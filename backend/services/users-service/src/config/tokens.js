import jwt from 'jsonwebtoken';

const accessSecret = process.env.JWT_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET;
if (
  !refreshSecret || Buffer.byteLength(refreshSecret, 'utf8') < 32 ||
  refreshSecret !== refreshSecret.trim() || refreshSecret === accessSecret ||
  refreshSecret.toLowerCase() === 'reemplaza_por_una_cadena_larga_y_aleatoria'
) {
  throw new Error('JWT_REFRESH_SECRET debe ser aleatorio, de al menos 32 bytes y distinto de JWT_SECRET');
}

const issuer = 'smart-campus-users';
export function signAccessToken(user) {
  return jwt.sign(
    { id: user.id, rol: user.rol, email: user.email, token_use: 'access' },
    accessSecret,
    { algorithm: 'HS256', issuer, audience: 'smart-campus-api', expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
}

export function signRefreshToken(user) {
  return jwt.sign(
    { id: user.id, token_use: 'refresh' }, refreshSecret,
    { algorithm: 'HS256', issuer, audience: 'smart-campus-refresh', expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
}

export function verifyRefreshToken(token) {
  const payload = jwt.verify(token, refreshSecret, {
    algorithms: ['HS256'], issuer, audience: 'smart-campus-refresh'
  });
  if (payload.token_use !== 'refresh' || !Number.isSafeInteger(payload.id) || payload.id <= 0) {
    throw new Error('Refresh token inválido');
  }
  return payload;
}
