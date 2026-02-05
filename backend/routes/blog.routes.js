import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import {
  getBlogs,
  getBlogById,
  getAllBlogs,
  createBlog,
  updateBlog,
  deleteBlog
} from '../controllers/blog.controller.js';
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
router.get('/', getBlogs);
router.get('/:id', getBlogById);

// Admin routes (protected)
router.get('/admin/all', authenticate, authorize('admin'), getAllBlogs);
router.post('/admin', authenticate, authorize('admin'), upload.single('featuredImage'), createBlog);
router.put('/admin/:id', authenticate, authorize('admin'), upload.single('featuredImage'), updateBlog);
router.delete('/admin/:id', authenticate, authorize('admin'), deleteBlog);

export default router;
