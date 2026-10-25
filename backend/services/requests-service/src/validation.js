export const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status, statusCode: status }); };
export function object(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail('Cuerpo inválido');
  return body;
}
export function id(value) {
  if (!['number', 'string'].includes(typeof value) || !/^\d+$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value) <= 0) fail('Identificador inválido');
  return Number(value);
}
export function text(value, name, max) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) fail(`${name} inválido (máximo ${max} caracteres)`);
  return value.trim();
}
export function date(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) fail('Fecha inválida');
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) fail('Fecha inválida');
  return value;
}
export function filters(query = {}) {
  const result = {};
  for (const key of ['estado', 'tipo']) if (query[key] !== undefined) result[key] = text(query[key], key, 50);
  if (query.usuario_id !== undefined) result.usuario_id = id(query.usuario_id);
  for (const key of ['fecha_desde', 'fecha_hasta']) if (query[key] !== undefined) result[key] = date(query[key]);
  if (result.fecha_desde && result.fecha_hasta && result.fecha_desde > result.fecha_hasta) fail('Rango de fechas inválido');
  result.limit = query.limit === undefined ? 100 : Number(query.limit);
  result.offset = query.offset === undefined ? 0 : Number(query.offset);
  if (!Number.isSafeInteger(result.limit) || result.limit < 1 || result.limit > 100 || !Number.isSafeInteger(result.offset) || result.offset < 0 || result.offset > 10000000) fail('Paginación inválida');
  return result;
}
export function solicitudInput(body, partial = false) {
  object(body);
  const data = {};
  for (const [key, max] of [['tipo_servicio', 100], ['dependencia', 100], ['descripcion', 10000]]) {
    if (body[key] !== undefined || !partial) data[key] = text(body[key], key, max);
  }
  if (body.prioridad !== undefined || !partial) {
    if (typeof body.prioridad !== 'string' || !['baja', 'media', 'alta', 'critica'].includes(body.prioridad.toLowerCase())) fail('Prioridad inválida');
    data.prioridad = body.prioridad.toLowerCase();
  }
  if (partial && body.responsable_id !== undefined) data.responsable_id = body.responsable_id === null ? null : id(body.responsable_id);
  const allowed = partial ? ['tipo_servicio','dependencia','descripcion','prioridad','responsable_id'] : ['tipo_servicio','dependencia','descripcion','prioridad'];
  if (Object.keys(body).some(key => !allowed.includes(key))) fail('Se enviaron campos no permitidos');
  if (!Object.keys(data).length) fail('No hay campos para actualizar');
  return data;
}
