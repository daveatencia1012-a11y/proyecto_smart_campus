import express from 'express';
import * as pqrsController from '../controllers/pqrsController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

const STAFF = ['administrador', 'administrativo'];

router.post('/', authenticate, authorize('estudiante', 'docente', ...STAFF), pqrsController.createPqrs);
router.get('/', authenticate, authorize(...STAFF), pqrsController.getPqrsList);
router.get('/conteo', authenticate, authorize(...STAFF), pqrsController.countPqrs);
router.get('/mis', authenticate, pqrsController.getMisPqrs);
router.get('/:id', authenticate, pqrsController.getPqrsById);
router.put('/:id', authenticate, authorize(...STAFF), pqrsController.updatePqrs);
router.delete('/:id', authenticate, authorize('administrador'), pqrsController.deletePqrs);

export default router;
