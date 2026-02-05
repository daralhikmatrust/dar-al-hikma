# Donation Transaction Flow - Plain English Summary

## How It Works (Simple Explanation)

### Step 1: User Wants to Donate

1. User fills out donation form on website
2. User clicks "Donate"
3. Website sends request to backend: "Create a payment order for ₹500"
4. Backend:
   - Creates an order with Razorpay (like creating a shopping cart)
   - Saves a record in database: "Donation #123: ₹500, status: waiting for payment"
   - Gives website an order ID: "order_ABC123"

**What if this fails?**
- If Razorpay fails: Nothing is saved, user can try again
- If database fails: Order might exist in Razorpay but not in our database (rare) - webhook will handle it later
- If user refreshes: Same order ID is returned (no duplicate)

---

### Step 2: User Pays

1. Razorpay payment popup appears
2. User enters card details and pays
3. Razorpay processes payment
4. Two things happen **at the same time**:
   - **A)** Website tries to verify payment immediately (for fast user feedback)
   - **B)** Razorpay sends a webhook to our server (the official confirmation)

---

### Step 3A: Website Verifies Payment (Fast Path)

1. Website sends payment details to backend: "Verify this payment"
2. Backend checks:
   - Is the signature valid? (prevents fraud)
   - Has this payment been processed before? (prevents double charge)
   - Does the amount match? (prevents errors)
3. If all good:
   - Updates database: "Donation #123: status changed to completed"
   - Updates project total: "Project X now has ₹500 more"
   - Sends receipt email to user
   - Tells website: "Payment successful!"

**What if this fails?**
- Network error: User can refresh/retry (safe - won't charge twice)
- User closes browser: Webhook (Step 3B) will complete it anyway
- Already completed: Returns success immediately (idempotent)

---

### Step 3B: Razorpay Webhook (Official Confirmation)

1. Razorpay sends webhook: "Payment order_ABC123 was successful"
2. Backend receives webhook:
   - Checks: "Have I seen this webhook before?" (prevents duplicate processing)
   - Checks: "Is this donation already completed?" (prevents double processing)
   - If new and not completed:
     - Updates database: "Donation #123: status = completed"
     - Updates project total
     - Sends receipt email (if not sent already)

**Why both Step 3A and 3B?**
- Step 3A: Fast feedback for user (happens immediately)
- Step 3B: Guaranteed completion (even if user closes browser)

**What if webhook fails?**
- Razorpay retries automatically (up to 24 hours)
- Our system is idempotent (safe to process same webhook multiple times)

---

## Safety Features

### 1. No Double Charges

**How**: Every payment has a unique ID. Database prevents saving the same payment twice.

**Example**: User clicks "Pay" twice by mistake
- First click: Payment processed, saved with ID "pay_123"
- Second click: Database rejects it (already exists)
- Result: Only charged once ✅

---

### 2. No Lost Payments

**How**: Webhook is the "official record" - it always arrives, even if user closes browser.

**Example**: User pays, then closes browser before verification
- Website verification: Never happened (browser closed)
- Webhook: Arrives 2 seconds later, completes donation
- Result: Payment recorded ✅

---

### 3. No Race Conditions

**How**: Database locks prevent two processes from updating same donation simultaneously.

**Example**: Website verification and webhook arrive at exact same time
- Database: "Only one of you can update this donation at a time"
- First one: Completes donation
- Second one: Sees it's already completed, does nothing
- Result: Only processed once ✅

---

### 4. Handles All Failures

**Network failure**: Can retry safely (idempotent)
**System crash**: Database transaction rolls back (no partial state)
**Duplicate webhook**: Ignored (already processed)
**Amount mismatch**: Rejected immediately (fraud prevention)

---

## State Machine (Donation Lifecycle)

Think of a donation like a package being shipped:

1. **pending**: Order created, waiting for payment
2. **processing**: Payment initiated, waiting for confirmation
3. **completed**: Payment successful, donation recorded
4. **failed**: Payment failed (card declined, etc.)
5. **cancelled**: User cancelled before paying
6. **refunded**: Payment was refunded

**Rules**:
- Can't go backwards (completed → pending is not allowed)
- Terminal states (completed, cancelled, refunded) can't change
- System enforces these rules automatically

---

## Edge Cases Handled

### User Closes Browser
- ✅ Webhook completes payment
- ✅ Receipt sent via email

### Network Failure
- ✅ User can retry verification
- ✅ No double charge (idempotent)

### Duplicate Webhook
- ✅ Processed once, others ignored
- ✅ No duplicate processing

### Payment Amount Mismatch
- ✅ Payment rejected
- ✅ Alert sent to operations team
- ✅ Requires manual investigation

### System Crash Mid-Transaction
- ✅ Database rolls back
- ✅ No partial state
- ✅ Can retry safely

### User Pays Twice (Same Order)
- ✅ Second payment rejected
- ✅ Only first payment processed

### Webhook Arrives Before Verification
- ✅ Webhook completes donation
- ✅ Verification sees it's done, returns success

### Webhook Arrives After Verification
- ✅ Webhook sees it's done, does nothing
- ✅ No duplicate processing

---

## What Makes This Production-Ready?

1. **Idempotency**: Every operation can be safely retried
2. **Transactions**: Database ensures consistency (all or nothing)
3. **Webhooks as Truth**: Official payment status comes from Razorpay
4. **Error Handling**: Every error is classified and handled appropriately
5. **Monitoring**: System tracks all operations for debugging
6. **Recovery**: Stuck donations can be identified and fixed
7. **Security**: Signatures verified, constraints enforced
8. **Audit Trail**: Every change is logged with timestamp and source

---

## For Operations Team

### If Something Goes Wrong

1. **Check webhook_events table**: See all webhook deliveries
2. **Check donations table**: See donation status and errors
3. **Query stuck donations**: Find donations needing attention
4. **Verify with Razorpay**: Check actual payment status
5. **Manual correction**: Only for terminal states, with proper logging

### Monitoring Queries

```sql
-- Donations stuck in processing
SELECT * FROM donations 
WHERE status = 'processing' 
AND created_at < NOW() - INTERVAL '1 hour';

-- Donations with errors
SELECT * FROM donations 
WHERE last_error IS NOT NULL;

-- Recent webhook events
SELECT * FROM webhook_events 
ORDER BY created_at DESC 
LIMIT 100;
```

---

## Summary

This system ensures:
- ✅ **Zero double charges** - Unique constraints prevent duplicates
- ✅ **No lost payments** - Webhook guarantees completion
- ✅ **Deterministic outcomes** - Same input always produces same result
- ✅ **Safe retries** - All operations are idempotent
- ✅ **Complete audit trail** - Every action is logged
- ✅ **Recovery procedures** - Stuck states can be identified and fixed

The system is designed to be **safe by default** - even if everything fails, the worst case is a donation stuck in "pending" state, which can be manually reviewed and fixed.
