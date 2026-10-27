import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon/Icon";
import RequestCard from "../components/RequestCard/RequestCard";
import { getMyRequests, createRequest, deleteRequest } from "../services/requestsService";
import useSession from "../hooks/useSession";
import useResource from '../hooks/useResource';

const filters = ["TODAS", "REGISTRADA", "EN REVISION", "ASIGNADA", "EN PROCESO", "RESUELTA", "CERRADA"];
const requestTypes = ["Solicitud de recurso", "Reserva de laboratorio", "Certificado", "Soporte académico", "Otro"];
const dependencies = ["Bienestar Universitario", "Biblioteca", "Laboratorios", "Registro Académico", "Soporte TI"];
const priorities = ["BAJA", "MEDIA", "ALTA"];
const EMPTY = [];

function Requests() {
  const { isAdmin } = useSession();
  const resource = useResource(getMyRequests);
  const requests = resource.data || EMPTY;
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("TODAS");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState({
    tipo_servicio: "Solicitud de recurso",
    dependencia: "Soporte TI",
    prioridad: "MEDIA",
    descripcion: "",
  });
  const [formError, setFormError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const { loading, error, reload:loadRequests } = resource;

  const filteredRequests = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();
    return requests.filter((request) => {
      const matchesFilter = filter === "TODAS" || request.status === filter;
      const searchable = `${request.type} ${request.description} ${request.code}`.toLowerCase();
      const matchesSearch = searchable.includes(normalizedSearch);
      return matchesFilter && matchesSearch;
    });
  }, [filter, requests, search]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;
    setFormError("");
    // DEF-09: indicar el campo que falta en lugar de no hacer nada.
    if (!form.descripcion.trim()) {
      setDescriptionError("La descripción es obligatoria.");
      return;
    }

    setSaving(true);
    try {
      await createRequest({
        tipo_servicio: form.tipo_servicio,
        dependencia: form.dependencia,
        descripcion: form.descripcion.trim(),
        prioridad: form.prioridad,
      });
      setForm({ tipo_servicio: "Solicitud de recurso", dependencia: "Soporte TI", prioridad: "MEDIA", descripcion: "" });
      setIsFormOpen(false);
      setActionMessage("Solicitud registrada correctamente.");
      loadRequests();
    } catch (err) {
      if (!err.cancelled) setFormError(err.message || "Error al crear la solicitud.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setActionMessage("");
    try {
      await deleteRequest(id);
      setActionMessage("Solicitud eliminada.");
      loadRequests();
    } catch (err) {
      if (!err.cancelled) setActionMessage(err.message || "Error al eliminar la solicitud.");
    }
  };

  const openForm = () => {
    setFormError("");
    setDescriptionError("");
    setActionMessage("");
    setIsFormOpen(true);
  };

  return (
    <main className="requests-page">
      <section className="requests-page__hero">
        <div>
          <span className="requests-page__eyebrow">GESTIÓN UNIVERSITARIA</span>
          <h1>Mis solicitudes</h1>
          <p>Registra, consulta y realiza seguimiento a tus solicitudes desde un solo lugar.</p>
        </div>
        <button className="requests-page__new-button" type="button" onClick={() => (isFormOpen ? setIsFormOpen(false) : openForm())}>
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
            <button className="requests-form__close" type="button" onClick={() => setIsFormOpen(false)} aria-label="Cerrar formulario">
              <Icon name="close" size={18} />
            </button>
          </div>
          <form className="requests-form__body" onSubmit={handleSubmit} noValidate>
            <div className="requests-form__grid">
              <label>
                <span>Tipo de solicitud</span>
                <select name="tipo_servicio" value={form.tipo_servicio} onChange={(e) => setForm((c) => ({ ...c, tipo_servicio: e.target.value }))}>
                  {requestTypes.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label>
                <span>Dependencia</span>
                <select name="dependencia" value={form.dependencia} onChange={(e) => setForm((c) => ({ ...c, dependencia: e.target.value }))}>
                  {dependencies.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label>
                <span>Prioridad</span>
                <select name="prioridad" value={form.prioridad} onChange={(e) => setForm((c) => ({ ...c, prioridad: e.target.value }))}>
                  {priorities.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label className="requests-form__full">
                <span>Descripción *</span>
                <textarea
                  name="descripcion"
                  rows="4"
                  value={form.descripcion}
                  onChange={(e) => {
                    setForm((c) => ({ ...c, descripcion: e.target.value }));
                    if (descriptionError) setDescriptionError("");
                  }}
                  placeholder="Describe el requerimiento..."
                  maxLength={500}
                  aria-invalid={Boolean(descriptionError)}
                  aria-describedby={descriptionError ? "descripcion-error" : undefined}
                />
                {descriptionError && <small id="descripcion-error" className="field-error" role="alert">{descriptionError}</small>}
                <small className="form-helper">{form.descripcion.length}/500 caracteres</small>
              </label>
            </div>
            {formError && <p className="requests-form__error" role="alert">{formError}</p>}
            <div className="requests-form__actions">
              <button className="requests-form__cancel" type="button" onClick={() => setIsFormOpen(false)} disabled={saving}>Cancelar</button>
              <button className="requests-form__submit" type="submit" disabled={saving}>{saving ? "Registrando…" : "Registrar solicitud"}</button>
            </div>
          </form>
        </section>
      )}

      {actionMessage && <p className="role-message" role="status">{actionMessage}</p>}

      <section className="requests-page__toolbar panel">
        <div className="requests-page__search">
          <Icon name="search" size={18} />
          <input type="search" placeholder="Buscar por tipo, descripción o número..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Buscar solicitudes" />
        </div>
        <div className="requests-page__filters" aria-label="Filtrar solicitudes">
          {filters.map((item) => (
            <button key={item} type="button" className={filter === item ? "requests-page__filter requests-page__filter--active" : "requests-page__filter"} onClick={() => setFilter(item)}>
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

        {loading ? (
          <div className="requests-page__empty panel">
            <p>Cargando solicitudes...</p>
          </div>
        ) : error ? (
          <div className="requests-page__empty panel" role="alert">
            <p>{error}</p>
            <button type="button" onClick={loadRequests}>Reintentar</button>
          </div>
        ) : filteredRequests.length > 0 ? (
          <div className="requests-page__list">
            {filteredRequests.map((request) => (
              <RequestCard key={request.id} request={request} onDelete={isAdmin ? handleDelete : undefined} />
            ))}
          </div>
        ) : (
          <div className="requests-page__empty panel">
            <span className="requests-page__empty-icon"><Icon name="search" size={24} /></span>
            <h3>No encontramos solicitudes</h3>
            <p>Prueba con otro filtro o registra una nueva solicitud.</p>
            <Link to="/requests" onClick={openForm}>Crear solicitud</Link>
          </div>
        )}
      </section>
    </main>
  );
}

export default Requests;
