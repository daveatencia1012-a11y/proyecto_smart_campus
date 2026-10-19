import express from 'express';
import * as solicitudController from '../controllers/solicitudController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

const STAFF = ['administrador', 'administrativo'];

router.post('/', authenticateToken, authorizeRoles('estudiante', 'docente', ...STAFF), solicitudController.createSolicitud);
router.get('/', authenticateToken, authorizeRoles(...STAFF), solicitudController.getSolicitudes);
router.get('/conteo', authenticateToken, authorizeRoles('administrador'), solicitudController.countSolicitudes);
router.get('/mis', authenticateToken, solicitudController.getMisSolicitudes);
router.get('/:id', authenticateToken, solicitudController.getSolicitudById);
router.put('/:id', authenticateToken, authorizeRoles(...STAFF), solicitudController.updateSolicitud);
router.put('/:id/estado', authenticateToken, authorizeRoles(...STAFF), solicitudController.updateSolicitudEstado);
router.delete('/:id', authenticateToken, authorizeRoles('administrador'), solicitudController.deleteSolicitud);

export default router;
