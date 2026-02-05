// PostgreSQL Seed Script for Supabase
import "dotenv/config";
import pool from "./db.js";
import bcrypt from "bcryptjs";

const seedPostgres = async () => {
  try {
    console.log("🌱 Starting PostgreSQL database seeding...");

    // Check if users table exists, if not create it
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'user',
          profession VARCHAR(100),
          phone VARCHAR(20),
          address JSONB,
          is_hall_of_fame BOOLEAN DEFAULT false,
          refresh_token TEXT,
          reset_password_token TEXT,
          reset_password_expire TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log("✅ Users table ready");
    } catch (err) {
      if (err.code !== '42P07') { // Table already exists
        throw err;
      }
      console.log("✅ Users table already exists");
    }

    // Check if admin already exists
    const existingAdmin = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      ["admin@daralhikma.org"]
    );

    if (existingAdmin.rows.length > 0) {
      console.log("⚠️  Admin already exists. Updating password...");
      const hashedPassword = await bcrypt.hash("admin123", 12);
      await pool.query(
        "UPDATE users SET password = $1, role = 'admin' WHERE email = $2",
        [hashedPassword, "admin@daralhikma.org"]
      );
      console.log("✅ Admin password updated");
    } else {
      // Create demo admin
      const hashedPassword = await bcrypt.hash("admin123", 12);
      const adminResult = await pool.query(
        `INSERT INTO users (name, email, password, role, profession)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, email, role, created_at`,
        ["Demo Admin", "admin@daralhikma.org", hashedPassword, "admin", "Administrator"]
      );
      console.log("✅ Demo admin created:", adminResult.rows[0].email);
    }

    // Create additional demo admin
    const demoAdmin2 = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      ["demo@daralhikma.org"]
    );

    if (demoAdmin2.rows.length === 0) {
      const hashedPassword2 = await bcrypt.hash("demo123", 12);
      await pool.query(
        `INSERT INTO users (name, email, password, role, profession)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, email, role, created_at`,
        ["Demo Admin 2", "demo@daralhikma.org", hashedPassword2, "admin", "Administrator"]
      );
      console.log("✅ Second demo admin created: demo@daralhikma.org");
    }

    console.log("\n🎉 Database seeding completed!");
    console.log("\n📝 Demo Admin Credentials:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Email: admin@daralhikma.org");
    console.log("Password: admin123");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\nEmail: demo@daralhikma.org");
    console.log("Password: demo123");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n🔗 Login at: http://localhost:5173/admin/login");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding error:", error.message);
    console.error(error);
    process.exit(1);
  }
};

seedPostgres();

