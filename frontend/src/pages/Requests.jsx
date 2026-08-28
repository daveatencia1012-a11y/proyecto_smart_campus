import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { requests as initialRequests } from "../data/mockData";
import RequestCard from "../components/RequestCard/RequestCard";
import useLocalStorage from "../hooks/useLocalStorage";

const filters = ["TODAS", "EN PROCESO", "EN REVISIÓN", "RESUELTA"];

function Requests() {
  const [requests, setRequests] = useLocalStorage(
    "uajs_requests",
    initialRequests
  );
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("TODAS");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState({
    type: "",
    description: "",
  });

  const filteredRequests = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();

    return requests.filter((request) => {
      const matchesFilter =
        filter === "TODAS" || request.status === filter;
      const searchable = `${request.type} ${request.description} ${request.id}`.toLowerCase();
      const matchesSearch = searchable.includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [filter, requests, search]);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.type.trim() || !form.description.trim()) return;

    const newRequest = {
      id: Date.now(),
      type: form.type.trim(),
      date: new Date().toLocaleDateString("es-CO"),
      status: "EN REVISIÓN",
      description: form.description.trim(),
    };

    setRequests((current) => [newRequest, ...current]);
    setForm({ type: "", description: "" });
    setIsFormOpen(false);
  };

  const handleDelete = (id) => {
    setRequests((current) => current.filter((request) => request.id !== id));
  };

  return (
    <main className="requests-page">
      <section className="requests-page__hero">
        <div>
          <span className="requests-page__eyebrow">GESTIÓN UNIVERSITARIA</span>
          <h1>Mis solicitudes</h1>
          <p>
            Registra, consulta y realiza seguimiento a tus solicitudes desde un solo lugar.
          </p>
        </div>

        <button
          className="requests-page__new-button"
          type="button"
          onClick={() => setIsFormOpen((open) => !open)}
        >
          <span aria-hidden="true">＋</span>
          Nueva solicitud
        </button>
      </section>

      {isFormOpen && (
        <section className="requests-form panel">
          <div className="panel__header">
            <div>
              <span className="panel__eyebrow">NUEVA SOLICITUD</span>
              <h2>Cuéntanos qué necesitas</h2>
            </div>
            <button
              className="requests-form__close"
              type="button"
              onClick={() => setIsFormOpen(false)}
              aria-label="Cerrar formulario"
            >
              ×
            </button>
          </div>

          <form className="requests-form__body" onSubmit={handleSubmit}>
            <label>
              <span>Tipo de solicitud</span>
              <input
                name="type"
                value={form.type}
                onChange={(event) =>
                  setForm((current) => ({ ...current, type: event.target.value }))
                }
                placeholder="Ej. Reserva de laboratorio"
              />
            </label>

            <label>
              <span>Descripción</span>
              <textarea
                name="description"
                rows="4"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Describe brevemente tu solicitud..."
              />
            </label>

            <div className="requests-form__actions">
              <button
                className="requests-form__cancel"
                type="button"
                onClick={() => setIsFormOpen(false)}
              >
                Cancelar
              </button>
              <button className="requests-form__submit" type="submit">
                Registrar solicitud
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="requests-page__toolbar panel">
        <div className="requests-page__search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            placeholder="Buscar por tipo, descripción o número..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Buscar solicitudes"
          />
        </div>

        <div className="requests-page__filters" aria-label="Filtrar solicitudes">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              className={filter === item ? "requests-page__filter requests-page__filter--active" : "requests-page__filter"}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="requests-page__content">
        <div className="requests-page__section-heading">
          <div>
            <span className="panel__eyebrow">SEGUIMIENTO</span>
            <h2>Solicitudes registradas</h2>
          </div>
          <span className="requests-page__count">{filteredRequests.length}</span>
        </div>

        {filteredRequests.length > 0 ? (
          <div className="requests-page__list">
            {filteredRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="requests-page__empty panel">
            <span className="requests-page__empty-icon">⌕</span>
            <h3>No encontramos solicitudes</h3>
            <p>Prueba con otro filtro o registra una nueva solicitud.</p>
            <Link to="/requests" onClick={() => setIsFormOpen(true)}>
              Crear solicitud
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}

export default Requests;
