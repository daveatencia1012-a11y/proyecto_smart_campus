import { DisponibilidadModel } from '../models/Disponibilidad.js';

export const disponibilidadController = {
  async getDisponibilidad(req, res, next) {
    try {
      const { recurso_id } = req.params;
      const { fecha } = req.query;

      const disponibilidad = await DisponibilidadModel.findByRecursoIdAndFecha(recurso_id, fecha);
      return res.json(disponibilidad);
    } catch (error) {
      next(error);
    }
  },

  async createDisponibilidad(req, res, next) {
    try {
      const { recurso_id, fecha, hora_inicio, hora_fin, tipo } = req.body;

      if (!recurso_id || !fecha || !hora_inicio || !hora_fin || !tipo) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
      }

      const tiposValidos = ['reserva', 'mantenimiento', 'bloqueo'];
      if (!tiposValidos.includes(tipo)) {
        return res.status(400).json({ error: 'Tipo de disponibilidad inválido' });
      }

      if (hora_inicio >= hora_fin) {
        return res.status(400).json({ error: 'La hora de inicio debe ser menor que la hora de fin' });
      }

      const overlap = await DisponibilidadModel.checkOverlap(recurso_id, fecha, hora_inicio, hora_fin);
      if (overlap) {
        return res.status(409).json({ error: 'Ya existe una entrada de disponibilidad en ese horario' });
      }

      const disponibilidad = await DisponibilidadModel.create({ recurso_id, fecha, hora_inicio, hora_fin, tipo });
      return res.status(201).json(disponibilidad);
    } catch (error) {
      next(error);
    }
  }
};
