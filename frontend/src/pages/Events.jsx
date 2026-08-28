import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { events as initialEvents } from "../data/mockData";
import useLocalStorage from "../hooks/useLocalStorage";

const filters = ["TODOS", "PRÓXIMOS", "INSCRITOS"];

function Events() {
  const [events] = useLocalStorage("uajs_events", initialEvents);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("TODOS");

  const filteredEvents = useMemo(() => {
    const term = search.toLowerCase().trim();
    return events.filter((event) => {
      const text = `${event.title} ${event.type} ${event.location} ${event.description}`.toLowerCase();
      const matchesSearch = text.includes(term);
      const matchesFilter =
        filter === "TODOS" ||
        (filter === "PRÓXIMOS" && event.status !== "FINALIZADO") ||
        (filter === "INSCRITOS" && event.inscribed);
      return matchesSearch && matchesFilter;
    });
  }, [events, search, filter]);

  return (
    <main className="service-page events-page">
      <section className="service-page__hero">
        <div>
          <span className="service-page__eyebrow">VIDA UNIVERSITARIA</span>
          <h1>Eventos y actividades</h1>
          <p>Consulta conferencias, seminarios, talleres y actividades institucionales disponibles.</p>
        </div>
        <Link className="service-page__hero-action" to="/events">
          <span>◈</span> Explorar agenda
        </Link>
      </section>

      <section className="service-page__toolbar panel">
        <label className="service-page__search">
          <span>⌕</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar eventos..." />
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
          <div><span className="panel__eyebrow">AGENDA ACADÉMICA</span><h2>Próximos eventos</h2></div>
          <span className="service-page__count">{filteredEvents.length}</span>
        </div>
        <div className="events-page__grid">
          {filteredEvents.map((event) => (
            <article className="event-card panel" key={event.id}>
              <div className="event-card__date"><strong>{event.day}</strong><span>{event.month}</span></div>
              <div className="event-card__content">
                <div className="event-card__top">
                  <span className="event-card__type">{event.type}</span>
                  <span className={`event-card__badge event-card__badge--${event.inscribed ? "success" : "primary"}`}>
                    {event.inscribed ? "Inscrito" : "Próximo"}
                  </span>
                </div>
                <h3>{event.title}</h3>
                <p>{event.description}</p>
                <div className="event-card__meta">
                  <span>◷ {event.time}</span>
                  <span>⌖ {event.location}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default Events;
