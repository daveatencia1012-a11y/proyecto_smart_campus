import { useMemo, useState } from "react";
import { notifications as initialNotifications } from "../data/mockData";
import useLocalStorage from "../hooks/useLocalStorage";

const filters = ["TODAS", "NO LEÍDAS", "LEÍDAS"];

function Notifications() {
  const [notifications, setNotifications] = useLocalStorage("uajs_notifications", initialNotifications);
  const [filter, setFilter] = useState("TODAS");

  const filtered = useMemo(() => notifications.filter((item) =>
    filter === "TODAS" || (filter === "NO LEÍDAS" && !item.read) || (filter === "LEÍDAS" && item.read)
  ), [notifications, filter]);

  const unread = notifications.filter((item) => !item.read).length;

  const markRead = (id) => setNotifications((current) => current.map((item) => item.id === id ? { ...item, read: true } : item));
  const markAll = () => setNotifications((current) => current.map((item) => ({ ...item, read: true })));

  return (
    <main className="service-page notifications-page">
      <section className="service-page__hero">
        <div>
          <span className="service-page__eyebrow">CENTRO DE COMUNICACIONES</span>
          <h1>Notificaciones</h1>
          <p>Consulta cambios de estado, confirmaciones, alertas y comunicaciones relevantes para tu experiencia universitaria.</p>
        </div>
        <button className="service-page__hero-action" type="button" onClick={markAll}>✓ Marcar todas como leídas</button>
      </section>

      <section className="notifications-page__summary">
        <article className="notification-summary panel"><span>🔔</span><div><strong>{unread}</strong><p>sin leer</p></div></article>
        <article className="notification-summary panel"><span>✓</span><div><strong>{notifications.length}</strong><p>notificaciones</p></div></article>
        <article className="notification-summary panel"><span>⚡</span><div><strong>24h</strong><p>actividad reciente</p></div></article>
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

      <section className="service-page__section">
        <div className="service-page__section-heading"><div><span className="panel__eyebrow">ACTIVIDAD</span><h2>Recientes</h2></div><span className="service-page__count">{filtered.length}</span></div>
        <div className="notifications-page__list">
          {filtered.map((item) => (
            <article className={`notification-card panel ${item.read ? "" : "notification-card--unread"}`} key={item.id}>
              <span className={`notification-card__icon notification-card__icon--${item.type}`}>{item.icon}</span>
              <div className="notification-card__content">
                <div className="notification-card__top"><h3>{item.title}</h3>{!item.read && <span className="notification-card__dot" />}</div>
                <p>{item.message}</p>
                <small>{item.time}</small>
              </div>
              {!item.read && <button type="button" onClick={() => markRead(item.id)}>Marcar leída</button>}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default Notifications;
