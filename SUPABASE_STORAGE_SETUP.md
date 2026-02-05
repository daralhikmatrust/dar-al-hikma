# Supabase Storage Setup Guide

## 🎯 Required Configuration

This guide ensures About Us photos and Audit PDFs are visible on the user website.

---

## 📦 Step 1: Create Storage Buckets

Create these buckets in your Supabase project:

### 1a. `media` bucket (Homepage slider, QR codes, other site assets)

1. Go to **Storage** → **"New bucket"**
2. Bucket name: `media`
3. Public bucket: ✅ YES
4. File size limit: 50MB

### 1b. `about-us-media` bucket (About Us member photos – REQUIRED)

1. Go to **Storage** → **"New bucket"**
2. **Bucket name must be exactly:** `about-us-media` (with hyphens, no spaces)
3. **Public bucket: ✅ YES** (required for photos to display)
4. File size limit: 10MB (optional)

### 1c. `audit-reports` bucket (Audit PDFs – REQUIRED)

1. Go to **Storage** → **"New bucket"**
2. **Bucket name must be exactly:** `audit-reports` (with hyphen, no spaces)
3. **Public bucket: ✅ YES** (required for PDFs to open/download)
4. File size limit: 15MB (optional)

**IMPORTANT**:
- Names must match exactly (case-sensitive)
- Both must be **Public** or files will not be viewable
- After creating, run the SQL in Step 2 to add policies

---

## 🔓 Step 2: Set Bucket Policies (REQUIRED for uploads + public read)

**About Us buckets will NOT store files until you run the policies SQL.**

Go to **Supabase Dashboard → SQL Editor** and run the script:

```
backend/sql/supabase-about-us-buckets-setup.sql
```

Or copy and run this SQL:

```sql
-- Drop existing policies (to avoid duplicates)
DROP POLICY IF EXISTS "about-us-media public read" ON storage.objects;
DROP POLICY IF EXISTS "about-us-media allow insert" ON storage.objects;
DROP POLICY IF EXISTS "about-us-media allow update" ON storage.objects;
DROP POLICY IF EXISTS "about-us-media allow delete" ON storage.objects;
DROP POLICY IF EXISTS "audit-reports public read" ON storage.objects;
DROP POLICY IF EXISTS "audit-reports allow insert" ON storage.objects;
DROP POLICY IF EXISTS "audit-reports allow update" ON storage.objects;
DROP POLICY IF EXISTS "audit-reports allow delete" ON storage.objects;

-- Public read (anyone can view)
CREATE POLICY "about-us-media public read" ON storage.objects FOR SELECT USING (bucket_id = 'about-us-media');
CREATE POLICY "audit-reports public read" ON storage.objects FOR SELECT USING (bucket_id = 'audit-reports');

-- Allow INSERT (uploads from backend)
CREATE POLICY "about-us-media allow insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'about-us-media');
CREATE POLICY "audit-reports allow insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'audit-reports');

-- Allow UPDATE and DELETE
CREATE POLICY "about-us-media allow update" ON storage.objects FOR UPDATE USING (bucket_id = 'about-us-media') WITH CHECK (bucket_id = 'about-us-media');
CREATE POLICY "audit-reports allow update" ON storage.objects FOR UPDATE USING (bucket_id = 'audit-reports') WITH CHECK (bucket_id = 'audit-reports');
CREATE POLICY "about-us-media allow delete" ON storage.objects FOR DELETE USING (bucket_id = 'about-us-media');
CREATE POLICY "audit-reports allow delete" ON storage.objects FOR DELETE USING (bucket_id = 'audit-reports');
```

---

## 🧪 Step 3: Test Storage Access

### Test 1: Upload a Test File

1. Go to **Storage** → `media` bucket
2. Click **"Upload file"**
3. Upload any image (e.g., `test.jpg`)
4. Note the file path (e.g., `test.jpg`)

### Test 2: Verify Public URL

The public URL format should be:
```
https://<your-project>.supabase.co/storage/v1/object/public/media/<file-path>
```

Example:
```
https://abc123xyz.supabase.co/storage/v1/object/public/media/test.jpg
```

Open this URL in your browser:
- ✅ **Success**: Image displays
- ❌ **Fail**: 403 Forbidden → Policies not set correctly

---

## 📂 Step 4: Verify Folder Structure

### `media` bucket (homepage, QR, etc.)
```
media/
├── dar-al-hikma/
│   └── site-assets/
│       ├── home-slider/
│       └── qr/
└── (other folders as needed)
```

