import pkg from "pg";
const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set in environment variables");
  process.exit(1);
}

// 🚀 Optimized configuration for Supabase Free Tier
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Required for Supabase production
  
  // Lowered max connections to 10 to stay within Supabase limits
  max: 10, 
  
  // Reduced idle timeout to 10s to free up connections faster
  idleTimeoutMillis: 10000, 
  
  // Return error after 5s if connection cannot be established
  connectionTimeoutMillis: 5000, 
  allowExitOnIdle: false,
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  // Do not process.exit(-1) here in production to keep the server alive
});

// Connection retry logic with exponential backoff
const retryConnection = async (maxRetries = 5, delay = 2000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await pool.query("SELECT 1 as test");
      if (result.rows[0].test === 1) return true;
    } catch (err) {
      console.log(`⚠️ Connection attempt ${i + 1}/${maxRetries} failed: ${err.message}`);
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 1.5; 
      } else {
        throw err;
      }
    }
  }
  return false;
};

export const initDatabase = async () => {
  try {
    console.log("🔄 Attempting to connect to PostgreSQL...");
    await retryConnection();
    
    const result = await pool.query("SELECT NOW() as current_time, version() as db_version");
    console.log("✅ Successfully connected to PostgreSQL database");
    console.log(`📊 DB Version: ${result.rows[0].db_version.split(' ')[1]}`);
    
    // Test table existence check
    try {
      await pool.query("SELECT 1 FROM users LIMIT 1");
      console.log("✅ Database tables are initialized");
    } catch (tableErr) {
      if (tableErr.code === '42P01') {
        console.warn("⚠️ Database tables (users) not found.");
      }
    }
    
    return true;
  } catch (err) {
    console.error("❌ Database connection failed after retries", err.message);
    // Don't kill the process, let the health check handle it
    return false;
  }
};

// Health check function for Render
export const checkDatabaseHealth = async () => {
  try {
    await pool.query("SELECT 1");
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