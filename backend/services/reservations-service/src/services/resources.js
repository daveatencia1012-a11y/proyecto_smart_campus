import http from '../config/http.js';
import { calendarError } from './calendar.js';

export async function checkResource(id, authorization, requireAvailable = true) {
  const { data } = await http.get(
    `${process.env.RESOURCES_SERVICE_URL || 'http://resources-service:3204'}/api/recursos/${id}`,
    { headers: { Authorization: authorization } }
  );
  if (!data || data.id !== id) throw calendarError(404, 'Recurso no encontrado');
  if (requireAvailable && (data.estado !== 'disponible' || ![1, true].includes(data.disponible))) {
    throw calendarError(409, 'El recurso no está disponible');
  }
  return data;
}
