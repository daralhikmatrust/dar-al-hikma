-- =====================================================
-- SUPABASE STORAGE: About Us & Audit Reports Buckets
-- Run in Supabase Dashboard → SQL Editor
-- Required for About Us photos and Audit PDFs to work
-- =====================================================

-- Drop existing policies (to avoid duplicates)
DROP POLICY IF EXISTS "about-us-media public read" ON storage.objects;
DROP POLICY IF EXISTS "about-us-media allow insert" ON storage.objects;
DROP POLICY IF EXISTS "about-us-media allow update" ON storage.objects;
DROP POLICY IF EXISTS "about-us-media allow delete" ON storage.objects;
DROP POLICY IF EXISTS "audit-reports public read" ON storage.objects;
DROP POLICY IF EXISTS "audit-reports allow insert" ON storage.objects;
DROP POLICY IF EXISTS "audit-reports allow update" ON storage.objects;
DROP POLICY IF EXISTS "audit-reports allow delete" ON storage.objects;

-- Public read (anyone can view - user site)
CREATE POLICY "about-us-media public read" ON storage.objects FOR SELECT USING (bucket_id = 'about-us-media');
CREATE POLICY "audit-reports public read" ON storage.objects FOR SELECT USING (bucket_id = 'audit-reports');

-- Allow INSERT (admin uploads from backend)
CREATE POLICY "about-us-media allow insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'about-us-media');
CREATE POLICY "audit-reports allow insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'audit-reports');

-- Allow UPDATE and DELETE
CREATE POLICY "about-us-media allow update" ON storage.objects FOR UPDATE USING (bucket_id = 'about-us-media') WITH CHECK (bucket_id = 'about-us-media');
CREATE POLICY "audit-reports allow update" ON storage.objects FOR UPDATE USING (bucket_id = 'audit-reports') WITH CHECK (bucket_id = 'audit-reports');
CREATE POLICY "about-us-media allow delete" ON storage.objects FOR DELETE USING (bucket_id = 'about-us-media');
CREATE POLICY "audit-reports allow delete" ON storage.objects FOR DELETE USING (bucket_id = 'audit-reports');
