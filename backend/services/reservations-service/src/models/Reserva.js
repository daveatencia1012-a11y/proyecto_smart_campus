import pool from '../config/db.js';

export const ReservaModel = {
  async create({ usuario_id, recurso_id, fecha, hora_inicio, hora_fin }, conn = pool) {
    const [result] = await conn.execute(
      `INSERT INTO reservas (usuario_id, recurso_id, fecha, hora_inicio, hora_fin, estado)
       VALUES (?, ?, ?, ?, ?, 'confirmada')`,
      [usuario_id, recurso_id, fecha, hora_inicio, hora_fin]
    );
    return { id: result.insertId, usuario_id, recurso_id, fecha, hora_inicio, hora_fin, estado: 'confirmada' };
  },

  async findById(id, conn = pool, lock = false) {
    const [rows] = await conn.execute(`SELECT * FROM reservas WHERE id = ?${lock ? ' FOR UPDATE' : ''}`, [id]);
    return rows[0];
  },

  async findByFilters({ usuario_id, recurso_id, fecha, estado, fecha_desde, fecha_hasta, limit = 100, offset = 0 }) {
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
    if (fecha_desde) { conditions.push('fecha >= ?'); params.push(fecha_desde); }
    if (fecha_hasta) { conditions.push('fecha <= ?'); params.push(fecha_hasta); }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows] = await pool.execute(
      `SELECT * FROM reservas ${whereClause} ORDER BY creado_en DESC, id DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return rows;
  },

  async update(id, { fecha, hora_inicio, hora_fin }, conn = pool) {
    const [result] = await conn.execute(
      `UPDATE reservas SET fecha = COALESCE(?, fecha), hora_inicio = COALESCE(?, hora_inicio), hora_fin = COALESCE(?, hora_fin)
       WHERE id = ?`,
      [fecha, hora_inicio, hora_fin, id]
    );
    return result.affectedRows > 0;
  },

  async cancel(id, motivo_cancelacion, conn = pool) {
    const [result] = await conn.execute(
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

    const [rows] = await pool.execute(query, params);
    return rows.length > 0;
  },

  async count(fecha, filters = {}, grouped = false) {
    let query = `SELECT ${grouped ? 'estado, ' : ''}COUNT(*) AS total FROM reservas WHERE 1=1`;
    const params = [];
    if (fecha) {
      query += ' AND fecha = ?';
      params.push(fecha);
    }
    if (filters.usuario_id) { query += ' AND usuario_id = ?'; params.push(filters.usuario_id); }
    if (filters.estado) { query += ' AND estado = ?'; params.push(filters.estado); }
    if (filters.fecha_desde) { query += ' AND fecha >= ?'; params.push(filters.fecha_desde); }
    if (filters.fecha_hasta) { query += ' AND fecha <= ?'; params.push(filters.fecha_hasta); }
    if (grouped) query += ' GROUP BY estado';
    const [rows] = await pool.execute(query, params);
    return grouped ? Object.fromEntries(rows.map(row => [row.estado, row.total])) : rows[0].total;
  },
  async byDate(filters = {}) {
    let query = 'SELECT fecha, COUNT(*) AS total FROM reservas WHERE 1=1';
    const params = [];
    if (filters.fecha_desde) { query += ' AND fecha >= ?'; params.push(filters.fecha_desde); }
    if (filters.fecha_hasta) { query += ' AND fecha <= ?'; params.push(filters.fecha_hasta); }
    if (filters.estado) { query += ' AND estado = ?'; params.push(filters.estado); }
    query += ' GROUP BY fecha ORDER BY fecha';
    const [rows] = await pool.execute(query, params);
    return { por_fecha: Object.fromEntries(rows.map(row => [row.fecha, row.total])), total: rows.reduce((sum, row) => sum + row.total, 0) };
  }
};
