import express from 'express';
import { listRoles, listPermisos } from '../controllers/roleController.js';
import { verifyToken, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/roles', verifyToken, authorize('administrador'), listRoles);
router.get('/permisos', verifyToken, authorize('administrador'), listPermisos);

export default router;
