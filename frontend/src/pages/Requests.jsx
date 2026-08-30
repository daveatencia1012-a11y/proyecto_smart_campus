import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon/Icon";

import { requests as initialRequests } from "../data/mockData";
import RequestCard from "../components/RequestCard/RequestCard";
import useLocalStorage from "../hooks/useLocalStorage";

const filters = ["TODAS", "REGISTRADA", "EN REVISIÓN", "ASIGNADA", "EN PROCESO", "RESUELTA", "CERRADA"];
const requestTypes = ["Solicitud de recurso", "Reserva de laboratorio", "Certificado", "Soporte académico", "Otro"];
const dependencies = ["Bienestar Universitario", "Biblioteca", "Laboratorios", "Registro Académico", "Soporte TI"];
const priorities = ["BAJA", "MEDIA", "ALTA"];

function Requests() {
  const [requests, setRequests] = useLocalStorage(
    "uajs_requests",
    initialRequests
  );
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("TODAS");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState({
    type: "Solicitud de recurso",
    dependency: "Soporte TI",
    priority: "MEDIA",
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

    if (!form.type || !form.dependency || !form.description.trim()) return;

    const newRequest = {
      id: Date.now(),
      type: form.type,
      dependency: form.dependency,
      priority: form.priority,
      date: new Date().toLocaleDateString("es-CO"),
      status: "REGISTRADA",
      responsible: "Pendiente de asignación",
      description: form.description.trim(),
    };

    setRequests((current) => [newRequest, ...current]);
    setForm({ type: "Solicitud de recurso", dependency: "Soporte TI", priority: "MEDIA", description: "" });
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
          <Icon name="plus" size={18} />
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
              <Icon name="close" size={18} />
            </button>
          </div>

          <form className="requests-form__body" onSubmit={handleSubmit}>
            <div className="requests-form__grid">
              <label>
                <span>Tipo de solicitud</span>
                <select name="type" value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}>
                  {requestTypes.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label>
                <span>Dependencia</span>
                <select name="dependency" value={form.dependency} onChange={(event) => setForm((current) => ({ ...current, dependency: event.target.value }))}>
                  {dependencies.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label>
                <span>Prioridad</span>
                <select name="priority" value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}>
                  {priorities.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label className="requests-form__full">
                <span>Descripción</span>
                <textarea
                  name="description"
                  rows="4"
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Describe el requerimiento, contexto y necesidad..."
                  maxLength={500}
                />
                <small className="form-helper">{form.description.length}/500 caracteres</small>
              </label>
            </div>

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
          <Icon name="search" size={18} />
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
            <span className="requests-page__empty-icon"><Icon name="search" size={24} /></span>
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
