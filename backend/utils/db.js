import pkg from "pg";
const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set in environment variables");
  console.error("Please create a .env file with DATABASE_URL");
  process.exit(1);
}

// Enhanced connection pool configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false }
    : { rejectUnauthorized: false }, // Required for Supabase
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection cannot be established
  allowExitOnIdle: false, // Keep pool alive
});

// Handle pool errors
pool.on('error', (err, client) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// Connection retry logic
const retryConnection = async (maxRetries = 5, delay = 2000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await pool.query("SELECT 1 as test");
      if (result.rows[0].test === 1) {
        return true;
      }
    } catch (err) {
      console.log(`⚠️  Connection attempt ${i + 1}/${maxRetries} failed: ${err.message}`);
      if (i < maxRetries - 1) {
        console.log(`⏳ Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 1.5; // Exponential backoff
      } else {
        throw err;
      }
    }
  }
  return false;
};

export const initDatabase = async () => {
  try {
    console.log("🔄 Attempting to connect to database...");
    console.log(`📍 Database URL: ${process.env.DATABASE_URL ? 'Set ✓' : 'Missing ✗'}`);
    
    await retryConnection();
    
    // Test query to verify connection
    const result = await pool.query("SELECT NOW() as current_time, version() as db_version");
    console.log("✅ Successfully connected to PostgreSQL database");
    console.log(`⏰ Database time: ${result.rows[0].current_time}`);
    console.log(`📊 Database version: ${result.rows[0].db_version.split(' ')[0]} ${result.rows[0].db_version.split(' ')[1]}`);
    
    // Test table existence
    try {
      await pool.query("SELECT 1 FROM users LIMIT 1");
      console.log("✅ Database tables are initialized");
    } catch (tableErr) {
      if (tableErr.code === '42P01') {
        console.warn("⚠️  Database tables not found. Run migrations or seed script.");
      }
    }
    
    return true;
  } catch (err) {
    console.error("❌ Database connection failed after retries");
    console.error("Error details:", {
      message: err.message,
      code: err.code,
      errno: err.errno,
      syscall: err.syscall,
      address: err.address,
      port: err.port
    });
    
    console.error("\n💡 Troubleshooting tips:");
    console.error("1. Check if DATABASE_URL is correct in .env file");
    console.error("2. Verify database is running and accessible");
    console.error("3. Check network connectivity");
    console.error("4. For Supabase: Ensure database is not paused");
    console.error("5. Check firewall/antivirus settings");
    
    process.exit(1);
  }
};

// Health check function
export const checkDatabaseHealth = async () => {
  try {
    const result = await pool.query("SELECT 1");
    return { healthy: true, message: "Database is connected" };
  } catch (err) {
    return { healthy: false, message: err.message };
  }
};

// Graceful shutdown
export const closeDatabase = async () => {
  try {
    await pool.end();
    console.log("✅ Database pool closed gracefully");
  } catch (err) {
    console.error("❌ Error closing database pool:", err.message);
  }
};

export default pool;
