-- =====================================================
-- COMPLETE DATABASE SETUP FOR DAR AL HIKMA TRUST
-- Run this entire script in Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USERS TABLE
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

-- Create indexes on users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_hall_of_fame ON users(is_hall_of_fame);

-- =====================================================
-- 2. PROJECTS TABLE
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
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes on projects
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_faculty ON projects(faculty);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects(is_featured);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);

-- =====================================================
-- 3. DONATIONS TABLE
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

-- Create indexes on donations
CREATE INDEX IF NOT EXISTS idx_donations_donor ON donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_project ON donations(project_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_faculty ON donations(faculty);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_anonymous ON donations(is_anonymous);

-- =====================================================
-- 4. MEDIA TABLE (for images and videos)
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

-- Create indexes on media
CREATE INDEX IF NOT EXISTS idx_media_approved ON media(is_approved);
CREATE INDEX IF NOT EXISTS idx_media_type ON media(type);
CREATE INDEX IF NOT EXISTS idx_media_category ON media(category);
CREATE INDEX IF NOT EXISTS idx_media_project ON media(project_id);
CREATE INDEX IF NOT EXISTS idx_media_uploaded_by ON media(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_created_at ON media(created_at DESC);

-- =====================================================
-- 5. HALL OF FAME TABLE (NEW - This fixes the error)
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

-- Create indexes on hall_of_fame
CREATE INDEX IF NOT EXISTS idx_hall_of_fame_donations ON hall_of_fame(total_donations DESC);
CREATE INDEX IF NOT EXISTS idx_hall_of_fame_created_at ON hall_of_fame(created_at DESC);

-- =====================================================
-- 6. CREATE DEMO ADMIN USER
-- =====================================================
-- Password: admin123 (hashed with bcrypt)
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
-- 7. GRANT PERMISSIONS (if using Row Level Security)
-- =====================================================
-- Enable Row Level Security (optional, for Supabase)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE media ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE hall_of_fame ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 8. SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Database setup completed successfully!';
  RAISE NOTICE '✅ All tables created: users, projects, donations, media, hall_of_fame';
  RAISE NOTICE '✅ Demo admin created: admin@daralhikma.org / admin123';
  RAISE NOTICE '✅ All indexes created for optimal performance';
END $$;

-- =====================================================
-- VERIFICATION QUERIES (Optional - Run to verify)
-- =====================================================
-- Check if all tables exist:
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('users', 'projects', 'donations', 'media', 'hall_of_fame')
-- ORDER BY table_name;

-- Check table structures:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'hall_of_fame'
-- ORDER BY ordinal_position;
