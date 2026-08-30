import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon/Icon";
import { events, notifications, requests, reservations, resources } from "../data/mockData";

const seedUsers = [
  { id: 1, name: "Ismael Pérez", email: "ismael@uniajs.edu.co", role: "ESTUDIANTE", status: "ACTIVO", program: "Ingeniería de Sistemas" },
  { id: 2, name: "Laura Gómez", email: "laura@uniajs.edu.co", role: "DOCENTE", status: "ACTIVO", program: "Ingeniería de Sistemas" },
  { id: 3, name: "Carlos Mendoza", email: "carlos@uniajs.edu.co", role: "ADMINISTRATIVO", status: "ACTIVO", program: "Gestión Institucional" },
  { id: 4, name: "Ana Torres", email: "ana@uniajs.edu.co", role: "ESTUDIANTE", status: "PENDIENTE", program: "Administración" },
  { id: 5, name: "Miguel Rojas", email: "miguel@uniajs.edu.co", role: "DOCENTE", status: "ACTIVO", program: "Derecho" },
];

const statusFlow = ["REGISTRADA", "EN REVISIÓN", "ASIGNADA", "EN PROCESO", "RESUELTA", "CERRADA"];

function AdminDashboard() {
  const [users, setUsers] = useState(seedUsers);
  const [adminRequests, setAdminRequests] = useState(() => requests.map((item, index) => ({
    ...item,
    requester: seedUsers[index % seedUsers.length].name,
    priority: ["ALTA", "MEDIA", "BAJA"][index % 3],
    responsible: index === 0 ? "Mesa de servicios" : index === 1 ? "Recursos físicos" : "Atención institucional",
  })));
  const [adminResources, setAdminResources] = useState(resources);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [activePanel, setActivePanel] = useState("resumen");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");
  const [showUserForm, setShowUserForm] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "ESTUDIANTE", program: "" });

  const pendingRequests = adminRequests.filter((item) => !["RESUELTA", "CERRADA"].includes(item.status)).length;
  const unreadNotifications = notifications.filter((item) => !item.read).length;
  const activeReservations = reservations.filter((item) => ["CONFIRMADA", "PENDIENTE"].includes(item.status)).length;
  const availableResources = adminResources.filter((item) => item.status === "DISPONIBLE").length;
  const occupiedResources = adminResources.filter((item) => item.status === "EN USO").length;
  const maintenanceResources = adminResources.filter((item) => item.status === "MANTENIMIENTO").length;

  const filteredRequests = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    if (!normalized) return adminRequests;
    return adminRequests.filter((item) => `${item.id} ${item.type} ${item.requester} ${item.status}`.toLowerCase().includes(normalized));
  }, [adminRequests, query]);

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  const advanceRequest = (requestId) => {
    setAdminRequests((current) => current.map((item) => {
      if (item.id !== requestId) return item;
      const index = statusFlow.indexOf(item.status);
      const nextStatus = statusFlow[Math.min(index + 1, statusFlow.length - 1)];
      showToast(`Solicitud #${item.id} actualizada a ${nextStatus.toLowerCase()}.`);
      return { ...item, status: nextStatus };
    }));
  };

  const toggleResource = (resourceId) => {
    setAdminResources((current) => current.map((item) => {
      if (item.id !== resourceId) return item;
      const next = item.status === "DISPONIBLE" ? "EN USO" : "DISPONIBLE";
      showToast(`${item.name}: estado cambiado a ${next.toLowerCase()}.`);
      return { ...item, status: next };
    }));
  };

  const toggleUserStatus = (userId) => {
    setUsers((current) => current.map((user) => user.id === userId
      ? { ...user, status: user.status === "ACTIVO" ? "INACTIVO" : "ACTIVO" }
      : user));
    showToast("Estado del usuario actualizado.");
  };

  const createUser = (event) => {
    event.preventDefault();
    if (!newUser.name.trim() || !newUser.email.trim()) return;
    setUsers((current) => [...current, {
      id: Date.now(),
      ...newUser,
      status: "ACTIVO",
    }]);
    setNewUser({ name: "", email: "", role: "ESTUDIANTE", program: "" });
    setShowUserForm(false);
    showToast("Usuario creado correctamente en el entorno de demostración.");
  };

  const exportReport = () => {
    const rows = [
      ["ID", "Solicitud", "Solicitante", "Prioridad", "Estado", "Responsable"],
      ...adminRequests.map((item) => [item.id, item.type, item.requester, item.priority, item.status, item.responsible]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "uajs-smart-campus-reporte-solicitudes.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    showToast("Reporte CSV generado.");
  };

  const systemServices = [
    { name: "API de Usuarios", state: "Operativo", latency: "42 ms" },
    { name: "API de Solicitudes", state: "Operativo", latency: "58 ms" },
    { name: "API de Reservas", state: "Operativo", latency: "64 ms" },
    { name: "API de Notificaciones", state: "Operativo", latency: "51 ms" },
    { name: "API Gateway", state: "Operativo", latency: "36 ms" },
  ];

  return (
    <section className="admin-page">
      <div className="admin-page__hero">
        <div>
          <div className="page-eyebrow"><span /> CONSOLA DE ADMINISTRACIÓN</div>
          <h1>Centro de control <em>Smart Campus.</em></h1>
          <p>Supervisa usuarios, solicitudes, reservas, recursos y el estado general de la plataforma desde un único lugar.</p>
        </div>
        <div className="admin-page__hero-actions">
          <button className="button button--secondary" type="button" onClick={exportReport}><Icon name="file" size={17} /> Exportar reporte</button>
          <button className="button button--primary" type="button" onClick={() => setShowUserForm(true)}><Icon name="plus" size={17} /> Nuevo usuario</button>
        </div>
      </div>

      <div className="admin-page__statusbar">
        <div><span className="admin-dot admin-dot--success" /> Todos los servicios operativos</div>
        <span>Última sincronización: ahora</span>
        <Link to="/settings">Configuración del sistema <Icon name="arrowUpRight" size={14} /></Link>
      </div>

      <div className="admin-kpis">
        <article className="admin-kpi"><div className="admin-kpi__icon"><Icon name="profile" size={20} /></div><span>Usuarios registrados</span><strong>{users.length}</strong><small><b>+8.4%</b> este mes</small></article>
        <article className="admin-kpi"><div className="admin-kpi__icon"><Icon name="requests" size={20} /></div><span>Solicitudes pendientes</span><strong>{pendingRequests}</strong><small><b>{adminRequests.length}</b> solicitudes en seguimiento</small></article>
        <article className="admin-kpi"><div className="admin-kpi__icon"><Icon name="reservations" size={20} /></div><span>Reservas activas</span><strong>{activeReservations}</strong><small><b>{reservations.length}</b> registros totales</small></article>
        <article className="admin-kpi"><div className="admin-kpi__icon"><Icon name="resources" size={20} /></div><span>Recursos disponibles</span><strong>{availableResources}</strong><small>{occupiedResources} en uso · {maintenanceResources} mantenimiento</small></article>
      </div>

      <div className="admin-tabs" role="tablist" aria-label="Panel de administración">
        {["resumen", "solicitudes", "usuarios", "recursos"].map((panel) => (
          <button key={panel} type="button" className={activePanel === panel ? "admin-tabs__tab admin-tabs__tab--active" : "admin-tabs__tab"} onClick={() => setActivePanel(panel)}>
            {panel === "resumen" ? "Resumen" : panel[0].toUpperCase() + panel.slice(1)}
          </button>
        ))}
      </div>

      {(activePanel === "resumen") && (
        <div className="admin-grid admin-grid--main">
          <article className="admin-panel admin-panel--wide">
            <div className="admin-panel__header"><div><span className="panel-kicker">ATENCIÓN REQUERIDA</span><h2>Cola de solicitudes</h2></div><button className="text-button" type="button" onClick={() => setActivePanel("solicitudes")}>Ver todas <Icon name="arrowRight" size={15} /></button></div>
            <div className="admin-request-list">
              {adminRequests.slice(0, 5).map((item) => (
                <div className="admin-request-row" key={item.id}>
                  <div className="admin-request-row__id">#{item.id}</div>
                  <div className="admin-request-row__body"><strong>{item.type}</strong><span>{item.requester} · {item.responsible}</span></div>
                  <span className={`status-pill status-pill--${item.status.toLowerCase().replaceAll(" ", "-")}`}>{item.status}</span>
                  <button className="icon-button" type="button" title="Gestionar solicitud" onClick={() => setSelectedRequest(item)}><Icon name="more" size={18} /></button>
                </div>
              ))}
            </div>
          </article>

          <article className="admin-panel">
            <div className="admin-panel__header"><div><span className="panel-kicker">SALUD DEL SISTEMA</span><h2>Servicios</h2></div><span className="admin-health">100%</span></div>
            <div className="admin-service-list">
              {systemServices.map((service) => <div className="admin-service-row" key={service.name}><span className="admin-dot admin-dot--success" /><div><strong>{service.name}</strong><small>{service.latency}</small></div><span>Operativo</span></div>)}
            </div>
          </article>

          <article className="admin-panel">
            <div className="admin-panel__header"><div><span className="panel-kicker">AGENDA</span><h2>Próximas actividades</h2></div><Link className="text-button" to="/calendar">Calendario <Icon name="arrowUpRight" size={15} /></Link></div>
            <div className="admin-event-list">
              {events.slice(0, 4).map((event) => <div className="admin-event-row" key={event.id}><div className="admin-event-date"><b>{event.day}</b><small>{event.month}</small></div><div><strong>{event.title}</strong><span>{event.time} · {event.location}</span></div></div>)}
            </div>
          </article>

          <article className="admin-panel admin-panel--wide">
            <div className="admin-panel__header"><div><span className="panel-kicker">ACTIVIDAD RECIENTE</span><h2>Operaciones de la plataforma</h2></div><span className="admin-live"><i /> En vivo</span></div>
            <div className="admin-activity-grid">
              <div><span className="admin-activity__icon"><Icon name="requests" size={17} /></span><div><strong>Solicitud #1001 actualizada</strong><p>Pasó a En proceso · hace 4 min</p></div></div>
              <div><span className="admin-activity__icon"><Icon name="profile" size={17} /></span><div><strong>Nuevo usuario registrado</strong><p>Cuenta pendiente de activación · hace 12 min</p></div></div>
              <div><span className="admin-activity__icon"><Icon name="reservations" size={17} /></span><div><strong>Reserva confirmada</strong><p>Auditorio Principal · hace 19 min</p></div></div>
              <div><span className="admin-activity__icon"><Icon name="notifications" size={17} /></span><div><strong>{unreadNotifications} notificaciones pendientes</strong><p>Revisión recomendada · hace 28 min</p></div></div>
            </div>
          </article>
        </div>
      )}

      {activePanel === "solicitudes" && (
        <section className="admin-panel admin-panel--full">
          <div className="admin-panel__header admin-panel__header--stack-mobile"><div><span className="panel-kicker">GESTIÓN OPERATIVA</span><h2>Solicitudes universitarias</h2><p>Revisa, asigna y avanza solicitudes según el flujo institucional.</p></div><div className="admin-toolbar"><div className="admin-search"><Icon name="search" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por ID, usuario o servicio..." /></div></div></div>
          <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Solicitud</th><th>Solicitante</th><th>Prioridad</th><th>Estado</th><th>Responsable</th><th>Acción</th></tr></thead><tbody>{filteredRequests.map((item) => <tr key={item.id}><td><strong>#{item.id}</strong><span>{item.type}</span></td><td>{item.requester}</td><td><span className={`priority priority--${item.priority.toLowerCase()}`}>{item.priority}</span></td><td><span className="status-pill status-pill--table">{item.status}</span></td><td>{item.responsible}</td><td><button className="table-action" type="button" onClick={() => setSelectedRequest(item)}>Gestionar</button></td></tr>)}</tbody></table></div>
        </section>
      )}

      {activePanel === "usuarios" && (
        <section className="admin-panel admin-panel--full">
          <div className="admin-panel__header"><div><span className="panel-kicker">CONTROL DE ACCESO</span><h2>Usuarios y roles</h2><p>Administra cuentas ficticias del entorno académico y sus estados.</p></div><button className="button button--primary" type="button" onClick={() => setShowUserForm(true)}><Icon name="plus" size={17} /> Crear usuario</button></div>
          <div className="admin-user-grid">{users.map((user) => <article className="admin-user-card" key={user.id}><div className="admin-user-card__top"><span className="admin-user-avatar">{user.name.split(" ").map((word) => word[0]).slice(0, 2).join("")}</span><button className="icon-button" type="button" title="Cambiar estado" onClick={() => toggleUserStatus(user.id)}><Icon name="more" size={18} /></button></div><strong>{user.name}</strong><span>{user.email}</span><div className="admin-user-card__meta"><span>{user.role}</span><i className={user.status === "ACTIVO" ? "is-active" : ""}>{user.status}</i></div><small>{user.program}</small></article>)}</div>
        </section>
      )}

      {activePanel === "recursos" && (
        <section className="admin-panel admin-panel--full">
          <div className="admin-panel__header"><div><span className="panel-kicker">INVENTARIO</span><h2>Recursos universitarios</h2><p>Consulta disponibilidad y cambia el estado operativo del recurso.</p></div><Link className="button button--secondary" to="/resources">Abrir módulo completo</Link></div>
          <div className="admin-resource-grid">{adminResources.map((resource) => <article className="admin-resource-card" key={resource.id}><div className="admin-resource-card__icon"><Icon name={resource.icon} size={21} /></div><div className="admin-resource-card__body"><span>{resource.code}</span><strong>{resource.name}</strong><small>{resource.location}</small></div><button type="button" className={`resource-state resource-state--${resource.status.toLowerCase().replaceAll(" ", "-")} `} onClick={() => toggleResource(resource.id)}>{resource.status}</button></article>)}</div>
        </section>
      )}

      {selectedRequest && (
        <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedRequest(null); }}>
          <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="request-modal-title">
            <button className="admin-modal__close" type="button" onClick={() => setSelectedRequest(null)} aria-label="Cerrar"><Icon name="close" size={18} /></button>
            <span className="panel-kicker">GESTIONAR SOLICITUD</span><h2 id="request-modal-title">#{selectedRequest.id} · {selectedRequest.type}</h2><p>{selectedRequest.description}</p>
            <div className="admin-modal__facts"><div><small>Solicitante</small><strong>{selectedRequest.requester}</strong></div><div><small>Prioridad</small><strong>{selectedRequest.priority}</strong></div><div><small>Responsable</small><strong>{selectedRequest.responsible}</strong></div><div><small>Estado actual</small><strong>{selectedRequest.status}</strong></div></div>
            <div className="admin-progress"><span style={{ width: `${((statusFlow.indexOf(selectedRequest.status) + 1) / statusFlow.length) * 100}%` }} /></div><div className="admin-progress-labels">{statusFlow.map((status) => <small key={status}>{status}</small>)}</div>
            <div className="admin-modal__actions"><button className="button button--secondary" type="button" onClick={() => setSelectedRequest(null)}>Cerrar</button><button className="button button--primary" type="button" onClick={() => { advanceRequest(selectedRequest.id); setSelectedRequest(null); }} disabled={selectedRequest.status === "CERRADA"}>{selectedRequest.status === "CERRADA" ? "Solicitud cerrada" : "Avanzar estado"}</button></div>
          </div>
        </div>
      )}

      {showUserForm && (
        <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowUserForm(false); }}>
          <form className="admin-modal" onSubmit={createUser}>
            <button className="admin-modal__close" type="button" onClick={() => setShowUserForm(false)} aria-label="Cerrar"><Icon name="close" size={18} /></button>
            <span className="panel-kicker">NUEVA CUENTA</span><h2>Registrar usuario</h2><p>Crea un usuario ficticio para demostrar la gestión administrativa.</p>
            <div className="admin-form-grid"><label><span>Nombre completo</span><input required value={newUser.name} onChange={(event) => setNewUser({ ...newUser, name: event.target.value })} placeholder="Nombre del usuario" /></label><label><span>Correo</span><input required type="email" value={newUser.email} onChange={(event) => setNewUser({ ...newUser, email: event.target.value })} placeholder="usuario@uniajs.edu.co" /></label><label><span>Rol</span><select value={newUser.role} onChange={(event) => setNewUser({ ...newUser, role: event.target.value })}><option>ESTUDIANTE</option><option>DOCENTE</option><option>ADMINISTRATIVO</option><option>ADMINISTRADOR</option></select></label><label><span>Programa / dependencia</span><input value={newUser.program} onChange={(event) => setNewUser({ ...newUser, program: event.target.value })} placeholder="Programa o dependencia" /></label></div>
            <div className="admin-modal__actions"><button className="button button--secondary" type="button" onClick={() => setShowUserForm(false)}>Cancelar</button><button className="button button--primary" type="submit">Crear usuario</button></div>
          </form>
        </div>
      )}

      {toast && <div className="admin-toast"><Icon name="checkCircle" size={18} /> {toast}</div>}
    </section>
  );
}

export default AdminDashboard;
