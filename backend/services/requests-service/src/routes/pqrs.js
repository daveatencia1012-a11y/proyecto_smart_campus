import express from 'express';
import * as pqrsController from '../controllers/pqrsController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

const STAFF = ['administrador', 'administrativo'];

router.post('/', authenticateToken, authorizeRoles('estudiante', 'docente', ...STAFF), pqrsController.createPqrs);
router.get('/', authenticateToken, authorizeRoles(...STAFF), pqrsController.getPqrsList);
router.get('/mis', authenticateToken, pqrsController.getMisPqrs);
router.get('/:id', authenticateToken, pqrsController.getPqrsById);
router.put('/:id', authenticateToken, authorizeRoles(...STAFF), pqrsController.updatePqrs);
router.delete('/:id', authenticateToken, authorizeRoles('administrador'), pqrsController.deletePqrs);

export default router;
