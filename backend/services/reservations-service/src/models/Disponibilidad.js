import pool from '../config/db.js';

export const DisponibilidadModel = {
  async findByRecursoIdAndFecha(recurso_id, fecha) {
    const [rows] = await pool.execute(
      `SELECT id, recurso_id, fecha, hora_inicio, hora_fin, tipo, 'disponibilidad' AS fuente
       FROM disponibilidad WHERE recurso_id = ? AND fecha = ?
       UNION ALL
       SELECT id, recurso_id, fecha, hora_inicio, hora_fin, 'reserva' AS tipo, 'reservas' AS fuente
       FROM reservas WHERE recurso_id = ? AND fecha = ? AND estado <> 'cancelada'
       ORDER BY hora_inicio`,
      [recurso_id, fecha, recurso_id, fecha]
    );
    return rows;
  },

  async create({ recurso_id, fecha, hora_inicio, hora_fin, tipo }, conn = pool) {
    const [result] = await conn.execute(
      `INSERT INTO disponibilidad (recurso_id, fecha, hora_inicio, hora_fin, tipo)
       VALUES (?, ?, ?, ?, ?)`,
      [recurso_id, fecha, hora_inicio, hora_fin, tipo]
    );
    return { id: result.insertId, recurso_id, fecha, hora_inicio, hora_fin, tipo };
  },

  async checkOverlap(recurso_id, fecha, hora_inicio, hora_fin, excludeId = null, tipos = null) {
    let query = `SELECT id FROM disponibilidad WHERE recurso_id = ? AND fecha = ? AND hora_inicio < ? AND hora_fin > ?`;
    const params = [recurso_id, fecha, hora_fin, hora_inicio];

    if (tipos) {
      query += ` AND tipo IN (${tipos.map(() => '?').join(',')})`;
      params.push(...tipos);
    }

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const [rows] = await pool.execute(query, params);
    return rows.length > 0;
  }
};
