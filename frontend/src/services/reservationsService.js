import { get, post, put } from "./api";

let resourcesCache = null;

async function loadResources() {
  if (resourcesCache) return resourcesCache;
  try {
    const data = await get("/api/recursos");
    resourcesCache = Array.isArray(data) ? data : [];
  } catch {
    resourcesCache = [];
  }
  return resourcesCache;
}

function formatReservationDate(dateString) {
  if (!dateString) return "";
  const clean = dateString.split("T")[0];
  const parts = clean.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateString;
}

function capitalizeStatus(status) {
  if (!status) return "PENDIENTE";
  const map = {
    pendiente: "PENDIENTE",
    confirmada: "CONFIRMADA",
    cancelada: "CANCELADA",
  };
  return map[status.toLowerCase()] || status.toUpperCase();
}

async function transformReservation(raw) {
  const resources = await loadResources();
  const resource = resources.find((r) => r.id === raw.recurso_id);

  return {
    id: raw.id,
    resource: resource ? resource.nombre : `Recurso #${raw.recurso_id}`,
    type: resource ? resource.tipo : "No definido",
    date: formatReservationDate(raw.fecha),
    startTime: raw.hora_inicio ? raw.hora_inicio.substring(0, 5) : "",
    endTime: raw.hora_fin ? raw.hora_fin.substring(0, 5) : "",
    location: resource ? resource.ubicacion : "Sin ubicación",
    status: capitalizeStatus(raw.estado),
    description: raw.motivo_cancelacion || "Reserva registrada desde Smart Campus.",
    usuario_id: raw.usuario_id,
    recurso_id: raw.recurso_id,
  };
}

export async function getReservations(filters = {}) {
  const params = new URLSearchParams();
  if (filters.estado) params.append("estado", filters.estado);
  if (filters.usuario_id) params.append("usuario_id", filters.usuario_id);
  const query = params.toString();
  const data = await get(`/api/reservas${query ? `?${query}` : ""}`);

  if (!Array.isArray(data)) return [];

  const transformed = await Promise.all(data.map(transformReservation));
  return transformed;
}

export async function getReservationById(id) {
  const data = await get(`/api/reservas/${id}`);
  return transformReservation(data);
}

export async function createReservation({ recurso_id, fecha, hora_inicio, hora_fin }) {
  const data = await post("/api/reservas", { recurso_id, fecha, hora_inicio, hora_fin });
  return transformReservation(data);
}

export async function updateReservation(id, data) {
  return put(`/api/reservas/${id}`, data);
}

export async function cancelReservation(id, motivo_cancelacion = null) {
  return put(`/api/reservas/${id}/cancelar`, { motivo_cancelacion });
}