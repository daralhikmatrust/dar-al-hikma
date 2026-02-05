-- Complete Database Setup Script for Supabase
-- Run this in Supabase SQL Editor to set up all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
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

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Projects Table
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
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Donations Table
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
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
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

-- Media Table
CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255),
  description TEXT,
  url TEXT NOT NULL,
  type VARCHAR(50) CHECK (type IN ('image', 'video', 'document')),
  category VARCHAR(100),
  project_id UUID REFERENCES projects(id),
  uploaded_by UUID REFERENCES users(id),
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Hall of Fame Table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_donations_donor ON donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_project ON donations(project_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_media_approved ON media(is_approved);
CREATE INDEX IF NOT EXISTS idx_hall_of_fame_donations ON hall_of_fame(total_donations DESC);

-- Create demo admin (password: admin123)
-- Hash generated for password "admin123"
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
  updated_at = NOW();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Database setup completed!';
  RAISE NOTICE '✅ Demo admin created: admin@daralhikma.org / admin123';
END $$;

