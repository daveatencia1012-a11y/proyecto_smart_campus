import pool from '../config/db.js';

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
    query += ' ORDER BY fecha_creacion DESC';
    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM solicitudes WHERE id = ?', [id]);
    return rows[0];
  }

  static async create(data) {
    const { usuario_id, tipo_servicio, dependencia, descripcion, prioridad } = data;
    const [result] = await pool.query(
      'INSERT INTO solicitudes (usuario_id, tipo_servicio, dependencia, descripcion, prioridad) VALUES (?, ?, ?, ?, ?)',
      [usuario_id, tipo_servicio, dependencia, descripcion, prioridad]
    );
    return { id: result.insertId, ...data };
  }

  static async update(id, data) {
    const { tipo_servicio, dependencia, descripcion, prioridad, responsable_id } = data;
    const [result] = await pool.query(
      'UPDATE solicitudes SET tipo_servicio = ?, dependencia = ?, descripcion = ?, prioridad = ?, responsable_id = ? WHERE id = ?',
      [tipo_servicio, dependencia, descripcion, prioridad, responsable_id, id]
    );
    return result.affectedRows > 0;
  }

  static async updateEstado(id, nuevoEstado) {
    const solicitud = await this.findById(id);
    if (!solicitud) return false;
    const currentEstado = solicitud.estado;
    if (!VALID_TRANSITIONS[currentEstado]?.includes(nuevoEstado)) {
      throw new Error(`Transición de estado no válida: ${currentEstado} -> ${nuevoEstado}`);
    }
    const [result] = await pool.query(
      'UPDATE solicitudes SET estado = ? WHERE id = ?',
      [nuevoEstado, id]
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await pool.query('DELETE FROM solicitudes WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async count(estado) {
    let query = 'SELECT COUNT(*) AS total FROM solicitudes WHERE 1=1';
    const params = [];
    if (estado) {
      query += ' AND estado = ?';
      params.push(estado);
    }
    const [rows] = await pool.query(query, params);
    return rows[0].total;
  }

  static getValidTransitions() {
    return VALID_TRANSITIONS;
  }
}

export default SolicitudModel;
