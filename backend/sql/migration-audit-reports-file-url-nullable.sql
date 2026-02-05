-- Allow file_url to be NULL when only file upload is used (URL generated after upload)
-- Run this if you get: null value in column "file_url" violates not-null constraint
ALTER TABLE audit_reports ALTER COLUMN file_url DROP NOT NULL;
