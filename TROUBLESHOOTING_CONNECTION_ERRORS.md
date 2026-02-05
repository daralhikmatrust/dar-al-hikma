# Troubleshooting Connection Errors

## Understanding the Errors

### `ERR_CONNECTION_REFUSED`
**Meaning**: The backend server is not running or not accessible on port 5000.

**Solution**: Start the backend server.

### `401 Unauthorized` on `/api/admin/dashboard`
**Meaning**: You're not authenticated or your token expired.

**Solution**: 
- Login again
- Check if token is valid
- Verify JWT_SECRET is set correctly

### `400 Bad Request` on `/api/donations/razorpay/verify`
**Meaning**: Invalid request data or payment verification failed.

**Solution**: 
- Check payment signature is valid
- Verify payment_id and order_id are correct
- Check backend logs for details

## Step-by-Step Fix

### 1. Start Backend Server

Open a terminal and run:
```bash
cd backend
npm run dev
```

**Expected Output**:
```
🔄 Attempting to connect to database...
✅ Successfully connected to PostgreSQL database
⏰ Database time: 2026-01-28...
📊 Database version: PostgreSQL 15.x
✅ Database tables are initialized
🚀 Server running on port 5000
```

**If you see errors**, check:
- Is `.env` file present? ✅ (You have it)
- Are all required variables set?
- Is database accessible?

### 2. Verify Server is Running

Open browser: http://localhost:5000/health

**Should return**:
```json
{
  "success": true,
  "message": "Server and database are healthy",
  "database": {
    "healthy": true
  }
}
```

### 3. Check Environment Variables

Your `.env` file should have:
```env
# Required
DATABASE_URL=postgresql://...
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
JWT_SECRET=...
PORT=5000

# Optional but recommended
RAZORPAY_WEBHOOK_SECRET=...
JWT_REFRESH_SECRET=...
NODE_ENV=development
```

### 4. Test Payment Flow

Once server is running:

1. **Create Order**: Should work without errors
2. **Verify Payment**: Should return success
3. **Check Logs**: Monitor backend console

## Common Issues & Quick Fixes

### Issue: Server Won't Start

**Check**:
1. Port 5000 available? `netstat -ano | findstr :5000`
2. Database connection? Check DATABASE_URL
3. Dependencies installed? `npm install`

**Fix**:
```bash
# Kill process on port 5000 (Windows)
netstat -ano | findstr :5000
taskkill /PID <process_id> /F

# Or change port in .env
PORT=5001
```

### Issue: Database Connection Failed

**Check**:
1. DATABASE_URL format is correct
2. Supabase database is not paused
3. Network/firewall allows connection

**Fix**:
- Verify DATABASE_URL in Supabase dashboard
- Test connection: `psql $DATABASE_URL` (if psql installed)
- Check Supabase project is active

### Issue: Module Not Found

**Fix**:
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Issue: 401 Unauthorized

**Fix**:
1. Clear browser localStorage/sessionStorage
2. Login again
3. Check JWT_SECRET is set in backend

### Issue: 400 Bad Request on Verify

**Possible Causes**:
1. Invalid payment signature
2. Payment already processed
3. Amount mismatch

**Check Backend Logs**:
```bash
# Look for error messages in backend console
# Should show: "Payment verification error [TYPE]: ..."
```

## Verification Checklist

Before testing payment flow:

- [ ] Backend server is running (`npm run dev`)
- [ ] Health check works (http://localhost:5000/health)
- [ ] Database connection successful
- [ ] All environment variables set
- [ ] Migration script executed
- [ ] Frontend can reach backend (no connection errors)

## Still Not Working?

1. **Check Backend Console**: Look for error messages
2. **Check Browser Console**: Look for specific error details
3. **Verify Environment**: All required vars in `.env`
4. **Test Database**: Can you connect to Supabase?
5. **Check Ports**: Is 5000 available?

## Quick Test Script

Run this to verify everything:
```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Test health
curl http://localhost:5000/health

# Should return JSON with success: true
```
