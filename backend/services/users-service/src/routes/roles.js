import express from 'express';
import { listRoles, listPermisos } from '../controllers/roleController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/roles', authenticate, authorize('administrador'), listRoles);
router.get('/permisos', authenticate, authorize('administrador'), listPermisos);

export default router;
