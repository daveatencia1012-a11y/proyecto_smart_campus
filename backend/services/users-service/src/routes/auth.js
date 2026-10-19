import express from 'express';
import { register, login, refresh } from '../controllers/authController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', authenticate, authorize('administrador'), register);
router.post('/login', login);
router.post('/refresh', refresh);

export default router;
