import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import {
  getAboutUsContent,
  getAdminAboutUsContent,
  updateAboutUsSection,
  uploadSectionImage,
  upsertAboutUsMember,
  deleteAboutUsMember,
  upsertAuditReport,
  deleteAuditReport
} from '../controllers/aboutus.controller.js';
import multer from 'multer';

/** Member photos: JPG, PNG, WEBP only */
const uploadPhoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and WEBP images are allowed for member photos'));
    }
  }
});

/** Audit PDFs only */
const uploadPdf = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed for audit reports'));
    }
  }
});

const router = express.Router();

// Public routes
router.get('/', getAboutUsContent);

// Admin routes
router.use(authenticate);
router.use(authorize('admin'));

router.get('/admin', getAdminAboutUsContent);
router.put('/sections', updateAboutUsSection);
router.post('/sections/upload-image', uploadPhoto.single('image'), uploadSectionImage);
router.post('/members', uploadPhoto.single('photo'), upsertAboutUsMember);
router.put('/members/:id', uploadPhoto.single('photo'), upsertAboutUsMember);
router.delete('/members/:id', deleteAboutUsMember);
router.post('/audit-reports', uploadPdf.single('file'), upsertAuditReport);
router.put('/audit-reports/:id', uploadPdf.single('file'), upsertAuditReport);
router.delete('/audit-reports/:id', deleteAuditReport);

export default router;
