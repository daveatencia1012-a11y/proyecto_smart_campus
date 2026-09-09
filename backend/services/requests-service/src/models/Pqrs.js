import pool from '../config/db.js';

class PqrsModel {
  static async findAll(filters = {}) {
    let query = 'SELECT * FROM pqrs WHERE 1=1';
    const params = [];
    if (filters.tipo) { query += ' AND tipo = ?'; params.push(filters.tipo); }
    if (filters.estado) { query += ' AND estado = ?'; params.push(filters.estado); }
    query += ' ORDER BY creado_en DESC';
    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM pqrs WHERE id = ?', [id]);
    return rows[0];
  }

  static async create(data) {
    const { usuario_id, tipo, asunto, descripcion } = data;
    const [result] = await pool.query(
      'INSERT INTO pqrs (usuario_id, tipo, asunto, descripcion) VALUES (?, ?, ?, ?)',
      [usuario_id, tipo, asunto, descripcion]
    );
    return { id: result.insertId, ...data };
  }

  static async update(id, data) {
    const { estado, respuesta } = data;
    const [result] = await pool.query(
      'UPDATE pqrs SET estado = ?, respuesta = ? WHERE id = ?',
      [estado, respuesta, id]
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await pool.query('DELETE FROM pqrs WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

export default PqrsModel;
