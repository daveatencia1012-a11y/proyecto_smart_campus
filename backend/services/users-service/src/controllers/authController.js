import bcrypt from 'bcrypt';
import User, { ROLES } from '../models/User.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../config/tokens.js';
import { validateUserInput } from '../middleware/validation.js';

function publicUser(user) {
  if (!user) return null;
  const { password_hash, ...rest } = user;
  return rest;
}

export async function register(req, res, next) {
  try {
    validateUserInput(req.body, true);
    const { nombre, email, password, rol } = req.body;

    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({ error: 'nombre, email, password y rol son requeridos' });
    }

    if (!ROLES.includes(rol)) {
      return res.status(400).json({ error: 'rol inválido' });
    }

    const existing = await User.findByEmail(email, false);
    if (existing) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({ nombre, email, password_hash, rol });

    return res.status(201).json({ mensaje: 'Usuario creado', usuario: publicUser(user) });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    if (typeof req.body?.email !== 'string' || typeof req.body?.password !== 'string') {
      return res.status(400).json({ error: 'email y password deben ser texto' });
    }
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email y password son requeridos' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    return res.json({
      accessToken,
      refreshToken,
      usuario: publicUser(user)
    });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body ?? {};

    if (typeof refreshToken !== 'string' || !refreshToken) {
      return res.status(400).json({ error: 'refreshToken requerido' });
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({ error: 'Refresh token inválido o expirado' });
    }

    const user = await User.findActiveById(payload.id);
    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado o inactivo' });
    }

    const accessToken = signAccessToken(user);

    return res.json({ accessToken, usuario: publicUser(user) });
  } catch (error) {
    next(error);
  }
}
