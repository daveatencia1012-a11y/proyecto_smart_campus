export function fail(message) { throw Object.assign(new Error(message), { statusCode: 400, status: 400 }); }
export function eventInput(body, partial = false) {
  const max = { nombre:150, descripcion:10000, fecha:10, hora:8, lugar:100, tipo:30 };
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => ![...Object.keys(max), 'publico'].includes(key))) fail('Campos de evento no permitidos');
  const data = {};
  for (const [key, length] of Object.entries(max)) {
    if (body[key] === undefined && (partial || key === 'descripcion')) continue;
    if (typeof body[key] !== 'string' || body[key].length > length || key !== 'descripcion' && !body[key].trim()) fail(`${key} inválido`);
    data[key] = body[key].trim();
  }
  if (data.fecha !== undefined) {
    const parsed = /^\d{4}-\d{2}-\d{2}$/.test(data.fecha) ? new Date(`${data.fecha}T00:00:00Z`) : new Date(NaN);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0,10) !== data.fecha) fail('Fecha inválida');
  }
  if (data.hora !== undefined && !/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(data.hora)) fail('Hora inválida');
  if (data.tipo !== undefined && !['academico','institucional','cultural','deportivo','otro'].includes(data.tipo)) fail('Tipo inválido');
  if (body.publico !== undefined) {
    if (![true,false,0,1].includes(body.publico)) fail('publico debe ser booleano');
    data.publico = Number(body.publico);
  }
  if (partial && !Object.keys(data).length) fail('No hay campos para actualizar');
  return data;
}
export function eventFilters(query = {}, user) {
  const data = { limit: Number(query.limit ?? 100), offset: Number(query.offset ?? 0) };
  if (!Number.isSafeInteger(data.limit) || data.limit < 1 || data.limit > 100 || !Number.isSafeInteger(data.offset) || data.offset < 0 || data.offset > 10000000) fail('Paginación inválida');
  if (query.fecha !== undefined) {
    const checked = eventInput({ fecha: query.fecha }, true);
    data.fecha = checked.fecha;
  }
  if (query.tipo !== undefined) data.tipo = eventInput({ tipo: query.tipo }, true).tipo;
  for (const key of ['fecha_desde','fecha_hasta']) if (query[key] !== undefined) data[key] = eventInput({ fecha: query[key] }, true).fecha;
  if (data.fecha_desde && data.fecha_hasta && data.fecha_desde > data.fecha_hasta) fail('Rango de fechas inválido');
  if (query.scope !== undefined && query.scope !== 'mine') fail('Ámbito inválido');
  if (query.scope === 'mine') data.creado_por = user.id;
  return data;
}
