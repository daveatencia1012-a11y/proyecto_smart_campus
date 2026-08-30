import { NavLink, Link } from "react-router-dom";
import Icon from "../Icon/Icon";
import uajsLogo from "../../assets/uajs-logo.png";

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
  { to: "/admin/dependencies", icon: "building", label: "Dependencias" },
  { to: "/admin/services", icon: "services", label: "Servicios" },
  { to: "/admin/requests", icon: "requests", label: "Solicitudes" },
  { to: "/admin/reservations", icon: "reservations", label: "Reservas" },
  { to: "/admin/resources", icon: "resources", label: "Recursos" },
  { to: "/admin/events", icon: "events", label: "Eventos" },
  { to: "/admin/notifications", icon: "notifications", label: "Notificaciones" },
  { to: "/admin/pqrs", icon: "pqrs", label: "PQRS" },
  { to: "/admin/monitoring", icon: "monitor", label: "Estado del sistema" },
  { to: "/admin/audit", icon: "file", label: "Auditoría" },
  { to: "/admin/settings", icon: "settings", label: "Configuración admin" },
];

const accountNavigation = [
  { to: "/profile", icon: "profile", label: "Mi perfil" },
  { to: "/settings", icon: "settings", label: "Configuración" },
  { to: "/help", icon: "help", label: "Centro de ayuda" },
];

function Sidebar({ isOpen, onClose }) {
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
          <Link className="brand" to="/dashboard" onClick={onClose}>
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
            {navigation.map(renderLink)}
          </nav>

          {localStorage.getItem("uniajs-smart-campus-role") === "admin" && (
            <>
              <div className="sidebar__divider" />
              <div className="sidebar__label">ADMINISTRACIÓN</div>
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
            <span>v2.0 · Centro de control</span>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
