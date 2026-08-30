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

router.post('/', authenticate, authorize('administrador'), createRecurso);
router.get('/', authenticate, getRecursos);
router.get('/:id', authenticate, getRecursoById);
router.put('/:id', authenticate, authorize('administrador'), updateRecurso);
router.put('/:id/disponibilidad', authenticate, authorize('administrador'), updateDisponibilidad);
router.delete('/:id', authenticate, authorize('administrador'), deleteRecurso);
router.get('/disponibles/conteo', authenticate, authorize('administrador'), countRecursosDisponibles);

export default router;
