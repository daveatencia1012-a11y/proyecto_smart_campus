import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import useSession from '../hooks/useSession';
import useResource from '../hooks/useResource';
import useInstitution from '../hooks/useInstitution';
import { get } from '../services/api';
import { ROLE_LABELS } from '../services/roles';

export default function RoleDashboard({ operational = false }) {
  const { user, role } = useSession();
  const institution = useInstitution();
  const loader = useCallback(() => get(`/api/dashboard/${operational ? 'operativo' : 'personal'}`), [operational]);
  const { data, error, loading, reload } = useResource(loader);
  const title = operational ? role === 'administrador' ? 'Centro de control' : 'Gestión operativa' : role === 'docente' ? 'Panel docente' : 'Mi Campus';
  const metrics = operational ? [
    ['solicitudes','Solicitudes','/gestion/solicitudes'], ['reservas','Reservas','/gestion/reservas'],
    ['recursos_disponibles','Recursos disponibles','/gestion/recursos'], ['pqrs','PQRS','/gestion/pqrs']
  ] : [
    ['solicitudes','Mis solicitudes','/requests'], ['reservas','Mis reservas','/reservations'],
    ['notificaciones_no_leidas','Avisos sin leer','/notifications'], ['eventos','Eventos visibles en 7 días','/events']
  ];
  return <section className="role-page"><header className="role-page__heading"><div><span className="panel__eyebrow">{ROLE_LABELS[role]} · {institution?.config?.nombre_campus || 'UAJS Smart Campus'}</span><h1>{title}</h1><p>Hola, {user?.nombre}. {operational ? 'Estos indicadores corresponden a la operación global autorizada.' : 'Consulta tu actividad y los servicios disponibles.'}</p></div><button className="button button--secondary" onClick={reload}>Actualizar</button></header>
    {institution?.config?.mensaje_institucional && <p className="role-config-message">{institution.config.mensaje_institucional}</p>}
    {error && <p role="alert" className="role-message">{error}</p>}
    <div className="role-kpis">{metrics.map(([key,label,to]) => <Link className="panel role-kpi" to={to} key={key}><span>{label}</span><strong>{loading ? '…' : data ? data[key] : '—'}</strong></Link>)}</div>
    <div className="role-grid"><article className="panel role-card"><h2>Mi actividad</h2><Link to="/requests">Solicitudes propias</Link><Link to="/reservations">Reservar un recurso</Link><Link to="/pqrs">Mis PQRS</Link><Link to="/calendar">Mi calendario</Link><Link to="/profile">Mi perfil</Link></article>
      <article className="panel role-card"><h2>Campus</h2><Link to="/services">Servicios institucionales</Link><Link to="/resources">Inventario y disponibilidad</Link><Link to="/events">{role === 'docente' ? 'Consultar y publicar mis eventos' : 'Eventos visibles'}</Link><Link to="/notifications">Notificaciones personales</Link></article>
      {operational && <article className="panel role-card"><h2>Gestión autorizada</h2><Link to="/gestion/solicitudes">Atender solicitudes</Link><Link to="/gestion/recursos">Administrar recursos</Link><Link to="/gestion/reservas">Gestionar reservas</Link><Link to="/gestion/pqrs">Responder PQRS</Link><Link to="/gestion/reportes">Reportes operativos</Link></article>}
      {role === 'administrador' && <article className="panel role-card"><h2>Administración del sistema</h2><Link to="/admin/users">Usuarios</Link><Link to="/admin/roles">Roles y permisos</Link><Link to="/admin/services">Catálogo de servicios</Link><Link to="/admin/settings">Configuración institucional</Link><Link to="/admin/monitoring">Estado de los componentes</Link></article>}
    </div>
  </section>;
}
