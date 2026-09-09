import express from 'express';
import { list, getById, update, remove } from '../controllers/userController.js';
import { verifyToken, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', verifyToken, authorize('administrador'), list);
router.get('/:id', verifyToken, getById);
router.put('/:id', verifyToken, update);
router.delete('/:id', verifyToken, authorize('administrador'), remove);

export default router;
