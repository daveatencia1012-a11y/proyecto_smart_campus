import axios from 'axios';

const REQUESTS_SERVICE_URL = process.env.REQUESTS_SERVICE_URL || 'http://requests-service:3202';
const RESERVATIONS_SERVICE_URL = process.env.RESERVATIONS_SERVICE_URL || 'http://reservations-service:3203';
const NOTIFICATIONS_SERVICE_URL = process.env.NOTIFICATIONS_SERVICE_URL || 'http://notifications-service:3206';
const EVENTS_SERVICE_URL = process.env.EVENTS_SERVICE_URL || 'http://events-service:3205';
const RESOURCES_SERVICE_URL = process.env.RESOURCES_SERVICE_URL || 'http://resources-service:3204';

export async function getSolicitudesPendientes(req, res, next) {
  try {
    const [resueltaRes, cerradaRes] = await Promise.all([
      axios.get(`${REQUESTS_SERVICE_URL}/api/solicitudes/conteo?estado=RESUELTA`, { headers: { Authorization: req.headers.authorization } }),
      axios.get(`${REQUESTS_SERVICE_URL}/api/solicitudes/conteo?estado=CERRADA`, { headers: { Authorization: req.headers.authorization } })
    ]);

    const totalResueltas = resueltaRes.data.count;
    const totalCerradas = cerradaRes.data.count;

    res.json({
      resueltas: totalResueltas,
      cerradas: totalCerradas
    });
  } catch (error) {
    next(error);
  }
}

export async function getReservasRealizadas(req, res, next) {
  try {
    const { fecha_desde, fecha_hasta } = req.query;
    const params = new URLSearchParams();
    if (fecha_desde) params.append('fecha_desde', fecha_desde);
    if (fecha_hasta) params.append('fecha_hasta', fecha_hasta);

    const response = await axios.get(`${RESERVATIONS_SERVICE_URL}/api/reservas?${params.toString()}`, {
      headers: { Authorization: req.headers.authorization }
    });

    const reservas = response.data;
    const porFecha = {};

    reservas.forEach(r => {
      porFecha[r.fecha] = (porFecha[r.fecha] || 0) + 1;
    });

    res.json({ por_fecha: porFecha, total: reservas.length });
  } catch (error) {
    next(error);
  }
}

export async function getNotificacionesNoLeidas(req, res, next) {
  try {
    const response = await axios.get(`${NOTIFICATIONS_SERVICE_URL}/api/notificaciones/conteo/no-leidas`, {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
}

export async function getProximosEventos(req, res, next) {
  try {
    const response = await axios.get(`${EVENTS_SERVICE_URL}/api/eventos/proximos?dias=7`, {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
}

export async function getServiciosDisponibles(req, res, next) {
  try {
    const response = await axios.get(`${RESOURCES_SERVICE_URL}/api/recursos?disponible=true`, {
      headers: { Authorization: req.headers.authorization }
    });
    res.json({ recursos: response.data });
  } catch (error) {
    next(error);
  }
}

export async function getEstadisticasGenerales(req, res, next) {
  try {
    const [solicitudesRes, reservasRes, notificacionesRes, eventosRes, recursosRes] = await Promise.all([
      axios.get(`${REQUESTS_SERVICE_URL}/api/solicitudes/conteo`, { headers: { Authorization: req.headers.authorization } }),
      axios.get(`${RESERVATIONS_SERVICE_URL}/api/reservas/conteo`, { headers: { Authorization: req.headers.authorization } }),
      axios.get(`${NOTIFICATIONS_SERVICE_URL}/api/notificaciones/conteo/no-leidas`, { headers: { Authorization: req.headers.authorization } }),
      axios.get(`${EVENTS_SERVICE_URL}/api/eventos/proximos?dias=7`, { headers: { Authorization: req.headers.authorization } }),
      axios.get(`${RESOURCES_SERVICE_URL}/api/recursos/disponibles/conteo`, { headers: { Authorization: req.headers.authorization } })
    ]);

    res.json({
      solicitudes: solicitudesRes.data,
      reservas: reservasRes.data,
      notificaciones_no_leidas: notificacionesRes.data,
      proximos_eventos: eventosRes.data.length,
      recursos_disponibles: recursosRes.data
    });
  } catch (error) {
    next(error);
  }
}
