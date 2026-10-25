import { useCallback, useState } from 'react';
import useSession from '../hooks/useSession';
import useResource from '../hooks/useResource';
import { get, put } from '../services/api';
import { updateSession } from '../services/session';
import { ROLE_LABELS } from '../services/roles';
export default function Profile() {
  const { user } = useSession();
  const load = useCallback(() => get(`/api/usuarios/${user.id}`), [user.id]);
  const { data, loading, error, reload } = useResource(load);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  async function save(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (!values.password) delete values.password;
    setSaving(true); setMessage('');
    try {
      const result = await put(`/api/usuarios/${user.id}`, values);
      updateSession({ usuario:result.usuario });
      setMessage('Perfil actualizado.'); await reload();
    } catch (err) { if (!err.cancelled) setMessage(err.message); }
    finally { setSaving(false); }
  }
  const profile = data?.usuario;
  return <section className="role-page"><h1>Mi perfil</h1><p>Tu rol es {ROLE_LABELS[profile?.rol || user.rol]}. Solo administración puede modificar roles y estados.</p>
    {(error || message) && <p className="role-message" role="status">{error || message}</p>}
    {loading ? <p>Cargando…</p> : profile && <form key={JSON.stringify(profile)} className="panel role-configuration" onSubmit={save}>
      <label>Nombre<input name="nombre" defaultValue={profile.nombre} maxLength={100} required/></label>
      <label>Correo<input name="email" type="email" defaultValue={profile.email} maxLength={100} required/></label>
      <label>Nueva contraseña (opcional)<input name="password" type="password" minLength={8} autoComplete="new-password"/></label>
      <button className="button button--primary" disabled={saving}>Guardar mi información</button>
    </form>}
  </section>;
}
