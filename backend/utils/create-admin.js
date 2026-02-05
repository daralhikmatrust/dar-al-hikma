// Simple Admin Creation Script
// Usage: node utils/create-admin.js "Admin Name" "admin@email.com" "password123"

import "dotenv/config";
import pool from "./db.js";
import bcrypt from "bcryptjs";
import User from "../models/User.model.js";

const createAdmin = async () => {
  try {
    const args = process.argv.slice(2);
    
    if (args.length < 3) {
      console.log("📝 Usage: node utils/create-admin.js \"Name\" \"email@example.com\" \"password\"");
      console.log("\nExample:");
      console.log('  node utils/create-admin.js "John Doe" "john@example.com" "mypassword123"');
      process.exit(1);
    }

    const [name, email, password] = args;

    console.log("🔄 Creating admin user...");
    console.log(`Name: ${name}`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password.length} characters`);

    // Check if user exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      if (existingUser.role === 'admin') {
        console.log("⚠️  Admin with this email already exists!");
        console.log("Updating to admin role...");
        await pool.query(
          "UPDATE users SET role = 'admin' WHERE email = $1",
          [email.toLowerCase()]
        );
        console.log("✅ User role updated to admin");
      } else {
        // Update existing user to admin
        const hashedPassword = await bcrypt.hash(password, 12);
        await pool.query(
          "UPDATE users SET password = $1, role = 'admin' WHERE email = $2",
          [hashedPassword, email.toLowerCase()]
        );
        console.log("✅ Existing user promoted to admin");
      }
    } else {
      // Create new admin
      const admin = await User.create({
        name,
        email,
        password,
        role: 'admin'
      });
      console.log("✅ Admin created successfully!");
      console.log(`ID: ${admin.id}`);
    }

    console.log("\n🎉 Admin creation completed!");
    console.log(`\n🔗 Login at: http://localhost:5173/admin/login`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error.message);
    console.error(error);
    process.exit(1);
  }
};

createAdmin();

