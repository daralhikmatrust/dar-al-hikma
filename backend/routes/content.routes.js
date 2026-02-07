import express from 'express';
import { getPublicAboutContent, getPublicAssets, getPublicContactContent, getPublicFaculties } from '../controllers/content.controller.js';

const router = express.Router();

router.get('/about', getPublicAboutContent);
router.get('/contact', getPublicContactContent);
router.get('/faculties', getPublicFaculties);
router.get('/assets', getPublicAssets);

export default router;

