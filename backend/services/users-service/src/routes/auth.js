import express from 'express';
import { register, login, refresh } from '../controllers/authController.js';
import { verifyToken, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', verifyToken, authorize('administrador'), register);
router.post('/login', login);
router.post('/refresh', refresh);

export default router;
