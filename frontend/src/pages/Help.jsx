import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon/Icon";

const faqs = [
  {
    q: "¿Dónde puedo consultar mis reservas?",
    a: "En Reservas puedes consultar tus recursos y solicitudes. El Calendario reúne además las reservas y eventos en una agenda única.",
  },
  {
    q: "¿Cómo hago seguimiento a una solicitud?",
    a: "Abre Solicitudes y selecciona una solicitud para ver su información y la evolución de su estado: registrada, en revisión, asignada, en proceso, resuelta o cerrada.",
  },
  {
    q: "¿Puedo cambiar el modo claro u oscuro?",
    a: "Sí. Usa el botón de tema del encabezado o entra en Configuración > Tema de la plataforma.",
  },
  {
    q: "¿Los datos son reales?",
    a: "No. Esta versión académica utiliza datos ficticios y almacenamiento local para demostrar el funcionamiento del frontend. Posteriormente puede conectarse a las APIs del proyecto.",
  },
];

function Help() {
  const [open, setOpen] = useState(0);

  return (
    <main className="help-page">
      <section className="help-page__hero">
        <div>
          <span className="service-page__eyebrow">SOPORTE SMART CAMPUS</span>
          <h1>Centro de ayuda</h1>
          <p>Encuentra respuestas rápidas y accesos directos para trabajar con la plataforma.</p>
        </div>
        <div className="help-page__hero-icon"><Icon name="help" size={30} /></div>
      </section>

      <section className="help-page__grid">
        <article className="panel help-card">
          <span className="help-card__icon"><Icon name="search" size={20} /></span>
          <span className="panel__eyebrow">GUÍA RÁPIDA</span>
          <h2>¿Qué necesitas hacer?</h2>
          <p>Accede directamente a las funciones más utilizadas de Smart Campus.</p>
          <div className="help-links">
            <Link to="/requests"><Icon name="requests" size={17} /> Gestionar solicitudes</Link>
            <Link to="/reservations"><Icon name="reservations" size={17} /> Crear una reserva</Link>
            <Link to="/calendar"><Icon name="calendar" size={17} /> Revisar calendario</Link>
            <Link to="/notifications"><Icon name="notifications" size={17} /> Ver notificaciones</Link>
          </div>
        </article>

        <article className="panel help-card help-card--faq">
          <span className="panel__eyebrow">PREGUNTAS FRECUENTES</span>
          <h2>Respuestas rápidas</h2>
          <div className="help-faq">
            {faqs.map((item, index) => (
              <div className={`help-faq__item ${open === index ? "help-faq__item--open" : ""}`} key={item.q}>
                <button type="button" onClick={() => setOpen(open === index ? -1 : index)}>
                  <span>{item.q}</span>
                  <Icon name={open === index ? "close" : "plus"} size={16} />
                </button>
                {open === index && <p>{item.a}</p>}
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel help-contact">
        <div className="help-contact__icon"><Icon name="info" size={21} /></div>
        <div>
          <span className="panel__eyebrow">PROYECTO ACADÉMICO</span>
          <h2>¿Necesitas asistencia con una funcionalidad?</h2>
          <p>Esta interfaz está preparada para integrarse posteriormente con APIs REST y servicios independientes.</p>
        </div>
        <Link to="/settings" className="service-page__hero-action">Ver configuración</Link>
      </section>
    </main>
  );
}

export default Help;
