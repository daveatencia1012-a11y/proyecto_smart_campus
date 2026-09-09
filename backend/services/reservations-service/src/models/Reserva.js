import pool from '../config/db.js';

export const ReservaModel = {
  async create({ usuario_id, recurso_id, fecha, hora_inicio, hora_fin }) {
    const [result] = await pool.query(
      `INSERT INTO reservas (usuario_id, recurso_id, fecha, hora_inicio, hora_fin, estado)
       VALUES (?, ?, ?, ?, ?, 'pendiente')`,
      [usuario_id, recurso_id, fecha, hora_inicio, hora_fin]
    );
    return { id: result.insertId, usuario_id, recurso_id, fecha, hora_inicio, hora_fin, estado: 'pendiente' };
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM reservas WHERE id = ?', [id]);
    return rows[0];
  },

  async findByFilters({ usuario_id, recurso_id, fecha, estado, limit = 50, offset = 0 }) {
    const conditions = [];
    const params = [];

    if (usuario_id) {
      conditions.push('usuario_id = ?');
      params.push(usuario_id);
    }
    if (recurso_id) {
      conditions.push('recurso_id = ?');
      params.push(recurso_id);
    }
    if (fecha) {
      conditions.push('fecha = ?');
      params.push(fecha);
    }
    if (estado) {
      conditions.push('estado = ?');
      params.push(estado);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `SELECT * FROM reservas ${whereClause} ORDER BY creado_en DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return rows;
  },

  async update(id, { fecha, hora_inicio, hora_fin }) {
    const [result] = await pool.query(
      `UPDATE reservas SET fecha = COALESCE(?, fecha), hora_inicio = COALESCE(?, hora_inicio), hora_fin = COALESCE(?, hora_fin)
       WHERE id = ?`,
      [fecha, hora_inicio, hora_fin, id]
    );
    return result.affectedRows > 0;
  },

  async cancel(id, motivo_cancelacion) {
    const [result] = await pool.query(
      `UPDATE reservas SET estado = 'cancelada', motivo_cancelacion = ? WHERE id = ?`,
      [motivo_cancelacion, id]
    );
    return result.affectedRows > 0;
  },

  async checkOverlap(recurso_id, fecha, hora_inicio, hora_fin, excludeId = null) {
    let query = `SELECT id FROM reservas WHERE recurso_id = ? AND fecha = ? AND estado != 'cancelada' AND hora_inicio < ? AND hora_fin > ?`;
    const params = [recurso_id, fecha, hora_fin, hora_inicio];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const [rows] = await pool.query(query, params);
    return rows.length > 0;
  },

  async count(fecha) {
    let query = 'SELECT COUNT(*) AS total FROM reservas WHERE 1=1';
    const params = [];
    if (fecha) {
      query += ' AND fecha = ?';
      params.push(fecha);
    }
    const [rows] = await pool.query(query, params);
    return rows[0].total;
  }
};
