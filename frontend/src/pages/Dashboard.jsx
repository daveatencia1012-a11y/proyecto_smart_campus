import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon/Icon";
import useSession from "../hooks/useSession";
import useResource from "../hooks/useResource";
import { get } from "../services/api";
import { listRecords, listNotifications, query, dateKey as isoDateKey } from "../services/campusService";
import { getMyRequests, getRequests } from "../services/requestsService";
import { getReservations } from "../services/reservationsService";
import { STAFF } from "../services/roles";

const periods = ["Hoy", "Esta semana", "Este mes", "Todo"];
const LIFECYCLE = ["REGISTRADA", "EN_REVISION", "ASIGNADA", "EN_PROCESO", "RESUELTA", "CERRADA"];
const OPEN_STATES = ["REGISTRADA", "EN_REVISION", "ASIGNADA", "EN_PROCESO"];
const MONTHS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

const heroByRole = {
  estudiante: ["Panel principal", "Tu campus, más simple."],
  docente: ["Panel docente", "Tu campus, más simple."],
  administrativo: ["Gestión operativa", "La operación del campus, al día."],
  administrador: ["Centro de control", "Todo el campus, bajo control."],
};

const actionsByRole = {
  estudiante: [["plus", "Nueva solicitud", "/requests"], ["reservations", "Reservar espacio", "/reservations"], ["pqrs", "Enviar PQRS", "/pqrs"]],
  docente: [["events", "Publicar evento", "/events"], ["reservations", "Reservar espacio", "/reservations"], ["plus", "Nueva solicitud", "/requests"]],
  administrativo: [["requests", "Atender solicitudes", "/gestion/solicitudes"], ["pqrs", "Responder PQRS", "/gestion/pqrs"], ["file", "Reportes", "/gestion/reportes"]],
  administrador: [["requests", "Atender solicitudes", "/gestion/solicitudes"], ["profile", "Usuarios", "/admin/users"], ["monitor", "Estado del sistema", "/admin/monitoring"]],
};

const toneByType = { solicitud: "requests", reserva: "reservations", evento: "events", pqrs: "pqrs", sistema: "notifications" };
const iconByType = { solicitud: "requests", reserva: "reservations", evento: "events", pqrs: "pqrs", sistema: "alert" };

const loadServices = () => listRecords("services");
const loadActivity = () => listNotifications();
const loadUpcomingEvents = () => get("/api/eventos/proximos?dias=30");
const loadHealth = () => get("/api/dashboard/salud");
const loadNothing = () => Promise.resolve(null);

function localDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// Solo se envía la fecha inicial: la BD guarda fechas en UTC y un tope con la
// fecha local de hoy excluiría lo registrado en la noche (hora de Colombia).
function rangeFor(period) {
  const today = new Date();
  if (period === "Hoy") return { fecha_desde: localDateKey(today) };
  if (period === "Esta semana") {
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    return { fecha_desde: localDateKey(monday) };
  }
  if (period === "Este mes") return { fecha_desde: localDateKey(new Date(today.getFullYear(), today.getMonth(), 1)) };
  return {};
}

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
}

function timeAgo(value) {
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 1) return "Hace un momento";
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.round(hours / 24);
  return days < 7 ? `Hace ${days} d` : new Date(value).toLocaleDateString("es-CO");
}

// Normaliza los conteos por estado (solicitudes en MAYÚSCULAS, PQRS en minúsculas).
function byState(map = {}) {
  return Object.fromEntries(Object.entries(map).map(([state, total]) => [state.toUpperCase(), Number(total || 0)]));
}

const plural = (count, singular, pluralWord) => `${count} ${count === 1 ? singular : pluralWord}`;

function Skeleton({ lines = 3 }) {
  return (
    <div className="dash-skeleton" aria-hidden="true">
      {Array.from({ length: lines }, (_, index) => <span key={index} />)}
    </div>
  );
}

function Empty({ icon, title, text, action }) {
  return (
    <div className="dash-empty">
      <span className="dash-empty__icon"><Icon name={icon} size={20} /></span>
      <strong>{title}</strong>
      <p>{text}</p>
      {action && <Link className="button button--primary" to={action[1]}>{action[0]}</Link>}
    </div>
  );
}

function RequestProgress({ request, to }) {
  const step = Math.max(LIFECYCLE.indexOf(request.rawStatus), 0);
  return (
    <Link className="dash-request" to={to}>
      <div className="dash-request__top">
        <strong>{request.type}</strong>
        <span className={`dash-status dash-status--${request.rawStatus.toLowerCase()}`}>{request.status}</span>
      </div>
      <small>{request.code} · {request.date}{request.dependency ? ` · ${request.dependency}` : ""}</small>
      <div className="dash-progress" aria-label={`Paso ${step + 1} de ${LIFECYCLE.length}`}>
        {LIFECYCLE.map((state, index) => <i key={state} className={index <= step ? "is-done" : ""} />)}
      </div>
    </Link>
  );
}

