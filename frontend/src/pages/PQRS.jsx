import { useState } from "react";
import useLocalStorage from "../hooks/useLocalStorage";
import Icon from "../components/Icon/Icon";

const types = [
  { value: "PETICIÓN", icon: "file", text: "Solicita información o una gestión." },
  { value: "QUEJA", icon: "alert", text: "Comunica una inconformidad con un servicio." },
  { value: "RECLAMO", icon: "arrowUpRight", text: "Solicita una solución frente a un incumplimiento." },
  { value: "SUGERENCIA", icon: "spark", text: "Propón mejoras para la comunidad." },
];

function PQRS() {
  const [items, setItems] = useLocalStorage("uajs_pqrs", []);
  const [form, setForm] = useState({ type: "PETICIÓN", subject: "", description: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.subject.trim() || !form.description.trim()) return;
    setItems((current) => [{
      id: Date.now(),
      ...form,
      date: new Date().toLocaleDateString("es-CO"),
      status: "RECIBIDA",
    }, ...current]);
    setForm({ type: "PETICIÓN", subject: "", description: "" });
    setSent(true);
    window.setTimeout(() => setSent(false), 2800);
  };

  return (
    <main className="service-page pqrs-page">
      <section className="service-page__hero">
        <div>
          <span className="service-page__eyebrow">ATENCIÓN Y PARTICIPACIÓN</span>
          <h1>PQRS</h1>
          <p>Registra peticiones, quejas, reclamos y sugerencias como parte del prototipo académico de integración.</p>
        </div>
        <span className="service-page__hero-badge">Módulo académico</span>
      </section>

      <section className="pqrs-page__layout">
        <article className="panel pqrs-page__form-card">
          <div className="panel__header"><div><span className="panel__eyebrow">NUEVA PQRS</span><h2>¿Cómo podemos ayudarte?</h2></div></div>
          <form className="pqrs-form" onSubmit={handleSubmit}>
            <div className="pqrs-form__types">
              {types.map((type) => (
                <button key={type.value} type="button"
                  className={form.type === type.value ? "pqrs-form__type pqrs-form__type--active" : "pqrs-form__type"}
                  onClick={() => setForm((current) => ({ ...current, type: type.value }))}>
                  <span><Icon name={type.icon} size={18} /></span><strong>{type.value}</strong><small>{type.text}</small>
                </button>
              ))}
            </div>
            <label><span>Asunto</span><input value={form.subject} onChange={(e) => setForm((current) => ({ ...current, subject: e.target.value }))} placeholder="Escribe un asunto claro" /></label>
            <label><span>Descripción</span><textarea rows="6" value={form.description} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} placeholder="Cuéntanos los detalles..." /></label>
            <button className="pqrs-form__submit" type="submit">Enviar PQRS <Icon name="arrowRight" size={17} /></button>
            {sent && <p className="pqrs-form__success"><Icon name="checkCircle" size={17} /> PQRS registrada correctamente en el prototipo.</p>}
          </form>
        </article>

        <aside className="panel pqrs-page__history">
          <div className="panel__header"><div><span className="panel__eyebrow">SEGUIMIENTO</span><h2>Mis PQRS</h2></div><span className="service-page__count">{items.length}</span></div>
          {items.length ? <div className="pqrs-history">{items.map((item) => <div className="pqrs-history__item" key={item.id}><span>{item.type}</span><strong>{item.subject}</strong><small>{item.date} · {item.status}</small></div>)}</div> : <div className="pqrs-history__empty"><Icon name="pqrs" size={26} /><p>Aún no tienes PQRS registradas.</p></div>}
        </aside>
      </section>
    </main>
  );
}

export default PQRS;
