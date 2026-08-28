import { NavLink, Link } from "react-router-dom";

const navigation = [
  { to: "/dashboard", icon: "⌂", label: "Dashboard" },
  { to: "/services", icon: "✦", label: "Servicios" },
  { to: "/requests", icon: "▤", label: "Solicitudes" },
  { to: "/reservations", icon: "□", label: "Reservas" },
  { to: "/events", icon: "◈", label: "Eventos" },
  { to: "/notifications", icon: "♧", label: "Notificaciones" },
  { to: "/resources", icon: "▣", label: "Recursos" },
  { to: "/pqrs", icon: "✎", label: "PQRS" },
];

function Sidebar({ isOpen, onClose }) {
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
            <span className="brand__mark">U</span>

            <span>
              <strong className="brand__name">Uniajs</strong>
              <small className="brand__caption">SMART CAMPUS</small>
            </span>
          </Link>

          <button
            className="sidebar__close"
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            ×
          </button>
        </div>

        <div className="sidebar__label">MENÚ PRINCIPAL</div>

        <nav className="sidebar__nav">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `sidebar__link ${isActive ? "sidebar__link--active" : ""}`
              }
            >
              <span className="sidebar__icon" aria-hidden="true">
                {item.icon}
              </span>

              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__divider" />

        <div className="sidebar__label">CUENTA</div>

        <nav className="sidebar__nav">
          <NavLink
            to="/profile"
            onClick={onClose}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? "sidebar__link--active" : ""}`
            }
          >
            <span className="sidebar__icon" aria-hidden="true">
              ◯
            </span>
            <span>Mi perfil</span>
          </NavLink>
        </nav>

        <div className="sidebar__help">
          <div className="sidebar__help-icon">?</div>
          <div>
            <strong>¿Necesitas ayuda?</strong>
            <p>Consulta soporte de Smart Campus.</p>
          </div>
        </div>

        <div className="sidebar__footer">
          <span>v1.0 · Proyecto académico</span>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
