export function validateUserInput(body, required = false) {
  const fail = message => { throw Object.assign(new Error(message), { status: 400 }); };
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail('Cuerpo inválido');
  for (const [field, max] of [['nombre', 100], ['email', 100]]) {
    const value = body[field];
    if (value === undefined && !required) continue;
    if (typeof value !== 'string' || !value.trim() || value.length > max) fail(`${field} inválido`);
  }
  if (body.email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) fail('email inválido');
  if (body.password !== undefined || required) {
    if (typeof body.password !== 'string' || body.password.length < 8 || Buffer.byteLength(body.password, 'utf8') > 72) {
      fail('password debe tener al menos 8 caracteres y como máximo 72 bytes');
    }
  }
  if (body.activo !== undefined && ![0, 1, true, false].includes(body.activo)) fail('activo inválido');
}

export function validateId(id) {
  if (!/^\d+$/.test(String(id)) || !Number.isSafeInteger(Number(id)) || Number(id) <= 0) {
    throw Object.assign(new Error('id inválido'), { status: 400 });
  }
}
