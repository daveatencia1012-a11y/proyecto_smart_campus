import express from 'express';
import * as solicitudController from '../controllers/solicitudController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, authorizeRoles('estudiante', 'docente', 'administrador'), solicitudController.createSolicitud);
router.get('/', authenticateToken, authorizeRoles('administrador'), solicitudController.getSolicitudes);
router.get('/conteo', authenticateToken, authorizeRoles('administrador'), solicitudController.countSolicitudes);
router.get('/:id', authenticateToken, solicitudController.getSolicitudById);
router.put('/:id', authenticateToken, authorizeRoles('administrador'), solicitudController.updateSolicitud);
router.put('/:id/estado', authenticateToken, authorizeRoles('administrador'), solicitudController.updateSolicitudEstado);
router.delete('/:id', authenticateToken, authorizeRoles('administrador'), solicitudController.deleteSolicitud);

export default router;
