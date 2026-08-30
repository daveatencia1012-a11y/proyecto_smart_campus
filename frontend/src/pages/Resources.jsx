import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { resources as initialResources } from "../data/mockData";
import useLocalStorage from "../hooks/useLocalStorage";
import Icon from "../components/Icon/Icon";

const filters = ["TODOS", "DISPONIBLE", "EN USO", "MANTENIMIENTO"];

function Resources() {
  const [resources] = useLocalStorage("uajs_resources", initialResources);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("TODOS");

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    return resources.filter((resource) => {
      const text = `${resource.code} ${resource.name} ${resource.type} ${resource.location}`.toLowerCase();
      return text.includes(term) && (filter === "TODOS" || resource.status === filter);
    });
  }, [resources, search, filter]);

  return (
    <main className="service-page resources-page">
      <section className="service-page__hero">
        <div>
          <span className="service-page__eyebrow">INVENTARIO UNIVERSITARIO</span>
          <h1>Recursos disponibles</h1>
          <p>Consulta equipos, salas, laboratorios y espacios académicos registrados en Smart Campus.</p>
        </div>
        <Link className="service-page__hero-action" to="/reservations"><Icon name="plus" size={18} /> Reservar recurso</Link>
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
        <div className="resources-page__grid">
          {filtered.map((resource) => (
            <article className="resource-card panel" key={resource.id}>
              <div className="resource-card__icon"><Icon name={resource.icon} size={22} /></div>
              <div className="resource-card__body">
                <div className="resource-card__top">
                  <span className="resource-card__code">{resource.code}</span>
                  <span className={`resource-card__status resource-card__status--${resource.status === "DISPONIBLE" ? "available" : resource.status === "EN USO" ? "busy" : "maintenance"}`}>
                    {resource.status}
                  </span>
                </div>
                <h3>{resource.name}</h3>
                <p>{resource.type} · {resource.location}</p>
                <div className="resource-card__footer">
                  <span>{resource.description}</span>
                  {resource.status === "DISPONIBLE" ? <Link to="/reservations">Reservar <Icon name="arrowRight" size={16} /></Link> : <span className="resource-card__disabled">No disponible</span>}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default Resources;
