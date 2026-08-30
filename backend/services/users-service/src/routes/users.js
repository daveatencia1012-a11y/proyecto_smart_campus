import express from 'express';
import userController from '../controllers/userController.js';
import { verifyToken, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', verifyToken, authorize('administrador'), userController.list);
router.get('/:id', verifyToken, userController.getById);
router.put('/:id', verifyToken, userController.update);
router.delete('/:id', verifyToken, authorize('administrador'), userController.remove);

export default router;
