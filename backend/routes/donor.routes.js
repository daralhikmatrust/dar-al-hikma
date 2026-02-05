import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import {
  getDonors,
  getDonorStats,
  updateDonor,
  getHallOfFame
} from '../controllers/donor.controller.js';

const router = express.Router();

// Public routes
router.get('/hall-of-fame', getHallOfFame);

// User routes
router.get('/stats/:id?', authenticate, getDonorStats);

// Admin routes
router.get('/', authenticate, authorize('admin'), getDonors);
router.put('/:id', authenticate, authorize('admin'), updateDonor);

export default router;

