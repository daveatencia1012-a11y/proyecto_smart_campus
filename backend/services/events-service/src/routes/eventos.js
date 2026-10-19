import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { eventoController } from '../controllers/eventoController.js';

const router = Router();

router.post('/', authenticate, authorize('administrador', 'docente', 'administrativo'), eventoController.createEvento);
router.get('/', authenticate, eventoController.getEventos);
router.get('/proximos', authenticate, eventoController.getProximosEventos);
router.get('/:id', authenticate, eventoController.getEventoById);
router.put('/:id', authenticate, authorize('administrador', 'docente', 'administrativo'), eventoController.updateEvento);
router.delete('/:id', authenticate, authorize('administrador'), eventoController.deleteEvento);

export default router;
