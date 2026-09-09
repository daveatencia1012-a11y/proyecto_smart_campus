import pool from '../config/db.js';

export const EventoModel = {
  async create({ nombre, descripcion, fecha, hora, lugar, tipo, creado_por, publico }) {
    const [result] = await pool.query(
      `INSERT INTO eventos (nombre, descripcion, fecha, hora, lugar, tipo, creado_por, publico)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, descripcion, fecha, hora, lugar, tipo, creado_por, publico]
    );
    return { id: result.insertId, nombre, descripcion, fecha, hora, lugar, tipo, creado_por, publico };
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM eventos WHERE id = ?', [id]);
    return rows[0];
  },

  async findAll(filters = {}) {
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

    query += ' ORDER BY fecha DESC, hora DESC';

    const [rows] = await pool.query(query, params);
    return rows;
  },

  async findUpcoming(dias = 30) {
    const [rows] = await pool.query(
      `SELECT * FROM eventos
       WHERE fecha >= CURDATE()
       AND fecha <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
       ORDER BY fecha ASC, hora ASC`,
      [dias]
    );
    return rows;
  },

  async update(id, { nombre, descripcion, fecha, hora, lugar, tipo, publico }) {
    const [result] = await pool.query(
      `UPDATE eventos
       SET nombre = ?, descripcion = ?, fecha = ?, hora = ?, lugar = ?, tipo = ?, publico = ?
       WHERE id = ?`,
      [nombre, descripcion, fecha, hora, lugar, tipo, publico, id]
    );
    return result.affectedRows > 0;
  },

  async delete(id) {
    const [result] = await pool.query('DELETE FROM eventos WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};
