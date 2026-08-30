import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon/Icon";
import useTheme from "../hooks/useTheme";
import useLocalStorage from "../hooks/useLocalStorage";

const defaultPreferences = {
  notifications: true,
  emailNotifications: true,
  compactMode: false,
  autoRefresh: true,
  reducedMotion: false,
};

function Settings() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [preferences, setPreferences] = useLocalStorage(
    "uajs_preferences",
    defaultPreferences
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.compact = preferences.compactMode ? "true" : "false";
    document.documentElement.dataset.reducedMotion = preferences.reducedMotion ? "true" : "false";
  }, [preferences.compactMode, preferences.reducedMotion]);

  const updatePreference = (key) => {
    setPreferences((current) => ({ ...current, [key]: !current[key] }));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1400);
  };

  const handleTheme = (nextTheme) => {
    setTheme(nextTheme);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1400);
  };

  const resetDemoData = () => {
    const confirmed = window.confirm(
      "¿Restablecer los datos de demostración? Se perderán los cambios locales de solicitudes, reservas, eventos, notificaciones y perfil."
    );
    if (!confirmed) return;

    [
      "uajs_profile",
      "uajs_requests",
      "uajs_reservations",
      "uajs_events",
      "uajs_notifications",
      "uajs_preferences",
    ].forEach((key) => localStorage.removeItem(key));

    window.location.reload();
  };

  const logout = () => {
    localStorage.removeItem("uajs-smart-campus-auth");
    localStorage.removeItem("uniajs-smart-campus-auth");
    localStorage.removeItem("uajs-smart-campus-user");
    localStorage.removeItem("uniajs-smart-campus-user");
    navigate("/login", { replace: true });
  };

  return (
    <main className="settings-page">
      <section className="settings-page__hero">
        <div>
          <span className="service-page__eyebrow">PREFERENCIAS</span>
          <h1>Configuración</h1>
          <p>
            Personaliza tu experiencia en Smart Campus, controla las
            notificaciones y administra las preferencias de esta sesión.
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
                <p>Controla qué avisos quieres recibir.</p>
              </div>
            </div>

            <div className="settings-list">
              <PreferenceRow
                icon="notifications"
                title="Notificaciones dentro de la plataforma"
                description="Recibe avisos sobre solicitudes, reservas, eventos y cambios importantes."
                enabled={preferences.notifications}
                onChange={() => updatePreference("notifications")}
              />
              <PreferenceRow
                icon="mail"
                title="Comunicaciones por correo"
                description="Permite recibir confirmaciones y novedades en tu correo institucional."
                enabled={preferences.emailNotifications}
                onChange={() => updatePreference("emailNotifications")}
              />
              <PreferenceRow
                icon="refresh"
                title="Actualizar actividad automáticamente"
                description="Mantiene los indicadores de la plataforma sincronizados durante la sesión."
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

            <button className="settings-action" type="button" onClick={() => navigate("/profile")}>
              <Icon name="profile" size={17} />
              <span><strong>Mi perfil</strong><small>Actualizar información personal</small></span>
              <Icon name="arrowRight" size={15} />
            </button>
            <button className="settings-action" type="button" onClick={() => navigate("/notifications")}>
              <Icon name="notifications" size={17} />
              <span><strong>Notificaciones</strong><small>Revisar actividad reciente</small></span>
              <Icon name="arrowRight" size={15} />
            </button>
            <button className="settings-action" type="button" onClick={() => navigate("/calendar")}>
              <Icon name="calendar" size={17} />
              <span><strong>Mi calendario</strong><small>Consultar agenda universitaria</small></span>
              <Icon name="arrowRight" size={15} />
            </button>
          </article>

          <article className="panel settings-card">
            <div className="settings-card__header">
              <span className="settings-card__icon"><Icon name="shield" size={20} /></span>
              <div>
                <span className="panel__eyebrow">DATOS</span>
                <h2>Sesión y demostración</h2>
                <p>Esta versión utiliza almacenamiento local para simular persistencia.</p>
              </div>
            </div>
            <div className="settings-info">
              <div><span>Estado</span><strong><i /> Sesión activa</strong></div>
              <div><span>Entorno</span><strong>Prototipo académico</strong></div>
              <div><span>Persistencia</span><strong>LocalStorage</strong></div>
            </div>
            <button className="settings-danger" type="button" onClick={resetDemoData}>
              <Icon name="trash" size={17} />
              Restablecer datos de demostración
            </button>
            <button className="settings-logout" type="button" onClick={logout}>
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
