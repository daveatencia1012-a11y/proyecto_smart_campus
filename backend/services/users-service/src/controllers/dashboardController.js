import axios from '../config/http.js';

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

    const response = await axios.get(`${RESERVATIONS_SERVICE_URL}/api/reservas/por-fecha?${params.toString()}`, {
      headers: { Authorization: req.headers.authorization }
    });

    res.json(response.data);
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
      axios.get(`${EVENTS_SERVICE_URL}/api/eventos/conteo?dias=7`, { headers: { Authorization: req.headers.authorization } }),
      axios.get(`${RESOURCES_SERVICE_URL}/api/recursos/disponibles/conteo`, { headers: { Authorization: req.headers.authorization } })
    ]);

    res.json({
      solicitudes: solicitudesRes.data,
      reservas: reservasRes.data,
      notificaciones_no_leidas: notificacionesRes.data,
      proximos_eventos: eventosRes.data.count,
      recursos_disponibles: recursosRes.data
    });
  } catch (error) {
    next(error);
  }
}

function headers(req) { return { headers: { Authorization: req.headers.authorization } }; }
function range(req) {
  const params = new URLSearchParams();
  for (const name of ['fecha_desde','fecha_hasta']) if (req.query[name] !== undefined) {
    if (typeof req.query[name] !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(req.query[name])) throw Object.assign(new Error('Rango de fechas inválido'), { status: 400 });
    params.set(name, req.query[name]);
  }
  return params.toString();
}

export async function personal(req, res, next) {
  try {
    const [solicitudes, reservas, notificaciones, eventos] = await Promise.all([
      axios.get(`${REQUESTS_SERVICE_URL}/api/solicitudes/mis/conteo`, headers(req)),
      axios.get(`${RESERVATIONS_SERVICE_URL}/api/reservas/mis/conteo`, headers(req)),
      axios.get(`${NOTIFICATIONS_SERVICE_URL}/api/notificaciones/no-leidas`, headers(req)),
      axios.get(`${EVENTS_SERVICE_URL}/api/eventos/conteo?dias=7`, headers(req))
    ]);
    res.json({ solicitudes: solicitudes.data.count, reservas: reservas.data.count, notificaciones_no_leidas: notificaciones.data.no_leidas, eventos: eventos.data.count });
  } catch (error) { next(error); }
}

export async function operativo(req, res, next) {
  try {
    const query = range(req);
    const [solicitudes, reservas, pqrs, recursos] = await Promise.all([
      axios.get(`${REQUESTS_SERVICE_URL}/api/solicitudes/conteo?${query}`, headers(req)),
      axios.get(`${RESERVATIONS_SERVICE_URL}/api/reservas/conteo?${query}`, headers(req)),
      axios.get(`${REQUESTS_SERVICE_URL}/api/pqrs/conteo?${query}`, headers(req)),
      axios.get(`${RESOURCES_SERVICE_URL}/api/recursos/disponibles/conteo`, headers(req))
    ]);
    res.json({ solicitudes: solicitudes.data.count, reservas: reservas.data.count, pqrs: pqrs.data.count, recursos_disponibles: recursos.data.count,
      solicitudes_por_estado: solicitudes.data.por_estado, reservas_por_estado: reservas.data.por_estado, pqrs_por_estado: pqrs.data.por_estado });
  } catch (error) { next(error); }
}

export async function salud(req, res, next) {
  try {
    const response = await axios.get(`${process.env.GATEWAY_SERVICE_URL || 'http://gateway:3200'}/health`, { validateStatus: status => [200,503].includes(status) });
    res.json({ ...response.data, consultado_en: new Date().toISOString() });
  } catch (error) { next(error); }
}
