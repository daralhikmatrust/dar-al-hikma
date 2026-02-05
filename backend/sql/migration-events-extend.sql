-- Migration: Extend events table for premium UI
-- Run in Supabase SQL Editor

-- Add url_slug for SEO-friendly URLs
ALTER TABLE events ADD COLUMN IF NOT EXISTS url_slug VARCHAR(500);
CREATE INDEX IF NOT EXISTS idx_events_url_slug ON events(url_slug);

-- Short description / excerpt for cards
ALTER TABLE events ADD COLUMN IF NOT EXISTS excerpt TEXT;

-- Event type tags: Free, Online, In-Person, Networking (stored as JSONB array)
ALTER TABLE events ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

-- Featured flag for Featured Events section
ALTER TABLE events ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;
