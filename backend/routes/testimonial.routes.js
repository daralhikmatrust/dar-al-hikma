import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import {
  getTestimonials,
  getAllTestimonials,
  createTestimonial,
  updateTestimonialStatus,
  deleteTestimonial
} from '../controllers/testimonial.controller.js';

const router = express.Router();

// Public routes
router.get('/', getTestimonials);
router.post('/', createTestimonial); // Public submission (optional auth)

// Admin routes (protected)
router.get('/admin/all', authenticate, authorize('admin'), getAllTestimonials);
router.put('/admin/:id/status', authenticate, authorize('admin'), updateTestimonialStatus);
router.delete('/admin/:id', authenticate, authorize('admin'), deleteTestimonial);

export default router;
