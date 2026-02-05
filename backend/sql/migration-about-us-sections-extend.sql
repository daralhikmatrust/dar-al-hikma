-- Extend about_us_sections to allow who_we_are and why_dar_al_hikma
-- Run in Supabase SQL Editor if you already have cms-tables applied

ALTER TABLE about_us_sections DROP CONSTRAINT IF EXISTS about_us_sections_section_type_check;
ALTER TABLE about_us_sections ADD CONSTRAINT about_us_sections_section_type_check
  CHECK (section_type IN ('who_we_are', 'why_dar_al_hikma', 'council', 'advisory', 'legal_financial', 'audit'));
