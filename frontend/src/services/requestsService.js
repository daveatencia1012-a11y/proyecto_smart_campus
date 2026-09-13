import { get, post, put, del } from "./api";

function formatRequestDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function transformRequest(raw) {
  return {
    id: raw.id,
    type: raw.tipo_servicio || "Solicitud",
    dependency: raw.dependencia || "",
    description: raw.descripcion || "",
    priority: (raw.prioridad || "MEDIA").toUpperCase(),
    status: (raw.estado || "REGISTRADA").replaceAll("_", " "),
    date: formatRequestDate(raw.fecha_creacion),
    responsible: raw.responsable_id ? `Responsable #${raw.responsable_id}` : "Pendiente de asignación",
    usuario_id: raw.usuario_id,
  };
}

export async function getRequests(filters = {}) {
  const params = new URLSearchParams();
  if (filters.estado) params.append("estado", filters.estado);
  if (filters.usuario_id) params.append("usuario_id", filters.usuario_id);
  const query = params.toString();
  const data = await get(`/api/solicitudes${query ? `?${query}` : ""}`);
  return Array.isArray(data) ? data.map(transformRequest) : [];
}

export async function getRequestById(id) {
  const data = await get(`/api/solicitudes/${id}`);
  return transformRequest(data);
}

export async function createRequest({ tipo_servicio, dependencia, descripcion, prioridad }) {
  const data = await post("/api/solicitudes", { tipo_servicio, dependencia, descripcion, prioridad });
  return transformRequest(data);
}

export async function updateRequest(id, data) {
  return put(`/api/solicitudes/${id}`, data);
}

export async function updateRequestStatus(id, estado) {
  return put(`/api/solicitudes/${id}/estado`, { estado });
}

export async function deleteRequest(id) {
  return del(`/api/solicitudes/${id}`);
}