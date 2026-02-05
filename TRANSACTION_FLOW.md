# Donation Transaction Flow

## 1. Flow Overview
1.  **Frontend**: Initiates order -> `POST /razorpay/order`.
2.  **Backend**: Creates Razorpay Order & **Pending DB Record**. Returns Order ID.
3.  **Frontend**: Collects Payment via Razorpay.
4.  **Backend**:
    *   **Verify API**: `POST /razorpay/verify`. Checks Signature -> DB Transaction -> Update Status -> Send Email.
    *   **Webhook**: Listens for `payment.captured`. Updates Status safely if Verify API missed it.

## 2. Database Schema
```sql
CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_id UUID REFERENCES users(id),
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  payment_method VARCHAR(20) DEFAULT 'razorpay',
  payment_id VARCHAR(100),
  order_id VARCHAR(100) UNIQUE NOT NULL, -- Indexed
  status VARCHAR(20) DEFAULT 'pending',
  receipt_number VARCHAR(50) UNIQUE,
  donor_name VARCHAR(100),
  donor_email VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_donations_order_id ON donations(order_id);
```

## 3. Safety Checklist
- [x] **Idempotency**: `findByOrderId` prevents double-processing.
- [x] **Transactions**: `BEGIN`/`COMMIT` ensures data integrity.
- [x] **Webhooks**: Handles "tab closed" scenarios.
- [x] **Security**: Signatures verified on all endpoints.
