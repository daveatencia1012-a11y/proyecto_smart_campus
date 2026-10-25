import User, { ROLES } from '../models/User.js';
import bcrypt from 'bcrypt';
import { validateUserInput, validateId } from '../middleware/validation.js';

function publicUser(user) {
  if (!user) return null;
  const { password_hash, ...rest } = user;
  return rest;
}

export async function list(req, res, next) {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    if (!Number.isSafeInteger(page) || page < 1 || page > 100000 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) return res.status(400).json({ error: 'Paginación inválida' });
    if (req.query.activo !== undefined && !['0','1','todos'].includes(req.query.activo)) return res.status(400).json({ error: 'Filtro de estado inválido' });
    if (req.query.q !== undefined && (typeof req.query.q !== 'string' || req.query.q.length > 100)) return res.status(400).json({ error: 'Búsqueda inválida' });
    const offset = (page - 1) * limit;

    const activo = req.query.activo === 'todos' ? null : Number(req.query.activo ?? 1);
    const { users, total } = await User.list({ limit, offset, activo, q: req.query.q });

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
    validateId(id);

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
    validateId(id);
    validateUserInput(req.body);
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
      const existing = await User.findByEmail(email, false);
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

export async function responsables(req, res, next) {
  try {
    if (req.params.id) validateId(req.params.id);
    const rows = await User.findResponsables(req.params.id ? Number(req.params.id) : null);
    if (req.params.id && !rows.length) return res.status(404).json({ error: 'Responsable no encontrado' });
    res.json(req.params.id ? rows[0] : rows);
  } catch (error) { next(error); }
}

export async function remove(req, res, next) {
  try {
    const { id } = req.params;
    validateId(id);

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
