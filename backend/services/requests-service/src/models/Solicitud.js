import pool from '../config/db.js';
import { fail } from '../validation.js';

const VALID_TRANSITIONS = {
  'REGISTRADA': ['EN_REVISION'],
  'EN_REVISION': ['ASIGNADA', 'REGISTRADA'],
  'ASIGNADA': ['EN_PROCESO', 'EN_REVISION'],
  'EN_PROCESO': ['RESUELTA', 'ASIGNADA'],
  'RESUELTA': ['CERRADA', 'EN_PROCESO']
};

class SolicitudModel {
  static async findAll(filters = {}) {
    let query = 'SELECT * FROM solicitudes WHERE 1=1';
    const params = [];
    if (filters.estado) { query += ' AND estado = ?'; params.push(filters.estado); }
    if (filters.usuario_id) { query += ' AND usuario_id = ?'; params.push(filters.usuario_id); }
    if (filters.fecha_desde) { query += ' AND fecha_creacion >= ?'; params.push(filters.fecha_desde); }
    if (filters.fecha_hasta) { query += ' AND fecha_creacion <= ?'; params.push(filters.fecha_hasta); }
    if (filters.fecha_hasta) {
      // El límite superior anterior se sustituye por día completo.
      query = query.replace('fecha_creacion <= ?', 'fecha_creacion < DATE_ADD(?, INTERVAL 1 DAY)');
    }
    query += ' ORDER BY fecha_creacion DESC, id DESC LIMIT ? OFFSET ?';
    params.push(filters.limit ?? 100, filters.offset ?? 0);
    const [rows] = await pool.execute(query, params);
    return rows.map(row => ({ ...row, transiciones_permitidas: VALID_TRANSITIONS[row.estado] || [] }));
  }

  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM solicitudes WHERE id = ?', [id]);
    return rows[0] && { ...rows[0], transiciones_permitidas: VALID_TRANSITIONS[rows[0].estado] || [] };
  }

  static async create(data) {
    const { usuario_id, tipo_servicio, dependencia, descripcion, prioridad } = data;
    const [result] = await pool.execute(
      'INSERT INTO solicitudes (usuario_id, tipo_servicio, dependencia, descripcion, prioridad, historial) VALUES (?, ?, ?, ?, ?, ?)',
      [usuario_id, tipo_servicio, dependencia, descripcion, prioridad, JSON.stringify([{ estado: 'REGISTRADA', actor_id: usuario_id, fecha: new Date().toISOString() }])]
    );
    return this.findById(result.insertId);
  }

  static async update(id, data) {
    const allowed = ['tipo_servicio','dependencia','descripcion','prioridad','responsable_id'];
    const keys = Object.keys(data).filter(key => allowed.includes(key) && data[key] !== undefined);
    if (!keys.length) return Boolean(await this.findById(id));
    const [result] = await pool.execute(`UPDATE solicitudes SET ${keys.map(key => `${key} = ?`).join(', ')} WHERE id = ?`, [...keys.map(key => data[key]), id]);
    return result.affectedRows > 0;
  }

  static async updateEstado(id, nuevoEstado, actorId) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [[solicitud]] = await conn.execute('SELECT * FROM solicitudes WHERE id = ? FOR UPDATE', [id]);
      if (!solicitud) { await conn.rollback(); return false; }
      if (!VALID_TRANSITIONS[solicitud.estado]?.includes(nuevoEstado)) fail('Transición de estado no válida', 409);
      // Regla del equipo (más estricta que la guía §7.4, que solo lo exige para ASIGNADA):
      // sin responsable la solicitud no avanza; solo puede quedarse o volver a REGISTRADA.
      if (nuevoEstado !== 'REGISTRADA' && !solicitud.responsable_id) fail('Asigna un responsable antes de avanzar la solicitud', 409);
      const entry = JSON.stringify({ estado: nuevoEstado, anterior: solicitud.estado, actor_id: actorId, fecha: new Date().toISOString() });
      await conn.execute("UPDATE solicitudes SET estado = ?, historial = JSON_ARRAY_APPEND(COALESCE(historial, JSON_ARRAY()), '$', CAST(? AS JSON)) WHERE id = ?", [nuevoEstado, entry, id]);
      await conn.commit();
      return true;
    } catch (error) { await conn.rollback(); throw error; }
    finally { conn.release(); }
  }

  static async delete(id) {
    const [result] = await pool.execute('DELETE FROM solicitudes WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async count(estado, filters = {}, grouped = false) {
    let query = `SELECT ${grouped ? 'estado, ' : ''}COUNT(*) AS total FROM solicitudes WHERE 1=1`;
    const params = [];
    if (estado) {
      query += ' AND estado = ?';
      params.push(estado);
    }
    if (filters.usuario_id) { query += ' AND usuario_id = ?'; params.push(filters.usuario_id); }
    if (filters.fecha_desde) { query += ' AND fecha_creacion >= ?'; params.push(filters.fecha_desde); }
    if (filters.fecha_hasta) { query += ' AND fecha_creacion < DATE_ADD(?, INTERVAL 1 DAY)'; params.push(filters.fecha_hasta); }
    if (grouped) query += ' GROUP BY estado';
    const [rows] = await pool.execute(query, params);
    return grouped ? Object.fromEntries(rows.map(row => [row.estado, row.total])) : rows[0].total;
  }

  static getValidTransitions() {
    return VALID_TRANSITIONS;
  }
}

export default SolicitudModel;
