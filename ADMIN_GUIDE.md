# Admin Management Guide

## How to Add Admin Users

### Method 1: Through Admin Panel (Recommended)

1. **Login as Admin**
   - Go to `/admin/login`
   - Login with existing admin credentials

2. **Navigate to Admins Page**
   - Click on "Admins" in the sidebar
   - Or go directly to `/admin/admins`

3. **Create New Admin**
   - Click "Add New Admin" button
   - Fill in the form:
     - **Name**: Full name of the admin
     - **Email**: Email address (must be unique)
     - **Password**: Minimum 6 characters
   - Click "Create Admin"

4. **Verify Admin Created**
   - The new admin will appear in the admin list
   - They can now login at `/admin/login` with their credentials

### Method 2: Direct Database Insert (Advanced)

If you need to create an admin directly in the database:

```sql
-- First, hash the password (use bcrypt with cost 12)
-- Example password: "admin123" 
-- Hashed: $2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5

INSERT INTO users (name, email, password, role, created_at)
VALUES (
  'Admin Name',
  'admin@example.com',
  '$2a$12$YOUR_HASHED_PASSWORD_HERE',
  'admin',
  NOW()
);
```

### Method 3: Using Backend API

You can also create an admin via API (requires authentication):

```bash
curl -X POST http://localhost:5000/api/admin/admins \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "New Admin",
    "email": "newadmin@example.com",
    "password": "securepassword123"
  }'
```

## Admin Capabilities

Admins have **FULL ACCESS** to manage:

### ✅ Projects Management
- Create, edit, delete projects
- Set project status (planned, ongoing, completed)
- Add project descriptions and details
- All projects are visible to users

### ✅ Faculties Management
- Edit faculty descriptions
- Manage faculty information
- All changes are visible to users

### ✅ Media & Photos
- Upload photos and media
- Approve/reject media
- Delete media
- All approved media is visible to users

### ✅ Donations Management
- View all donations
- Filter donations by type, status, date
- Export donations to CSV
- View donation details

### ✅ Donors Management
- View all donors
- Mark donors for Hall of Fame
- View donor statistics

### ✅ Admin Management
- View all admins
- Create new admins
- Delete admins (cannot delete last admin)
- Manage admin access

## Admin Routes

All admin routes are protected and require:
1. Authentication (valid JWT token)
2. Admin role verification

**Admin Routes:**
- `/admin/dashboard` - Analytics and statistics
- `/admin/projects` - Project management
- `/admin/faculties` - Faculty management
- `/admin/media` - Media and photo management
- `/admin/donations` - Donation management
- `/admin/donors` - Donor management
- `/admin/admins` - Admin user management

## Security Notes

1. **Password Requirements**
   - Minimum 6 characters
   - Stored as bcrypt hash (cost 12)
   - Never stored in plain text

2. **Last Admin Protection**
   - Cannot delete the last admin
   - At least one admin must always exist
   - Prevents lockout scenarios

3. **Role Verification**
   - All admin routes check for `role: 'admin'`
   - Regular users cannot access admin routes
   - Admin status is verified on every request

## Viewing Existing Admins

### Through Admin Panel
1. Login as admin
2. Go to `/admin/admins`
3. See all admins with:
   - Name and email
   - Role (admin)
   - Creation date
   - Profession (if set)

### Through Database

```sql
SELECT id, name, email, role, created_at, updated_at
FROM users
WHERE role = 'admin'
ORDER BY created_at DESC;
```

### Through API

```bash
curl -X GET http://localhost:5000/api/admin/admins \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Default Admin Credentials

After initial setup, you may have a default admin:

**Email**: `admin@daralhikma.org`  
**Password**: `admin123`

⚠️ **IMPORTANT**: Change the default password immediately after first login!

## Troubleshooting

### Cannot Create Admin
- Check if email already exists
- Verify password meets requirements (min 6 chars)
- Ensure you're logged in as an admin
- Check backend logs for errors

### Cannot Delete Admin
- Ensure there's more than one admin
- Last admin cannot be deleted
- Check if admin exists in database

### Admin Cannot Login
- Verify email is correct
- Check password is correct
- Verify user has `role = 'admin'` in database
- Check JWT token expiration

## Best Practices

1. **Use Strong Passwords**
   - Minimum 12 characters
   - Mix of letters, numbers, symbols
   - Unique for each admin

2. **Limit Admin Access**
   - Only create admins for trusted users
   - Regularly review admin list
   - Remove inactive admins

3. **Monitor Admin Activity**
   - Check admin dashboard regularly
   - Review changes made by admins
   - Keep audit logs if needed

4. **Backup Admin Credentials**
   - Store admin credentials securely
   - Have at least 2 admins at all times
   - Document admin creation process

## Support

For issues or questions:
1. Check backend logs
2. Verify database connection
3. Check API responses
4. Review error messages in admin panel

