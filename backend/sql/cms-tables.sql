-- =====================================================
-- CMS TABLES FOR BLOGS, EVENTS, TESTIMONIALS, ABOUT US
-- Run this script in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. BLOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  author VARCHAR(255),
  category VARCHAR(100),
  date DATE DEFAULT CURRENT_DATE,
  featured_image TEXT,
  featured_image_url TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  video_url TEXT,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  seo_title VARCHAR(500),
  seo_description TEXT,
  url_slug VARCHAR(500),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blogs_status ON blogs(status);
CREATE INDEX IF NOT EXISTS idx_blogs_category ON blogs(category);
CREATE INDEX IF NOT EXISTS idx_blogs_date ON blogs(date DESC);
CREATE INDEX IF NOT EXISTS idx_blogs_url_slug ON blogs(url_slug);
CREATE INDEX IF NOT EXISTS idx_blogs_created_at ON blogs(created_at DESC);

-- =====================================================
-- 2. EVENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME,
  location VARCHAR(500),
  banner_image TEXT,
  banner_image_url TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  video_url TEXT,
  status VARCHAR(50) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'past')),
  visible BOOLEAN DEFAULT true,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_visible ON events(visible);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date DESC);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);

-- =====================================================
-- 3. TESTIMONIALS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  role VARCHAR(100),
  location VARCHAR(255),
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'hidden')),
  submitted_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_testimonials_status ON testimonials(status);
CREATE INDEX IF NOT EXISTS idx_testimonials_created_at ON testimonials(created_at DESC);

-- =====================================================
-- 4. ABOUT US SECTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS about_us_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_type VARCHAR(100) NOT NULL CHECK (section_type IN ('who_we_are', 'why_dar_al_hikma', 'council', 'advisory', 'legal_financial', 'audit')),
  title VARCHAR(500),
  description TEXT,
  content JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(section_type)
);

-- =====================================================
-- 5. ABOUT US MEMBERS TABLE (Council, Advisory, Legal/Financial)
-- =====================================================
CREATE TABLE IF NOT EXISTS about_us_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_type VARCHAR(100) NOT NULL CHECK (member_type IN ('council', 'advisory', 'legal_financial')),
  name VARCHAR(255) NOT NULL,
  role VARCHAR(255),
  description TEXT,
  photo TEXT,
  photo_url TEXT,
  display_order INTEGER DEFAULT 0,
  visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_about_us_members_type ON about_us_members(member_type);
CREATE INDEX IF NOT EXISTS idx_about_us_members_visible ON about_us_members(visible);
CREATE INDEX IF NOT EXISTS idx_about_us_members_order ON about_us_members(member_type, display_order);

-- =====================================================
-- 6. AUDIT REPORTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  fiscal_year VARCHAR(50) NOT NULL,
  file_url TEXT,
  file_name VARCHAR(255),
  description TEXT,
  display_order INTEGER DEFAULT 0,
  visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_reports_visible ON audit_reports(visible);
CREATE INDEX IF NOT EXISTS idx_audit_reports_order ON audit_reports(display_order);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ CMS tables created successfully!';
  RAISE NOTICE '✅ Tables: blogs, events, testimonials, about_us_sections, about_us_members, audit_reports';
END $$;
