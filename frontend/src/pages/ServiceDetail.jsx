import { Link, useParams } from "react-router-dom";
import { services } from "../data/mockData";
import Icon from "../components/Icon/Icon";

const details = {
  Solicitudes: {
    eyebrow: "GESTIÓN Y SEGUIMIENTO",
    title: "Solicitudes universitarias",
    description: "Registra requerimientos, consulta su estado y realiza seguimiento del proceso desde la recepción hasta el cierre.",
    features: [
      ["Registrar", "Crea una solicitud indicando tipo, dependencia, prioridad y descripción."],
      ["Consultar", "Filtra por estado, número o tipo para encontrar rápidamente tus requerimientos."],
      ["Seguimiento", "Visualiza la evolución: registrada, en revisión, asignada, en proceso, resuelta y cerrada."],
      ["Historial", "Conserva la trazabilidad de tus solicitudes en un único espacio."]
    ],
    actions: [{ label: "Nueva solicitud", to: "/requests" }, { label: "Ver mis solicitudes", to: "/requests" }]
  },
  Reservas: {
    eyebrow: "ESPACIOS Y RECURSOS",
    title: "Reservas universitarias",
    description: "Consulta disponibilidad y programa salas, laboratorios, equipos y otros espacios académicos.",
    features: [
      ["Disponibilidad", "Consulta recursos disponibles antes de registrar una reserva."],
      ["Agenda", "Visualiza tus reservas y eventos en el calendario institucional."],
      ["Validación", "El formulario evita horarios invertidos y cruces con reservas existentes."],
      ["Seguimiento", "Consulta el estado de cada reserva y sus datos operativos."]
    ],
    actions: [{ label: "Nueva reserva", to: "/reservations" }, { label: "Abrir calendario", to: "/calendar" }]
  },
  Recursos: {
    eyebrow: "INVENTARIO UNIVERSITARIO",
    title: "Recursos disponibles",
    description: "Explora el inventario de salas, laboratorios, equipos y espacios, con su ubicación y estado actual.",
    features: [
      ["Catálogo", "Busca por nombre, código, tipo o ubicación."],
      ["Estado", "Identifica recursos disponibles, en uso o en mantenimiento."],
      ["Reserva rápida", "Accede directamente al proceso de reserva cuando un recurso está disponible."],
      ["Información", "Consulta características y ubicación antes de utilizar un recurso."]
    ],
    actions: [{ label: "Explorar recursos", to: "/resources" }, { label: "Ver reservas", to: "/reservations" }]
  },
  Eventos: {
    eyebrow: "VIDA UNIVERSITARIA",
    title: "Eventos y actividades",
    description: "Consulta la agenda académica e institucional y mantente al día con las actividades de la universidad.",
    features: [
      ["Agenda", "Consulta talleres, seminarios, ferias y encuentros."],
      ["Búsqueda", "Localiza actividades por nombre, tipo o lugar."],
      ["Inscripción", "Identifica actividades en las que ya estás inscrito."],
      ["Calendario", "Relaciona actividades con tu agenda universitaria."]
    ],
    actions: [{ label: "Explorar eventos", to: "/events" }, { label: "Abrir calendario", to: "/calendar" }]
  },
  Notificaciones: {
    eyebrow: "CENTRO DE COMUNICACIONES",
    title: "Notificaciones",
    description: "Consulta alertas, cambios de estado, confirmaciones y comunicaciones generadas por la plataforma.",
    features: [
      ["No leídas", "Identifica rápidamente los avisos que requieren tu atención."],
      ["Lectura", "Marca individualmente una comunicación o todas como leídas."],
      ["Filtros", "Separa notificaciones leídas y pendientes."],
      ["Actualizaciones", "Recibe información relacionada con solicitudes, reservas y eventos."]
    ],
    actions: [{ label: "Ver notificaciones", to: "/notifications" }]
  },
  PQRS: {
    eyebrow: "ATENCIÓN Y PARTICIPACIÓN",
    title: "PQRS",
    description: "Registra peticiones, quejas, reclamos y sugerencias como componente académico de integración.",
    features: [
      ["Petición", "Solicita información o una gestión."],
      ["Queja", "Comunica una inconformidad con un servicio."],
      ["Reclamo", "Solicita una solución frente a un incumplimiento."],
      ["Sugerencia", "Propón mejoras para la comunidad universitaria."]
    ],
    actions: [{ label: "Registrar PQRS", to: "/pqrs" }]
  }
};

function ServiceDetail() {
  const { id } = useParams();
  const service = services.find((item) => String(item.id) === String(id));
  const detail = service ? details[service.name] : null;

  if (!service || !detail) {
    return (
      <main className="service-detail">
        <section className="panel service-detail__not-found">
          <Icon name="search" size={26} />
          <h1>Servicio no encontrado</h1>
          <p>El servicio solicitado no está disponible en el catálogo.</p>
          <Link className="service-page__hero-action" to="/services">Volver a servicios</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="service-detail">
      <section className="service-detail__hero">
        <div>
          <div className="service-detail__icon"><Icon name={service.icon} size={27} /></div>
          <span className="service-page__eyebrow">{detail.eyebrow}</span>
          <h1>{detail.title}</h1>
          <p>{detail.description}</p>
        </div>
        <div className="service-detail__actions">
          {detail.actions.map((action) => (
            <Link key={action.to} className="service-page__hero-action" to={action.to}>
              {action.label} <Icon name="arrowRight" size={17} />
            </Link>
          ))}
        </div>
      </section>

      <section className="service-detail__body">
        <article className="panel" style={{ padding: "24px" }}>
          <span className="panel__eyebrow">FUNCIONALIDADES</span>
          <h2 style={{ marginTop: "6px" }}>¿Qué puedes hacer?</h2>
          <div className="service-detail__features">
            {detail.features.map(([title, description]) => (
              <div className="service-detail__feature" key={title}>
                <strong>{title}</strong>
                <p>{description}</p>
              </div>
            ))}
          </div>
        </article>

        <aside className="panel service-detail__side">
          <span className="panel__eyebrow">INTEGRACIÓN</span>
          <h2 style={{ marginTop: "6px" }}>Preparado para API REST</h2>
          <ul>
            <li><Icon name="checkCircle" size={16} />Frontend React desacoplado del backend.</li>
            <li><Icon name="checkCircle" size={16} />Operaciones preparadas para persistencia.</li>
            <li><Icon name="checkCircle" size={16} />Datos de demostración sustituibles por API.</li>
          </ul>
        </aside>
      </section>
    </main>
  );
}

export default ServiceDetail;
