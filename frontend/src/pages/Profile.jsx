import { useCallback, useState } from "react";
import useSession from "../hooks/useSession";
import useResource from "../hooks/useResource";
import { get, put } from "../services/api";
import { updateSession } from "../services/session";
import { ROLE_LABELS } from "../services/roles";

function Profile() {
  const { user } = useSession();
  const load = useCallback(() => get(`/api/usuarios/${user.id}`), [user.id]);
  const { data, loading, error, reload } = useResource(load);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const profile = data?.usuario;

  const save = async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (!values.password) delete values.password;
    setSaving(true);
    setMessage("");
    try {
      const result = await put(`/api/usuarios/${user.id}`, values);
      updateSession({ usuario: result.usuario });
      setEditing(false);
      setMessage("Perfil actualizado.");
      await reload();
    } catch (err) {
      if (!err.cancelled) setMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  const name = profile?.nombre || user.nombre || "";

  return (
    <main className="profile-page">
      <section className="profile-page__hero">
        <div>
          <span className="service-page__eyebrow">CUENTA</span>
          <h1>Mi perfil</h1>
          <p>Consulta y actualiza tu información básica. Solo la administración puede cambiar roles y estados.</p>
        </div>
        <button className="service-page__hero-action" type="button" disabled={!profile} onClick={() => { setMessage(""); setEditing((value) => !value); }}>
          {editing ? "Cerrar edición" : "Editar perfil"}
        </button>
      </section>

      {(error || message) && <p className="role-message" role="status">{error || message}</p>}

      {loading ? <p>Cargando perfil…</p> : profile && (
        <section className="profile-page__grid">
          <article className="panel profile-card">
            <div className="profile-card__avatar">{name.charAt(0).toUpperCase()}</div>
            <h2>{name}</h2>
            <span className="profile-card__role">{ROLE_LABELS[profile.rol]}</span>
            <div className="profile-card__line" />
            <div className="profile-card__item"><span>Correo</span><strong>{profile.email}</strong></div>
            <div className="profile-card__item"><span>Miembro desde</span><strong>{new Date(profile.creado_en).toLocaleDateString("es-CO")}</strong></div>
          </article>

          <article className="panel profile-page__details">
            <div className="panel__header"><div><span className="panel__eyebrow">INFORMACIÓN</span><h2>Datos del usuario</h2></div></div>
            {editing ? (
              <form className="profile-form" key={JSON.stringify(profile)} onSubmit={save}>
                <label><span>Nombre</span><input name="nombre" defaultValue={profile.nombre} maxLength={100} required /></label>
                <label><span>Correo</span><input name="email" type="email" defaultValue={profile.email} maxLength={100} required /></label>
                <label><span>Nueva contraseña (opcional)</span><input name="password" type="password" minLength={8} autoComplete="new-password" /></label>
                <button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar cambios"}</button>
              </form>
            ) : (
              <div className="profile-details__grid">
                <div><span>Nombre completo</span><strong>{profile.nombre}</strong></div>
                <div><span>Tipo de usuario</span><strong>{ROLE_LABELS[profile.rol]}</strong></div>
                <div><span>Correo institucional</span><strong>{profile.email}</strong></div>
                <div><span>Estado</span><strong className="profile-details__active">{profile.activo ? "Activo" : "Inactivo"}</strong></div>
              </div>
            )}
          </article>
        </section>
      )}
    </main>
  );
}

export default Profile;
