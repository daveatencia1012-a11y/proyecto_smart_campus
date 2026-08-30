import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User, { ROLES } from '../models/User.js';

function signAccessToken(user) {
  return jwt.sign(
    { id: user.id, rol: user.rol, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    { id: user.id, rol: user.rol, email: user.email },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
}

function publicUser(user) {
  if (!user) return null;
  const { password_hash, ...rest } = user;
  return rest;
}

export async function register(req, res, next) {
  try {
    const { nombre, email, password, rol } = req.body;

    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({ error: 'nombre, email, password y rol son requeridos' });
    }

    if (!ROLES.includes(rol)) {
      return res.status(400).json({ error: 'rol inválido' });
    }

    const existing = await User.findByEmail(email);
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
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'refreshToken requerido' });
    }

    const payload = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    const user = await User.findById(payload.id) || (await User.findByEmail(payload.email));
    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const accessToken = signAccessToken(user);

    return res.json({ accessToken });
  } catch (error) {
    return res.status(401).json({ error: 'Refresh token inválido o expirado' });
  }
}
