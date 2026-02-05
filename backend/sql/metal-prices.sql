-- Run in Supabase SQL Editor
-- Caches gold/silver prices (INR per gram) for Nisab feature

CREATE TABLE IF NOT EXISTS metal_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  as_of_date DATE NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  gold_per_gram NUMERIC(18, 6) NOT NULL,
  silver_per_gram NUMERIC(18, 6) NOT NULL,
  source TEXT,
  fetched_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_metal_prices_fetched_at ON metal_prices(fetched_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_metal_prices_date_currency ON metal_prices(as_of_date, currency);

