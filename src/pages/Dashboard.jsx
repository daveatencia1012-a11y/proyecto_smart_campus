import { useMemo, useState } from "react";
import Icon from "../components/Icon/Icon";

import { services, requests as initialRequests, reservations as initialReservations, notifications as initialNotifications, events as initialEvents } from "../data/mockData";

import ServiceCard from "../components/ServiceCard/ServiceCard";
import StatCard from "../components/StatCard/StatCard";
import RequestCard from "../components/RequestCard/RequestCard";
import useLocalStorage from "../hooks/useLocalStorage";

function Dashboard() {
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("Este mes");
  const [requests] = useLocalStorage("uajs_requests", initialRequests);
  const [reservations] = useLocalStorage("uajs_reservations", initialReservations);
  const [notifications] = useLocalStorage("uajs_notifications", initialNotifications);
  const [events] = useLocalStorage("uajs_events", initialEvents);

  const filteredServices = useMemo(
    () =>
      services.filter((service) =>
        `${service.name} ${service.description}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [search]
  );

  const stats = {
    requests: requests.length,
    reservations: reservations.filter((item) => item.status !== "CANCELADA").length,
    notifications: notifications.filter((item) => !item.read).length,
    events: events.filter((item) => item.status !== "FINALIZADO").length,
  };

  const activityTotal = stats.requests + stats.reservations + stats.events;
  const completionPercentage = Math.round((requests.filter((item) => item.status === "RESUELTA" || item.status === "CERRADA").length / Math.max(stats.requests, 1)) * 100);

  return (
    <main className="dashboard">
      <section className="dashboard__hero">
        <div className="dashboard__hero-copy">
          <span className="dashboard__eyebrow">
            Panel principal
          </span>

          <h1>Tu campus, más simple.</h1>

          <p>
            Gestiona tus servicios universitarios, solicitudes y
            reservas desde un solo lugar.
          </p>
        </div>

        <div className="dashboard__periods">
          {["Hoy", "Esta semana", "Este mes", "Reportes"].map(
            (item) => (
              <button
                key={item}
                type="button"
                className={
                  period === item
                    ? "dashboard__period dashboard__period--active"
                    : "dashboard__period"
                }
                onClick={() => setPeriod(item)}
              >
                {item}
              </button>
            )
          )}
        </div>
      </section>

      <section className="dashboard__toolbar">
        <div>
          <span className="dashboard__toolbar-label">
            RESUMEN
          </span>

          <h2>
            Buenos días, Ismael <Icon name="spark" size={18} />
          </h2>
        </div>

        <label className="dashboard__search">
          <Icon name="search" size={18} />

          <input
            type="search"
            placeholder="Buscar un servicio..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Buscar un servicio"
          />
        </label>
      </section>

      <section className="dashboard__stats">
        <StatCard
          title="Solicitudes"
          value={stats.requests}
          icon="requests"
          trend="+12%"
          detail="este mes"
        />

        <StatCard
          title="Reservas"
          value={stats.reservations}
          icon="reservations"
          trend="+8%"
          detail="este mes"
        />

        <StatCard
          title="Notificaciones"
          value={stats.notifications}
          icon="notifications"
          trend="3 nuevas"
          detail="sin leer"
        />

        <StatCard
          title="Eventos"
          value={stats.events}
          icon="events"
          trend="Próximos"
          detail="disponibles"
        />
      </section>

      <section className="dashboard__grid">
        <article className="panel panel--services">
          <div className="panel__header">
            <div>
              <span className="panel__eyebrow">ACCESO RÁPIDO</span>
              <h2>Servicios universitarios</h2>
            </div>

            <span className="panel__count">
              {filteredServices.length}
            </span>
          </div>

          <div className="dashboard__services">
            {filteredServices.length > 0 ? (
              filteredServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                />
              ))
            ) : (
              <div className="dashboard__empty">
                <Icon name="search" size={24} />
                <strong>No encontramos servicios</strong>
                <p>Prueba con otro término de búsqueda.</p>
              </div>
            )}
          </div>
        </article>

        <article className="panel panel--overview">
          <div className="panel__header">
            <div>
              <span className="panel__eyebrow">ACTIVIDAD</span>
              <h2>Resumen de actividad</h2>
            </div>

            <span className="panel__round-button" aria-hidden="true">
              <Icon name="arrowUpRight" size={17} />
            </span>
          </div>

          <div className="overview">
            <div
              className="overview__chart"
              style={{
                "--completion": `${completionPercentage}%`,
              }}
            >
              <div className="overview__chart-center">
                <strong>{activityTotal}</strong>
                <span>actividades</span>
              </div>
            </div>

            <div className="overview__legend">
              <div>
                <span className="overview__dot overview__dot--primary" />
                <span>Solicitudes</span>
                <strong>{stats.requests}</strong>
              </div>

              <div>
                <span className="overview__dot overview__dot--secondary" />
                <span>Reservas</span>
                <strong>{stats.reservations}</strong>
              </div>

              <div>
                <span className="overview__dot overview__dot--muted" />
                <span>Eventos</span>
                <strong>{stats.events}</strong>
              </div>
            </div>
          </div>
        </article>

        <article className="panel panel--requests">
          <div className="panel__header">
            <div>
              <span className="panel__eyebrow">SEGUIMIENTO</span>
              <h2>Solicitudes recientes</h2>
            </div>

            <span className="panel__round-button" aria-hidden="true">
              <Icon name="arrowUpRight" size={17} />
            </span>
          </div>

          <div className="dashboard__requests">
            {requests.slice(0, 3).map((request) => (
              <RequestCard
                key={request.id}
                request={request}
              />
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}

export default Dashboard;
