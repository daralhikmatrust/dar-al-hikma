import express from 'express';
import { authenticate, optionalAuth } from '../middlewares/auth.middleware.js';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getMyDonations,
  getDonationById,
  getPaymentByIdentifier,
  downloadReceipt
} from '../controllers/donation.controller.js';

const router = express.Router();

// Payment creation - Allow both guest and authenticated (Razorpay only)
router.post('/razorpay/order', optionalAuth, createRazorpayOrder);

// Payment verification - Allow both guest and authenticated (Razorpay only)
router.post('/razorpay/verify', optionalAuth, verifyRazorpayPayment);

// Get payment by identifier (for success page - refresh-safe)
router.get('/payment', getPaymentByIdentifier);

// User donations (authenticated only)
router.get('/my-donations', authenticate, getMyDonations);
router.get('/:id', authenticate, getDonationById);
router.get('/:id/receipt', downloadReceipt); // Allow receipt download without auth

export default router;

