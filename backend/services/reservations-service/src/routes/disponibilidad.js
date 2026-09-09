import { Router } from 'express';
import { disponibilidadController } from '../controllers/disponibilidadController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/:recurso_id', authenticate, disponibilidadController.getDisponibilidad);
router.post('/', authenticate, authorize('administrador'), disponibilidadController.createDisponibilidad);

export default router;
