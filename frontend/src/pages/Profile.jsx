import { useState } from "react";
import useLocalStorage from "../hooks/useLocalStorage";

const defaultProfile = {
  name: "Ismael",
  role: "Estudiante",
  program: "Ingeniería de Sistemas",
  dependency: "Facultad de Ciencias de la Computación",
  email: "ismael.estudiante@uajs.edu.co",
};

function Profile() {
  const [profile, setProfile] = useLocalStorage("uajs_profile", defaultProfile);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);

  const save = (event) => {
    event.preventDefault();
    setProfile(draft);
    setEditing(false);
  };

  return (
    <main className="profile-page">
      <section className="profile-page__hero">
        <div>
          <span className="service-page__eyebrow">CUENTA</span>
          <h1>Mi perfil</h1>
          <p>Consulta y actualiza la información básica de tu perfil de prueba.</p>
        </div>
        <button className="service-page__hero-action" type="button" onClick={() => { setDraft(profile); setEditing((value) => !value); }}>
          {editing ? "Cerrar edición" : "Editar perfil"}
        </button>
      </section>

      <section className="profile-page__grid">
        <article className="panel profile-card">
          <div className="profile-card__avatar">{profile.name.charAt(0)}</div>
          <h2>{profile.name}</h2>
          <span className="profile-card__role">{profile.role}</span>
          <div className="profile-card__line" />
          <div className="profile-card__item"><span>Programa</span><strong>{profile.program}</strong></div>
          <div className="profile-card__item"><span>Dependencia</span><strong>{profile.dependency}</strong></div>
          <div className="profile-card__item"><span>Correo</span><strong>{profile.email}</strong></div>
        </article>

        <article className="panel profile-page__details">
          <div className="panel__header"><div><span className="panel__eyebrow">INFORMACIÓN</span><h2>Datos del usuario</h2></div></div>
          {editing ? (
            <form className="profile-form" onSubmit={save}>
              {Object.entries({ name: "Nombre", role: "Tipo de usuario", program: "Programa", dependency: "Dependencia", email: "Correo" }).map(([key, label]) => (
                <label key={key}><span>{label}</span><input value={draft[key]} onChange={(e) => setDraft((current) => ({ ...current, [key]: e.target.value }))} /></label>
              ))}
              <button type="submit">Guardar cambios</button>
            </form>
          ) : (
            <div className="profile-details__grid">
              <div><span>Nombre completo</span><strong>{profile.name}</strong></div>
              <div><span>Tipo de usuario</span><strong>{profile.role}</strong></div>
              <div><span>Programa académico</span><strong>{profile.program}</strong></div>
              <div><span>Dependencia</span><strong>{profile.dependency}</strong></div>
              <div><span>Correo institucional</span><strong>{profile.email}</strong></div>
              <div><span>Estado</span><strong className="profile-details__active">Activo</strong></div>
            </div>
          )}
        </article>
      </section>
    </main>
  );
}

export default Profile;
