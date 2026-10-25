import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon/Icon";
import useTheme from "../hooks/useTheme";
import useLocalStorage from "../hooks/useLocalStorage";
import useSession from "../hooks/useSession";
import { logout } from "../services/authService";
import { ROLE_LABELS, STAFF, EVENT_EDITORS } from "../services/roles";

// Preferencias visuales por usuario; se guardan solo en este navegador.
// Header y DashboardLayout leen la misma clave y escuchan el evento de cambio.
const defaultPreferences = {
  unreadBadge: true,
  autoRefresh: true,
  compactMode: false,
  reducedMotion: false,
};

function Settings() {
  const navigate = useNavigate();
  const { user, role } = useSession();
  const { theme, setTheme } = useTheme();
  const [stored, setPreferences] = useLocalStorage(`uajs-ui-${user.id}`, defaultPreferences);
  const preferences = { ...defaultPreferences, ...stored };
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.compact = preferences.compactMode ? "true" : "false";
    document.documentElement.dataset.reducedMotion = preferences.reducedMotion ? "true" : "false";
    window.dispatchEvent(new Event("campus-preferences-changed"));
  }, [preferences.compactMode, preferences.reducedMotion, preferences.unreadBadge, preferences.autoRefresh]);

  const flashSaved = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1400);
  };

  const updatePreference = (key) => {
    setPreferences((current) => ({ ...defaultPreferences, ...current, [key]: !({ ...defaultPreferences, ...current })[key] }));
    flashSaved();
  };

  const handleTheme = (nextTheme) => {
    setTheme(nextTheme);
    flashSaved();
  };

  const resetPreferences = () => {
    if (!window.confirm("¿Restablecer las preferencias de esta cuenta en este navegador? Tus datos del campus no se modifican.")) return;
    setPreferences(defaultPreferences);
    setTheme("light");
    flashSaved();
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const shortcuts = [
    { icon: "profile", title: "Mi perfil", text: "Actualizar información personal y contraseña", to: "/profile" },
    { icon: "notifications", title: "Notificaciones", text: "Revisar actividad reciente", to: "/notifications" },
    { icon: "calendar", title: "Mi calendario", text: "Consultar agenda universitaria", to: "/calendar" },
    ...(EVENT_EDITORS.includes(role) ? [{ icon: "events", title: "Mis eventos", text: "Publicar y editar eventos académicos", to: "/events" }] : []),
    ...(STAFF.includes(role) ? [{ icon: "file", title: "Reportes operativos", text: "Indicadores y exportaciones del período", to: "/gestion/reportes" }] : []),
    ...(role === "administrador" ? [
      { icon: "building", title: "Configuración institucional", text: "Nombre del campus, contacto y mensaje", to: "/admin/settings" },
      { icon: "shield", title: "Usuarios y roles", text: "Administrar cuentas y permisos", to: "/admin/users" },
    ] : []),
  ];

  return (
    <main className="settings-page">
      <section className="settings-page__hero">
        <div>
          <span className="service-page__eyebrow">PREFERENCIAS</span>
          <h1>Configuración</h1>
          <p>
            Personaliza tu experiencia en Smart Campus, controla los avisos
            y administra las preferencias de tu cuenta en este navegador.
          </p>
        </div>
        {saved && (
          <div className="settings-page__saved" role="status">
            <Icon name="checkCircle" size={17} />
            Cambios guardados
          </div>
        )}
      </section>

      <div className="settings-page__layout">
        <section className="settings-page__main">
          <article className="panel settings-card">
            <div className="settings-card__header">
              <span className="settings-card__icon"><Icon name="settings" size={20} /></span>
              <div>
                <span className="panel__eyebrow">APARIENCIA</span>
                <h2>Tema de la plataforma</h2>
                <p>Elige cómo quieres visualizar Smart Campus.</p>
              </div>
            </div>

            <div className="settings-theme">
              <button
                type="button"
                className={`settings-theme__option ${theme === "light" ? "settings-theme__option--active" : ""}`}
                onClick={() => handleTheme("light")}
              >
                <span className="settings-theme__preview settings-theme__preview--light">
                  <span />
                  <i /><i /><i />
                </span>
                <strong>Modo claro</strong>
                <small>Interfaz luminosa para espacios con buena iluminación.</small>
              </button>
              <button
                type="button"
                className={`settings-theme__option ${theme === "dark" ? "settings-theme__option--active" : ""}`}
                onClick={() => handleTheme("dark")}
              >
                <span className="settings-theme__preview settings-theme__preview--dark">
                  <span />
                  <i /><i /><i />
                </span>
                <strong>Modo oscuro</strong>
                <small>Reduce el brillo y mejora la lectura nocturna.</small>
              </button>
            </div>
          </article>

          <article className="panel settings-card">
            <div className="settings-card__header">
              <span className="settings-card__icon"><Icon name="notifications" size={20} /></span>
              <div>
                <span className="panel__eyebrow">COMUNICACIONES</span>
                <h2>Notificaciones</h2>
                <p>Controla cómo te avisa la plataforma.</p>
              </div>
            </div>

            <div className="settings-list">
              <PreferenceRow
                icon="notifications"
                title="Indicador de avisos sin leer"
                description="Muestra un punto en la campana del encabezado cuando tienes notificaciones pendientes."
                enabled={preferences.unreadBadge}
                onChange={() => updatePreference("unreadBadge")}
              />
              <PreferenceRow
                icon="refresh"
                title="Actualizar avisos automáticamente"
                description="Consulta nuevas notificaciones cada minuto mientras usas la plataforma."
                enabled={preferences.autoRefresh}
                onChange={() => updatePreference("autoRefresh")}
              />
            </div>
          </article>

          <article className="panel settings-card">
            <div className="settings-card__header">
              <span className="settings-card__icon"><Icon name="layout" size={20} /></span>
              <div>
                <span className="panel__eyebrow">EXPERIENCIA</span>
                <h2>Preferencias de interfaz</h2>
                <p>Ajusta la densidad y las animaciones de la interfaz.</p>
              </div>
            </div>

            <div className="settings-list">
              <PreferenceRow
                icon="layout"
                title="Vista compacta"
                description="Reduce espacios y permite visualizar más información en cada pantalla."
                enabled={preferences.compactMode}
                onChange={() => updatePreference("compactMode")}
              />
              <PreferenceRow
                icon="spark"
                title="Reducir animaciones"
                description="Minimiza las transiciones visuales para una navegación más discreta."
                enabled={preferences.reducedMotion}
                onChange={() => updatePreference("reducedMotion")}
              />
            </div>
          </article>
        </section>

        <aside className="settings-page__side">
          <article className="panel settings-card settings-card--account">
            <div className="settings-card__header">
              <span className="settings-card__icon"><Icon name="profile" size={20} /></span>
              <div>
                <span className="panel__eyebrow">CUENTA</span>
                <h2>Accesos rápidos</h2>
              </div>
            </div>

            {shortcuts.map((item) => (
              <button key={item.to} className="settings-action" type="button" onClick={() => navigate(item.to)}>
                <Icon name={item.icon} size={17} />
                <span><strong>{item.title}</strong><small>{item.text}</small></span>
                <Icon name="arrowRight" size={15} />
              </button>
            ))}
          </article>

          <article className="panel settings-card">
            <div className="settings-card__header">
              <span className="settings-card__icon"><Icon name="shield" size={20} /></span>
              <div>
                <span className="panel__eyebrow">SEGURIDAD</span>
                <h2>Sesión y cuenta</h2>
                <p>Tus datos se guardan en el servidor; la sesión se renueva automáticamente.</p>
              </div>
            </div>
            <div className="settings-info">
              <div><span>Estado</span><strong><i /> Sesión activa</strong></div>
              <div><span>Rol</span><strong>{ROLE_LABELS[role]}</strong></div>
              <div><span>Correo</span><strong>{user.email}</strong></div>
              <div><span>Persistencia</span><strong>Servidor (MySQL)</strong></div>
            </div>
            <button className="settings-danger" type="button" onClick={resetPreferences}>
              <Icon name="refresh" size={17} />
              Restablecer preferencias
            </button>
            <button className="settings-logout" type="button" onClick={handleLogout}>
              <Icon name="logout" size={17} />
              Cerrar sesión
            </button>
          </article>
        </aside>
      </div>
    </main>
  );
}

function PreferenceRow({ icon, title, description, enabled, onChange }) {
  return (
    <div className="settings-row">
      <span className="settings-row__icon"><Icon name={icon} size={17} /></span>
      <div className="settings-row__copy">
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      <button
        className={`settings-switch ${enabled ? "settings-switch--on" : ""}`}
        type="button"
        onClick={onChange}
        role="switch"
        aria-checked={enabled}
        aria-label={`${title}: ${enabled ? "activado" : "desactivado"}`}
      >
        <span />
      </button>
    </div>
  );
}

export default Settings;
