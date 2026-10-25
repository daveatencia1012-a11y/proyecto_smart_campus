import axios from '../config/http.js';
import { EventoModel } from '../models/Evento.js';
import { eventInput, eventFilters } from '../validation.js';

const NOTIFICATIONS_SERVICE_URL = process.env.NOTIFICATIONS_SERVICE_URL || 'http://notifications-service:3206';

const TIPOS_VALIDOS = ['academico', 'institucional', 'cultural', 'deportivo', 'otro'];

export const eventoController = {
  async createEvento(req, res, next) {
    try {
      const creado_por = req.user.id;
      const { nombre, descripcion, fecha, hora, lugar, tipo, publico } = eventInput(req.body);

      if (!nombre || !fecha || !hora || !lugar || !tipo) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
      }

      if (!TIPOS_VALIDOS.includes(tipo)) {
        return res.status(400).json({ error: 'Tipo de evento inválido' });
      }

      if (publico !== undefined && ![0, 1, true, false].includes(publico)) {
        return res.status(400).json({ error: 'publico debe ser 0 o 1' });
      }

      const evento = await EventoModel.create({
        nombre,
        descripcion: descripcion ?? '',
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
        }, { headers: { 'x-internal-token': process.env.INTERNAL_API_TOKEN } });
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
      const filters = eventFilters(req.query, req.user);

      const eventos = await EventoModel.findAll(filters, req.user);
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

      const esGestor = req.user.rol === 'administrador';
      if (!evento.publico && !esGestor && evento.creado_por !== req.user.id) {
        return res.status(403).json({ error: 'No autorizado' });
      }

      return res.json(evento);
    } catch (error) {
      next(error);
    }
  },

  async updateEvento(req, res, next) {
    try {
      const { id } = req.params;
      const fields = eventInput(req.body, true);
      const { nombre, descripcion, fecha, hora, lugar, tipo, publico } = fields;

      const evento = await EventoModel.findById(id);
      if (!evento) {
        return res.status(404).json({ error: 'Evento no encontrado' });
      }

      const esGestor = req.user.rol === 'administrador';
      const isCreator = evento.creado_por === req.user.id;

      if (!esGestor && !isCreator) {
        return res.status(403).json({ error: 'No tienes permisos para modificar este evento' });
      }

      const campos = { nombre, descripcion, fecha, hora, lugar, tipo, publico };
      const enviados = Object.keys(campos).filter((campo) => campos[campo] !== undefined);

      if (enviados.length === 0) {
        return res.status(400).json({ error: 'No hay campos para actualizar' });
      }

      for (const campo of ['nombre', 'fecha', 'hora', 'lugar', 'tipo']) {
        if (campos[campo] !== undefined && (campos[campo] === null || String(campos[campo]).trim() === '')) {
          return res.status(400).json({ error: `El campo ${campo} no puede estar vacío` });
        }
      }

      if (tipo !== undefined && !TIPOS_VALIDOS.includes(tipo)) {
        return res.status(400).json({ error: 'Tipo de evento inválido' });
      }

      if (descripcion === null) {
        return res.status(400).json({ error: 'La descripción no puede ser nula' });
      }

      if (publico !== undefined && ![0, 1, true, false].includes(publico)) {
        return res.status(400).json({ error: 'publico debe ser 0 o 1' });
      }

      const actualizado = await EventoModel.update(id, fields);

      if (!actualizado) {
        return res.status(404).json({ error: 'Evento no encontrado' });
      }

      return res.json(await EventoModel.findById(id));
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
      const dias = req.query.dias === undefined ? 30 : Number(req.query.dias);
      if (!Number.isInteger(dias) || dias < 1 || dias > 365) {
        return res.status(400).json({ error: 'dias debe estar entre 1 y 365' });
      }
      const eventos = await EventoModel.findUpcoming(dias, req.user);
      return res.json(eventos);
    } catch (error) {
      next(error);
    }
  },
  async countEventos(req, res, next) {
    try {
      const filters = eventFilters(req.query, req.user);
      const dias = req.query.dias === undefined ? undefined : Number(req.query.dias);
      if (dias !== undefined && (!Number.isInteger(dias) || dias < 1 || dias > 365)) return res.status(400).json({ error: 'dias inválido' });
      res.json({ count: await EventoModel.count(filters, req.user, dias) });
    } catch (error) { next(error); }
  }
};
