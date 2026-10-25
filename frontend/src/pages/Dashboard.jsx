import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon/Icon";
import ServiceCard from "../components/ServiceCard/ServiceCard";
import StatCard from "../components/StatCard/StatCard";
import RequestCard from "../components/RequestCard/RequestCard";
import useSession from "../hooks/useSession";
import useResource from "../hooks/useResource";
import { get } from "../services/api";
import { listRecords, query } from "../services/campusService";
import { getMyRequests, getRequests } from "../services/requestsService";
import { STAFF } from "../services/roles";

const periods = ["Hoy", "Esta semana", "Este mes", "Todo"];

const heroByRole = {
  estudiante: ["Panel principal", "Tu campus, más simple.", "Gestiona tus servicios universitarios, solicitudes y reservas desde un solo lugar."],
  docente: ["Panel docente", "Tu campus, más simple.", "Consulta tus servicios, gestiona tus reservas y publica la información académica de tus cursos."],
  administrativo: ["Gestión operativa", "La operación del campus, al día.", "Atiende solicitudes, administra recursos y gestiona reservas desde un solo lugar."],
  administrador: ["Centro de control", "Todo el campus, bajo control.", "Supervisa la operación, administra usuarios y consulta las estadísticas del sistema."],
};

const shortcutsByRole = {
  estudiante: [["Nueva solicitud", "/requests"], ["Reservar", "/reservations"], ["PQRS", "/pqrs"]],
  docente: [["Publicar evento", "/events"], ["Reservar", "/reservations"], ["Mis solicitudes", "/requests"]],
};

const loadServices = () => listRecords("services");

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// Solo se envía la fecha inicial: la BD guarda fechas en UTC y un tope con la
// fecha local de hoy excluiría lo registrado en la noche (hora de Colombia).
function rangeFor(period) {
  const today = new Date();
  if (period === "Hoy") return { fecha_desde: dateKey(today) };
  if (period === "Esta semana") {
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    return { fecha_desde: dateKey(monday) };
  }
  if (period === "Este mes") return { fecha_desde: dateKey(new Date(today.getFullYear(), today.getMonth(), 1)) };
  return {};
}

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
}

function resolvedCount(byState = {}) {
  return Object.entries(byState)
    .filter(([state]) => ["RESUELTA", "CERRADA"].includes(state.toUpperCase()))
    .reduce((total, [, value]) => total + Number(value || 0), 0);
}

