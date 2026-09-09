import express from 'express';
import { getTipos } from '../controllers/recursoController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getTipos);

export default router;
