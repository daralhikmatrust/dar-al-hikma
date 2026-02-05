import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import {
  getDashboardStats,
  getAllDonations,
  exportDonations,
  getAllAdmins,
  createAdmin,
  updateUserRole,
  deleteAdmin
} from '../controllers/admin.controller.js';
import {
  getAllHallOfFame,
  createHallOfFameMember,
  updateHallOfFameMember,
  deleteHallOfFameMember,
  clearAllHallOfFame
} from '../controllers/halloffame.controller.js';
import {
  getAdminContent,
  getAdminAssets,
  uploadDonationQrImage,
  uploadHomeSliderImages,
  uploadEventsHeroImage,
  updateAboutContent,
  updateAssets,
  updateContactContent
} from '../controllers/content.controller.js';
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

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/donations', getAllDonations);
router.get('/donations/export', exportDonations);

// Site content (admin)
router.get('/content', getAdminContent);
router.put('/content/about', updateAboutContent);
router.put('/content/contact', updateContactContent);
router.get('/content/assets', getAdminAssets);
router.put('/content/assets', updateAssets);
router.post('/content/assets/qr', upload.single('file'), uploadDonationQrImage);
router.post('/content/assets/home-slider', upload.array('files', 10), uploadHomeSliderImages);
router.post('/content/assets/events-hero', upload.single('file'), uploadEventsHeroImage);

// Admin management routes
router.get('/admins', getAllAdmins);
router.post('/admins', createAdmin);
router.put('/admins/:userId/role', updateUserRole);
router.delete('/admins/:adminId', deleteAdmin);

// Hall of Fame management routes (admin only)
router.get('/hall-of-fame', getAllHallOfFame);
router.post('/hall-of-fame', upload.single('photo'), createHallOfFameMember);
router.put('/hall-of-fame/:id', upload.single('photo'), updateHallOfFameMember);
router.delete('/hall-of-fame/:id', deleteHallOfFameMember);
router.delete('/hall-of-fame', clearAllHallOfFame); // Clear all members (use with caution)

export default router;

