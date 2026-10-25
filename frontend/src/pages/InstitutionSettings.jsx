import { useState } from 'react';
import useInstitution from '../hooks/useInstitution';
import { saveConfiguration } from '../services/campusService';

export default function InstitutionSettings() {
  const { config, loading, error, reload } = useInstitution();
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  async function save(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setSaving(true); setMessage('');
    try { await saveConfiguration(values); await reload(); setMessage('Configuración guardada en el servidor.'); }
    catch (err) { if (!err.cancelled) setMessage(err.message); }
    finally { setSaving(false); }
  }
  return <section className="role-page"><h1>Configuración institucional</h1><p>Solo datos institucionales. Las claves JWT, credenciales y reglas operativas no se editan desde esta interfaz.</p>
    {(error || message) && <p className="role-message" role="status">{error || message}</p>}
    {loading ? <p>Cargando…</p> : config && <form className="panel role-configuration" key={JSON.stringify(config)} onSubmit={save}>
      <label>Nombre del campus<input name="nombre_campus" defaultValue={config.nombre_campus} maxLength={120} required/></label>
      <label>Correo de contacto<input name="correo_contacto" type="email" defaultValue={config.correo_contacto} maxLength={254}/></label>
      <label>Mensaje institucional<textarea name="mensaje_institucional" defaultValue={config.mensaje_institucional} maxLength={1000}/></label>
      <button className="button button--primary" disabled={saving}>Guardar configuración</button>
    </form>}
  </section>;
}
