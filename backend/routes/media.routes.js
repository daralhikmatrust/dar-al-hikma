import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import {
  uploadMedia,
  getMedia,
  getMediaById,
  deleteMedia,
  approveMedia,
  upload
} from '../controllers/media.controller.js';

const router = express.Router();

// Public routes
router.get('/', getMedia);
router.get('/:id', getMediaById);

// User routes (upload)
router.post('/upload', authenticate, upload.single('file'), uploadMedia);

// Admin routes
router.delete('/:id', authenticate, authorize('admin'), deleteMedia);
router.put('/:id/approve', authenticate, authorize('admin'), approveMedia);

export default router;

