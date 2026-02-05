-- =====================================================
-- MIGRATION: Add Missing Columns to Existing Tables
-- Run this if tables already exist but are missing columns
-- =====================================================

-- Add missing columns to projects table
DO $$ 
BEGIN
  -- Add images column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'projects' AND column_name = 'images') THEN
    ALTER TABLE projects ADD COLUMN images JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Add videos column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'projects' AND column_name = 'videos') THEN
    ALTER TABLE projects ADD COLUMN videos JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Add tags column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'projects' AND column_name = 'tags') THEN
    ALTER TABLE projects ADD COLUMN tags JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Add milestones column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'projects' AND column_name = 'milestones') THEN
    ALTER TABLE projects ADD COLUMN milestones JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add missing columns to donations table
DO $$ 
BEGIN
  -- Add cancelled status if not in check constraint
  -- Note: This requires dropping and recreating the constraint
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'donations_status_check') THEN
    ALTER TABLE donations DROP CONSTRAINT donations_status_check;
    ALTER TABLE donations ADD CONSTRAINT donations_status_check 
      CHECK (status IN ('pending', 'completed', 'failed', 'cancelled'));
  END IF;
END $$;

-- Add missing columns to media table
DO $$ 
BEGIN
  -- Add public_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'media' AND column_name = 'public_id') THEN
    ALTER TABLE media ADD COLUMN public_id VARCHAR(255);
  END IF;

  -- Add thumbnail column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'media' AND column_name = 'thumbnail') THEN
    ALTER TABLE media ADD COLUMN thumbnail TEXT;
  END IF;

  -- Add tags column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'media' AND column_name = 'tags') THEN
    ALTER TABLE media ADD COLUMN tags JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Add metadata column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'media' AND column_name = 'metadata') THEN
    ALTER TABLE media ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create hall_of_fame table if it doesn't exist
CREATE TABLE IF NOT EXISTS hall_of_fame (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  profession VARCHAR(100),
  bio TEXT,
  photo TEXT,
  total_donations DECIMAL(15, 2) DEFAULT 0,
  donation_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create missing indexes
CREATE INDEX IF NOT EXISTS idx_hall_of_fame_donations ON hall_of_fame(total_donations DESC);
CREATE INDEX IF NOT EXISTS idx_hall_of_fame_created_at ON hall_of_fame(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_faculty ON projects(faculty);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects(is_featured);
CREATE INDEX IF NOT EXISTS idx_donations_faculty ON donations(faculty);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_anonymous ON donations(is_anonymous);
CREATE INDEX IF NOT EXISTS idx_media_type ON media(type);
CREATE INDEX IF NOT EXISTS idx_media_category ON media(category);
CREATE INDEX IF NOT EXISTS idx_media_project ON media(project_id);
CREATE INDEX IF NOT EXISTS idx_media_uploaded_by ON media(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_created_at ON media(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_hall_of_fame ON users(is_hall_of_fame);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE '✅ All missing columns added';
  RAISE NOTICE '✅ Hall of Fame table created';
  RAISE NOTICE '✅ All indexes created';
END $$;
