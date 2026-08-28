import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import ThemeToggle from "../ThemeToggle/ThemeToggle";

function Header({ onMenuClick }) {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const close = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("uajs-smart-campus-auth");
    localStorage.removeItem("uniajs-smart-campus-auth");
    localStorage.removeItem("uajs-smart-campus-user");
    localStorage.removeItem("uniajs-smart-campus-user");
    navigate("/login", { replace: true });
  };

  return (
    <header className="header">
      <div className="header__mobile-brand">
        <button
          className="header__menu"
          type="button"
          onClick={onMenuClick}
          aria-label="Abrir menú"
        >
          <span />
          <span />
          <span />
        </button>

        <Link className="brand brand--compact" to="/dashboard">
          <span className="brand__mark">U</span>
          <span className="brand__name">Uniajs</span>
        </Link>
      </div>

      <div className="header__search">
        <span className="header__search-icon" aria-hidden="true">
          ⌕
        </span>
        <input
          type="search"
          placeholder="Buscar en Smart Campus..."
          aria-label="Buscar en Smart Campus"
        />
        <span className="header__search-shortcut">⌘ K</span>
      </div>

      <div className="header__actions">
        <ThemeToggle />

        <Link
          className="header__notification"
          to="/notifications"
          aria-label="Ver notificaciones"
        >
          <span aria-hidden="true">♧</span>
          <span className="header__notification-dot" />
        </Link>

        <div className="header__profile-wrap" ref={profileRef}>
          <button
            type="button"
            className={`header__profile ${profileOpen ? "header__profile--open" : ""}`}
            onClick={() => setProfileOpen((current) => !current)}
            aria-expanded={profileOpen}
            aria-haspopup="menu"
          >
            <span className="header__avatar">IS</span>
            <span className="header__profile-info">
              <strong>Ismael</strong>
              <small>Estudiante</small>
            </span>
            <span className="header__profile-chevron">⌄</span>
          </button>

          {profileOpen && (
            <div className="profile-menu" role="menu">
              <div className="profile-menu__header">
                <span className="profile-menu__avatar">IS</span>
                <div>
                  <strong>Ismael</strong>
                  <small>Estudiante</small>
                </div>
              </div>
              <div className="profile-menu__divider" />
              <Link to="/profile" className="profile-menu__item" onClick={() => setProfileOpen(false)}>
                <span>♙</span> Mi perfil
              </Link>
              <Link to="/notifications" className="profile-menu__item" onClick={() => setProfileOpen(false)}>
                <span>♧</span> Notificaciones
              </Link>
              <Link to="/services" className="profile-menu__item" onClick={() => setProfileOpen(false)}>
                <span>▦</span> Mis servicios
              </Link>
              <Link to="/requests" className="profile-menu__item" onClick={() => setProfileOpen(false)}>
                <span>✓</span> Mis solicitudes
              </Link>
              <div className="profile-menu__divider" />
              <button type="button" className="profile-menu__logout" onClick={handleLogout}>
                <span>↪</span> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
