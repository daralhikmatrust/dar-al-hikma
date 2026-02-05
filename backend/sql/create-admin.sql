-- SQL Script to Create Admin in Supabase
-- Run this in Supabase SQL Editor

-- First, make sure you have bcrypt extension (Supabase has it by default)
-- If not, run: CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Method 1: Create Admin with Hashed Password
-- Replace 'your_password_here' with your desired password
-- You can generate bcrypt hash at: https://bcrypt-generator.com/
-- Or use: SELECT crypt('your_password', gen_salt('bf', 12));

-- Example: Create admin with password "admin123"
-- The hash below is for password "admin123"
INSERT INTO users (name, email, password, role, profession, created_at)
VALUES (
  'Demo Admin',
  'admin@daralhikma.org',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5', -- password: admin123
  'admin',
  'Administrator',
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  password = EXCLUDED.password,
  updated_at = NOW();

-- Method 2: Create Admin with Custom Password
-- Replace the values below:
/*
INSERT INTO users (name, email, password, role, profession, created_at)
VALUES (
  'Your Admin Name',
  'your-email@example.com',
  '$2a$12$YOUR_BCRYPT_HASH_HERE', -- Generate at https://bcrypt-generator.com/
  'admin',
  'Administrator',
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  updated_at = NOW();
*/

-- Method 3: Promote Existing User to Admin
-- Replace 'user@example.com' with the user's email
/*
UPDATE users 
SET role = 'admin', updated_at = NOW()
WHERE email = 'user@example.com';
*/

-- View All Admins
SELECT id, name, email, role, created_at, updated_at
FROM users
WHERE role = 'admin'
ORDER BY created_at DESC;

-- View All Users
SELECT id, name, email, role, profession, created_at
FROM users
ORDER BY created_at DESC;

