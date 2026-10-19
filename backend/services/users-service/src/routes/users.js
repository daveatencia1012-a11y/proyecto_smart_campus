import express from 'express';
import { list, getById, update, remove } from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, authorize('administrador'), list);
router.get('/:id', authenticate, getById);
router.put('/:id', authenticate, update);
router.delete('/:id', authenticate, authorize('administrador'), remove);

export default router;