function DateBadge({ iso }) {
  const [, month, day] = isoDateKey(iso).split("-");
  return (
    <span className="dash-date">
      <strong>{day}</strong>
      <small>{MONTHS[Number(month) - 1]}</small>
    </span>
  );
}

function Dashboard() {
  const { user, role } = useSession();
  const staff = STAFF.includes(role);
  const admin = role === "administrador";
  const [period, setPeriod] = useState("Este mes");

  const loadMetrics = useCallback(
    () => get(staff ? `/api/dashboard/operativo?${query(rangeFor(period))}` : "/api/dashboard/personal"),
    [staff, period]
  );
  const loadRequests = useCallback(() => (staff ? getRequests() : getMyRequests()), [staff]);
  const loadReservations = useCallback(
    () => (staff ? getReservations({ operational: true, fecha: localDateKey(new Date()) }) : getReservations()),
    [staff]
  );

  const metrics = useResource(loadMetrics);
  const requests = useResource(loadRequests);
  const reservations = useResource(loadReservations);
  const events = useResource(loadUpcomingEvents);
  const activity = useResource(loadActivity);
  const services = useResource(loadServices);
  const health = useResource(admin ? loadHealth : loadNothing);

  const data = metrics.data || {};
  const requestList = requests.data || [];
  const openRequests = requestList.filter((item) => OPEN_STATES.includes(item.rawStatus));
  const requestStates = byState(data.solicitudes_por_estado);
  const pqrsStates = byState(data.pqrs_por_estado);
  const pendingRequests = OPEN_STATES.reduce((total, state) => total + (requestStates[state] || 0), 0);
  const pendingPqrs = (pqrsStates.REGISTRADA || 0) + (pqrsStates.EN_REVISION || 0);

  const todayKey = localDateKey(new Date());
  const toKey = (date) => date.split("/").reverse().join("-");
  const activeReservations = (reservations.data || [])
    .filter((item) => item.status !== "CANCELADA")
    .sort((a, b) => `${toKey(a.date)}${a.startTime}`.localeCompare(`${toKey(b.date)}${b.startTime}`));
  const upcomingReservations = staff ? activeReservations : activeReservations.filter((item) => toKey(item.date) >= todayKey);
  const nextReservation = upcomingReservations[0];
  const upcomingEvents = (events.data || []).slice(0, 3);
  const recentActivity = (activity.data || []).slice(0, 5);

  const value = (key) => (metrics.loading ? "…" : data[key] ?? 0);
  const periodLabel = period === "Todo" ? "en total" : period.toLowerCase();

  const kpis = staff
    ? [
        { tone: "requests", icon: "requests", label: "Solicitudes", value: value("solicitudes"), hint: `${pendingRequests} por atender`, to: "/gestion/solicitudes" },
        { tone: "reservations", icon: "reservations", label: "Reservas", value: value("reservas"), hint: `${upcomingReservations.length} para hoy`, to: "/gestion/reservas" },
        { tone: "pqrs", icon: "pqrs", label: "PQRS", value: value("pqrs"), hint: `${pendingPqrs} sin responder`, to: "/gestion/pqrs" },
        { tone: "resources", icon: "resources", label: "Recursos", value: value("recursos_disponibles"), hint: "disponibles ahora", to: "/gestion/recursos" },
      ]
    : [
        { tone: "requests", icon: "requests", label: "Mis solicitudes", value: value("solicitudes"), hint: `${openRequests.length} en curso`, to: "/requests" },
        { tone: "reservations", icon: "reservations", label: "Mis reservas", value: value("reservas"), hint: nextReservation ? `Próxima: ${nextReservation.date}` : "Sin reservas próximas", to: "/reservations" },
        { tone: "notifications", icon: "notifications", label: "Avisos sin leer", value: value("notificaciones_no_leidas"), hint: "en notificaciones", to: "/notifications" },
        { tone: "events", icon: "events", label: "Eventos", value: value("eventos"), hint: "en los próximos 7 días", to: "/events" },
      ];

  const summary = metrics.loading
    ? "Cargando tu resumen…"
    : staff
      ? `Hay ${plural(pendingRequests, "solicitud por atender", "solicitudes por atender")}, ${plural(pendingPqrs, "PQRS sin responder", "PQRS sin responder")} y ${plural(upcomingReservations.length, "reserva para hoy", "reservas para hoy")}.`
      : `Tienes ${plural(openRequests.length, "solicitud en curso", "solicitudes en curso")}, ${plural(upcomingReservations.length, "reserva próxima", "reservas próximas")} y ${plural(Number(data.notificaciones_no_leidas || 0), "aviso sin leer", "avisos sin leer")}.`;

  const [eyebrow, title] = heroByRole[role] || heroByRole.estudiante;
  // El título se muestra en dos tonos: "Todo el campus," / "bajo control."
  const [titleStart, titleEnd] = title.split(/,\s*/);
  const firstName = (user?.nombre || "").split(" ")[0];
  const workList = (staff ? openRequests : requestList).slice(0, 4);

  return (
    <main className="dashboard dash">
      <section className="dashboard__hero">
        <div className="dashboard__hero-copy">
          <span className="dashboard__eyebrow">{eyebrow}</span>
          <h1>{titleEnd ? <>{titleStart}, <span className="dashboard__hero-accent">{titleEnd}</span></> : title}</h1>
          <p>{greeting()}{firstName ? `, ${firstName}` : ""}. {summary}</p>
        </div>

        <div className="dashboard__periods">
          {(actionsByRole[role] || actionsByRole.estudiante).map(([icon, label, to]) => (
            <Link key={label} className="dashboard__period dash-hero-action" to={to}>
              <Icon name={icon} size={15} /> {label}
            </Link>
          ))}
        </div>
      </section>

      <section className="dash-toolbar">
        <div>
          <span className="dashboard__toolbar-label">RESUMEN</span>
          <h2>{staff ? `Operación ${periodLabel}` : "Tu actividad"}</h2>
        </div>
        {staff && (
          <div className="service-page__filters">
            {periods.map((item) => (
              <button key={item} type="button"
                className={period === item ? "service-page__filter service-page__filter--active" : "service-page__filter"}
                onClick={() => setPeriod(item)}>
                {item}
              </button>
            ))}
          </div>
        )}
      </section>

      {metrics.error && <p className="role-message" role="alert">{metrics.error}</p>}

      <section className="dash-kpis">
        {kpis.map((kpi) => (
          <Link key={kpi.label} className={`dash-kpi panel dash-tone--${kpi.tone}`} to={kpi.to}>
            <span className="dash-kpi__icon"><Icon name={kpi.icon} size={20} /></span>
            <span className="dash-kpi__body">
              <span className="dash-kpi__label">{kpi.label}</span>
              <strong className="dash-kpi__value">{kpi.value}</strong>
              <small className="dash-kpi__hint">{kpi.hint}</small>
            </span>
            <Icon name="arrowUpRight" size={15} className="dash-kpi__arrow" />
          </Link>
        ))}
      </section>

      <section className="dash-grid">
        <article className="panel dash-card dash-card--wide">
          <header className="dash-card__header">
            <div>
              <span className="panel__eyebrow">{staff ? "BANDEJA DE TRABAJO" : "SEGUIMIENTO"}</span>
              <h2>{staff ? "Solicitudes por atender" : "Mis solicitudes"}</h2>
            </div>
            <Link className="dash-link" to={staff ? "/gestion/solicitudes" : "/requests"}>
              {staff ? "Ir a atender" : "Ver todas"} <Icon name="arrowRight" size={14} />
            </Link>
          </header>

          {staff && (
            <div className="dash-chips">
              {OPEN_STATES.concat("RESUELTA").map((state) => (
                <Link key={state} className={`dash-chip dash-status--${state.toLowerCase()}`} to="/gestion/solicitudes">
                  <strong>{metrics.loading ? "…" : requestStates[state] || 0}</strong> {state.replaceAll("_", " ")}
                </Link>
              ))}
            </div>
          )}

          {requests.loading ? <Skeleton lines={3} /> : requests.error ? <p className="role-message">{requests.error}</p> : workList.length ? (
            <div className="dash-requests">
              {workList.map((request) => (
                <RequestProgress key={request.id} request={request} to={`/requests/${request.id}`} />
              ))}
            </div>
          ) : staff ? (
            <Empty icon="check" title="Todo al día" text="No hay solicitudes abiertas por atender." />
          ) : (
            <Empty icon="requests" title="Aún no tienes solicitudes" text="Registra tu primera solicitud y sigue su estado desde aquí." action={["Nueva solicitud", "/requests"]} />
          )}
        </article>

        <article className="panel dash-card">
          <header className="dash-card__header">
            <div>
              <span className="panel__eyebrow">AGENDA</span>
              <h2>Próximamente</h2>
            </div>
            <Link className="dash-link" to="/calendar">Calendario <Icon name="arrowRight" size={14} /></Link>
          </header>

          <h3 className="dash-subtitle">{staff ? "Reservas de hoy" : "Tu próxima reserva"}</h3>
          {reservations.loading ? <Skeleton lines={1} /> : staff ? (
            upcomingReservations.length ? (
              <div className="dash-list">
                {upcomingReservations.slice(0, 3).map((item) => (
                  <Link key={item.id} className="dash-list__item dash-tone--reservations" to={`/reservations/${item.id}`}>
                    <span className="dash-list__icon"><Icon name="clock" size={15} /></span>
                    <span><strong>{item.startTime}–{item.endTime}</strong><small>{item.resource}</small></span>
                  </Link>
                ))}
              </div>
            ) : <p className="dash-muted">No hay reservas para hoy.</p>
          ) : nextReservation ? (
            <Link className="dash-next dash-tone--reservations" to={`/reservations/${nextReservation.id}`}>
              <span className="dash-list__icon"><Icon name="reservations" size={16} /></span>
              <span>
                <strong>{nextReservation.resource}</strong>
                <small>{nextReservation.date} · {nextReservation.startTime}–{nextReservation.endTime}</small>
              </span>
            </Link>
          ) : (
            <p className="dash-muted">No tienes reservas próximas. <Link to="/reservations">Reservar ahora</Link></p>
          )}

          <h3 className="dash-subtitle">Próximos eventos</h3>
          {events.loading ? <Skeleton lines={2} /> : upcomingEvents.length ? (
            <div className="dash-list">
              {upcomingEvents.map((event) => (
                <Link key={event.id} className="dash-list__item dash-tone--events" to="/events">
                  <DateBadge iso={event.fecha} />
                  <span><strong>{event.nombre}</strong><small>{String(event.hora).slice(0, 5)} · {event.lugar}</small></span>
                </Link>
              ))}
            </div>
          ) : <p className="dash-muted">No hay eventos en los próximos 30 días.</p>}
        </article>

        <article className="panel dash-card dash-card--wide">
          <header className="dash-card__header">
            <div>
              <span className="panel__eyebrow">ACTIVIDAD</span>
              <h2>Actividad reciente</h2>
            </div>
            <Link className="dash-link" to="/notifications">Ver notificaciones <Icon name="arrowRight" size={14} /></Link>
          </header>

          {activity.loading ? <Skeleton lines={4} /> : recentActivity.length ? (
            <ol className="dash-timeline">
              {recentActivity.map((item) => (
                <li key={item.id} className={`dash-tone--${toneByType[item.tipo] || "notifications"} ${item.leida ? "" : "is-unread"}`}>
                  <span className="dash-timeline__icon"><Icon name={iconByType[item.tipo] || "notifications"} size={14} /></span>
                  <div>
                    <strong>{item.titulo}</strong>
                    <p>{item.mensaje}</p>
                  </div>
                  <small>{timeAgo(item.fecha_creacion)}</small>
                </li>
              ))}
            </ol>
          ) : (
            <Empty icon="notifications" title="Sin actividad todavía" text="Aquí verás los cambios de tus solicitudes, reservas y eventos." />
          )}
        </article>

        <article className="panel dash-card">
          <header className="dash-card__header">
            <div>
              <span className="panel__eyebrow">ACCESO RÁPIDO</span>
              <h2>Servicios</h2>
            </div>
            <Link className="dash-link" to="/services">Todos <Icon name="arrowRight" size={14} /></Link>
          </header>

          {services.loading ? <Skeleton lines={2} /> : (
            <div className="dash-services">
              {(services.data || []).slice(0, 6).map((service) => (
                <Link key={service.id} className={`dash-service dash-tone--${service.icono}`} to={`/services/${service.id}`} title={service.descripcion}>
                  <span className="dash-service__icon"><Icon name={service.icono} size={18} /></span>
                  <span>{service.nombre}</span>
                </Link>
              ))}
            </div>
          )}

          {admin && (
            <>
              <h3 className="dash-subtitle">Estado del sistema</h3>
              {health.loading ? <Skeleton lines={1} /> : health.data ? (
                <div className="dash-health">
                  {Object.entries(health.data.services || {}).map(([name, status]) => (
                    <span key={name} className={`dash-health__item ${status === "ok" ? "is-ok" : "is-down"}`} title={status}>
                      <i /> {name}
                    </span>
                  ))}
                </div>
              ) : <p className="dash-muted">{health.error || "Sin datos de estado."}</p>}
            </>
          )}
        </article>
      </section>
    </main>
  );
}

export default Dashboard;
