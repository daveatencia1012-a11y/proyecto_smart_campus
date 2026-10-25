import pool from '../config/db.js';
import { fail } from '../validation.js';

const TRANSITIONS = { registrada: ['en_revision'], en_revision: ['respondida'], respondida: ['cerrada'], cerrada: [] };
const present = row => row && { ...row, transiciones_permitidas: TRANSITIONS[row.estado] || [] };

class PqrsModel {
  static async findAll(filters = {}) {
    let query = 'SELECT * FROM pqrs WHERE 1=1';
    const params = [];
    if (filters.tipo) { query += ' AND tipo = ?'; params.push(filters.tipo); }
    if (filters.estado) { query += ' AND estado = ?'; params.push(filters.estado); }
    if (filters.usuario_id) { query += ' AND usuario_id = ?'; params.push(filters.usuario_id); }
    if (filters.fecha_desde) { query += ' AND creado_en >= ?'; params.push(filters.fecha_desde); }
    if (filters.fecha_hasta) { query += ' AND creado_en < DATE_ADD(?, INTERVAL 1 DAY)'; params.push(filters.fecha_hasta); }
    query += ' ORDER BY creado_en DESC, id DESC LIMIT ? OFFSET ?';
    const [rows] = await pool.execute(query, [...params, filters.limit ?? 100, filters.offset ?? 0]);
    return rows.map(present);
  }

  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM pqrs WHERE id = ?', [id]);
    return present(rows[0]);
  }

  static async create(data) {
    const { usuario_id, tipo, asunto, descripcion } = data;
    const [result] = await pool.execute(
      'INSERT INTO pqrs (usuario_id, tipo, asunto, descripcion) VALUES (?, ?, ?, ?)',
      [usuario_id, tipo, asunto, descripcion]
    );
    return this.findById(result.insertId);
  }

  static async update(id, data) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [[current]] = await conn.execute('SELECT * FROM pqrs WHERE id = ? FOR UPDATE', [id]);
      if (!current) { await conn.rollback(); return false; }
      const estado = data.estado ?? current.estado;
      if (estado !== current.estado && !TRANSITIONS[current.estado]?.includes(estado)) fail('Transición de PQRS no válida', 409);
      if (current.estado === 'cerrada') fail('La PQRS está cerrada', 409);
      const respuesta = data.respuesta ?? current.respuesta;
      if (['respondida','cerrada'].includes(estado) && !respuesta?.trim()) fail('Es necesaria una respuesta');
      await conn.execute('UPDATE pqrs SET estado = ?, respuesta = ? WHERE id = ?', [estado, respuesta, id]);
      await conn.commit();
      return true;
    } catch (error) { await conn.rollback(); throw error; }
    finally { conn.release(); }
  }

  static async count(filters = {}, grouped = false) {
    let query = `SELECT ${grouped ? 'estado, ' : ''}COUNT(*) AS total FROM pqrs WHERE 1=1`;
    const params = [];
    for (const key of ['estado','usuario_id','tipo']) if (filters[key]) { query += ` AND ${key} = ?`; params.push(filters[key]); }
    if (filters.fecha_desde) { query += ' AND creado_en >= ?'; params.push(filters.fecha_desde); }
    if (filters.fecha_hasta) { query += ' AND creado_en < DATE_ADD(?, INTERVAL 1 DAY)'; params.push(filters.fecha_hasta); }
    if (grouped) query += ' GROUP BY estado';
    const [rows] = await pool.execute(query, params);
    return grouped ? Object.fromEntries(rows.map(row => [row.estado, row.total])) : rows[0].total;
  }

  static async delete(id) {
    const [result] = await pool.execute('DELETE FROM pqrs WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

export default PqrsModel;
