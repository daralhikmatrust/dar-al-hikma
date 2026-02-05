# Database Connection Troubleshooting

## ETIMEDOUT Error Fix

If you're getting `ETIMEDOUT` errors when connecting to Supabase, try these solutions:

### Solution 1: Check Supabase Database Status
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Check if your database is **paused** (free tier databases pause after inactivity)
3. If paused, click "Resume" to wake it up
4. Wait 1-2 minutes for the database to fully start

### Solution 2: Check Network Settings
1. Go to Supabase Dashboard → Settings → Database
2. Check "Connection Pooling" settings
3. Make sure "Direct Connection" is enabled
4. Check if your IP is blocked in network restrictions

### Solution 3: Use Connection Pooling (Recommended)
Update your `.env` file to use Supabase's connection pooler:

```env
# Instead of direct connection, use pooler:
DATABASE_URL=postgresql://postgres.ecrczjjravtlmgtiswuq:Anurag%400601200@aws-0-ap-south-1.pooler.supabase.com:6543/postgres

# Or use transaction pooler:
DATABASE_URL=postgresql://postgres.ecrczjjravtlmgtiswuq:Anurag%400601200@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?pgbouncer=true
```

### Solution 4: Force IPv4 (Windows)
If IPv6 is causing issues, you can try:
1. Disable IPv6 temporarily in Windows Network Settings
2. Or use the pooler URL which typically works better with IPv4

### Solution 5: Check Firewall/Antivirus
- Windows Firewall might be blocking the connection
- Antivirus software might be blocking PostgreSQL connections
- Try temporarily disabling firewall/antivirus to test

### Solution 6: Use Direct Connection String
Get the direct connection string from Supabase:
1. Go to Supabase Dashboard → Settings → Database
2. Under "Connection string", select "URI"
3. Copy the connection string
4. Make sure it includes `?sslmode=require`

### Quick Test
Test your connection directly:
```bash
psql "postgresql://postgres:Anurag%400601200@db.ecrczjjravtlmgtiswuq.supabase.co:5432/postgres?sslmode=require"
```

If this works, the issue is in the Node.js connection pool settings.

