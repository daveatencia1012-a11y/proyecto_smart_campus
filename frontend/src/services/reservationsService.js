import { get, getAll, post, put } from './api';
import { listRecords, dateKey } from './campusService';

async function transform(raw, resources = []) {
  let resource = resources.find(row => row.id === raw.recurso_id);
  if (!resource) {
    try { resource = await get(`/api/recursos/${raw.recurso_id}`); }
    catch (error) { if (error.status !== 404) throw error; }
  }
  const [year, month, day] = dateKey(raw.fecha).split('-');
  return {
    id:raw.id, resource:resource?.nombre || `Recurso #${raw.recurso_id}`,
    type:resource?.tipo || 'Recurso histórico', date:`${day}/${month}/${year}`,
    startTime:raw.hora_inicio?.slice(0,5) || '', endTime:raw.hora_fin?.slice(0,5) || '',
    location:resource?.ubicacion || 'No disponible', status:raw.estado.toUpperCase(),
    description:raw.motivo_cancelacion || 'Reserva registrada en el campus.', usuario_id:raw.usuario_id, recurso_id:raw.recurso_id
  };
}
export async function getReservations(filters = {}) {
  const [rows, resources] = await Promise.all([listRecords('reservations', filters), getAll('/api/recursos')]);
  return Promise.all(rows.map(row => transform(row, resources)));
}
export async function getReservationById(id) { return transform(await get(`/api/reservas/${id}`)); }
export async function createReservation(body) { return transform(await post('/api/reservas', body)); }
export const updateReservation = (id, body) => put(`/api/reservas/${id}`, body);
export const cancelReservation = (id, motivo_cancelacion = null) => put(`/api/reservas/${id}/cancelar`, { motivo_cancelacion });
