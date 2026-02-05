import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import {
  getEvents,
  getEventById,
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent
} from '../controllers/event.controller.js';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

const router = express.Router();

// Public routes
router.get('/', getEvents);
router.get('/:id', getEventById);

// Admin routes (protected)
router.get('/admin/all', authenticate, authorize('admin'), getAllEvents);
router.post('/admin', authenticate, authorize('admin'), upload.single('bannerImage'), createEvent);
router.put('/admin/:id', authenticate, authorize('admin'), upload.single('bannerImage'), updateEvent);
router.delete('/admin/:id', authenticate, authorize('admin'), deleteEvent);

export default router;
