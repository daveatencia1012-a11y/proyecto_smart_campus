import db from '../config/db.js';

export async function findByRole(rol) {
  const [rows] = await db.query(
    'SELECT id, rol, recurso, accion, alcance FROM permisos WHERE rol = ? ORDER BY recurso, accion',
    [rol]
  );
  return rows;
}

export async function listAll() {
  const [rows] = await db.execute('SELECT id, rol, recurso, accion, alcance FROM permisos ORDER BY rol, recurso, accion');
  return rows;
}

const Permiso = { findByRole, listAll };
export default Permiso;
