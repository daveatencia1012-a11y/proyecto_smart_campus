import axios from '../config/http.js';
import { ReservaModel } from '../models/Reserva.js';
import pool from '../config/db.js';
import { assertFree, withCalendarLocks, interval, positiveId, dateOnly, calendarError } from '../services/calendar.js';
import { checkResource } from '../services/resources.js';

const NOTIFICATIONS_SERVICE_URL = process.env.NOTIFICATIONS_SERVICE_URL || 'http://notifications-service:3206';

function canModify(reserva, user) {
  if (!reserva) throw calendarError(404, 'Reserva no encontrada');
  if (!['administrador', 'administrativo'].includes(user.rol) && reserva.usuario_id !== user.id) {
    throw calendarError(403, 'No tienes permisos para modificar esta reserva');
  }
  if (reserva.estado === 'cancelada') throw calendarError(400, 'La reserva está cancelada');
}

function parseFilters(query = {}) {
  const filters = {};
  for (const key of ['usuario_id','recurso_id']) if (query[key] !== undefined) filters[key] = positiveId(query[key]);
  for (const key of ['fecha','fecha_desde','fecha_hasta']) if (query[key] !== undefined) filters[key] = dateOnly(query[key]);
  if (query.estado !== undefined) {
    if (!['pendiente','confirmada','cancelada'].includes(query.estado)) throw calendarError(400, 'Estado inválido');
    filters.estado = query.estado;
  }
  if (filters.fecha_desde && filters.fecha_hasta && filters.fecha_desde > filters.fecha_hasta) throw calendarError(400, 'Rango inválido');
  filters.limit = Number(query.limit ?? 100); filters.offset = Number(query.offset ?? 0);
  if (!Number.isSafeInteger(filters.limit) || filters.limit < 1 || filters.limit > 100 || !Number.isSafeInteger(filters.offset) || filters.offset < 0 || filters.offset > 10000000) throw calendarError(400, 'Paginación inválida');
  return filters;
}

