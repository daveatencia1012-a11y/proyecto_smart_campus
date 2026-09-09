import db from '../config/db.js';

const ROLES = ['estudiante', 'docente', 'administrativo', 'administrador'];

export async function findByEmail(email) {
  const [rows] = await db.query('SELECT * FROM users WHERE email = ? AND activo = 1', [email]);
  return rows[0];
}

export async function findById(id) {
  const [rows] = await db.query(
    'SELECT id, nombre, email, rol, activo, creado_en FROM users WHERE id = ?',
    [id]
  );
  return rows[0];
}

export async function list({ limit = 10, offset = 0 } = {}) {
  const [rows] = await db.query(
    'SELECT id, nombre, email, rol, activo, creado_en FROM users WHERE activo = 1 ORDER BY id LIMIT ? OFFSET ?',
    [Number(limit), Number(offset)]
  );

  const [[{ total }]] = await db.query('SELECT COUNT(*) AS total FROM users WHERE activo = 1');

  return { users: rows, total };
}

export async function create({ nombre, email, password_hash, rol }) {
  const [result] = await db.query(
    'INSERT INTO users (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)',
    [nombre, email, password_hash, rol]
  );

  return findById(result.insertId);
}

export async function update(id, fields) {
  const allowed = ['nombre', 'email', 'password_hash', 'rol', 'activo'];
  const keys = Object.keys(fields).filter((k) => allowed.includes(k) && fields[k] !== undefined);

  if (keys.length === 0) return findById(id);

  const sets = keys.map((k) => `${k} = ?`).join(', ');
  const values = keys.map((k) => fields[k]);

  await db.query(`UPDATE users SET ${sets} WHERE id = ?`, [...values, id]);

  return findById(id);
}

export async function softDelete(id) {
  await db.query('UPDATE users SET activo = 0 WHERE id = ?', [id]);
  return true;
}

export { ROLES };

const User = { findByEmail, findById, list, create, update, softDelete };
export default User;
