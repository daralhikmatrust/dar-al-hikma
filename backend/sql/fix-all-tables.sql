-- =====================================================
-- COMPLETE DATABASE FIX FOR DAR AL HIKMA TRUST
-- This script fixes all missing columns and creates missing tables
-- Run this in Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USERS TABLE - Create or Fix
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  profession VARCHAR(100),
  phone VARCHAR(20),
  address JSONB DEFAULT '{}'::jsonb,
  is_hall_of_fame BOOLEAN DEFAULT false,
  refresh_token TEXT,
  reset_password_token TEXT,
  reset_password_expire TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add missing columns to users if they exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_hall_of_fame') THEN
    ALTER TABLE users ADD COLUMN is_hall_of_fame BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'profession') THEN
    ALTER TABLE users ADD COLUMN profession VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone') THEN
    ALTER TABLE users ADD COLUMN phone VARCHAR(20);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'address') THEN
    ALTER TABLE users ADD COLUMN address JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- =====================================================
-- 2. PROJECTS TABLE - Create or Fix (THIS FIXES created_by ERROR)
-- =====================================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  short_description TEXT,
  faculty VARCHAR(100),
  status VARCHAR(50) DEFAULT 'planned' CHECK (status IN ('planned', 'ongoing', 'completed')),
  target_amount DECIMAL(15, 2),
  current_amount DECIMAL(15, 2) DEFAULT 0,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  is_featured BOOLEAN DEFAULT false,
  location JSONB DEFAULT '{}'::jsonb,
  images JSONB DEFAULT '[]'::jsonb,
  videos JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  milestones JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
-- created_by is added in the DO block below to match users.id type (UUID vs INTEGER)

-- Add missing columns to projects if table exists
DO $$ 
DECLARE
  users_id_type TEXT;
BEGIN
  -- Get users.id type (UUID vs INTEGER) so we match it for created_by
  SELECT data_type INTO users_id_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'id';

  -- Add created_by column - use same type as users.id (fixes UUID vs INTEGER error)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'created_by') THEN
    IF users_id_type = 'integer' THEN
      ALTER TABLE projects ADD COLUMN created_by INTEGER REFERENCES users(id);
    ELSIF users_id_type = 'bigint' THEN
      ALTER TABLE projects ADD COLUMN created_by BIGINT REFERENCES users(id);
    ELSIF users_id_type = 'smallint' THEN
      ALTER TABLE projects ADD COLUMN created_by SMALLINT REFERENCES users(id);
    ELSE
      -- Default: UUID (or when users not found)
      ALTER TABLE projects ADD COLUMN created_by UUID REFERENCES users(id);
    END IF;
  END IF;
  
  -- Add other missing columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'short_description') THEN
    ALTER TABLE projects ADD COLUMN short_description TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'images') THEN
    ALTER TABLE projects ADD COLUMN images JSONB DEFAULT '[]'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'videos') THEN
    ALTER TABLE projects ADD COLUMN videos JSONB DEFAULT '[]'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'tags') THEN
    ALTER TABLE projects ADD COLUMN tags JSONB DEFAULT '[]'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'milestones') THEN
    ALTER TABLE projects ADD COLUMN milestones JSONB DEFAULT '[]'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'location') THEN
    ALTER TABLE projects ADD COLUMN location JSONB DEFAULT '{}'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'is_featured') THEN
    ALTER TABLE projects ADD COLUMN is_featured BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'progress') THEN
    ALTER TABLE projects ADD COLUMN progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'current_amount') THEN
    ALTER TABLE projects ADD COLUMN current_amount DECIMAL(15, 2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'target_amount') THEN
    ALTER TABLE projects ADD COLUMN target_amount DECIMAL(15, 2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'faculty') THEN
    ALTER TABLE projects ADD COLUMN faculty VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'status') THEN
    ALTER TABLE projects ADD COLUMN status VARCHAR(50) DEFAULT 'planned' CHECK (status IN ('planned', 'ongoing', 'completed'));
  END IF;
END $$;

-- =====================================================
-- 3. DONATIONS TABLE - Create or Fix
-- =====================================================
CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID REFERENCES users(id),
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  donation_type VARCHAR(50),
  project_id UUID REFERENCES projects(id),
  faculty VARCHAR(100),
  payment_method VARCHAR(50),
  payment_id VARCHAR(255),
  order_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  donor_name VARCHAR(255),
  donor_email VARCHAR(255),
  donor_phone VARCHAR(20),
  donor_address JSONB,
  is_anonymous BOOLEAN DEFAULT false,
  notes TEXT,
  receipt_number VARCHAR(100),
  receipt_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add missing columns to donations
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'donations' AND column_name = 'is_anonymous') THEN
    ALTER TABLE donations ADD COLUMN is_anonymous BOOLEAN DEFAULT false;
  END IF;
  
  -- Ensure status constraint allows 'cancelled'
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_schema = 'public' AND constraint_name = 'donations_status_check') THEN
    ALTER TABLE donations DROP CONSTRAINT donations_status_check;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_schema = 'public' AND table_name = 'donations' AND constraint_name = 'donations_status_check') THEN
    ALTER TABLE donations ADD CONSTRAINT donations_status_check CHECK (status IN ('pending', 'completed', 'failed', 'cancelled'));
  END IF;
