import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon/Icon";
import useSession from "../hooks/useSession";
import useResource from "../hooks/useResource";
import { listRecords, saveRecord } from "../services/campusService";
import { STAFF } from "../services/roles";

const types = [
  { value: "peticion", label: "PETICIÓN", icon: "file", text: "Solicita información o una gestión." },
  { value: "queja", label: "QUEJA", icon: "alert", text: "Comunica una inconformidad con un servicio." },
  { value: "reclamo", label: "RECLAMO", icon: "arrowUpRight", text: "Solicita una solución frente a un incumplimiento." },
  { value: "sugerencia", label: "SUGERENCIA", icon: "spark", text: "Propón mejoras para la comunidad." },
];
const emptyForm = { tipo: "peticion", asunto: "", descripcion: "" };
const loadMyPqrs = () => listRecords("pqrs");

function PQRS() {
  const { role } = useSession();
  const { data, loading, error, reload } = useResource(loadMyPqrs);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);
  const items = data || [];

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    if (!form.asunto.trim() || !form.descripcion.trim()) {
      setMessage("Escribe el asunto y la descripción de tu PQRS.");
      return;
    }
    setSaving(true);
    try {
      await saveRecord("pqrs", { ...form, asunto: form.asunto.trim(), descripcion: form.descripcion.trim() });
      setForm(emptyForm);
      setSent(true);
      window.setTimeout(() => setSent(false), 2800);
      await reload();
    } catch (err) {
      if (!err.cancelled) setMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="service-page pqrs-page">
      <section className="service-page__hero">
        <div>
          <span className="service-page__eyebrow">ATENCIÓN Y PARTICIPACIÓN</span>
          <h1>PQRS</h1>
          <p>Registra peticiones, quejas, reclamos y sugerencias, y consulta la respuesta de la institución.</p>
        </div>
        {STAFF.includes(role) ? (
          <Link className="service-page__hero-action" to="/gestion/pqrs"><Icon name="pqrs" size={17} /> Atender PQRS</Link>
        ) : (
          <span className="service-page__hero-badge">Módulo académico</span>
        )}
      </section>

      <section className="pqrs-page__layout">
        <article className="panel pqrs-page__form-card">
          <div className="panel__header"><div><span className="panel__eyebrow">NUEVA PQRS</span><h2>¿Cómo podemos ayudarte?</h2></div></div>
          <form className="pqrs-form" onSubmit={handleSubmit}>
            <div className="pqrs-form__types">
              {types.map((type) => (
                <button key={type.value} type="button"
                  className={form.tipo === type.value ? "pqrs-form__type pqrs-form__type--active" : "pqrs-form__type"}
                  onClick={() => setForm((current) => ({ ...current, tipo: type.value }))}>
                  <span><Icon name={type.icon} size={18} /></span><strong>{type.label}</strong><small>{type.text}</small>
                </button>
              ))}
            </div>
            <label><span>Asunto</span><input maxLength={150} value={form.asunto} onChange={(e) => setForm((current) => ({ ...current, asunto: e.target.value }))} placeholder="Escribe un asunto claro" /></label>
            <label><span>Descripción</span><textarea rows="6" value={form.descripcion} onChange={(e) => setForm((current) => ({ ...current, descripcion: e.target.value }))} placeholder="Cuéntanos los detalles..." /></label>
            <button className="pqrs-form__submit" type="submit" disabled={saving}>{saving ? "Enviando…" : "Enviar PQRS"} <Icon name="arrowRight" size={17} /></button>
            {sent && <p className="pqrs-form__success"><Icon name="checkCircle" size={17} /> PQRS registrada correctamente.</p>}
            {message && <p className="role-message" role="alert">{message}</p>}
          </form>
        </article>

        <aside className="panel pqrs-page__history">
          <div className="panel__header"><div><span className="panel__eyebrow">SEGUIMIENTO</span><h2>Mis PQRS</h2></div><span className="service-page__count">{items.length}</span></div>
          {error && <p className="role-message" role="alert">{error}</p>}
          {loading ? <p>Cargando…</p> : items.length ? (
            <div className="pqrs-history">
              {items.map((item) => (
                <div className="pqrs-history__item" key={item.id}>
                  <span>{item.tipo.toUpperCase()}</span>
                  <strong>{item.asunto}</strong>
                  <small>{new Date(item.creado_en).toLocaleDateString("es-CO")} · {item.estado.replaceAll("_", " ").toUpperCase()}</small>
                  {item.respuesta && <small>Respuesta: {item.respuesta}</small>}
                </div>
              ))}
            </div>
          ) : (
            <div className="pqrs-history__empty"><Icon name="pqrs" size={26} /><p>Aún no tienes PQRS registradas.</p></div>
          )}
        </aside>
      </section>
    </main>
  );
}

export default PQRS;
