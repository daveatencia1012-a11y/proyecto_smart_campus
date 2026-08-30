import { Router } from 'express';
import { reservaController } from '../controllers/reservaController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, reservaController.createReserva);
router.get('/', authenticate, reservaController.getReservas);
router.get('/:id', authenticate, reservaController.getReservaById);
router.put('/:id', authenticate, reservaController.updateReserva);
router.put('/:id/cancelar', authenticate, reservaController.cancelReserva);
router.get('/conteo', authenticate, authorize('administrador'), reservaController.countReservas);

export default router;
