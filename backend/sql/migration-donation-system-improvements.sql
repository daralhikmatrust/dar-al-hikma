-- =====================================================
-- MIGRATION: Production-Grade Donation System Improvements
-- This migration adds critical safety features for payment processing
-- =====================================================

-- 1. Add unique constraint on order_id to prevent duplicate orders
DO $$ 
BEGIN
  -- Check if unique constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'donations_order_id_unique'
  ) THEN
    -- First, handle any existing duplicates (shouldn't exist, but safety first)
    DELETE FROM donations d1
    USING donations d2
    WHERE d1.id > d2.id 
      AND d1.order_id = d2.order_id 
      AND d1.order_id IS NOT NULL;
    
    -- Add unique constraint
    ALTER TABLE donations 
    ADD CONSTRAINT donations_order_id_unique UNIQUE (order_id);
    
    RAISE NOTICE '✅ Added unique constraint on order_id';
  ELSE
    RAISE NOTICE '⚠️  Unique constraint on order_id already exists';
  END IF;
END $$;

-- 2. Add unique constraint on payment_id (when not null) to prevent double charges
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'donations_payment_id_unique'
  ) THEN
    -- Handle any existing duplicates
    DELETE FROM donations d1
    USING donations d2
    WHERE d1.id > d2.id 
      AND d1.payment_id = d2.payment_id 
      AND d1.payment_id IS NOT NULL;
    
    -- Add unique constraint
    ALTER TABLE donations 
    ADD CONSTRAINT donations_payment_id_unique UNIQUE (payment_id);
    
    RAISE NOTICE '✅ Added unique constraint on payment_id';
  ELSE
    RAISE NOTICE '⚠️  Unique constraint on payment_id already exists';
  END IF;
END $$;

-- 3. Add metadata column for tracking webhook events, retries, and audit trail
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'donations' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE donations 
    ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    
    RAISE NOTICE '✅ Added metadata column';
  ELSE
    RAISE NOTICE '⚠️  Metadata column already exists';
  END IF;
END $$;

-- 4. Add webhook_event_id column for webhook deduplication
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'donations' AND column_name = 'webhook_event_id'
  ) THEN
    ALTER TABLE donations 
    ADD COLUMN webhook_event_id VARCHAR(255);
    
    RAISE NOTICE '✅ Added webhook_event_id column';
  ELSE
    RAISE NOTICE '⚠️  webhook_event_id column already exists';
  END IF;
END $$;

-- 5. Add index on webhook_event_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_donations_webhook_event_id 
ON donations(webhook_event_id) 
WHERE webhook_event_id IS NOT NULL;

-- 6. Add index on payment_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_donations_payment_id 
ON donations(payment_id) 
WHERE payment_id IS NOT NULL;

-- 7. Add index on order_id (if not exists) for fast lookups
CREATE INDEX IF NOT EXISTS idx_donations_order_id 
ON donations(order_id) 
WHERE order_id IS NOT NULL;

-- 8. Add status transition tracking columns
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'donations' AND column_name = 'status_changed_at'
  ) THEN
    ALTER TABLE donations 
    ADD COLUMN status_changed_at TIMESTAMP;
    
    RAISE NOTICE '✅ Added status_changed_at column';
  ELSE
    RAISE NOTICE '⚠️  status_changed_at column already exists';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'donations' AND column_name = 'status_changed_by'
  ) THEN
    ALTER TABLE donations 
    ADD COLUMN status_changed_by VARCHAR(50) DEFAULT 'system';
    
    RAISE NOTICE '✅ Added status_changed_by column';
  ELSE
    RAISE NOTICE '⚠️  status_changed_by column already exists';
  END IF;
END $$;

-- 9. Add verification_attempts column for tracking retry attempts
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'donations' AND column_name = 'verification_attempts'
  ) THEN
    ALTER TABLE donations 
    ADD COLUMN verification_attempts INTEGER DEFAULT 0;
    
    RAISE NOTICE '✅ Added verification_attempts column';
  ELSE
    RAISE NOTICE '⚠️  verification_attempts column already exists';
  END IF;
END $$;

-- 10. Add last_error column for error tracking
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'donations' AND column_name = 'last_error'
  ) THEN
    ALTER TABLE donations 
    ADD COLUMN last_error JSONB;
    
    RAISE NOTICE '✅ Added last_error column';
  ELSE
    RAISE NOTICE '⚠️  last_error column already exists';
  END IF;
END $$;

-- 11. Update status check constraint to include 'processing' state
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'donations_status_check'
  ) THEN
    ALTER TABLE donations DROP CONSTRAINT donations_status_check;
  END IF;
  
  ALTER TABLE donations 
  ADD CONSTRAINT donations_status_check 
  CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'));
  
  RAISE NOTICE '✅ Updated status check constraint with processing and refunded states';
END $$;

-- 12. Create webhook_events table for webhook deduplication and audit
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  order_id VARCHAR(255),
  payment_id VARCHAR(255),
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_order_id ON webhook_events(order_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_payment_id ON webhook_events(payment_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at DESC);

-- 13. Create function to update status_changed_at automatically
CREATE OR REPLACE FUNCTION update_donation_status_changed()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_changed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 14. Create trigger for status change tracking
DROP TRIGGER IF EXISTS trigger_donation_status_changed ON donations;
CREATE TRIGGER trigger_donation_status_changed
  BEFORE UPDATE ON donations
  FOR EACH ROW
  EXECUTE FUNCTION update_donation_status_changed();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Donation system improvements migration completed successfully!';
  RAISE NOTICE '✅ Added unique constraints on order_id and payment_id';
  RAISE NOTICE '✅ Added metadata, webhook_event_id, and audit columns';
  RAISE NOTICE '✅ Added processing and refunded status states';
  RAISE NOTICE '✅ Created webhook_events table for deduplication';
  RAISE NOTICE '✅ Added indexes for performance';
  RAISE NOTICE '✅ Added automatic status change tracking';
END $$;
