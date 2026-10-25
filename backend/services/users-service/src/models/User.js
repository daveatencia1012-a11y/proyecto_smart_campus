import db from '../config/db.js';

const ROLES = ['estudiante', 'docente', 'administrativo', 'administrador'];

export async function findByEmail(email, activeOnly = true) {
  const [rows] = await db.execute(`SELECT * FROM users WHERE email = ?${activeOnly ? ' AND activo = 1' : ''}`, [email]);
  return rows[0];
}

export async function findById(id, conn = db) {
  const [rows] = await conn.execute(
    'SELECT id, nombre, email, rol, activo, creado_en FROM users WHERE id = ?',
    [id]
  );
  return rows[0];
}

export async function findActiveById(id) {
  const [rows] = await db.execute(
    'SELECT id, nombre, email, rol, activo, creado_en FROM users WHERE id = ? AND activo = 1',
    [id]
  );
  return rows[0];
}

export async function list({ limit = 10, offset = 0, activo = 1, q = '' } = {}) {
  const where = ['1=1'];
  const params = [];
  if (activo !== null) { where.push('activo = ?'); params.push(activo); }
  if (q) { where.push('(nombre LIKE ? OR email LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
  const [rows] = await db.execute(
    `SELECT id, nombre, email, rol, activo, creado_en FROM users WHERE ${where.join(' AND ')} ORDER BY id LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );

  const [[{ total }]] = await db.execute(`SELECT COUNT(*) AS total FROM users WHERE ${where.join(' AND ')}`, params);

  return { users: rows, total };
}

export async function create({ nombre, email, password_hash, rol }) {
  const [result] = await db.execute(
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
  if (values.some(value => value !== null && typeof value === 'object')) {
    throw Object.assign(new Error('Campos de usuario inválidos'), { status: 400 });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    let admins = [];
    if (keys.includes('rol') || keys.includes('activo')) {
      [admins] = await conn.execute("SELECT id FROM users WHERE rol = 'administrador' AND activo = 1 ORDER BY id FOR UPDATE");
    }
    const [[current]] = await conn.execute('SELECT id, rol, activo FROM users WHERE id = ? FOR UPDATE', [id]);
    if (!current) { await conn.rollback(); return null; }
    const newRole = fields.rol ?? current.rol;
    const newActive = fields.activo === undefined ? current.activo : Number(fields.activo);
    if (current.rol === 'administrador' && current.activo === 1 && (newRole !== 'administrador' || newActive !== 1) && admins.length <= 1) {
      throw Object.assign(new Error('No puedes desactivar ni cambiar el rol del último administrador activo'), { status: 409 });
    }
    await conn.execute(`UPDATE users SET ${sets} WHERE id = ?`, [...values, id]);
    const user = await findById(id, conn);
    await conn.commit();
    return user;
  } catch (error) { await conn.rollback(); throw error; }
  finally { conn.release(); }
}

export async function softDelete(id) {
  return Boolean(await update(id, { activo: 0 }));
}

export async function findResponsables(id) {
  const [rows] = await db.execute(`SELECT id, nombre, rol FROM users WHERE activo = 1 AND rol IN ('administrador','administrativo')${id ? ' AND id = ?' : ''} ORDER BY nombre`, id ? [id] : []);
  return rows;
}

export { ROLES };

const User = { findByEmail, findById, findActiveById, findResponsables, list, create, update, softDelete };
export default User;
