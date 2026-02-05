import express from 'express';
import { getTodayNisab } from '../controllers/nisab.controller.js';

const router = express.Router();

// Public
router.get('/today', getTodayNisab);

export default router;

