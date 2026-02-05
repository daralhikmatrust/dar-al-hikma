# Donation System Architecture

## Overview

This document describes the production-grade donation transaction flow implemented for Dar Al Hikma Trust. The system prioritizes **correctness over speed**, **consistency over convenience**, and **safety over assumptions**.

## Core Principles

1. **Webhooks are the source of truth** - Payment status is determined by Razorpay webhooks, not frontend verification
2. **Idempotency everywhere** - All operations can be safely retried without side effects
3. **State machine enforcement** - Donation states follow strict transition rules
4. **Zero double charges** - Unique constraints and idempotency keys prevent duplicate processing
5. **Deterministic outcomes** - Same input always produces same result, even under failures

## Transaction Flow

### 1. Order Creation (`POST /api/donations/razorpay/order`)

**Purpose**: Create a Razorpay order and initialize a donation record

**Flow**:
1. Validate donation amount and donor information
2. Create Razorpay order via Razorpay API
3. Create donation record in database with status `pending`
4. Store order_id with unique constraint (prevents duplicates)
5. Return order details to frontend

**Idempotency**: 
- If order_id already exists, returns existing donation record
- Uses database-level locking to prevent race conditions

**Edge Cases Handled**:
- ✅ Duplicate order creation (network retry, user refresh)
- ✅ Razorpay API failure (transaction rolled back)
- ✅ Database failure after Razorpay order (orphaned order - handled by webhook)

**State**: `pending`

---

### 2. Payment Verification (`POST /api/donations/razorpay/verify`)

**Purpose**: Verify payment signature and update donation status (user-facing)

**Flow**:
1. Verify Razorpay payment signature
2. Check if payment already processed (idempotency)
3. Fetch payment details from Razorpay to verify amount
4. Update donation status to `completed` (within transaction)
5. Update project amounts atomically
6. Send receipt email (non-blocking)

**Idempotency**:
- Uses `payment_id` as idempotency key
- If already completed, returns existing donation
- Safe to retry if network fails

**Edge Cases Handled**:
- ✅ User closes browser before verification (webhook handles it)
- ✅ Network failure during verification (safe to retry)
- ✅ Amount mismatch (rejected, logged, alert triggered)
- ✅ Invalid signature (rejected immediately)
- ✅ Already completed (idempotent return)

**State Transition**: `pending` → `completed`

**Note**: This endpoint provides immediate feedback, but webhook is authoritative.

---

### 3. Webhook Processing (`POST /api/webhooks/razorpay`)

**Purpose**: Process Razorpay webhook events (source of truth)

**Flow**:
1. Verify webhook signature
2. Record webhook event for deduplication
3. Check if event already processed
4. Process based on event type:
   - `payment.captured` / `order.paid`: Complete donation
   - `payment.failed`: Mark as failed
   - `payment.refunded`: Mark as refunded, reverse project amounts
5. Update donation status atomically
6. Send receipt email (non-blocking)

**Idempotency**:
- Uses `webhook_event_id` for deduplication
- Uses `payment_id` to prevent double processing
- Safe to process same webhook multiple times

**Edge Cases Handled**:
- ✅ Duplicate webhook deliveries (idempotent)
- ✅ Webhook arrives before verify endpoint (completes donation)
- ✅ Webhook arrives after verify endpoint (idempotent, no change)
- ✅ Orphaned webhook (order not found - logged, acknowledged)
- ✅ Amount mismatch (rejected, logged, alert triggered)
- ✅ Network failure during processing (Razorpay retries)

**State Transitions**:
- `pending` / `processing` → `completed` (payment.captured)
- `pending` / `processing` → `failed` (payment.failed)
- `completed` → `refunded` (payment.refunded)

---

## State Machine

### Valid States

- `pending`: Order created, payment not yet initiated
- `processing`: Payment initiated, awaiting confirmation
- `completed`: Payment successfully captured
- `failed`: Payment failed or rejected
- `cancelled`: Order cancelled by user/system
- `refunded`: Payment refunded

### Valid Transitions

```
pending → processing, failed, cancelled
processing → completed, failed, cancelled
completed → refunded
failed → processing (retry)
cancelled → (terminal)
refunded → (terminal)
```

### State Enforcement

- State transitions are validated before execution
- Invalid transitions are rejected with clear error messages
- Terminal states cannot be changed
- State changes are automatically timestamped

---

## Database Schema

### Key Constraints

```sql
-- Prevent duplicate orders
UNIQUE (order_id)

-- Prevent double charges
UNIQUE (payment_id) WHERE payment_id IS NOT NULL

-- Track webhook events
UNIQUE (webhook_event_id) WHERE webhook_event_id IS NOT NULL
```

### Audit Fields

- `status_changed_at`: Timestamp of last state change
- `status_changed_by`: Source of state change (`system`, `verify_endpoint`, `webhook`)
- `verification_attempts`: Count of verification attempts
- `last_error`: JSON object with error details
- `metadata`: JSON object for extensibility

### Webhook Events Table

Tracks all webhook events for:
- Deduplication
- Audit trail
- Retry tracking
- Error analysis

---

## Idempotency Strategy

### Order Creation
- **Key**: `order_id`
- **Check**: Database unique constraint + application-level check
- **Result**: Returns existing order if duplicate

### Payment Verification
- **Key**: `payment_id`
- **Check**: Database unique constraint + status check
- **Result**: Returns existing donation if already completed

### Webhook Processing
- **Key**: `webhook_event_id` (primary) + `payment_id` (secondary)
- **Check**: webhook_events table + donation status
- **Result**: Skips processing if already handled

---

## Error Classification

Errors are classified into categories for proper handling:

