import { useMemo, useState } from "react";
import Icon from "../components/Icon/Icon";
import useResource from "../hooks/useResource";
import { listNotifications, markNotification, markAllNotifications, removeNotification } from "../services/campusService";

const filters = ["TODAS", "NO LEÍDAS", "LEÍDAS"];
const iconByType = {
  solicitud: ["requests", "info"],
  reserva: ["reservations", "success"],
  evento: ["events", "info"],
  pqrs: ["pqrs", "warning"],
  sistema: ["alert", "warning"],
};

function Notifications() {
  const { data, loading, error, reload } = useResource(listNotifications);
  const [filter, setFilter] = useState("TODAS");
  const [message, setMessage] = useState("");
  const [now] = useState(() => Date.now());
  const notifications = useMemo(() => data || [], [data]);

  const filtered = useMemo(() => notifications.filter((item) =>
    filter === "TODAS" || (filter === "NO LEÍDAS" && !item.leida) || (filter === "LEÍDAS" && item.leida)
  ), [notifications, filter]);

  const unread = notifications.filter((item) => !item.leida).length;
  const lastDay = notifications.filter((item) => now - new Date(item.fecha_creacion).getTime() < 24 * 60 * 60 * 1000).length;

  const act = async (fn) => {
    setMessage("");
    try {
      await fn();
      await reload();
    } catch (err) {
      if (!err.cancelled) setMessage(err.message);
    }
  };

  return (
    <main className="service-page notifications-page">
      <section className="service-page__hero">
        <div>
          <span className="service-page__eyebrow">CENTRO DE COMUNICACIONES</span>
          <h1>Notificaciones</h1>
          <p>Consulta cambios de estado, confirmaciones, alertas y comunicaciones relevantes para tu experiencia universitaria.</p>
        </div>
        <button className="service-page__hero-action" type="button" disabled={!unread} onClick={() => act(markAllNotifications)}>
          <Icon name="check" size={17} /> Marcar todas como leídas
        </button>
      </section>

      <section className="notifications-page__summary">
        <article className="notification-summary panel"><Icon name="notifications" size={22} /><div><strong>{unread}</strong><p>sin leer</p></div></article>
        <article className="notification-summary panel"><Icon name="check" size={17} /><div><strong>{notifications.length}</strong><p>notificaciones</p></div></article>
        <article className="notification-summary panel"><Icon name="spark" size={22} /><div><strong>{lastDay}</strong><p>en las últimas 24h</p></div></article>
      </section>

      <section className="service-page__toolbar panel">
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

      {(error || message) && <p className="role-message" role="status">{error || message}</p>}

      <section className="service-page__section">
        <div className="service-page__section-heading"><div><span className="panel__eyebrow">ACTIVIDAD</span><h2>Recientes</h2></div><span className="service-page__count">{filtered.length}</span></div>
        {loading ? <p>Cargando notificaciones…</p> : !filtered.length ? <p className="role-empty panel">No hay notificaciones.</p> : (
          <div className="notifications-page__list">
            {filtered.map((item) => {
              const [icon, tone] = iconByType[item.tipo] || ["notifications", "info"];
              return (
                <article className={`notification-card panel ${item.leida ? "" : "notification-card--unread"}`} key={item.id}>
                  <span className={`notification-card__icon notification-card__icon--${tone}`}><Icon name={icon} size={19} /></span>
                  <div className="notification-card__content">
                    <div className="notification-card__top"><h3>{item.titulo}</h3>{!item.leida && <span className="notification-card__dot" />}</div>
                    <p>{item.mensaje}</p>
                    <small>{new Date(item.fecha_creacion).toLocaleString("es-CO")}</small>
                  </div>
                  {!item.leida && <button type="button" onClick={() => act(() => markNotification(item.id))}>Marcar leída</button>}
                  <button type="button" onClick={() => act(() => removeNotification(item.id))}>Eliminar</button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default Notifications;
