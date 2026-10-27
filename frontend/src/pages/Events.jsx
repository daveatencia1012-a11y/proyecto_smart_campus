import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import Icon from "../components/Icon/Icon";
import useSession from "../hooks/useSession";
import useResource from "../hooks/useResource";
import { listRecords, saveRecord, deleteRecord, dateKey } from "../services/campusService";
import { EVENT_EDITORS, canEditEvent } from "../services/roles";

const monthNames = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
const types = ["academico", "institucional", "cultural", "deportivo", "otro"];
const typeLabels = { academico: "Académico", institucional: "Institucional", cultural: "Cultural", deportivo: "Deportivo", otro: "Otro" };
const emptyDraft = { nombre: "", descripcion: "", fecha: "", hora: "", lugar: "", tipo: "academico", publico: true };
const loadEvents = () => listRecords("events");

function todayKey() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function Events() {
  const { user, role } = useSession();
  const editor = EVENT_EDITORS.includes(role);
  const { data, loading, error, reload } = useResource(loadEvents);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("TODOS");
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const filters = editor ? ["TODOS", "PRÓXIMOS", "MIS EVENTOS"] : ["TODOS", "PRÓXIMOS"];
  const formOpen = Boolean(form);

  // Escape cierra el formulario (salvo mientras guarda).
  useEffect(() => {
    if (!formOpen) return undefined;
    const onKey = (e) => { if (e.key === "Escape" && !saving) setForm(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [formOpen, saving]);

  const filteredEvents = useMemo(() => {
    const term = search.toLowerCase().trim();
    const today = todayKey();
    return (data || []).filter((event) => {
      const text = `${event.nombre} ${event.tipo} ${event.lugar} ${event.descripcion}`.toLowerCase();
      const matchesFilter =
        filter === "TODOS" ||
        (filter === "PRÓXIMOS" && dateKey(event.fecha) >= today) ||
        (filter === "MIS EVENTOS" && event.creado_por === user?.id);
      return text.includes(term) && matchesFilter;
    });
  }, [data, search, filter, user?.id]);

  const openForm = (event = null) => {
    setMessage("");
    setForm(event
      ? { id: event.id, nombre: event.nombre, descripcion: event.descripcion || "", fecha: dateKey(event.fecha), hora: String(event.hora).slice(0, 5), lugar: event.lugar, tipo: event.tipo, publico: Boolean(event.publico) }
      : emptyDraft);
  };

  const submit = async (submitEvent) => {
    submitEvent.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const { id, ...fields } = form;
      await saveRecord("events", fields, id);
      setForm(null);
      setMessage(id ? "Evento actualizado." : "Evento publicado.");
      await reload();
    } catch (err) {
      if (!err.cancelled) setMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (event) => {
    if (!window.confirm(`¿Eliminar el evento "${event.nombre}"?`)) return;
    setMessage("");
    try {
      await deleteRecord("events", event.id);
      setMessage("Evento eliminado.");
      await reload();
    } catch (err) {
      if (!err.cancelled) setMessage(err.message);
    }
  };

  return (
    <main className="service-page events-page">
      <section className="service-page__hero">
        <div>
          <span className="service-page__eyebrow">VIDA UNIVERSITARIA</span>
          <h1>Eventos y actividades</h1>
          <p>Consulta conferencias, seminarios, talleres y actividades institucionales disponibles.</p>
        </div>
        {editor ? (
          <button className="service-page__hero-action" type="button" onClick={() => openForm()}>
            <Icon name="plus" size={18} /> Publicar evento
          </button>
        ) : (
          <Link className="service-page__hero-action" to="/calendar">
            <Icon name="calendar" size={18} /> Ver calendario
          </Link>
        )}
      </section>

      <section className="service-page__toolbar panel">
        <label className="service-page__search">
          <Icon name="search" size={24} />
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

      {message && !form && <p className="role-message" role="status">{message}</p>}

      <section className="service-page__section">
        <div className="service-page__section-heading">
          <div><span className="panel__eyebrow">AGENDA ACADÉMICA</span><h2>Eventos</h2></div>
          <span className="service-page__count">{filteredEvents.length}</span>
        </div>
        {/* DEF-10: si la carga falla se muestra solo el error, no también la lista vacía. */}
        {loading ? <p role="status">Cargando eventos…</p> : error ? (
          <div className="role-empty panel" role="alert">
            <p>{error}</p>
            <button type="button" className="button button--secondary" onClick={reload}>Reintentar</button>
          </div>
        ) : !filteredEvents.length ? <p className="role-empty panel">No hay eventos para mostrar.</p> : (
          <div className="events-page__grid">
            {filteredEvents.map((event) => {
              const key = dateKey(event.fecha);
              const [, month, day] = key.split("-");
              const upcoming = key >= todayKey();
              return (
                <article className="event-card panel" key={event.id}>
                  <div className="event-card__date"><strong>{day}</strong><span>{monthNames[Number(month) - 1]}</span></div>
                  <div className="event-card__content">
                    <div className="event-card__top">
                      <span className="event-card__type">{event.tipo}</span>
                      <span className={`event-card__badge event-card__badge--${event.publico ? "primary" : "success"}`}>
                        {!event.publico ? "Privado" : upcoming ? "Próximo" : "Finalizado"}
                      </span>
                    </div>
                    <h3>{event.nombre}</h3>
                    <p>{event.descripcion}</p>
                    <div className="event-card__meta">
                      <span><Icon name="clock" size={16} /> {String(event.hora).slice(0, 5)}</span>
                      <span><Icon name="location" size={16} /> {event.lugar}</span>
                    </div>
                    {canEditEvent(user, event) && (
                      <button className="event-card__register" type="button" onClick={() => openForm(event)}>
                        <Icon name="edit" size={15} /> Editar
                      </button>
                    )}
                    {role === "administrador" && (
                      <button className="event-card__register" type="button" onClick={() => remove(event)}>
                        <Icon name="trash" size={15} /> Eliminar
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {form && createPortal(
        <div className="role-modal-backdrop event-form-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) setForm(null); }}>
          <form className="event-form" onSubmit={submit} aria-labelledby="event-form-title">
            <header className="event-form__header">
              <span className="event-form__icon" aria-hidden="true"><Icon name="events" size={20} /></span>
              <div>
                <span className="panel__eyebrow">{form.id ? "EDITAR EVENTO" : "NUEVO EVENTO"}</span>
                <h2 id="event-form-title">{form.id ? "Editar evento" : "Publicar evento"}</h2>
                <p>Los campos con * son obligatorios.</p>
              </div>
              <button type="button" className="event-form__close" onClick={() => setForm(null)} disabled={saving} aria-label="Cerrar formulario">
                <Icon name="close" size={18} />
              </button>
            </header>

            <div className="event-form__grid">
              <label className="event-form__full">
                <span>Nombre del evento *</span>
                <input required maxLength={150} placeholder="Ej. Semana de la Ingeniería" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              </label>
              <label>
                <span>Tipo *</span>
                <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                  {types.map((type) => <option key={type} value={type}>{typeLabels[type]}</option>)}
                </select>
              </label>
              <label>
                <span>Lugar *</span>
                <input required maxLength={100} placeholder="Ej. Auditorio principal" value={form.lugar} onChange={(e) => setForm({ ...form, lugar: e.target.value })} />
              </label>
              <label>
                <span>Fecha *</span>
                <input required type="date" min={form.id ? undefined : todayKey()} value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
              </label>
              <label>
                <span>Hora *</span>
                <input required type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} />
              </label>
              <label className="event-form__full">
                <span>Descripción</span>
                <textarea rows="4" maxLength={1000} placeholder="¿De qué trata el evento y a quién va dirigido?" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
                <small className="form-helper">{form.descripcion.length}/1000 caracteres</small>
              </label>
              <label className="event-form__visibility event-form__full">
                <input type="checkbox" checked={form.publico} onChange={(e) => setForm({ ...form, publico: e.target.checked })} />
                <span className="event-form__switch" aria-hidden="true" />
                <span>
                  <strong>{form.publico ? "Evento público" : "Evento privado"}</strong>
                  <small>{form.publico ? "Visible para toda la comunidad." : "Solo lo ven tú y los administradores."}</small>
                </span>
              </label>
            </div>

            {message && <p className="event-form__error" role="alert"><Icon name="alert" size={16} /> {message}</p>}

            <footer className="event-form__actions">
              <button type="button" className="button button--secondary" onClick={() => setForm(null)} disabled={saving}>Cancelar</button>
              <button className="button button--primary" disabled={saving}>
                <Icon name={form.id ? "check" : "plus"} size={16} />
                {saving ? "Guardando…" : form.id ? "Guardar cambios" : "Publicar evento"}
              </button>
            </footer>
          </form>
        </div>,
        document.body
      )}
    </main>
  );
}

export default Events;
