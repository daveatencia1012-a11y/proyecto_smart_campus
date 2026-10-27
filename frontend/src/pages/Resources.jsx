import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon/Icon";
import useSession from "../hooks/useSession";
import useResource from "../hooks/useResource";
import { listRecords } from "../services/campusService";
import { STAFF } from "../services/roles";

const filters = ["TODOS", "DISPONIBLE", "MANTENIMIENTO", "FUERA DE SERVICIO"];
const statusLabel = { disponible: "DISPONIBLE", en_mantenimiento: "MANTENIMIENTO", fuera_servicio: "FUERA DE SERVICIO" };
const statusClass = { disponible: "available", en_mantenimiento: "maintenance", fuera_servicio: "busy" };
const loadResources = () => listRecords("resources");

function iconFor(type = "") {
  const value = type.toLowerCase();
  if (value.includes("lab")) return "flask";
  if (value.includes("auditorio")) return "presentation";
  if (value.includes("equipo") || value.includes("computador")) return "monitor";
  if (value.includes("sala") || value.includes("aula") || value.includes("espacio")) return "building";
  return "resources";
}

function Resources() {
  const { role } = useSession();
  const { data, loading, error, reload } = useResource(loadResources);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("TODOS");

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    return (data || []).filter((resource) => {
      const text = `${resource.codigo} ${resource.nombre} ${resource.tipo} ${resource.ubicacion}`.toLowerCase();
      return text.includes(term) && (filter === "TODOS" || statusLabel[resource.estado] === filter);
    });
  }, [data, search, filter]);

  return (
    <main className="service-page resources-page">
      <section className="service-page__hero">
        <div>
          <span className="service-page__eyebrow">INVENTARIO UNIVERSITARIO</span>
          <h1>Recursos disponibles</h1>
          <p>Consulta equipos, salas, laboratorios y espacios académicos registrados en Smart Campus.</p>
        </div>
        {STAFF.includes(role) ? (
          <Link className="service-page__hero-action" to="/gestion/recursos"><Icon name="edit" size={18} /> Administrar recursos</Link>
        ) : (
          <Link className="service-page__hero-action" to="/reservations"><Icon name="plus" size={18} /> Reservar recurso</Link>
        )}
      </section>

      <section className="service-page__toolbar panel">
        <label className="service-page__search">
          <Icon name="search" size={24} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre, código o ubicación..." />
        </label>
        <div className="service-page__filters">
          {filters.map((item) => (
            <button key={item} type="button"
              className={filter === item ? "service-page__filter service-page__filter--active" : "service-page__filter"}
              onClick={() => setFilter(item)}>
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="service-page__section">
        <div className="service-page__section-heading">
          <div><span className="panel__eyebrow">CATÁLOGO</span><h2>Recursos universitarios</h2></div>
          <span className="service-page__count">{filtered.length}</span>
        </div>
        {loading ? <p role="status">Cargando recursos…</p> : error ? (
          <div className="role-empty panel" role="alert">
            <p>{error}</p>
            <button type="button" className="button button--secondary" onClick={reload}>Reintentar</button>
          </div>
        ) : !filtered.length ? <p className="role-empty panel">No hay recursos para mostrar.</p> : (
          <div className="resources-page__grid">
            {filtered.map((resource) => {
              const reservable = resource.estado === "disponible" && Boolean(resource.disponible);
              return (
                <article className="resource-card panel" key={resource.id}>
                  <div className="resource-card__icon"><Icon name={iconFor(resource.tipo)} size={22} /></div>
                  <div className="resource-card__body">
                    <div className="resource-card__top">
                      <span className="resource-card__code">{resource.codigo}</span>
                      <span className={`resource-card__status resource-card__status--${statusClass[resource.estado] || "busy"}`}>
                        {statusLabel[resource.estado] || resource.estado}
                      </span>
                    </div>
                    <h3>{resource.nombre}</h3>
                    <p>{resource.tipo} · {resource.ubicacion}</p>
                    <div className="resource-card__footer">
                      <span>{resource.descripcion}</span>
                      {reservable ? <Link to="/reservations">Reservar <Icon name="arrowRight" size={16} /></Link> : <span className="resource-card__disabled">No disponible</span>}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default Resources;
