import User, { ROLES } from '../models/User.js';
import bcrypt from 'bcrypt';

function publicUser(user) {
  if (!user) return null;
  const { password_hash, ...rest } = user;
  return rest;
}

export async function list(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    const { users, total } = await User.list({ limit, offset });

    return res.json({
      usuarios: users.map(publicUser),
      paginacion: {
        total,
        page,
        limit,
        totalPaginas: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getById(req, res, next) {
  try {
    const { id } = req.params;

    if (req.user.rol !== 'administrador' && req.user.id !== Number(id)) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    return res.json({ usuario: publicUser(user) });
  } catch (error) {
    next(error);
  }
}

export async function update(req, res, next) {
  try {
    const { id } = req.params;
    const { nombre, email, password, rol, activo } = req.body;

    const isAdmin = req.user.rol === 'administrador';

    if (!isAdmin && req.user.id !== Number(id)) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    if (!isAdmin && (rol !== undefined || activo !== undefined)) {
      return res.status(403).json({ error: 'No puedes modificar tu rol ni tu estado' });
    }

    if (rol !== undefined && !ROLES.includes(rol)) {
      return res.status(400).json({ error: 'rol inválido' });
    }

    const current = await User.findById(id);
    if (!current) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (email !== undefined && email !== current.email) {
      const existing = await User.findByEmail(email);
      if (existing && existing.id !== Number(id)) {
        return res.status(409).json({ error: 'El email ya está registrado' });
      }
    }

    const fields = {};
    if (nombre !== undefined) fields.nombre = nombre;
    if (email !== undefined) fields.email = email;
    if (isAdmin && rol !== undefined) fields.rol = rol;
    if (isAdmin && activo !== undefined) fields.activo = activo;
    if (password !== undefined) fields.password_hash = await bcrypt.hash(password, 10);

    let updated;
    try {
      updated = await User.update(id, fields);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'El email ya está registrado' });
      }
      throw error;
    }

    return res.json({ mensaje: 'Usuario actualizado', usuario: publicUser(updated) });
  } catch (error) {
    next(error);
  }
}

export async function remove(req, res, next) {
  try {
    const { id } = req.params;

    const current = await User.findById(id);
    if (!current) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    await User.softDelete(id);

    return res.json({ mensaje: 'Usuario eliminado (baja lógica)' });
  } catch (error) {
    next(error);
  }
}
