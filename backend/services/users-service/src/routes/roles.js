import express from 'express';
import roleController from '../controllers/roleController.js';
import { verifyToken, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/roles', verifyToken, authorize('administrador'), roleController.listRoles);
router.get('/permisos', verifyToken, authorize('administrador'), roleController.listPermisos);

export default router;
