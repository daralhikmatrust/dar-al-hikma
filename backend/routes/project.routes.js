import express from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addProjectMedia
} from '../controllers/project.controller.js';

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
router.get('/', getProjects);
router.get('/:id', getProjectById);

// Admin routes
router.post('/', authenticate, authorize('admin'), upload.single('photo'), createProject);
router.put('/:id', authenticate, authorize('admin'), upload.single('photo'), updateProject);
router.delete('/:id', authenticate, authorize('admin'), deleteProject);
router.post('/:id/media', authenticate, authorize('admin'), addProjectMedia);

export default router;

