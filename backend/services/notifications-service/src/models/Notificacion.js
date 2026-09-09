import db from "../config/db.js";

const TIPOS_VALIDOS = ["solicitud", "reserva", "evento", "sistema", "pqrs"];

const Notificacion = {
  async crear({ usuario_id, titulo, mensaje, tipo, referencia_id = null, referencia_tipo = null }) {
    const [result] = await db.query(
      `INSERT INTO notificaciones
        (usuario_id, titulo, mensaje, tipo, referencia_id, referencia_tipo)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [usuario_id, titulo, mensaje, tipo, referencia_id, referencia_tipo]
    );
    return result.insertId;
  },

  async listarPorUsuario(usuario_id) {
    const [rows] = await db.query(
      `SELECT id, usuario_id, titulo, mensaje, tipo, referencia_id,
              referencia_tipo, leida, fecha_creacion
       FROM notificaciones
       WHERE usuario_id = ?
       ORDER BY fecha_creacion DESC`,
      [usuario_id]
    );
    return rows;
  },

  async contarNoLeidas(usuario_id) {
    const [rows] = await db.query(
      `SELECT COUNT(*) AS total
       FROM notificaciones
       WHERE usuario_id = ? AND leida = 0`,
      [usuario_id]
    );
    return rows[0].total;
  },

  async obtenerPorId(id) {
    const [rows] = await db.query(
      `SELECT id, usuario_id, titulo, mensaje, tipo, referencia_id,
              referencia_tipo, leida, fecha_creacion
       FROM notificaciones
       WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async marcarLeida(id, usuario_id) {
    const [result] = await db.query(
      `UPDATE notificaciones
       SET leida = 1
       WHERE id = ? AND usuario_id = ?`,
      [id, usuario_id]
    );
    return result.affectedRows > 0;
  },

  async marcarTodas(usuario_id) {
    const [result] = await db.query(
      `UPDATE notificaciones
       SET leida = 1
       WHERE usuario_id = ?`,
      [usuario_id]
    );
    return result.affectedRows;
  },

  async eliminar(id, usuario_id) {
    const [result] = await db.query(
      `DELETE FROM notificaciones
       WHERE id = ? AND usuario_id = ?`,
      [id, usuario_id]
    );
    return result.affectedRows > 0;
  },

  async contarGlobalNoLeidas() {
    const [rows] = await db.query(
      `SELECT COUNT(*) AS total
       FROM notificaciones
       WHERE leida = 0`
    );
    return rows[0].total;
  }
};

export { TIPOS_VALIDOS };
export default Notificacion;
