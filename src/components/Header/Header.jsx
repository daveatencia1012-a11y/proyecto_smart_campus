import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import ThemeToggle from "../ThemeToggle/ThemeToggle";
import Icon from "../Icon/Icon";
import uajsLogo from "../../assets/uajs-logo.png";

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
    localStorage.removeItem("uniajs-smart-campus-role");
    navigate("/login", { replace: true });
  };

  const role = localStorage.getItem("uniajs-smart-campus-role") || "student";
  const isAdmin = role === "admin";
  const storedUser = localStorage.getItem("uniajs-smart-campus-user") || "Ismael";
  const displayName = storedUser.includes("@") ? storedUser.split("@")[0] : storedUser;
  const initials = displayName.split(/[ ._-]+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("") || "IS";

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
          <img className="brand__logo" src={uajsLogo} alt="UAJS Smart Campus" />
        </Link>
      </div>

      <div className="header__search">
        <span className="header__search-icon" aria-hidden="true">
          <Icon name="search" size={18} />
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
          <Icon name="notifications" size={20} />
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
            <span className="header__avatar">{initials}</span>
            <span className="header__profile-info">
              <strong>{isAdmin ? "Administrador" : displayName}</strong>
              <small>{isAdmin ? "Administrador del sistema" : "Estudiante"}</small>
            </span>
            <Icon name="arrowRight" size={16} className="header__profile-chevron" />
          </button>

          {profileOpen && (
            <div className="profile-menu" role="menu">
              <div className="profile-menu__header">
                <span className="profile-menu__avatar">{initials}</span>
                <div>
                  <strong>{isAdmin ? "Administrador" : displayName}</strong>
                  <small>{isAdmin ? "Administrador del sistema" : "Estudiante"}</small>
                </div>
              </div>
              <div className="profile-menu__divider" />
              <Link to="/profile" className="profile-menu__item" onClick={() => setProfileOpen(false)}>
                <Icon name="profile" size={17} /> Mi perfil
              </Link>
              <Link to="/notifications" className="profile-menu__item" onClick={() => setProfileOpen(false)}>
                <Icon name="notifications" size={18} /> Notificaciones
              </Link>
              {isAdmin && (
                <Link to="/admin" className="profile-menu__item" onClick={() => setProfileOpen(false)}>
                  <Icon name="layout" size={17} /> Panel administrativo
                </Link>
              )}
              {!isAdmin && <Link to="/services" className="profile-menu__item" onClick={() => setProfileOpen(false)}>
                <Icon name="services" size={17} /> Mis servicios
              </Link>}
              <Link to="/requests" className="profile-menu__item" onClick={() => setProfileOpen(false)}>
                <Icon name="check" size={17} /> Mis solicitudes
              </Link>
              <div className="profile-menu__divider" />
              <button type="button" className="profile-menu__logout" onClick={handleLogout}>
                <Icon name="logout" size={17} /> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
