import { pool } from '../config/db.js';

class Recurso {
  static async findAll(filters = {}) {
    let query = 'SELECT * FROM recursos WHERE 1=1';
    const params = [];

    if (filters.tipo) {
      query += ' AND tipo = ?';
      params.push(filters.tipo);
    }

    if (filters.estado) {
      query += ' AND estado = ?';
      params.push(filters.estado);
    }

    if (filters.disponible !== undefined) {
      query += ' AND disponible = ?';
      params.push(filters.disponible ? 1 : 0);
    }

    query += ' ORDER BY creado_en DESC';

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM recursos WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  static async create(data) {
    const { codigo, nombre, tipo, ubicacion, estado, descripcion } = data;

    const [result] = await pool.execute(
      'INSERT INTO recursos (codigo, nombre, tipo, ubicacion, estado, descripcion) VALUES (?, ?, ?, ?, ?, ?)',
      [codigo, nombre, tipo, ubicacion, estado, descripcion || null]
    );

    return { id: result.insertId, ...data };
  }

  static async update(id, data) {
    const fields = [];
    const params = [];

    if (data.codigo !== undefined) {
      fields.push('codigo = ?');
      params.push(data.codigo);
    }
    if (data.nombre !== undefined) {
      fields.push('nombre = ?');
      params.push(data.nombre);
    }
    if (data.tipo !== undefined) {
      fields.push('tipo = ?');
      params.push(data.tipo);
    }
    if (data.ubicacion !== undefined) {
      fields.push('ubicacion = ?');
      params.push(data.ubicacion);
    }
    if (data.estado !== undefined) {
      fields.push('estado = ?');
      params.push(data.estado);
    }
    if (data.disponible !== undefined) {
      fields.push('disponible = ?');
      params.push(data.disponible ? 1 : 0);
    }
    if (data.descripcion !== undefined) {
      fields.push('descripcion = ?');
      params.push(data.descripcion);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    params.push(id);

    await pool.execute(
      `UPDATE recursos SET ${fields.join(', ')} WHERE id = ?`,
      params
    );

    return this.findById(id);
  }

  static async updateAvailability(id, disponible) {
    await pool.execute(
      'UPDATE recursos SET disponible = ? WHERE id = ?',
      [disponible ? 1 : 0, id]
    );

    return this.findById(id);
  }

  static async softDelete(id) {
    await pool.execute(
      'DELETE FROM recursos WHERE id = ?',
      [id]
    );
    return true;
  }

  static async findUniqueTypes() {
    const [rows] = await pool.execute(
      'SELECT DISTINCT tipo FROM recursos WHERE tipo IS NOT NULL ORDER BY tipo'
    );
    return rows.map((row) => row.tipo);
  }

  static async countAvailable() {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) AS total FROM recursos WHERE disponible = 1'
    );
    return rows[0].total;
  }
}

export default Recurso;
