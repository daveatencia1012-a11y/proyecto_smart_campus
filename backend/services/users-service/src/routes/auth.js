import express from 'express';
import authController from '../controllers/authController.js';
import { verifyToken, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', verifyToken, authorize('administrador'), authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);

export default router;
