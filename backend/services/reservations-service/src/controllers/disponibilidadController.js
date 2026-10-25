import { DisponibilidadModel } from '../models/Disponibilidad.js';
import pool from '../config/db.js';
import { assertFree, withCalendarLocks, interval, positiveId, dateOnly } from '../services/calendar.js';
import { checkResource } from '../services/resources.js';

export const disponibilidadController = {
  async getDisponibilidad(req, res, next) {
    try {
      const recurso_id = positiveId(req.params.recurso_id);
      const fecha = dateOnly(req.query.fecha);

      const disponibilidad = await DisponibilidadModel.findByRecursoIdAndFecha(recurso_id, fecha);
      return res.json(disponibilidad);
    } catch (error) {
      next(error);
    }
  },

  async createDisponibilidad(req, res, next) {
    try {
      const recurso_id = positiveId(req.body?.recurso_id);
      const horario = interval(req.body ?? {});
      const tipo = req.body?.tipo;
      const tiposValidos = ['mantenimiento', 'bloqueo'];
      if (!tiposValidos.includes(tipo)) {
        return res.status(400).json({ error: 'Tipo de disponibilidad inválido' });
      }

      await checkResource(recurso_id, req.headers.authorization, false);
      const disponibilidad = await withCalendarLocks(pool, [{ recurso_id, fecha: horario.fecha }], async conn => {
        await assertFree(conn, recurso_id, horario);
        return DisponibilidadModel.create({ recurso_id, ...horario, tipo }, conn);
      });
      return res.status(201).json(disponibilidad);
    } catch (error) {
      next(error);
    }
  }
};