### `about-us-media` bucket (member photos)
```
about-us-media/
├── council/
├── advisory/
└── legal_financial/
```

### `audit-reports` bucket (PDFs)
```
audit-reports/
├── 23-24-1738123456789.pdf
└── (other fiscal year PDFs)
```

---

## 🔍 Step 5: Verify Backend Configuration

Check your backend `.env` file has:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_MEDIA_BUCKET=media
```

**IMPORTANT**: 
- Use **Service Role Key** (not anon key) for backend
- Service Role Key bypasses RLS for admin operations
- Never expose Service Role Key in frontend

---

## 🧪 Step 6: Test Photo Upload from Admin

1. Login to Admin panel
2. Go to **About Us** → **Our Council**
3. Click **"+ Add Member"**
4. Fill in:
   - Name: Test Member
   - Role: Test Role
   - Upload a photo
5. Click **"Save"**
6. Check the member list - photo thumbnail should appear
7. Open **Preview: Our Council** link
8. Verify photo displays on public page

**Expected Result**: Photo visible on both admin and user pages

**If photo not visible**:
- Check browser console for errors
- Check network tab for 403 errors
- Verify bucket policies (Step 2)
- Verify backend env vars (Step 5)

---

## 📄 Step 7: Test PDF Upload from Admin

1. In Admin panel, go to **About Us** → **Audit Reports**
2. Click **"+ Add Audit Report"**
3. Fill in:
   - Title: Test Audit Report
   - Fiscal Year: 23-24
   - Upload a PDF file
4. Click **"Save"**
5. Open **Preview: Audit Reports** link
6. Click **"View"** button
7. Verify PDF displays in embedded viewer
8. Click **"Download"** button
9. Verify PDF downloads correctly

**Expected Result**: PDF visible and downloadable on user page

---

## 🔧 Troubleshooting

### Issue: 403 Forbidden on Images/PDFs

**Cause**: Bucket not public or policies not set

**Fix**:
1. Go to Storage → `media` bucket
2. Click **"Settings"** (gear icon)
3. Ensure **"Public bucket"** is checked
4. Re-run policies from Step 2

### Issue: Images Upload but Don't Display

**Cause**: Wrong bucket or missing `about-us-media` bucket

**Fix**:
1. Create `about-us-media` bucket (Step 1b) and set it to public
2. Add public read policy for `about-us-media`
3. Check database - verify `photo_url` column has full URL
4. URL format: `https://<project>.supabase.co/storage/v1/object/public/about-us-media/council/...`

### Issue: 401 Unauthorized on Upload

**Cause**: Invalid or missing Service Role Key

**Fix**:
1. Go to Supabase Dashboard → **Settings** → **API**
2. Copy **Service Role Key** (not anon key)
3. Update backend `.env`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   ```
4. Restart backend server

### Issue: Photos Show Placeholder (? icon)

**Cause**: Frontend not receiving photo URL from API

**Fix**:
1. Open browser DevTools → Network tab
2. Refresh About Us page
3. Find `/api/about-us` request
4. Check response - verify `photo` field has URL
5. If `photo` is `null` or `undefined`:
   - Check database `about_us_members.photo_url` column
   - Re-upload photo from admin
   - Verify backend fix from previous session is applied

---

## ✅ Verification Checklist

- [ ] `media` bucket created and public (homepage, QR)
- [ ] `about-us-media` bucket created and public
- [ ] `audit-reports` bucket created and public
- [ ] Public read policies for all three buckets
- [ ] Backend `.env` has SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
- [ ] Test member photo upload from Admin → About Us
- [ ] Test photo displays on user Council/Board pages
- [ ] Test audit PDF upload from Admin → About Us
- [ ] Test PDF View/Download on user Audit page
- [ ] No 403 errors in browser console
- [ ] No broken images or "PDF not available" on user pages

---

## 🎯 Expected URLs

### Member Photo Example (from `about-us-media` bucket)
```
Database: photo_url column
https://abc123xyz.supabase.co/storage/v1/object/public/about-us-media/council/1738123456789-abc123.jpg
```

### Audit PDF Example (from `audit-reports` bucket)
```
Database: file_url column
https://abc123xyz.supabase.co/storage/v1/object/public/audit-reports/23-24-1738123456789.pdf
```

---

*Setup completed successfully = Photos and PDFs visible on user website* ✅
