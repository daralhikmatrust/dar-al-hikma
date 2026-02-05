import express from 'express';
import { getPublicAboutContent, getPublicAssets, getPublicContactContent } from '../controllers/content.controller.js';

const router = express.Router();

router.get('/about', getPublicAboutContent);
router.get('/contact', getPublicContactContent);
router.get('/assets', getPublicAssets);

export default router;

