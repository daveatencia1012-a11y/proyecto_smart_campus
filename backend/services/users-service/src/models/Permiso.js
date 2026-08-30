import db from '../config/db.js';

export async function findByRole(rol) {
  const [rows] = await db.query(
    'SELECT id, rol, recurso, accion FROM permisos WHERE rol = ?',
    [rol]
  );
  return rows;
}

export async function listAll() {
  const [rows] = await db.query('SELECT id, rol, recurso, accion FROM permisos');
  return rows;
}

const Permiso = { findByRole, listAll };
export default Permiso;
