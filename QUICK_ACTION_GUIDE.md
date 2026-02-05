# Quick Action Guide - What You Need to Do

## 🚀 Immediate Actions Required

### 1️⃣ Run Database Migration (REQUIRED)

**Why**: Allows audit reports to be uploaded without a URL (file-only uploads)

**How**: Run this SQL command on your PostgreSQL database:

```sql
-- File: backend/sql/migration-audit-reports-file-url-nullable.sql
ALTER TABLE audit_reports ALTER COLUMN file_url DROP NOT NULL;
```

**Methods**:

#### Option A: Using psql
```bash
psql -U your_username -d your_database_name -f backend/sql/migration-audit-reports-file-url-nullable.sql
```

#### Option B: Using pgAdmin
1. Open pgAdmin
2. Connect to your database
3. Open Query Tool
4. Paste the SQL above
5. Click Execute (F5)

#### Option C: Using Supabase Dashboard
1. Go to Supabase Dashboard
2. Click **SQL Editor**
3. Paste the SQL above
4. Click **Run**

---

### 2️⃣ Configure Supabase Storage (REQUIRED)

**Why**: Photos and PDFs need public storage to be visible on user pages

**Follow**: `SUPABASE_STORAGE_SETUP.md` (complete step-by-step guide)

**Quick Steps**:

1. **Create Bucket**
   - Go to Supabase Dashboard → Storage
   - Click "New bucket"
   - Name: `media`
   - Public: ✅ YES
   - Click "Create bucket"

2. **Set Public Read Policy**
   - Click on `media` bucket → Policies tab
   - Click "New Policy" → "For full customization"
   - Paste this SQL:
   ```sql
   CREATE POLICY "Public read access"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'media');
   ```
   - Click "Review" → "Save policy"

3. **Verify Backend .env**
   - Open `backend/.env`
   - Ensure these variables exist:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   SUPABASE_MEDIA_BUCKET=media
   ```

4. **Restart Backend**
   ```bash
   cd backend
   npm start
   ```

---

### 3️⃣ Test the Fixes (RECOMMENDED)

#### Test 1: Member Photo Upload
1. Login to Admin panel
2. Go to **About Us** → **Our Council**
3. Click **"+ Add Member"**
4. Fill form and upload a photo
5. Click **"Save"**
6. Click **"Preview: Our Council"** link
7. **Verify**: Photo displays on public page (not placeholder)

#### Test 2: Audit PDF Upload
1. In Admin panel, go to **About Us** → **Audit Reports**
2. Click **"+ Add Audit Report"**
3. Fill form and upload a PDF
4. Click **"Save"**
5. Click **"Preview: Audit Reports"** link
6. **Verify**: PDF card shows with View/Download buttons
7. Click **"View"** → PDF displays in embedded viewer
8. Click **"Download"** → PDF downloads correctly

#### Test 3: Remember Me
1. Logout if logged in
2. Go to Login page
3. Enter credentials
4. ✅ Check "Remember me"
5. Click "Login"
6. Close browser completely
7. Reopen browser and go to your site
8. **Verify**: Still logged in (redirects to dashboard)

#### Test 4: Without Remember Me
1. Logout
2. Login with "Remember me" ❌ unchecked
3. Close browser
4. Reopen browser
5. **Verify**: Logged out (shows login page)

---

## 🔍 Troubleshooting

### Issue: Photos Still Show Placeholder

**Check**:
1. Is Supabase bucket created and public? (Step 2️⃣)
2. Are backend env vars correct? (Step 2️⃣ #3)
3. Is backend restarted after env changes?
4. Open browser DevTools → Network → Check `/api/about-us` response
5. Verify `photo` field has full URL (not null)

**If photo field is null**:
- Re-upload photo from admin
- Check backend logs for upload errors
- Verify Supabase Service Role Key is correct

### Issue: PDFs Show "Not Available"

**Check**:
1. Same as photos (bucket, policies, env vars)
2. Did you run the database migration? (Step 1️⃣)
3. Check `/api/about-us` response - verify `fileUrl` has URL

### Issue: 401 Errors

**Check**:
1. Is backend running? (`cd backend && npm start`)
2. Is `JWT_SECRET` set in backend `.env`?
3. Try logout and login again
4. Check browser console for token errors

### Issue: React Warnings

**Check**:
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Check browser console for remaining warnings

---

## ✅ Expected Results After Setup

### Admin Panel
- ✅ Upload photos → See thumbnail in list
- ✅ Upload PDFs → See file name in list
- ✅ Preview links work
- ✅ No errors in console

### User Website
- ✅ Council members show photos (not placeholders)
- ✅ Advisory members show photos
- ✅ Legal & Financial members show photos
- ✅ Audit reports show with View/Download buttons
- ✅ PDFs open in browser
- ✅ PDFs download correctly

### Authentication
- ✅ Login with Remember Me → stays logged in after browser restart
- ✅ Login without Remember Me → logged out after browser close
- ✅ No 401 errors on valid requests
- ✅ Token refresh works automatically

---

## 📞 Need Help?

If issues persist after following this guide:

1. **Check browser console** for errors
2. **Check backend logs** for upload/storage errors
3. **Verify Supabase dashboard** - bucket exists and is public
4. **Test storage URL directly** in browser
5. **Check database** - verify URLs are saved correctly

---

## 🎯 Summary

**What was fixed**:
- 2 lines of backend code (photo/PDF URL generation)
- 3 sections of frontend code (nested button warnings)
- Documentation created for setup and troubleshooting

**What you need to do**:
1. Run database migration (1 SQL command)
2. Configure Supabase Storage (5 minutes)
3. Test the fixes (5 minutes)

**Total time**: ~15 minutes to complete setup and verification

---

*Ready for production after completing steps 1️⃣ and 2️⃣* ✅
