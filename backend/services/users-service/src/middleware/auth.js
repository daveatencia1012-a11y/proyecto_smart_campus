import jwt from 'jsonwebtoken';

export const ROLES = ['estudiante', 'docente', 'administrativo', 'administrador'];

export function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    req.user = { id: payload.id, rol: payload.rol, email: payload.email };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'Acceso denegado: permisos insuficientes' });
    }

    next();
  };
}
