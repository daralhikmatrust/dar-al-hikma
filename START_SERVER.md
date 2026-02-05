# How to Start the Server

## Quick Start Guide

### 1. Start Backend Server

```bash
cd backend
npm install  # If not already installed
npm run dev   # For development with auto-reload
# OR
npm start     # For production
```

**Important:** Make sure you have a `.env` file in the `backend/` directory with:
```env
DATABASE_URL=your_database_connection_string
PORT=5000
JWT_SECRET=your_jwt_secret
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

### 2. Start Frontend Server

```bash
cd frontend
npm install  # If not already installed
npm run dev
```

The frontend will run on `http://localhost:5173`

### 3. Check Backend Health

Visit: `http://localhost:5000/health`

You should see:
```json
{
  "success": true,
  "message": "Server and database are healthy",
  "database": {
    "healthy": true,
    "message": "Database is connected"
  }
}
```

## Troubleshooting

### Error: "Cannot connect to server"
- Make sure backend is running on port 5000
- Check if DATABASE_URL is set correctly
- Verify database is accessible

### Error: "500 Internal Server Error"
- Check backend console for error messages
- Verify database connection
- Check if all environment variables are set
- Make sure database tables exist (run migrations if needed)

### Error: "Network error"
- Backend server is not running
- Check firewall settings
- Verify CORS configuration

## Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL format
   - Verify database credentials
   - Check if database is running (for local PostgreSQL)
   - For Supabase: Ensure database is not paused

2. **Port Already in Use**
   - Change PORT in .env file
   - Or kill the process using the port

3. **Module Not Found**
   - Run `npm install` in both frontend and backend directories