export const reservaController = {
  async createReserva(req, res, next) {
    try {
      const usuario_id = req.user.id;
      const recurso_id = positiveId(req.body?.recurso_id);
      const horario = interval(req.body ?? {}, true);
      await checkResource(recurso_id, req.headers.authorization);
      const reserva = await withCalendarLocks(pool, [{ recurso_id, fecha: horario.fecha }], async conn => {
        await assertFree(conn, recurso_id, horario);
        return ReservaModel.create({ usuario_id, recurso_id, ...horario }, conn);
      });

      try {
        await axios.post(`${NOTIFICATIONS_SERVICE_URL}/api/notificaciones`, {
          tipo: 'reserva',
          usuario_id,
          titulo: 'Reserva creada',
          mensaje: `Tu reserva para el recurso ${recurso_id} ha sido creada.`,
          referencia_id: reserva.id,
          referencia_tipo: 'reserva'
        }, { headers: { 'x-internal-token': process.env.INTERNAL_API_TOKEN } });
      } catch (notifErr) {
        console.error('Error enviando notificación:', notifErr.message);
      }

      return res.status(201).json(reserva);
    } catch (error) {
      next(error);
    }
  },

  async getReservas(req, res, next) {
    try {
      const userRole = req.user.rol;
      const userId = req.user.id || req.user.usuario_id;

      const filters = parseFilters(req.query);

      const esGestor = userRole === 'administrador' || userRole === 'administrativo';
      if (!esGestor) {
        filters.usuario_id = userId;
      }

      const reservas = await ReservaModel.findByFilters(filters);
      return res.json(reservas);
    } catch (error) {
      next(error);
    }
  },

  async getReservaById(req, res, next) {
    try {
      const id = positiveId(req.params.id);
      const reserva = await ReservaModel.findById(id);

      if (!reserva) {
        return res.status(404).json({ error: 'Reserva no encontrada' });
      }

      const esGestor = req.user.rol === 'administrador' || req.user.rol === 'administrativo';
      const isOwner = reserva.usuario_id === (req.user.id || req.user.usuario_id);

      if (!esGestor && !isOwner) {
        return res.status(403).json({ error: 'No tienes permisos para ver esta reserva' });
      }

      return res.json(reserva);
    } catch (error) {
      next(error);
    }
  },

  async updateReserva(req, res, next) {
    try {
      const id = positiveId(req.params.id);
      const snapshot = await ReservaModel.findById(id);
      canModify(snapshot, req.user);
      const fecha = req.body?.fecha === undefined ? snapshot.fecha : dateOnly(req.body.fecha);
      await checkResource(snapshot.recurso_id, req.headers.authorization);
      const updated = await withCalendarLocks(pool, [
        { recurso_id: snapshot.recurso_id, fecha: snapshot.fecha },
        { recurso_id: snapshot.recurso_id, fecha }
      ], async conn => {
        const current = await ReservaModel.findById(id, conn, true);
        canModify(current, req.user);
        if (current.fecha !== snapshot.fecha || current.recurso_id !== snapshot.recurso_id) {
          throw calendarError(409, 'La reserva cambió; vuelve a intentarlo');
        }
        const horario = interval({
          fecha,
          hora_inicio: req.body?.hora_inicio === undefined ? current.hora_inicio : req.body.hora_inicio,
          hora_fin: req.body?.hora_fin === undefined ? current.hora_fin : req.body.hora_fin
        }, true);
        await assertFree(conn, current.recurso_id, horario, id);
        await ReservaModel.update(id, horario, conn);
        return ReservaModel.findById(id, conn);
      });
      return res.json(updated);
    } catch (error) {
      next(error);
    }
  },

  async cancelReserva(req, res, next) {
    try {
      const id = positiveId(req.params.id);
      const motivo_cancelacion = req.body?.motivo_cancelacion ?? null;
      if (motivo_cancelacion !== null && (typeof motivo_cancelacion !== 'string' || motivo_cancelacion.length > 2000)) {
        throw calendarError(400, 'Motivo de cancelación inválido');
      }
      const snapshot = await ReservaModel.findById(id);
      canModify(snapshot, req.user);
      const reserva = await withCalendarLocks(pool, [{ recurso_id: snapshot.recurso_id, fecha: snapshot.fecha }], async conn => {
        const current = await ReservaModel.findById(id, conn, true);
        canModify(current, req.user);
        if (current.fecha !== snapshot.fecha || current.recurso_id !== snapshot.recurso_id) {
          throw calendarError(409, 'La reserva cambió; vuelve a intentarlo');
        }
        await ReservaModel.cancel(id, motivo_cancelacion, conn);
        return ReservaModel.findById(id, conn);
      });

      try {
        await axios.post(`${NOTIFICATIONS_SERVICE_URL}/api/notificaciones`, {
          tipo: 'reserva',
          usuario_id: reserva.usuario_id,
          titulo: 'Reserva cancelada',
          mensaje: `Tu reserva para el recurso ${reserva.recurso_id} ha sido cancelada.`,
          referencia_id: id,
          referencia_tipo: 'reserva'
        }, { headers: { 'x-internal-token': process.env.INTERNAL_API_TOKEN } });
      } catch (notifErr) {
        console.error('Error enviando notificación:', notifErr.message);
      }

      return res.json(reserva);
    } catch (error) {
      next(error);
    }
  },

  async countReservas(req, res, next) {
    try {
      const filters = parseFilters(req.query);
      const [count, por_estado] = await Promise.all([ReservaModel.count(filters.fecha, filters), ReservaModel.count(filters.fecha, filters, true)]);
      return res.json({ count, por_estado });
    } catch (error) {
      next(error);
    }
  },
  async porFecha(req, res, next) {
    try { res.json(await ReservaModel.byDate(parseFilters(req.query))); } catch (error) { next(error); }
  },
  async countMisReservas(req, res, next) {
    try {
      const filters = { ...parseFilters(req.query), usuario_id: req.user.id };
      res.json({ count: await ReservaModel.count(filters.fecha, filters) });
    } catch (error) { next(error); }
  }
};
