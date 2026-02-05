import User from "../models/User.model.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/generateToken.js";
import { sendEmail } from "../utils/sendEmail.js";

/* =========================
   REGISTER
========================= */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, profession, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required",
      });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      profession,
      address,
    });

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    await User.update(user.id, { refresh_token: refreshToken });

    res.status(201).json({
      success: true,
      user,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Register error:", error.message);
    next(error);
  }
};

/* =========================
   LOGIN
========================= */
export const login = async (req, res, next) => {
  // Backward-compatible alias: default to user portal
  return loginUser(req, res, next);
};

async function loginCore(req, res, next, expectedRole) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Get user WITH password
    const userWithPassword = await User.findByEmail(email, true);
    if (!userWithPassword) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(
      password,
      userWithPassword.password
    );

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const role = userWithPassword.role || 'user';
    if (expectedRole === 'admin' && role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin credentials required.' });
    }
    if (expectedRole === 'user' && role === 'admin') {
      return res.status(403).json({ message: 'Please login from the Admin Login page.' });
    }

    const accessToken = generateAccessToken(userWithPassword.id);
    const refreshToken = generateRefreshToken(userWithPassword.id);

    await User.update(userWithPassword.id, { refresh_token: refreshToken });

    delete userWithPassword.password;

    res.json({
      success: true,
      user: userWithPassword,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Login error:", error.message);
    next(error);
  }
}

export const loginUser = async (req, res, next) => loginCore(req, res, next, 'user');
export const loginAdmin = async (req, res, next) => loginCore(req, res, next, 'admin');

/* =========================
   REFRESH TOKEN
========================= */
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res
        .status(400)
        .json({ message: "Refresh token is required" });
    }

    verifyRefreshToken(refreshToken);

    const user = await User.findByRefreshToken(refreshToken);
    if (!user) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const newAccessToken = generateAccessToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);

    await User.update(user.id, { refresh_token: newRefreshToken });

    res.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("Refresh token error:", error.message);
    next(error);
  }
};

/* =========================
   GET CURRENT USER
========================= */
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("GetMe error:", error.message);
    next(error);
  }
};

/* =========================
   UPDATE PROFILE
========================= */
export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, profession, address } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (profession) updates.profession = profession;
    if (address) updates.address = address;

    const user = await User.update(req.user.id, updates);

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Update profile error:", error.message);
    next(error);
  }
};

/* =========================
   FORGOT PASSWORD
========================= */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    await User.update(user.id, {
      reset_password_token: hashedToken,
      reset_password_expire: new Date(Date.now() + 10 * 60 * 1000),
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    await sendEmail({
      email: user.email,
      subject: "Password Reset - Dar Al Hikma Trust",
      html: `
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link expires in 10 minutes.</p>
      `,
    });

    res.json({
      success: true,
      message: "Password reset email sent",
    });
  } catch (error) {
    console.error("Forgot password error:", error.message);
    next(error);
  }
};

/* =========================
   RESET PASSWORD
========================= */
export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findByResetToken(hashedToken);
    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await User.update(user.id, {
      password: hashedPassword,
      reset_password_token: null,
      reset_password_expire: null,
    });

    res.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Reset password error:", error.message);
    next(error);
  }
};

/* =========================
   LOGOUT
========================= */
export const logout = async (req, res, next) => {
  try {
    await User.update(req.user.id, { refresh_token: null });

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error.message);
    next(error);
  }
};
