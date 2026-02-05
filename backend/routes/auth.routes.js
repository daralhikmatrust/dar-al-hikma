import express from 'express';
import {
  register,
  login,
  loginUser,
  loginAdmin,
  refreshToken,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
  logout
} from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/register', register);
// User portal (default)
router.post('/login', loginUser);
router.post('/user/login', loginUser);
// Admin portal
router.post('/admin/login', loginAdmin);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.post('/logout', authenticate, logout);

export default router;

