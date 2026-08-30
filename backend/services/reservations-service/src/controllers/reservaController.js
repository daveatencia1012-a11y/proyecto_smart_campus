import axios from 'axios';
import { ReservaModel } from '../models/Reserva.js';
import { DisponibilidadModel } from '../models/Disponibilidad.js';

const RESOURCES_SERVICE_URL = process.env.RESOURCES_SERVICE_URL || 'http://resources-service:3204';
const NOTIFICATIONS_SERVICE_URL = process.env.NOTIFICATIONS_SERVICE_URL || 'http://notifications-service:3206';

const BUSINESS_HOURS_START = process.env.BUSINESS_HOURS_START || '08:00';
const BUSINESS_HOURS_END = process.env.BUSINESS_HOURS_END || '22:00';

function validateBusinessHours(hora_inicio, hora_fin) {
  if (hora_inicio < BUSINESS_HOURS_START || hora_fin > BUSINESS_HOURS_END) {
    return false;
  }
  return true;
}

export const reservaController = {
  async createReserva(req, res, next) {
    try {
      const usuario_id = req.user.id || req.user.usuario_id;
      const { recurso_id, fecha, hora_inicio, hora_fin } = req.body;

      if (!recurso_id || !fecha || !hora_inicio || !hora_fin) {
        return res.status(400).json({ error: 'Faltan campos requeridos: recurso_id, fecha, hora_inicio, hora_fin' });
      }

      if (hora_inicio >= hora_fin) {
        return res.status(400).json({ error: 'La hora de inicio debe ser menor que la hora de fin' });
      }

      if (!validateBusinessHours(hora_inicio, hora_fin)) {
        return res.status(400).json({ error: `El horario debe estar entre ${BUSINESS_HOURS_START} y ${BUSINESS_HOURS_END}` });
      }

      const recursosResp = await axios.get(`${RESOURCES_SERVICE_URL}/api/recursos/${recurso_id}`);
      const recurso = recursosResp.data;

      if (!recurso || recurso.estado !== 'activo') {
        return res.status(400).json({ error: 'El recurso no existe o no está activo' });
      }

      const overlapReserva = await ReservaModel.checkOverlap(recurso_id, fecha, hora_inicio, hora_fin);
      if (overlapReserva) {
        return res.status(409).json({ error: 'Ya existe una reserva en ese horario' });
      }

      const overlapDisponibilidad = await DisponibilidadModel.checkOverlap(recurso_id, fecha, hora_inicio, hora_fin, null, ['bloqueo', 'mantenimiento']);
      if (overlapDisponibilidad) {
        return res.status(409).json({ error: 'El recurso no está disponible en ese horario' });
      }

      const reserva = await ReservaModel.create({ usuario_id, recurso_id, fecha, hora_inicio, hora_fin });

      try {
        await axios.post(`${NOTIFICATIONS_SERVICE_URL}/api/notificaciones`, {
          tipo: 'reserva_creada',
          usuario_id,
          recurso_id,
          reserva_id: reserva.id,
          fecha,
          hora_inicio,
          hora_fin,
          mensaje: `Tu reserva para el recurso ${recurso_id} ha sido creada.`
        });
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
      const { usuario_id, recurso_id, fecha, estado } = req.query;
      const userRole = req.user.rol;
      const userId = req.user.id || req.user.usuario_id;

      const filters = {};
      if (usuario_id) filters.usuario_id = usuario_id;
      if (recurso_id) filters.recurso_id = recurso_id;
      if (fecha) filters.fecha = fecha;
      if (estado) filters.estado = estado;

      if (userRole !== 'administradoristrador') {
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
      const { id } = req.params;
      const reserva = await ReservaModel.findById(id);

      if (!reserva) {
        return res.status(404).json({ error: 'Reserva no encontrada' });
      }

      const isAdmin = req.user.rol === 'administrador';
      const isOwner = reserva.usuario_id === (req.user.id || req.user.usuario_id);

      if (!isAdmin && !isOwner) {
        return res.status(403).json({ error: 'No tienes permisos para ver esta reserva' });
      }

      return res.json(reserva);
    } catch (error) {
      next(error);
    }
  },

  async updateReserva(req, res, next) {
    try {
      const { id } = req.params;
      const { fecha, hora_inicio, hora_fin } = req.body;

      const reserva = await ReservaModel.findById(id);
      if (!reserva) {
        return res.status(404).json({ error: 'Reserva no encontrada' });
      }

      if (reserva.estado === 'cancelada') {
        return res.status(400).json({ error: 'No se puede modificar una reserva cancelada' });
      }

      const isAdmin = req.user.rol === 'administrador';
      const isOwner = reserva.usuario_id === (req.user.id || req.user.usuario_id);

      if (!isAdmin && !isOwner) {
        return res.status(403).json({ error: 'No tienes permisos para modificar esta reserva' });
      }

      const newFecha = fecha || reserva.fecha;
      const newHoraInicio = hora_inicio || reserva.hora_inicio;
      const newHoraFin = hora_fin || reserva.hora_fin;

      if (newHoraInicio >= newHoraFin) {
        return res.status(400).json({ error: 'La hora de inicio debe ser menor que la hora de fin' });
      }

      if (!validateBusinessHours(newHoraInicio, newHoraFin)) {
        return res.status(400).json({ error: `El horario debe estar entre ${BUSINESS_HOURS_START} y ${BUSINESS_HOURS_END}` });
      }

      const overlapReserva = await ReservaModel.checkOverlap(reserva.recurso_id, newFecha, newHoraInicio, newHoraFin, id);
      if (overlapReserva) {
        return res.status(409).json({ error: 'Ya existe una reserva en ese horario' });
      }

      const overlapDisponibilidad = await DisponibilidadModel.checkOverlap(reserva.recurso_id, newFecha, newHoraInicio, newHoraFin, null, ['bloqueo', 'mantenimiento']);
      if (overlapDisponibilidad) {
        return res.status(409).json({ error: 'El recurso no está disponible en ese horario' });
      }

      await ReservaModel.update(id, { fecha: newFecha, hora_inicio: newHoraInicio, hora_fin: newHoraFin });

      const updated = await ReservaModel.findById(id);
      return res.json(updated);
    } catch (error) {
      next(error);
    }
  },

  async cancelReserva(req, res, next) {
    try {
      const { id } = req.params;
      const { motivo_cancelacion } = req.body;

      const reserva = await ReservaModel.findById(id);
      if (!reserva) {
        return res.status(404).json({ error: 'Reserva no encontrada' });
      }

      if (reserva.estado === 'cancelada') {
        return res.status(400).json({ error: 'La reserva ya está cancelada' });
      }

      const isAdmin = req.user.rol === 'administrador';
      const isOwner = reserva.usuario_id === (req.user.id || req.user.usuario_id);

      if (!isAdmin && !isOwner) {
        return res.status(403).json({ error: 'No tienes permisos para cancelar esta reserva' });
      }

      await ReservaModel.cancel(id, motivo_cancelacion || null);

      try {
        await axios.post(`${NOTIFICATIONS_SERVICE_URL}/api/notificaciones`, {
          tipo: 'reserva_cancelada',
          usuario_id: reserva.usuario_id,
          recurso_id: reserva.recurso_id,
          reserva_id: id,
          motivo_cancelacion: motivo_cancelacion || null,
          mensaje: `Tu reserva para el recurso ${reserva.recurso_id} ha sido cancelada.`
        });
      } catch (notifErr) {
        console.error('Error enviando notificación:', notifErr.message);
      }

      const updated = await ReservaModel.findById(id);
      return res.json(updated);
    } catch (error) {
      next(error);
    }
  },

  async countReservas(req, res, next) {
    try {
      const { fecha } = req.query;
      const count = await ReservaModel.count(fecha);
      return res.json({ count });
    } catch (error) {
      next(error);
    }
  }
};
