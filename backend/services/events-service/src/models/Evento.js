import pool from '../config/db.js';

function visibility(user) {
  return user?.rol === 'administrador'
    ? { sql: '', params: [] }
    : { sql: ' AND (publico = 1 OR creado_por = ?)', params: [user?.id ?? 0] };
}

export const EventoModel = {
  async create({ nombre, descripcion, fecha, hora, lugar, tipo, creado_por, publico }) {
    const [result] = await pool.execute(
      `INSERT INTO eventos (nombre, descripcion, fecha, hora, lugar, tipo, creado_por, publico)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, descripcion, fecha, hora, lugar, tipo, creado_por, publico]
    );
    return { id: result.insertId, nombre, descripcion, fecha, hora, lugar, tipo, creado_por, publico };
  },

  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM eventos WHERE id = ?', [id]);
    return rows[0];
  },

  async findAll(filters = {}, user) {
    let query = 'SELECT * FROM eventos WHERE 1=1';
    const params = [];

    if (filters.fecha) {
      query += ' AND fecha = ?';
      params.push(filters.fecha);
    }

    if (filters.tipo) {
      query += ' AND tipo = ?';
      params.push(filters.tipo);
    }
    if (filters.creado_por) { query += ' AND creado_por = ?'; params.push(filters.creado_por); }
    if (filters.fecha_desde) { query += ' AND fecha >= ?'; params.push(filters.fecha_desde); }
    if (filters.fecha_hasta) { query += ' AND fecha <= ?'; params.push(filters.fecha_hasta); }

    const scope = visibility(user);
    query += scope.sql + ' ORDER BY fecha DESC, hora DESC, id DESC LIMIT ? OFFSET ?';
    params.push(...scope.params);
    params.push(filters.limit ?? 100, filters.offset ?? 0);

    const [rows] = await pool.execute(query, params);
    return rows;
  },

  async findUpcoming(dias = 30, user) {
    const scope = visibility(user);
    const [rows] = await pool.execute(
      `SELECT * FROM eventos
       WHERE TIMESTAMP(fecha, hora) >= NOW()
       AND fecha <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
       ${scope.sql}
       ORDER BY fecha ASC, hora ASC`,
      [dias, ...scope.params]
    );
    return rows;
  },

  async update(id, data) {
    const allowed = ['nombre','descripcion','fecha','hora','lugar','tipo','publico'];
    const keys = Object.keys(data).filter(key => allowed.includes(key) && data[key] !== undefined);
    if (!keys.length) return false;
    const [result] = await pool.execute(`UPDATE eventos SET ${keys.map(key => `${key} = ?`).join(', ')} WHERE id = ?`, [...keys.map(key => data[key]), id]);
    return result.affectedRows > 0;
  },

  async count(filters = {}, user, dias) {
    const scope = visibility(user);
    let query = 'SELECT COUNT(*) AS total FROM eventos WHERE 1=1' + scope.sql;
    const params = [...scope.params];
    if (filters.creado_por) { query += ' AND creado_por = ?'; params.push(filters.creado_por); }
    if (filters.fecha) { query += ' AND fecha = ?'; params.push(filters.fecha); }
    if (filters.tipo) { query += ' AND tipo = ?'; params.push(filters.tipo); }
    if (filters.fecha_desde) { query += ' AND fecha >= ?'; params.push(filters.fecha_desde); }
    if (filters.fecha_hasta) { query += ' AND fecha <= ?'; params.push(filters.fecha_hasta); }
    if (dias !== undefined) { query += ' AND TIMESTAMP(fecha,hora) >= NOW() AND fecha <= DATE_ADD(CURDATE(), INTERVAL ? DAY)'; params.push(dias); }
    const [[{ total }]] = await pool.execute(query, params);
    return total;
  },

  async delete(id) {
    const [result] = await pool.execute('DELETE FROM eventos WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};
