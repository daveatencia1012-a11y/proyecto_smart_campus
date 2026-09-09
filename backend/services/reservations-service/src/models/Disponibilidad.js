import pool from '../config/db.js';

export const DisponibilidadModel = {
  async findByRecursoIdAndFecha(recurso_id, fecha) {
    const [rows] = await pool.query(
      'SELECT * FROM disponibilidad WHERE recurso_id = ? AND fecha = ? ORDER BY hora_inicio ASC',
      [recurso_id, fecha]
    );
    return rows;
  },

  async create({ recurso_id, fecha, hora_inicio, hora_fin, tipo }) {
    const [result] = await pool.query(
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

    const [rows] = await pool.query(query, params);
    return rows.length > 0;
  }
};
