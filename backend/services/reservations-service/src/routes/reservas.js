import { Router } from 'express';
import { reservaController } from '../controllers/reservaController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, reservaController.createReserva);
router.get('/', authenticate, reservaController.getReservas);
router.get('/conteo', authenticate, authorize('administrador', 'administrativo'), reservaController.countReservas);
router.get('/mis/conteo', authenticate, reservaController.countMisReservas);
router.get('/por-fecha', authenticate, authorize('administrador', 'administrativo'), reservaController.porFecha);
router.get('/:id', authenticate, reservaController.getReservaById);
router.put('/:id', authenticate, reservaController.updateReserva);
router.put('/:id/cancelar', authenticate, reservaController.cancelReserva);

export default router;