function Dashboard() {
  const { user, role } = useSession();
  const staff = STAFF.includes(role);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("Este mes");

  const loadMetrics = useCallback(
    () => get(staff ? `/api/dashboard/operativo?${query(rangeFor(period))}` : "/api/dashboard/personal"),
    [staff, period]
  );
  const loadRequests = useCallback(() => (staff ? getRequests() : getMyRequests()), [staff]);

  const metrics = useResource(loadMetrics);
  const services = useResource(loadServices);
  const requests = useResource(loadRequests);

  const filteredServices = useMemo(
    () =>
      (services.data || []).filter((service) =>
        `${service.nombre} ${service.descripcion}`.toLowerCase().includes(search.toLowerCase())
      ),
    [services.data, search]
  );

  const data = metrics.data || {};
  const value = (key) => (metrics.loading ? "…" : data[key] ?? "—");
  const periodLabel = period === "Todo" ? "en total" : period.toLowerCase();

  const stats = staff
    ? [
        { title: "Solicitudes", key: "solicitudes", icon: "requests", trend: period, detail: periodLabel },
        { title: "Reservas", key: "reservas", icon: "reservations", trend: period, detail: periodLabel },
        { title: "PQRS", key: "pqrs", icon: "pqrs", trend: period, detail: periodLabel },
        { title: "Recursos", key: "recursos_disponibles", icon: "resources", trend: "Ahora", detail: "disponibles" },
      ]
    : [
        { title: "Mis solicitudes", key: "solicitudes", icon: "requests", detail: "registradas" },
        { title: "Mis reservas", key: "reservas", icon: "reservations", detail: "registradas" },
        { title: "Notificaciones", key: "notificaciones_no_leidas", icon: "notifications", trend: data.notificaciones_no_leidas ? `${data.notificaciones_no_leidas} nuevas` : undefined, detail: "sin leer" },
        { title: "Eventos", key: "eventos", icon: "events", trend: "Próximos", detail: "en 7 días" },
      ];

  const legend = staff
    ? [["Solicitudes", data.solicitudes], ["Reservas", data.reservas], ["PQRS", data.pqrs]]
    : [["Solicitudes", data.solicitudes], ["Reservas", data.reservas], ["Eventos", data.eventos]];
  const activityTotal = legend.reduce((total, [, count]) => total + Number(count || 0), 0);

  const requestList = requests.data || [];
  const resolved = staff
    ? resolvedCount(data.solicitudes_por_estado)
    : requestList.filter((item) => ["RESUELTA", "CERRADA"].includes(item.status)).length;
  const requestTotal = staff ? Number(data.solicitudes || 0) : requestList.length;
  const completionPercentage = Math.round((resolved / Math.max(requestTotal, 1)) * 100);

  const [eyebrow, title, description] = heroByRole[role] || heroByRole.estudiante;
  const firstName = (user?.nombre || "").split(" ")[0];

  return (
    <main className="dashboard">
      <section className="dashboard__hero">
        <div className="dashboard__hero-copy">
          <span className="dashboard__eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>

        <div className="dashboard__periods">
          {staff ? (
            <>
              {periods.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={period === item ? "dashboard__period dashboard__period--active" : "dashboard__period"}
                  onClick={() => setPeriod(item)}
                >
                  {item}
                </button>
              ))}
              <Link className="dashboard__period" to="/gestion/reportes">Reportes</Link>
              {role === "administrador" && <Link className="dashboard__period" to="/admin/users">Usuarios</Link>}
            </>
          ) : (
            (shortcutsByRole[role] || shortcutsByRole.estudiante).map(([label, to]) => (
              <Link key={label} className="dashboard__period" to={to}>{label}</Link>
            ))
          )}
        </div>
      </section>

      <section className="dashboard__toolbar">
        <div>
          <span className="dashboard__toolbar-label">RESUMEN</span>
          <h2>
            {greeting()}{firstName ? `, ${firstName}` : ""} <Icon name="spark" size={18} />
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

      {metrics.error && <p className="role-message" role="alert">{metrics.error}</p>}

      <section className="dashboard__stats">
        {stats.map((stat) => (
          <StatCard key={stat.key} title={stat.title} value={value(stat.key)} icon={stat.icon} trend={stat.trend} detail={stat.detail} />
        ))}
      </section>

      <section className="dashboard__grid">
        <article className="panel panel--services">
          <div className="panel__header">
            <div>
              <span className="panel__eyebrow">ACCESO RÁPIDO</span>
              <h2>Servicios universitarios</h2>
            </div>
            <span className="panel__count">{filteredServices.length}</span>
          </div>

          <div className="dashboard__services">
            {filteredServices.length > 0 ? (
              filteredServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={{ id: service.id, name: service.nombre, description: service.descripcion, icon: service.icono }}
                />
              ))
            ) : (
              <div className="dashboard__empty">
                <Icon name="search" size={24} />
                <strong>{services.loading ? "Cargando servicios…" : "No encontramos servicios"}</strong>
                <p>{services.error || "Prueba con otro término de búsqueda."}</p>
              </div>
            )}
          </div>
        </article>

        <article className="panel panel--overview">
          <div className="panel__header">
            <div>
              <span className="panel__eyebrow">ACTIVIDAD</span>
              <h2>{staff ? "Resumen operativo" : "Resumen de actividad"}</h2>
            </div>
            <Link className="panel__round-button" to={staff ? "/gestion/reportes" : "/requests"} aria-label="Ver detalle">
              <Icon name="arrowUpRight" size={17} />
            </Link>
          </div>

          <div className="overview">
            <div className="overview__chart" style={{ "--completion": `${completionPercentage}%` }}>
              <div className="overview__chart-center">
                <strong>{metrics.loading ? "…" : activityTotal}</strong>
                <span>{staff ? "registros" : "actividades"}</span>
              </div>
            </div>

            <div className="overview__legend">
              {legend.map(([label, count], index) => (
                <div key={label}>
                  <span className={`overview__dot overview__dot--${["primary", "secondary", "muted"][index]}`} />
                  <span>{label}</span>
                  <strong>{metrics.loading ? "…" : count ?? 0}</strong>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="panel panel--requests">
          <div className="panel__header">
            <div>
              <span className="panel__eyebrow">SEGUIMIENTO</span>
              <h2>{staff ? "Solicitudes por atender" : "Solicitudes recientes"}</h2>
            </div>
            <Link className="panel__round-button" to={staff ? "/gestion/solicitudes" : "/requests"} aria-label="Ver todas las solicitudes">
              <Icon name="arrowUpRight" size={17} />
            </Link>
          </div>

          <div className="dashboard__requests">
            {requestList.length > 0 ? (
              requestList.slice(0, 3).map((request) => <RequestCard key={request.id} request={request} />)
            ) : (
              <div className="dashboard__empty">
                <Icon name="requests" size={24} />
                <strong>{requests.loading ? "Cargando solicitudes…" : "Sin solicitudes"}</strong>
                <p>{requests.error || (staff ? "No hay solicitudes registradas." : "Aún no has registrado solicitudes.")}</p>
              </div>
            )}
          </div>
        </article>
      </section>
    </main>
  );
}

export default Dashboard;
