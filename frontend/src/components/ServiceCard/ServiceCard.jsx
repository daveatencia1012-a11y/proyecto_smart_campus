import { Link } from "react-router-dom";

const serviceRoutes = {
  Solicitudes: "/requests",
  Reservas: "/reservations",
  Recursos: "/resources",
  Eventos: "/events",
  Notificaciones: "/notifications",
  PQRS: "/pqrs",
};

function ServiceCard({ service }) {
  const route = serviceRoutes[service.name] || "/services";

  return (
    <article className="service-card">
      <div className="service-card__top">
        <span className="service-card__icon" aria-hidden="true">
          {service.icon}
        </span>

        <span className="service-card__arrow" aria-hidden="true">
          ↗
        </span>
      </div>

      <h3 className="service-card__title">
        {service.name}
      </h3>

      <p className="service-card__description">
        {service.description}
      </p>

      <Link className="service-card__link" to={route}>
        Ver servicio
        <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}

export default ServiceCard;
