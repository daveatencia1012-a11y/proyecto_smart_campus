import express from 'express';
import { list, getById, update, remove, responsables } from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, authorize('administrador'), list);
// Directorio operativo mínimo: nunca devuelve email, contraseña o perfil privado.
router.get('/responsables', authenticate, authorize('administrador', 'administrativo'), responsables);
router.get('/responsables/:id', authenticate, authorize('administrador', 'administrativo'), responsables);
router.get('/:id', authenticate, getById);
router.put('/:id', authenticate, update);
router.delete('/:id', authenticate, authorize('administrador'), remove);

export default router;
