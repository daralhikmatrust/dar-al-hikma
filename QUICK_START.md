# Quick Start - Fix Connection Errors

## The Problem

You're seeing `ERR_CONNECTION_REFUSED` errors because **the backend server is not running**.

## Solution (3 Steps)

### Step 1: Open Terminal in Backend Directory

```bash
cd backend
```

### Step 2: Start the Server

```bash
npm run dev
```

You should see:
```
🔄 Attempting to connect to database...
✅ Successfully connected to PostgreSQL database
🚀 Server running on port 5000
```

### Step 3: Verify It's Working

Open: http://localhost:5000/health

You should see:
```json
{
  "success": true,
  "message": "Server and database are healthy"
}
```

## If You See Errors

### Error: "DATABASE_URL is not set"
**Fix**: Create `backend/.env` file:
```env
DATABASE_URL=your_supabase_connection_string
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
JWT_SECRET=your_jwt_secret
PORT=5000
```

### Error: "Database connection failed"
**Fix**: 
1. Check `DATABASE_URL` is correct
2. Verify Supabase database is not paused
3. Check network connection

### Error: "Port 5000 already in use"
**Fix**: 
- Kill the process using port 5000, OR
- Change `PORT=5001` in `.env` file

## After Server Starts

1. **Keep the terminal open** - Server runs in that window
2. **Start frontend** in another terminal:
   ```bash
   cd frontend
   npm run dev
   ```
3. **Test the app** - Errors should be gone!

## Still Having Issues?

1. Check backend console for error messages
2. Verify `.env` file exists and has correct values
3. Make sure database migration was run
4. Check if port 5000 is available
