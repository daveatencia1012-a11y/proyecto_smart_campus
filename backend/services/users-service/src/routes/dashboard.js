import { Router } from 'express';
import { verifyToken, authorize } from '../middleware/auth.js';
import {
  getSolicitudesPendientes,
  getReservasRealizadas,
  getNotificacionesNoLeidas,
  getProximosEventos,
  getServiciosDisponibles,
  getEstadisticasGenerales
} from '../controllers/dashboardController.js';

const router = Router();

router.get('/solicitudes-pendientes', verifyToken, authorize('administrador'), getSolicitudesPendientes);
router.get('/reservas-realizadas', verifyToken, authorize('administrador'), getReservasRealizadas);
router.get('/notificaciones-no-leidas', verifyToken, authorize('administrador'), getNotificacionesNoLeidas);
router.get('/proximos-eventos', verifyToken, getProximosEventos);
router.get('/servicios-disponibles', verifyToken, getServiciosDisponibles);
router.get('/estadisticas-generales', verifyToken, authorize('administrador'), getEstadisticasGenerales);

export default router;
