import express from 'express';
import * as pqrsController from '../controllers/pqrsController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, authorizeRoles('estudiante', 'docente', 'administrador'), pqrsController.createPqrs);
router.get('/', authenticateToken, authorizeRoles('administrador'), pqrsController.getPqrsList);
router.get('/:id', authenticateToken, pqrsController.getPqrsById);
router.put('/:id', authenticateToken, authorizeRoles('administrador'), pqrsController.updatePqrs);
router.delete('/:id', authenticateToken, authorizeRoles('administrador'), pqrsController.deletePqrs);

export default router;
