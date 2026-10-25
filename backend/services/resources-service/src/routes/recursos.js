import express from 'express';
import {
  createRecurso,
  getRecursos,
  getRecursoById,
  updateRecurso,
  updateDisponibilidad,
  deleteRecurso,
  countRecursosDisponibles
} from '../controllers/recursoController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticate, authorize('administrador', 'administrativo'), createRecurso);
router.get('/', authenticate, getRecursos);
router.get('/:id', authenticate, getRecursoById);
router.put('/:id', authenticate, authorize('administrador', 'administrativo'), updateRecurso);
router.put('/:id/disponibilidad', authenticate, authorize('administrador', 'administrativo'), updateDisponibilidad);
router.delete('/:id', authenticate, authorize('administrador', 'administrativo'), deleteRecurso);
router.get('/disponibles/conteo', authenticate, authorize('administrador', 'administrativo'), countRecursosDisponibles);

export default router;
