import { useState } from 'react';
import Icon from '../components/Icon/Icon';
import useInstitution from '../hooks/useInstitution';
import { saveConfiguration } from '../services/campusService';

const LIMITS = { nombre_campus: 120, correo_contacto: 254, mensaje_institucional: 1000 };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PROTECTED = [
  ['shield', 'Claves JWT y secretos', 'Se definen en las variables de entorno del servidor.'],
  ['profile', 'Credenciales de usuarios', 'Cada usuario las gestiona desde su perfil.'],
  ['settings', 'Reglas operativas', 'Horarios de reserva y vigencia de sesiones se configuran en el backend.'],
];

function validate(values) {
  const errors = {};
  if (!values.nombre_campus.trim()) errors.nombre_campus = 'El nombre del campus es obligatorio.';
  if (values.correo_contacto.trim() && !EMAIL.test(values.correo_contacto.trim())) errors.correo_contacto = 'Escribe un correo válido, por ejemplo contacto@uniajs.edu.co.';
  return errors;
}

function SettingsForm({ config, onSave }) {
  const initial = {
    nombre_campus: config.nombre_campus || '',
    correo_contacto: config.correo_contacto || '',
    mensaje_institucional: config.mensaje_institucional || '',
  };
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const dirty = Object.keys(initial).some((key) => values[key] !== initial[key]);

  const change = (key) => (event) => {
    setValues((current) => ({ ...current, [key]: event.target.value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: '' }));
  };

  async function submit(event) {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length || saving) return;
    setSaving(true);
    try { await onSave(values); } finally { setSaving(false); }
  }

  const field = (key) => ({
    id: `config-${key}`, value: values[key], onChange: change(key), maxLength: LIMITS[key],
    'aria-invalid': Boolean(errors[key]), 'aria-describedby': `config-${key}-help`,
  });
  const help = (key, text) => (
    <small id={`config-${key}-help`} className={errors[key] ? 'field-error' : 'settings-view__help'} role={errors[key] ? 'alert' : undefined}>
      {errors[key] || text}
    </small>
  );

  return (
    <div className="settings-view__layout">
      <form className="settings-view__form" onSubmit={submit} noValidate>
        <section className="settings-view__section">
          <header>
            <span className="settings-view__section-icon"><Icon name="building" size={18} /></span>
            <div><h2>Identidad</h2><p>Nombre con el que se presenta la plataforma en el encabezado.</p></div>
          </header>
          <label htmlFor="config-nombre_campus">
            <span>Nombre del campus *<em>{values.nombre_campus.length}/{LIMITS.nombre_campus}</em></span>
            <input {...field('nombre_campus')} placeholder="Ej. UAJS Smart Campus" />
          </label>
          {help('nombre_campus', 'Se muestra a todos los usuarios en la parte superior de la aplicación.')}
        </section>

        <section className="settings-view__section">
          <header>
            <span className="settings-view__section-icon"><Icon name="mail" size={18} /></span>
            <div><h2>Contacto</h2><p>Canal oficial para que la comunidad resuelva dudas.</p></div>
          </header>
          <label htmlFor="config-correo_contacto">
            <span>Correo de contacto</span>
            <input {...field('correo_contacto')} type="email" placeholder="contacto@uniajs.edu.co" />
          </label>
          {help('correo_contacto', 'Opcional. Usa un correo institucional, no uno personal.')}
        </section>

        <section className="settings-view__section">
          <header>
            <span className="settings-view__section-icon"><Icon name="info" size={18} /></span>
            <div><h2>Mensaje institucional</h2><p>Aviso general para la comunidad universitaria.</p></div>
          </header>
          <label htmlFor="config-mensaje_institucional">
            <span>Mensaje<em>{values.mensaje_institucional.length}/{LIMITS.mensaje_institucional}</em></span>
            <textarea {...field('mensaje_institucional')} rows="5" placeholder="Ej. Bienvenidos al período académico 2026-2." />
          </label>
          {help('mensaje_institucional', 'Opcional. Escribe un mensaje breve y claro.')}
        </section>

        <footer className="settings-view__actions">
          <span className={dirty ? 'settings-view__dirty' : 'settings-view__saved'}>
            <Icon name={dirty ? 'edit' : 'checkCircle'} size={15} />
            {dirty ? 'Tienes cambios sin guardar' : 'Todo está guardado'}
          </span>
          <div>
            <button type="button" className="button button--secondary" disabled={!dirty || saving} onClick={() => { setValues(initial); setErrors({}); }}>
              Descartar
            </button>
            <button type="submit" className="button button--primary" disabled={!dirty || saving}>
              <Icon name="check" size={16} /> {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </footer>
      </form>

      <aside className="settings-view__aside">
        <article className="settings-view__preview">
          <span className="panel__eyebrow">VISTA PREVIA</span>
          <div className="settings-view__preview-bar">
            <span className="settings-view__preview-logo"><Icon name="building" size={16} /></span>
            <strong>{values.nombre_campus.trim() || 'UAJS Smart Campus'}</strong>
          </div>
          {values.mensaje_institucional.trim() ? (
            <p className="settings-view__preview-message"><Icon name="info" size={15} /> {values.mensaje_institucional.trim()}</p>
          ) : (
            <p className="settings-view__preview-empty">Sin mensaje institucional.</p>
          )}
          <p className="settings-view__preview-contact">
            <Icon name="mail" size={15} /> {values.correo_contacto.trim() || 'Sin correo de contacto'}
          </p>
        </article>

        <article className="settings-view__protected">
          <h2><Icon name="shield" size={17} /> No se edita desde aquí</h2>
          <ul>
            {PROTECTED.map(([icon, title, text]) => (
              <li key={title}>
                <span><Icon name={icon} size={15} /></span>
                <div><strong>{title}</strong><small>{text}</small></div>
              </li>
            ))}
          </ul>
        </article>
      </aside>
    </div>
  );
}

export default function InstitutionSettings() {
  const { config, loading, error, reload } = useInstitution();
  const [notice, setNotice] = useState(null);

  async function save(values) {
    setNotice(null);
    try {
      await saveConfiguration(values);
      setNotice({ type: 'success', text: 'Configuración guardada. Los cambios ya son visibles para todos los usuarios.' });
      reload();
    } catch (err) {
      if (!err.cancelled) setNotice({ type: 'error', text: err.message });
    }
  }

  return (
    <section className="role-page settings-view">
      <header className="settings-view__heading">
        <span className="panel__eyebrow">ADMINISTRACIÓN</span>
        <h1>Configuración institucional</h1>
        <p>Datos públicos de la institución que se muestran en la plataforma. Los secretos, credenciales y reglas operativas no se editan desde esta interfaz.</p>
      </header>

      {notice && (
        <p className={`settings-view__notice settings-view__notice--${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}>
          <Icon name={notice.type === 'error' ? 'alert' : 'checkCircle'} size={17} /> {notice.text}
        </p>
      )}

      {loading ? (
        <p className="settings-view__loading" role="status">Cargando configuración…</p>
      ) : error || !config ? (
        <div className="settings-view__notice settings-view__notice--error" role="alert">
          <Icon name="alert" size={17} /> {error || 'No fue posible cargar la configuración.'}
          <button type="button" className="button button--secondary" onClick={reload}>Reintentar</button>
        </div>
      ) : (
        <SettingsForm key={JSON.stringify(config)} config={config} onSave={save} />
      )}
    </section>
  );
}
