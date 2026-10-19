import express from 'express';
import * as solicitudController from '../controllers/solicitudController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

const STAFF = ['administrador', 'administrativo'];

router.post('/', authenticate, authorize('estudiante', 'docente', ...STAFF), solicitudController.createSolicitud);
router.get('/', authenticate, authorize(...STAFF), solicitudController.getSolicitudes);
router.get('/conteo', authenticate, authorize('administrador'), solicitudController.countSolicitudes);
router.get('/mis', authenticate, solicitudController.getMisSolicitudes);
router.get('/:id', authenticate, solicitudController.getSolicitudById);
router.put('/:id', authenticate, authorize(...STAFF), solicitudController.updateSolicitud);
router.put('/:id/estado', authenticate, authorize(...STAFF), solicitudController.updateSolicitudEstado);
router.delete('/:id', authenticate, authorize('administrador'), solicitudController.deleteSolicitud);

export default router;