END $$;

-- =====================================================
-- 4. MEDIA TABLE - Create or Fix (for images and videos)
-- =====================================================
CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255),
  description TEXT,
  url TEXT NOT NULL,
  public_id VARCHAR(255),
  thumbnail TEXT,
  type VARCHAR(50) CHECK (type IN ('image', 'video', 'document')),
  category VARCHAR(100),
  project_id UUID REFERENCES projects(id),
  uploaded_by UUID REFERENCES users(id),
  is_approved BOOLEAN DEFAULT false,
  tags JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add missing columns to media
DO $$ 
DECLARE
  users_id_type TEXT;
  projects_id_type TEXT;
BEGIN
  SELECT data_type INTO users_id_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'id';
  SELECT data_type INTO projects_id_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'id';

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'media' AND column_name = 'public_id') THEN
    ALTER TABLE media ADD COLUMN public_id VARCHAR(255);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'media' AND column_name = 'thumbnail') THEN
    ALTER TABLE media ADD COLUMN thumbnail TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'media' AND column_name = 'tags') THEN
    ALTER TABLE media ADD COLUMN tags JSONB DEFAULT '[]'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'media' AND column_name = 'metadata') THEN
    ALTER TABLE media ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'media' AND column_name = 'uploaded_by') THEN
    IF users_id_type = 'integer' THEN
      ALTER TABLE media ADD COLUMN uploaded_by INTEGER REFERENCES users(id);
    ELSIF users_id_type = 'bigint' THEN
      ALTER TABLE media ADD COLUMN uploaded_by BIGINT REFERENCES users(id);
    ELSIF users_id_type = 'smallint' THEN
      ALTER TABLE media ADD COLUMN uploaded_by SMALLINT REFERENCES users(id);
    ELSE
      ALTER TABLE media ADD COLUMN uploaded_by UUID REFERENCES users(id);
    END IF;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'media' AND column_name = 'is_approved') THEN
    ALTER TABLE media ADD COLUMN is_approved BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'media' AND column_name = 'category') THEN
    ALTER TABLE media ADD COLUMN category VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'media' AND column_name = 'project_id') THEN
    IF projects_id_type = 'integer' THEN
      ALTER TABLE media ADD COLUMN project_id INTEGER REFERENCES projects(id);
    ELSIF projects_id_type = 'bigint' THEN
      ALTER TABLE media ADD COLUMN project_id BIGINT REFERENCES projects(id);
    ELSE
      ALTER TABLE media ADD COLUMN project_id UUID REFERENCES projects(id);
    END IF;
  END IF;
END $$;

-- =====================================================
-- 5. HALL OF FAME TABLE - Create (This fixes the error)
-- =====================================================
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

-- =====================================================
-- 6. CREATE ALL INDEXES
-- =====================================================
-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_hall_of_fame ON users(is_hall_of_fame);

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_faculty ON projects(faculty);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects(is_featured);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);

-- Donations indexes
CREATE INDEX IF NOT EXISTS idx_donations_donor ON donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_project ON donations(project_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_faculty ON donations(faculty);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_anonymous ON donations(is_anonymous);

-- Media indexes
CREATE INDEX IF NOT EXISTS idx_media_approved ON media(is_approved);
CREATE INDEX IF NOT EXISTS idx_media_type ON media(type);
CREATE INDEX IF NOT EXISTS idx_media_category ON media(category);
CREATE INDEX IF NOT EXISTS idx_media_project ON media(project_id);
CREATE INDEX IF NOT EXISTS idx_media_uploaded_by ON media(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_created_at ON media(created_at DESC);

-- Hall of Fame indexes
CREATE INDEX IF NOT EXISTS idx_hall_of_fame_donations ON hall_of_fame(total_donations DESC);
CREATE INDEX IF NOT EXISTS idx_hall_of_fame_created_at ON hall_of_fame(created_at DESC);

-- =====================================================
-- 7. CREATE DEMO ADMIN USER
-- =====================================================
INSERT INTO users (name, email, password, role, profession)
VALUES (
  'Demo Admin',
  'admin@daralhikma.org',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5',
  'admin',
  'Administrator'
)
ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  profession = 'Administrator',
  updated_at = NOW();

-- =====================================================
-- 8. SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Database setup completed successfully!';
  RAISE NOTICE '✅ All tables created/fixed: users, projects, donations, media, hall_of_fame';
  RAISE NOTICE '✅ Missing columns added (including created_by in projects)';
  RAISE NOTICE '✅ Demo admin created: admin@daralhikma.org / admin123';
  RAISE NOTICE '✅ All indexes created for optimal performance';
END $$;

-- =====================================================
-- VERIFICATION QUERIES (Run these to verify)
-- =====================================================
-- Check if all tables exist:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'projects', 'donations', 'media', 'hall_of_fame')
ORDER BY table_name;

-- Check projects table has created_by column:
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'projects' AND column_name = 'created_by';

-- Check hall_of_fame table structure:
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'hall_of_fame'
ORDER BY ordinal_position;
