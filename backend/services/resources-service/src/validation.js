export const fail = message => { throw Object.assign(new Error(message), { statusCode: 400, status: 400 }); };
export function id(value) {
  if (!['string','number'].includes(typeof value) || !/^\d+$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value) <= 0) fail('Identificador inválido');
  return Number(value);
}
export function paging(query) {
  const limit = Number(query.limit ?? 100), offset = Number(query.offset ?? 0);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100 || !Number.isSafeInteger(offset) || offset < 0 || offset > 10000000) fail('Paginación inválida');
  return { limit, offset };
}
export function fields(body, definition, partial = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !Object.hasOwn(definition, key))) fail('Campos no permitidos');
  const result = {};
  for (const [key, max] of Object.entries(definition)) {
    if (body[key] === undefined) { if (!partial && key !== 'descripcion') fail(`Falta ${key}`); continue; }
    if (typeof body[key] !== 'string' || (key !== 'descripcion' && !body[key].trim()) || body[key].length > max) fail(`${key} inválido`);
    result[key] = body[key].trim();
  }
  if (!Object.keys(result).length) fail('No hay campos para guardar');
  return result;
}
export function recurso(body, partial = false, current = {}) {
  const { disponible, ...rest } = body || {};
  const data = partial && disponible !== undefined && !Object.keys(rest).length ? {} : fields(rest, { codigo:50, nombre:100, tipo:50, ubicacion:100, estado:30, descripcion:10000 }, partial);
  const estado = data.estado ?? current.estado;
  if (!['disponible','en_mantenimiento','fuera_servicio'].includes(estado)) fail('Estado de recurso inválido');
  if (disponible !== undefined) {
    if (![true,false,0,1].includes(disponible)) fail('disponible debe ser booleano');
    if (disponible && estado !== 'disponible') fail('Un recurso no operativo no puede estar disponible');
    data.disponible = Boolean(disponible);
  } else if (!partial || data.estado && data.estado !== 'disponible') data.disponible = estado === 'disponible';
  return data;
}
