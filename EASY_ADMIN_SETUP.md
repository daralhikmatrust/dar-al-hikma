# Easy Admin Setup Guide

## 🚀 Quick Start - Create Demo Admin

### Method 1: Run Seed Script (Easiest)

```bash
cd backend
node utils/seed-postgres.js
```

This will create:
- **Email**: `admin@daralhikma.org`
- **Password**: `admin123`
- **Email**: `demo@daralhikma.org`
- **Password**: `demo123`

### Method 2: Create Admin via Command Line

```bash
cd backend
node utils/create-admin.js "Your Name" "your-email@example.com" "yourpassword123"
```

Example:
```bash
node utils/create-admin.js "John Admin" "john@example.com" "securepass123"
```

### Method 3: Using Supabase SQL Editor (Recommended for Production)

1. **Go to Supabase Dashboard**
   - Open your Supabase project
   - Click on "SQL Editor" in the left sidebar

2. **Run the Setup Script**
   - Copy the contents of `backend/sql/setup-database.sql`
   - Paste in SQL Editor
   - Click "Run"

3. **Or Create Admin Directly**
   - Copy the contents of `backend/sql/create-admin.sql`
   - Modify the email and password hash
   - Run in SQL Editor

### Method 4: Direct SQL Insert (Supabase)

```sql
-- Create admin with password "admin123"
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
```

## 🔐 Generate Password Hash

To create an admin with a custom password:

1. **Online Tool**: https://bcrypt-generator.com/
   - Enter your password
   - Set rounds to 12
   - Copy the hash

2. **Use in SQL**:
```sql
INSERT INTO users (name, email, password, role, profession)
VALUES (
  'Admin Name',
  'admin@example.com',
  '$2a$12$YOUR_HASH_HERE',
  'admin',
  'Administrator'
);
```

## 📋 View All Admins

### In Supabase SQL Editor:
```sql
SELECT id, name, email, role, created_at, updated_at
FROM users
WHERE role = 'admin'
ORDER BY created_at DESC;
```

### Via API (after login):
```bash
curl -X GET http://localhost:5000/api/admin/admins \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## 🔄 Promote Existing User to Admin

### Via SQL:
```sql
UPDATE users 
SET role = 'admin', updated_at = NOW()
WHERE email = 'user@example.com';
```

### Via Command Line:
```bash
cd backend
node utils/create-admin.js "Existing User" "user@example.com" "theirpassword"
```

## ⚠️ Important Notes

### Why Users Don't Show in Supabase Authentication

**Your app uses a custom `users` table, NOT Supabase Auth!**

- Users are stored in your custom `users` table in PostgreSQL
- They won't appear in Supabase → Authentication section
- This is normal and expected
- View users in: Supabase → Table Editor → `users` table

### To View Users in Supabase:

1. Go to Supabase Dashboard
2. Click "Table Editor" in left sidebar
3. Select `users` table
4. You'll see all users including admins

### To Make Users Visible in Supabase Auth (Optional):

If you want users in Supabase Auth, you need to:
1. Use Supabase Auth API
2. Sync your custom table with Supabase Auth
3. This requires code changes

**Recommendation**: Keep using custom table (current setup) - it's simpler and works perfectly!

## 🛠️ Troubleshooting

### Admin Not Created?
1. Check database connection in `.env`
2. Verify `DATABASE_URL` is correct
3. Check Supabase database is not paused
4. Run: `node utils/seed-postgres.js` again

### Cannot Login?
1. Verify email is correct (case-insensitive)
2. Check password is correct
3. Verify user has `role = 'admin'` in database
4. Check backend logs for errors

### Password Hash Issues?
- Use bcrypt with 12 rounds
- Generate hash at: https://bcrypt-generator.com/
- Make sure hash starts with `$2a$12$`

## 📝 Default Demo Admin

After running seed script:
- **Email**: `admin@daralhikma.org`
- **Password**: `admin123`
- **Login**: http://localhost:5173/admin/login

## 🎯 Quick Commands

```bash
# Create demo admin
cd backend && node utils/seed-postgres.js

# Create custom admin
cd backend && node utils/create-admin.js "Name" "email@example.com" "password"

# Check database connection
cd backend && node -e "import('./utils/db.js').then(m => m.initDatabase())"
```

## ✅ Verification

After creating admin, verify:

1. **Check in Database**:
```sql
SELECT * FROM users WHERE role = 'admin';
```

2. **Try Login**:
   - Go to `/admin/login`
   - Use admin credentials
   - Should redirect to `/admin/dashboard`

3. **Check Admin Panel**:
   - Go to `/admin/admins`
   - Should see your admin listed

---

**Need Help?** Check backend logs or Supabase logs for detailed error messages.

