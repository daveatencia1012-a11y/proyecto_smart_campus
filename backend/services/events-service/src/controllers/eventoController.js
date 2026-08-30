import axios from 'axios';
import { EventoModel } from '../models/Evento.js';

const NOTIFICATIONS_SERVICE_URL = process.env.NOTIFICATIONS_SERVICE_URL || 'http://notifications-service:3206';

export const eventoController = {
  async createEvento(req, res, next) {
    try {
      const creado_por = req.user.id;
      const { nombre, descripcion, fecha, hora, lugar, tipo, publico } = req.body;

      if (!nombre || !fecha || !hora || !lugar || !tipo) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
      }

      const tiposValidos = ['academico', 'institucional', 'cultural', 'deportivo', 'otro'];
      if (!tiposValidos.includes(tipo)) {
        return res.status(400).json({ error: 'Tipo de evento inválido' });
      }

      const evento = await EventoModel.create({
        nombre,
        descripcion,
        fecha,
        hora,
        lugar,
        tipo,
        creado_por,
        publico: publico !== undefined ? publico : 1
      });

      try {
        await axios.post(`${NOTIFICATIONS_SERVICE_URL}/api/notificaciones`, {
          tipo: 'evento',
          usuario_id: creado_por,
          titulo: 'Nuevo evento creado',
          mensaje: `Se ha creado el evento "${nombre}" para el ${fecha}`,
          referencia_id: evento.id,
          referencia_tipo: 'evento'
        });
      } catch (notifErr) {
        console.error('Error enviando notificación:', notifErr.message);
      }

      return res.status(201).json(evento);
    } catch (error) {
      next(error);
    }
  },

  async getEventos(req, res, next) {
    try {
      const { fecha, tipo } = req.query;
      const filters = {};

      if (fecha) filters.fecha = fecha;
      if (tipo) filters.tipo = tipo;

      const eventos = await EventoModel.findAll(filters);
      return res.json(eventos);
    } catch (error) {
      next(error);
    }
  },

  async getEventoById(req, res, next) {
    try {
      const { id } = req.params;
      const evento = await EventoModel.findById(id);

      if (!evento) {
        return res.status(404).json({ error: 'Evento no encontrado' });
      }

      return res.json(evento);
    } catch (error) {
      next(error);
    }
  },

  async updateEvento(req, res, next) {
    try {
      const { id } = req.params;
      const { nombre, descripcion, fecha, hora, lugar, tipo, publico } = req.body;

      const evento = await EventoModel.findById(id);
      if (!evento) {
        return res.status(404).json({ error: 'Evento no encontrado' });
      }

      const isAdmin = req.user.rol === 'administrador';
      const isCreator = evento.creado_por === req.user.id;

      if (!isAdmin && !isCreator) {
        return res.status(403).json({ error: 'No tienes permisos para modificar este evento' });
      }

      const updated = await EventoModel.update(id, {
        nombre,
        descripcion,
        fecha,
        hora,
        lugar,
        tipo,
        publico
      });

      return res.json(updated);
    } catch (error) {
      next(error);
    }
  },

  async deleteEvento(req, res, next) {
    try {
      const { id } = req.params;
      const evento = await EventoModel.findById(id);

      if (!evento) {
        return res.status(404).json({ error: 'Evento no encontrado' });
      }

      const isAdmin = req.user.rol === 'administrador';
      if (!isAdmin) {
        return res.status(403).json({ error: 'No tienes permisos para eliminar este evento' });
      }

      await EventoModel.delete(id);
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  async getProximosEventos(req, res, next) {
    try {
      const dias = parseInt(req.query.dias) || 30;
      const eventos = await EventoModel.findUpcoming(dias);
      return res.json(eventos);
    } catch (error) {
      next(error);
    }
  }
};
