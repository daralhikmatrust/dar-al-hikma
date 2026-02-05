// Simple Web Interface to Add Admin
// Run: node utils/add-admin-web.js
// Then open: http://localhost:3001

import "dotenv/config";
import express from "express";
import pool from "./db.js";
import bcrypt from "bcryptjs";
import User from "../models/User.model.js";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Simple HTML form
const htmlForm = `
<!DOCTYPE html>
<html>
<head>
  <title>Create Admin - Dar Al Hikma Trust</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 20px;
      padding: 40px;
      max-width: 500px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 {
      color: #333;
      margin-bottom: 10px;
      font-size: 28px;
    }
    .subtitle {
      color: #666;
      margin-bottom: 30px;
      font-size: 14px;
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      margin-bottom: 8px;
      color: #333;
      font-weight: 600;
      font-size: 14px;
    }
    input {
      width: 100%;
      padding: 12px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 16px;
      transition: border-color 0.3s;
    }
    input:focus {
      outline: none;
      border-color: #667eea;
    }
    button {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s;
    }
    button:hover {
      transform: translateY(-2px);
    }
    .message {
      margin-top: 20px;
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
    }
    .success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
    .error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
    .info {
      background: #d1ecf1;
      color: #0c5460;
      border: 1px solid #bee5eb;
      margin-bottom: 20px;
      padding: 15px;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔐 Create Admin User</h1>
    <p class="subtitle">Add a new admin user to Dar Al Hikma Trust</p>
    
    <div class="info">
      <strong>💡 Tip:</strong> After creating, login at <code>/admin/login</code>
    </div>

    <form id="adminForm">
      <div class="form-group">
        <label>Full Name *</label>
        <input type="text" name="name" placeholder="Admin Name" required>
      </div>
      <div class="form-group">
        <label>Email Address *</label>
        <input type="email" name="email" placeholder="admin@example.com" required>
      </div>
      <div class="form-group">
        <label>Password *</label>
        <input type="password" name="password" placeholder="Minimum 6 characters" minlength="6" required>
      </div>
      <button type="submit">Create Admin</button>
    </form>

    <div id="message"></div>
  </div>

  <script>
    document.getElementById('adminForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData);
      
      const messageDiv = document.getElementById('message');
      messageDiv.innerHTML = '<div class="message">Creating admin...</div>';

      try {
        const response = await fetch('/create-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
          messageDiv.innerHTML = \`
            <div class="message success">
              <strong>✅ Success!</strong><br>
              Admin created successfully!<br><br>
              <strong>Email:</strong> \${data.email}<br>
              <strong>Password:</strong> \${data.password}<br><br>
              <a href="/admin/login" style="color: #155724; text-decoration: underline;">Login Now</a>
            </div>
          \`;
          e.target.reset();
        } else {
          messageDiv.innerHTML = \`
            <div class="message error">
              <strong>❌ Error:</strong><br>
              \${result.message || 'Failed to create admin'}
            </div>
          \`;
        }
      } catch (error) {
        messageDiv.innerHTML = \`
          <div class="message error">
            <strong>❌ Error:</strong><br>
            \${error.message}
          </div>
        \`;
      }
    });
  </script>
</body>
</html>
`;

// API endpoint to create admin
app.post('/create-admin', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    if (password.length < 6) {
      return res.json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Check if user exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      if (existingUser.role === 'admin') {
        return res.json({
          success: false,
          message: 'Admin with this email already exists'
        });
      } else {
        // Promote to admin
        const hashedPassword = await bcrypt.hash(password, 12);
        await pool.query(
          "UPDATE users SET password = $1, role = 'admin', updated_at = NOW() WHERE email = $2",
          [hashedPassword, email.toLowerCase()]
        );
        return res.json({
          success: true,
          message: 'Existing user promoted to admin'
        });
      }
    }

    // Create new admin
    const admin = await User.create({
      name,
      email,
      password,
      role: 'admin'
    });

    res.json({
      success: true,
      message: 'Admin created successfully',
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.json({
      success: false,
      message: error.message || 'Failed to create admin'
    });
  }
});

// Serve HTML form
app.get('/', (req, res) => {
  res.send(htmlForm);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`\n🌐 Admin Creation Web Interface`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📍 Open in browser: http://localhost:${PORT}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
});