### CLIENT_ERROR (400-499)
- Invalid input
- Missing required fields
- Invalid state transitions
- **Action**: Return error to user, don't retry

### SERVER_ERROR (500)
- Database failures
- Internal logic errors
- **Action**: Log, alert, may retry

### EXTERNAL_ERROR (503)
- Razorpay API failures
- Network timeouts
- **Action**: Log, alert, retry with backoff

### VALIDATION_ERROR (400)
- Amount validation
- Signature validation
- **Action**: Reject immediately

---

## Edge Cases Handled

### 1. User Closes Browser Before Verification
- **Scenario**: User pays but closes browser before verify endpoint completes
- **Solution**: Webhook processes payment and completes donation
- **Result**: Donation completed, receipt sent via email

### 2. Network Failure During Verification
- **Scenario**: Network fails after payment but before database update
- **Solution**: User can retry verification (idempotent)
- **Result**: No double charge, donation completed on retry

### 3. Duplicate Webhook Delivery
- **Scenario**: Razorpay sends same webhook multiple times
- **Solution**: webhook_event_id deduplication
- **Result**: Processed once, subsequent deliveries ignored

### 4. Race Condition: Verify vs Webhook
- **Scenario**: Verify endpoint and webhook process simultaneously
- **Solution**: Database row-level locking (FOR UPDATE)
- **Result**: One succeeds, other sees completed status (idempotent)

### 5. Amount Mismatch
- **Scenario**: Razorpay amount doesn't match database amount
- **Solution**: Reject payment, log error, trigger alert
- **Result**: Payment not completed, requires manual investigation

### 6. Orphaned Webhook
- **Scenario**: Webhook arrives for order that doesn't exist
- **Solution**: Log warning, acknowledge webhook (200 response)
- **Result**: No infinite retries, manual investigation if needed

### 7. Partial System Crash
- **Scenario**: System crashes during transaction
- **Solution**: Database transaction rollback
- **Result**: Consistent state, can retry safely

### 8. Double Payment Attempt
- **Scenario**: User tries to pay same order twice
- **Solution**: Unique constraint on payment_id
- **Result**: Second attempt rejected at database level

### 9. Refund Processing
- **Scenario**: Payment refunded via Razorpay dashboard
- **Solution**: Webhook processes refund, reverses project amounts
- **Result**: Donation marked refunded, project amounts adjusted

### 10. Stuck in Processing State
- **Scenario**: Donation stuck in processing (system crash, etc.)
- **Solution**: Monitoring query finds stuck donations
- **Result**: Manual review and recovery

---

## Monitoring & Observability

### Logging Levels

- **INFO**: Normal operations (order created, payment completed)
- **WARN**: Recoverable issues (idempotent operations, retries)
- **ERROR**: Critical issues (amount mismatch, state violations)
- **ALERT**: Requires immediate attention (amount mismatch, system failures)

### Key Metrics to Monitor

1. **Payment Success Rate**: completed / (completed + failed)
2. **Verification Attempts**: Average verification_attempts per donation
3. **Webhook Processing Time**: Time from webhook receipt to completion
4. **Stuck Donations**: Donations in processing > 1 hour
5. **Error Rate**: Donations with last_error not null

### Health Checks

- Database connectivity
- Razorpay API availability
- Webhook endpoint accessibility
- Transaction processing latency

---

## Recovery Procedures

### Stuck Donations

Query donations needing attention:
```sql
SELECT * FROM donations 
WHERE (
  (status = 'processing' AND created_at < NOW() - INTERVAL '1 hour')
  OR (status = 'pending' AND created_at < NOW() - INTERVAL '24 hours')
  OR (verification_attempts > 3 AND status != 'completed')
)
```

### Manual State Correction

Only for terminal states and with proper authorization:
1. Verify actual payment status with Razorpay
2. Update donation status manually
3. Update project amounts if needed
4. Log manual intervention

### Webhook Replay

If webhook was missed:
1. Fetch payment status from Razorpay
2. Manually trigger webhook processing
3. Verify donation status updated correctly

---

## Security Considerations

1. **Signature Verification**: All Razorpay interactions verify signatures
2. **Idempotency Keys**: Prevent replay attacks
3. **Database Constraints**: Prevent data corruption
4. **Transaction Isolation**: Prevent race conditions
5. **Error Messages**: User-safe messages, detailed internal logging

---

## Testing Recommendations

### Unit Tests
- State machine transitions
- Idempotency checks
- Error classification
- Amount validation

### Integration Tests
- Order creation flow
- Payment verification flow
- Webhook processing flow
- Error scenarios

### Load Tests
- Concurrent order creation
- Concurrent webhook processing
- Database connection pooling
- Razorpay API rate limits

---

## Deployment Checklist

- [ ] Run database migration (`migration-donation-system-improvements.sql`)
- [ ] Verify unique constraints created
- [ ] Verify webhook_events table created
- [ ] Set `RAZORPAY_WEBHOOK_SECRET` environment variable
- [ ] Configure webhook URL in Razorpay dashboard
- [ ] Test webhook endpoint accessibility
- [ ] Verify error alerting configured
- [ ] Set up monitoring dashboards
- [ ] Document recovery procedures for operations team

---

## Summary

This donation system provides:

✅ **Zero double charges** - Unique constraints + idempotency  
✅ **No orphaned transactions** - Webhook handles all cases  
✅ **Deterministic outcomes** - Same input = same result  
✅ **Clean separation** - Service layer, controllers, models  
✅ **Operational visibility** - Comprehensive logging and monitoring  
✅ **Production-ready** - Handles all edge cases safely  

The system is designed to be **safe by default** - failures resolve to known, recoverable states, and all operations can be safely retried.
