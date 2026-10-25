import { pool } from '../config/db.js';

class Recurso {
  static async findAll(filters = {}) {
    let query = 'SELECT * FROM recursos WHERE eliminado_en IS NULL';
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

    query += ' ORDER BY creado_en DESC, id DESC LIMIT ? OFFSET ?';
    params.push(filters.limit ?? 100, filters.offset ?? 0);

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
    const { codigo, nombre, tipo, ubicacion, estado, descripcion, disponible = estado === 'disponible' } = data;

    const [result] = await pool.execute(
      'INSERT INTO recursos (codigo, nombre, tipo, ubicacion, estado, descripcion, disponible) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [codigo, nombre, tipo, ubicacion, estado, descripcion || null, Number(disponible)]
    );

    return this.findById(result.insertId);
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
      `UPDATE recursos SET ${fields.join(', ')} WHERE id = ? AND eliminado_en IS NULL`,
      params
    );

    return this.findById(id);
  }

  static async updateAvailability(id, disponible) {
    await pool.execute(
      'UPDATE recursos SET disponible = ? WHERE id = ? AND eliminado_en IS NULL',
      [disponible ? 1 : 0, id]
    );

    return this.findById(id);
  }

  static async softDelete(id) {
    const [result] = await pool.execute(
      "UPDATE recursos SET eliminado_en = NOW(), disponible = 0, estado = 'fuera_servicio' WHERE id = ? AND eliminado_en IS NULL",
      [id]
    );
    return result.affectedRows > 0;
  }

  static async findUniqueTypes() {
    const [rows] = await pool.execute(
      'SELECT DISTINCT tipo FROM recursos WHERE tipo IS NOT NULL AND eliminado_en IS NULL ORDER BY tipo'
    );
    return rows.map((row) => row.tipo);
  }

  static async countAvailable() {
    const [rows] = await pool.execute(
      "SELECT COUNT(*) AS total FROM recursos WHERE disponible = 1 AND estado = 'disponible' AND eliminado_en IS NULL"
    );
    return rows[0].total;
  }
}

export default Recurso;
