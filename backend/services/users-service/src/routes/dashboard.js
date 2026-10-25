import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getSolicitudesPendientes,
  getReservasRealizadas,
  getNotificacionesNoLeidas,
  getProximosEventos,
  getServiciosDisponibles,
  getEstadisticasGenerales
} from '../controllers/dashboardController.js';
import { personal, operativo, salud } from '../controllers/dashboardController.js';

const router = Router();
router.get('/personal', authenticate, personal);
router.get('/operativo', authenticate, authorize('administrador', 'administrativo'), operativo);
router.get('/salud', authenticate, authorize('administrador'), salud);

router.get('/solicitudes-pendientes', authenticate, authorize('administrador'), getSolicitudesPendientes);
router.get('/reservas-realizadas', authenticate, authorize('administrador'), getReservasRealizadas);
router.get('/notificaciones-no-leidas', authenticate, authorize('administrador'), getNotificacionesNoLeidas);
router.get('/proximos-eventos', authenticate, getProximosEventos);
router.get('/servicios-disponibles', authenticate, getServiciosDisponibles);
router.get('/estadisticas-generales', authenticate, authorize('administrador'), getEstadisticasGenerales);

export default router;
