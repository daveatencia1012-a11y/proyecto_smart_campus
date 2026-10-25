import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import ThemeToggle from "../ThemeToggle/ThemeToggle";
import Icon from "../Icon/Icon";
import uajsLogo from "../../assets/uajs-logo.png";
import { logout } from "../../services/authService";
import useSession from "../../hooks/useSession";
import { ROLE_LABELS } from '../../services/roles';
import useInstitution from '../../hooks/useInstitution';
import useResource from '../../hooks/useResource';
import { get } from '../../services/api';
import { listNotifications, markNotification, markAllNotifications } from '../../services/campusService';

const loadUnread = () => get('/api/notificaciones/no-leidas');
// Preferencias de Configuración (pages/Settings.jsx), guardadas por usuario en este navegador.
const readUiPreferences = (id) => {
  try { return { unreadBadge: true, autoRefresh: true, ...JSON.parse(localStorage.getItem(`uajs-ui-${id}`) || '{}') }; }
  catch { return { unreadBadge: true, autoRefresh: true }; }
};

const NOTIFICATION_ICONS = { solicitud: 'requests', reserva: 'reservations', evento: 'events', pqrs: 'pqrs', sistema: 'alert' };
// Página a la que lleva cada notificación según el registro que la originó.
const notificationTarget = (item) => {
  if (item.referencia_tipo === 'solicitud' && item.referencia_id) return `/requests/${item.referencia_id}`;
  if (item.referencia_tipo === 'reserva' && item.referencia_id) return `/reservations/${item.referencia_id}`;
  if (item.referencia_tipo === 'evento') return '/events';
  if (item.referencia_tipo === 'pqrs') return '/pqrs';
  return '/notifications';
};
const timeAgo = (value) => {
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 1) return 'Hace un momento';
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.round(hours / 24);
  return days < 7 ? `Hace ${days} d` : new Date(value).toLocaleDateString('es-CO');
};

function Header({ onMenuClick }) {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState({ items: [], loading: false, error: '' });
  const notificationsRef = useRef(null);
  const institution = useInstitution();
  const { data:unread, reload:reloadUnread } = useResource(loadUnread);
  useEffect(() => {
    const refresh = () => reloadUnread();
    window.addEventListener('campus-data-changed', refresh);
    return () => window.removeEventListener('campus-data-changed', refresh);
  }, [reloadUnread]);

  useEffect(() => {
    const close = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) setProfileOpen(false);
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) setNotificationsOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const loadNotifications = async () => {
    setNotifications((current) => ({ ...current, loading: true, error: '' }));
    try {
      const items = await listNotifications();
      setNotifications({ items, loading: false, error: '' });
    } catch (err) {
      if (!err.cancelled) setNotifications({ items: [], loading: false, error: err.message || 'No fue posible cargar las notificaciones.' });
    }
  };

  const toggleNotifications = () => {
    if (!notificationsOpen) loadNotifications();
    setProfileOpen(false);
    setNotificationsOpen((current) => !current);
  };

  const openNotification = async (item) => {
    setNotificationsOpen(false);
    if (!item.leida) {
      try { await markNotification(item.id); } catch { /* la navegación continúa aunque falle */ }
    }
    navigate(notificationTarget(item));
  };

  const markAllAsRead = async () => {
    try {
      await markAllNotifications();
      await loadNotifications();
    } catch (err) {
      if (!err.cancelled) setNotifications((current) => ({ ...current, error: err.message }));
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const { user, role, isAdmin } = useSession();
  const [uiPrefs, setUiPrefs] = useState(() => readUiPreferences(user?.id));
  useEffect(() => {
    const sync = () => setUiPrefs(readUiPreferences(user?.id));
    window.addEventListener('campus-preferences-changed', sync);
    return () => window.removeEventListener('campus-preferences-changed', sync);
  }, [user?.id]);
  useEffect(() => {
    if (!uiPrefs.autoRefresh) return undefined;
    const timer = window.setInterval(reloadUnread, 60000);
    return () => window.clearInterval(timer);
  }, [uiPrefs.autoRefresh, reloadUnread]);
  const storedUser = user?.nombre || "Usuario";
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
        <strong>{institution?.config?.nombre_campus || 'UAJS Smart Campus'}</strong>
      </div>

      <div className="header__actions">
        <ThemeToggle />

        <div className="header__notification-wrap" ref={notificationsRef}>
          <button
            className={`header__notification ${notificationsOpen ? "header__notification--open" : ""}`}
            type="button"
            onClick={toggleNotifications}
            aria-label="Ver notificaciones"
            aria-expanded={notificationsOpen}
            aria-haspopup="dialog"
          >
            <Icon name="notifications" size={20} />
            {uiPrefs.unreadBadge && unread?.no_leidas > 0 && <span className="header__notification-dot" />}
          </button>

          {notificationsOpen && (
            <div className="notifications-menu" role="dialog" aria-label="Notificaciones recientes">
              <div className="notifications-menu__header">
                <div>
                  <strong>Notificaciones</strong>
                  <small>{unread?.no_leidas ? `${unread.no_leidas} sin leer` : "Estás al día"}</small>
                </div>
                {unread?.no_leidas > 0 && (
                  <button type="button" className="notifications-menu__mark" onClick={markAllAsRead}>
                    Marcar todas como leídas
                  </button>
                )}
              </div>

              <div className="notifications-menu__list">
                {notifications.loading && !notifications.items.length ? (
                  <p className="notifications-menu__empty">Cargando…</p>
                ) : notifications.error ? (
                  <p className="notifications-menu__empty">{notifications.error}</p>
                ) : notifications.items.length ? (
                  notifications.items.slice(0, 5).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`notifications-menu__item ${item.leida ? "" : "notifications-menu__item--unread"}`}
                      onClick={() => openNotification(item)}
                    >
                      <span className="notifications-menu__icon"><Icon name={NOTIFICATION_ICONS[item.tipo] || "notifications"} size={16} /></span>
                      <span className="notifications-menu__copy">
                        <strong>{item.titulo}</strong>
                        <span>{item.mensaje}</span>
                        <small>{timeAgo(item.fecha_creacion)}</small>
                      </span>
                      {!item.leida && <i className="notifications-menu__dot" aria-label="Sin leer" />}
                    </button>
                  ))
                ) : (
                  <p className="notifications-menu__empty">No tienes notificaciones.</p>
                )}
              </div>

              <Link to="/notifications" className="notifications-menu__footer" onClick={() => setNotificationsOpen(false)}>
                Ver todas las notificaciones <Icon name="arrowRight" size={15} />
              </Link>
            </div>
          )}
        </div>

        <div className="header__profile-wrap" ref={profileRef}>
          <button
            type="button"
            className={`header__profile ${profileOpen ? "header__profile--open" : ""}`}
            onClick={() => { setNotificationsOpen(false); setProfileOpen((current) => !current); }}
            aria-expanded={profileOpen}
            aria-haspopup="menu"
          >
            <span className="header__avatar">{initials}</span>
            <span className="header__profile-info">
              <strong>{displayName}</strong>
              <small>{ROLE_LABELS[role]}</small>
            </span>
            <Icon name="arrowRight" size={16} className="header__profile-chevron" />
          </button>

          {profileOpen && (
            <div className="profile-menu" role="menu">
              <div className="profile-menu__header">
                <span className="profile-menu__avatar">{initials}</span>
                <div>
                  <strong>{displayName}</strong>
                  <small>{ROLE_LABELS[role]}</small>
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
