import { get } from "./api";

function transformResource(raw) {
  return {
    id: raw.id,
    code: raw.codigo || "",
    name: raw.nombre || "",
    type: raw.tipo || "",
    location: raw.ubicacion || "",
    status: raw.estado === "disponible" ? "DISPONIBLE"
      : raw.estado === "en_mantenimiento" ? "MANTENIMIENTO"
      : "FUERA DE SERVICIO",
    available: raw.disponible === 1 || raw.disponible === true,
    description: raw.descripcion || "",
  };
}

export async function getResources(filters = {}) {
  const params = new URLSearchParams();
  if (filters.estado) params.append("estado", filters.estado);
  if (filters.disponible !== undefined) params.append("disponible", filters.disponible);
  const query = params.toString();
  const data = await get(`/api/recursos${query ? `?${query}` : ""}`);
  return Array.isArray(data) ? data.map(transformResource) : [];
}

export async function getResourceById(id) {
  const data = await get(`/api/recursos/${id}`);
  return transformResource(data);
}