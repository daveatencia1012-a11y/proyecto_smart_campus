import { NavLink, Link } from "react-router-dom";
import Icon from "../Icon/Icon";
import uajsLogo from "../../assets/uajs-logo.png";
import useSession from "../../hooks/useSession";
import { homeForRole, ROLE_LABELS } from '../../services/roles';

const navigation = [
  { to: "/dashboard", icon: "home", label: "Dashboard" },
  { to: "/services", icon: "services", label: "Servicios" },
  { to: "/requests", icon: "requests", label: "Solicitudes" },
  { to: "/reservations", icon: "reservations", label: "Reservas" },
  { to: "/events", icon: "events", label: "Eventos" },
  { to: "/calendar", icon: "calendar", label: "Calendario" },
  { to: "/notifications", icon: "notifications", label: "Notificaciones" },
  { to: "/resources", icon: "resources", label: "Recursos" },
  { to: "/pqrs", icon: "pqrs", label: "PQRS" },
];

const adminNavigation = [
  { to: "/admin", icon: "layout", label: "Centro de control" },
  { to: "/admin/analytics", icon: "services", label: "Analítica" },
  { to: "/admin/users", icon: "profile", label: "Usuarios" },
  { to: "/admin/roles", icon: "shield", label: "Roles y permisos" },
  { to: "/admin/services", icon: "services", label: "Servicios" },
  { to: "/admin/events", icon: "events", label: "Eventos" },
  { to: "/admin/monitoring", icon: "monitor", label: "Estado del sistema" },
  { to: "/admin/settings", icon: "settings", label: "Configuración admin" },
];

const managementNavigation = [
  { to:'/gestion', icon:'layout', label:'Resumen operativo' },
  { to:'/gestion/solicitudes', icon:'requests', label:'Atender solicitudes' },
  { to:'/gestion/reservas', icon:'reservations', label:'Gestionar reservas' },
  { to:'/gestion/recursos', icon:'resources', label:'Administrar recursos' },
  { to:'/gestion/pqrs', icon:'pqrs', label:'Atender PQRS' },
  { to:'/gestion/reportes', icon:'file', label:'Reportes operativos' }
];

const accountNavigation = [
  { to: "/profile", icon: "profile", label: "Mi perfil" },
  { to: "/settings", icon: "settings", label: "Configuración" },
  { to: "/help", icon: "help", label: "Centro de ayuda" },
];

function Sidebar({ isOpen, onClose }) {
  const { isAdmin, isStaff, role } = useSession();

  const renderLink = (item) => (
    <NavLink
      key={item.to}
      to={item.to}
      onClick={onClose}
      className={({ isActive }) =>
        `sidebar__link ${isActive ? "sidebar__link--active" : ""}`
      }
    >
      <span className="sidebar__icon" aria-hidden="true">
        <Icon name={item.icon} size={18} />
      </span>
      <span>{item.label}</span>
    </NavLink>
  );

  return (
    <>
      <button
        className={`sidebar-overlay ${isOpen ? "sidebar-overlay--visible" : ""}`}
        type="button"
        aria-label="Cerrar menú"
        onClick={onClose}
      />

      <aside className={`sidebar ${isOpen ? "sidebar--open" : ""}`}>
        <div className="sidebar__top">
          <Link className="brand" to={homeForRole(role)} onClick={onClose}>
            <img
              className="brand__logo"
              src={uajsLogo}
              alt="Corporación Universitaria Antonio José de Sucre"
            />
          </Link>

          <button
            className="sidebar__close"
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="sidebar__scroll">
          <div className="sidebar__label">MENÚ PRINCIPAL</div>
          <nav className="sidebar__nav" aria-label="Menú principal">
            {navigation.map(item => renderLink(item.to === '/dashboard' ? { ...item, to:homeForRole(role), label:role === 'docente' ? 'Panel docente' : 'Mi Campus' } : item))}
          </nav>

          {isStaff && <><div className="sidebar__divider"/><div className="sidebar__label">GESTIÓN OPERATIVA</div><nav className="sidebar__nav" aria-label="Gestión operativa">{managementNavigation.map(renderLink)}</nav></>}
          {isAdmin && (
            <>
              <div className="sidebar__divider" />
              <div className="sidebar__label">ADMINISTRACIÓN DEL SISTEMA</div>
              <nav className="sidebar__nav" aria-label="Administración">
                {adminNavigation.map(renderLink)}
              </nav>
            </>
          )}

          <div className="sidebar__divider" />

          <div className="sidebar__label">CUENTA</div>
          <nav className="sidebar__nav" aria-label="Cuenta">
            {accountNavigation.map(renderLink)}
          </nav>
        </div>

        <div className="sidebar__bottom">
          <div className="sidebar__help">
            <div className="sidebar__help-icon">
              <Icon name="help" size={18} />
            </div>
            <div>
              <strong>¿Necesitas ayuda?</strong>
              <p>Consulta el centro de ayuda de Smart Campus.</p>
            </div>
          </div>

          <div className="sidebar__footer">
            <span>UAJS · {ROLE_LABELS[role]}</span>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
