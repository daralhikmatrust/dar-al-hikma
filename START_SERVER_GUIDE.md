# Backend Server Startup Guide

## Quick Start

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Install Dependencies (if not already installed)
```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the `backend` directory with:

```env
# Database (Supabase PostgreSQL)
DATABASE_URL=your_supabase_connection_string

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# Node Environment
NODE_ENV=development
PORT=5000

# Email (Optional - for receipts)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### 4. Run Database Migration

Make sure you've run the migration:
```sql
-- Execute: backend/sql/migration-donation-system-improvements.sql
-- In your Supabase SQL Editor
```

### 5. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

### 6. Verify Server is Running

Open your browser or use curl:
```bash
curl http://localhost:5000/health
```

You should see:
```json
{
  "success": true,
  "message": "Server and database are healthy",
  "database": {
    "healthy": true,
    "message": "Database is connected"
  },
  "time": "2026-01-28T..."
}
```

## Common Issues & Solutions

### Issue 1: `ERR_CONNECTION_REFUSED`
**Cause**: Backend server is not running

**Solution**:
1. Check if server is running: `netstat -ano | findstr :5000` (Windows) or `lsof -i :5000` (Mac/Linux)
2. Start the server: `cd backend && npm run dev`
3. Check for errors in the console

### Issue 2: Database Connection Failed
**Cause**: Invalid `DATABASE_URL` or database not accessible

**Solution**:
1. Verify `DATABASE_URL` in `.env` file
2. Check Supabase dashboard - ensure database is not paused
3. Test connection: `psql $DATABASE_URL` (if psql is installed)

### Issue 3: Missing Environment Variables
**Cause**: Required env vars not set

**Solution**:
1. Check `.env` file exists in `backend` directory
2. Verify all required variables are set (see above)
3. Restart server after adding variables

### Issue 4: Port Already in Use
**Cause**: Another process is using port 5000

**Solution**:
1. Find process: `netstat -ano | findstr :5000`
2. Kill process or change PORT in `.env`

### Issue 5: Module Not Found Errors
**Cause**: Dependencies not installed

**Solution**:
```bash
cd backend
npm install
```

## Verification Checklist

- [ ] Backend server starts without errors
- [ ] `/health` endpoint returns success
- [ ] Database connection successful
- [ ] All environment variables set
- [ ] Migration script executed
- [ ] Frontend can connect to backend (check browser console)

## Testing the Payment Flow

1. **Start Backend**: `cd backend && npm run dev`
2. **Start Frontend**: `cd frontend && npm run dev`
3. **Test Order Creation**: Try creating a donation order
4. **Check Logs**: Monitor backend console for errors
5. **Test Webhook**: Use Razorpay test webhook or test payment

## Production Deployment

For production:
1. Set `NODE_ENV=production`
2. Use process manager (PM2, systemd, etc.)
3. Set up proper logging
4. Configure webhook URL in Razorpay dashboard
5. Set up SSL/HTTPS
6. Configure environment variables securely
