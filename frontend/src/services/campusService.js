import { get, getAll, post, put, del } from './api';
import { getUser } from './session';

export function query(filters = {}) {
  return new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== undefined && value !== '')).toString();
}
const endpoints = { requests: 'solicitudes', pqrs: 'pqrs', resources: 'recursos', reservations: 'reservas', events: 'eventos', services: 'servicios' };
export const dateKey = value => String(value || '').split('T')[0];

export async function listRecords(kind, { operational = false, mine = false, ...filters } = {}) {
  if (kind === 'users') {
    const all = [];
    for (let page = 1; page <= 50; page++) {
      const data = await get(`/api/usuarios?${query({ activo: 'todos', ...filters, page, limit: 100 })}`);
      all.push(...data.usuarios);
      if (page >= data.paginacion.totalPaginas) return all;
    }
    throw new Error('Hay demasiados usuarios; aplica un filtro.');
  }
  let path = `/api/${endpoints[kind]}`;
  if (['requests', 'pqrs'].includes(kind) && !operational) path += '/mis';
  if (kind === 'reservations' && !operational) filters.usuario_id = getUser()?.id;
  if (kind === 'events' && mine) filters.scope = 'mine';
  if (kind === 'services' && operational) filters.incluir_inactivos = true;
  return getAll(`${path}?${query(filters)}`);
}
export function saveRecord(kind, data, id) {
  if (kind === 'users' && !id) return post('/api/auth/register', data);
  const path = `/api/${kind === 'users' ? 'usuarios' : endpoints[kind]}`;
  return id ? put(`${path}/${id}`, data) : post(path, data);
}
export function deleteRecord(kind, id) {
  return del(`/api/${kind === 'users' ? 'usuarios' : endpoints[kind]}/${id}`);
}
export const transitionRequest = (id, estado) => put(`/api/solicitudes/${id}/estado`, { estado });
export const cancelReservation = id => put(`/api/reservas/${id}/cancelar`, { motivo_cancelacion: 'Cancelada desde el portal' });
export const reactivateUser = id => put(`/api/usuarios/${id}`, { activo: true });
export const listResponsables = () => get('/api/usuarios/responsables');
export const configuration = () => get('/api/configuracion');
export const saveConfiguration = data => put('/api/configuracion', data);
export const listNotifications = () => getAll('/api/notificaciones', data => data.notificaciones);
export const markNotification = id => put(`/api/notificaciones/${id}/leer`, {});
export const markAllNotifications = () => put('/api/notificaciones/marcar-todas', {});
export const removeNotification = id => del(`/api/notificaciones/${id}`);

export function exportCSV(name, rows, columns) {
  const cell = value => {
    let text = String(value ?? '');
    if (/^[\s]*[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  const content = [columns.map(column => column.label), ...rows.map(row => columns.map(column => row[column.key]))].map(row => row.map(cell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([`\ufeff${content}`], { type: 'text/csv;charset=utf-8;' }));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = `${name}.csv`; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
