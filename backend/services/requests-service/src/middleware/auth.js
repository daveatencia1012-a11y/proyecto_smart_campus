import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_SECRET_EXAMPLES = new Set([
  'smart_campus_jwt_secret',
  'cambia_este_secreto',
  'your_jwt_secret_key_here',
  'reemplaza_por_una_cadena_larga_y_aleatoria'
]);

if (
  !JWT_SECRET ||
  Buffer.byteLength(JWT_SECRET, 'utf8') < 32 ||
  JWT_SECRET !== JWT_SECRET.trim() ||
  JWT_SECRET_EXAMPLES.has(JWT_SECRET.toLowerCase())
) {
  console.error('[auth] JWT_SECRET debe ser una clave aleatoria de al menos 32 bytes, sin espacios al inicio/final ni valores de ejemplo');
  process.exit(1);
}

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'], issuer: 'smart-campus-users', audience: 'smart-campus-api'
    });
    if (payload.token_use !== 'access' || !Number.isSafeInteger(payload.id) || payload.id <= 0 ||
        !['estudiante', 'docente', 'administrativo', 'administrador'].includes(payload.rol)) {
      return res.status(401).json({ error: 'Token inválido' });
    }
    req.user = {
      id: payload.id,
      rol: payload.rol,
      email: payload.email ?? null
    };
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

    if (!roles.length || !roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'Acceso denegado: permisos insuficientes' });
    }

    next();
  };
}
