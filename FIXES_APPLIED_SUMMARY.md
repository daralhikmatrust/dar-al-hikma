# Fixes Applied Summary

## ✅ Issues Fixed (No UI Redesign)

### 1. Duplicate Key "education" Warning – FIXED
**Cause:** Category dropdown items used `cat.id` or `cat.name` as React keys; duplicate category names produced duplicate keys.

**Change:** Use index-based keys for category items: `id: \`nav-cat-${i}\`` so each item has a unique key.

### 2. 401 Unauthorized on Admin Dashboard – IMPROVED
**Cause:** On network/server errors, AuthContext cleared all tokens, forcing logout.

**Change:**
- Only clear tokens on 401/403 (auth errors)
- On network error (no `error.response`), keep tokens so session survives backend downtime
- When no token on load, explicitly set `user` to null and `loading` to false

### 3. About Us Member Photos – Now Visible on User Pages

**Root cause:** 
- `getPublicObjectUrl()` was called with only 1 parameter instead of 2 (bucket + path).
- Existing records could have `photo` (storage path) but null `photo_url`.

**Changes:**
- **Backend (`aboutus.controller.js`)**: 
  - Corrected `getPublicObjectUrl(SUPABASE_MEDIA_BUCKET, fileName)` for uploads.
  - Added URL resolution in public and admin APIs: if `photo_url` is null but `photo` has a storage path, full public URL is built at runtime.
- **Storage:** Uses existing `media` bucket (same as Home slider, QR codes).
- **Fallback:** Placeholder shown when no photo exists.

### 4. Audit PDFs – Now Visible and Downloadable

**Root cause:** Same URL generation bug for PDFs.

**Changes:**
- **Backend:** Corrected `getPublicObjectUrl(SUPABASE_MEDIA_BUCKET, fileNameUpload)` for uploads.
- **Public API:** Builds full URL when `file_url` is a path instead of a full URL.
- **Admin API:** Same resolution logic for admin view.

### 5. Navbar Duplicate Key (see #1 above)

**Cause:** Category items used `sub.label` as React key; duplicate category names caused duplicate keys.

**Changes:**
- Added unique `id` to all dropdown items (About, Explore, Categories).
- Category items use `cat.id || cat.name || cat-${i}`.
- Dropdown items use `key={sub.id || sub.label + '-' + i}`.
- Inner dropdown triggers changed from `<button>` to `<div role="button">` to avoid nested buttons.

### 6. Member Image/Placeholder Size

**Change:** Photo area increased from `w-24 h-24` (96px) to `w-32 h-32` (128px) in `MemberCard.jsx` so member images look more prominent.

### 7. 401 Redirect to Correct Login Page

**Change:** In `api.js`, when a 401 triggers redirect after failed token refresh, admin API requests now redirect to `/admin/login` instead of `/login`.

### 8. Validation Relaxed for Edit Operations

**Change:** Photo/PDF required only for new members/audits. Editing existing records without changing photo/PDF is allowed.

---

## 📁 Files Modified

### Backend
- `backend/controllers/aboutus.controller.js`
  - URL resolution for members and audit reports in both public and admin APIs
  - Correct `getPublicObjectUrl` usage on upload (2 parameters)

### Frontend
- `frontend/src/components/Navbar.jsx` – Unique keys, dropdown item structure
- `frontend/src/components/about/MemberCard.jsx` – Larger image/placeholder
- `frontend/src/services/api.js` – Admin 401 → `/admin/login` redirect
- `frontend/src/pages/admin/AboutUs.jsx` – Validation only for new records

---

## 🔧 Storage Configuration

About Us photos and audit PDFs use the same `media` bucket as:
- Home slider images
- QR code
- Other site assets

Path layout:
- Photos: `media/about-us/{council|advisory|legal_financial}/{timestamp}-{id}.{ext}`
- PDFs: `media/audit-reports/{fiscalYear}-{timestamp}.pdf`

Confirm in Supabase:
1. `media` bucket exists and is public.
2. Policy allows public read access.
3. `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set in backend `.env`.

---

## 🚫 Remember Me / Password

Storing passwords (even encrypted) is not recommended. Current behavior:

- **Remember Me = true:** Tokens stored in `localStorage` so sessions persist across restarts.
- **Remember Me = false:** Tokens stored in `sessionStorage`; session ends when the tab is closed.
- Passwords are never stored; only JWT access and refresh tokens are persisted.

---

## 📋 What to Do if Photos/PDFs Still Don’t Show

1. **Verify Supabase bucket**
   - Bucket name must be `media`.
   - Bucket must be public (or have a public-read policy).
   - Backend `.env` has `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

2. **Re-upload if needed**
   - Old records may have invalid `photo_url` / `file_url`.
   - Re-upload via Admin → About Us for those members/audits.
   - New uploads will store correct public URLs.

3. **Restart backend**
   - Restart the Node server so changes in `aboutus.controller.js` and env are applied.

**ERR_CONNECTION_REFUSED:** The backend is not running. Start it with `cd backend && npm run dev`.
