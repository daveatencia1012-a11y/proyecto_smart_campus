import { Link } from "react-router-dom";
import Icon from "../Icon/Icon";

const serviceRoutes = {
  Solicitudes: "/requests",
  Reservas: "/reservations",
  Recursos: "/resources",
  Eventos: "/events",
  Notificaciones: "/notifications",
  PQRS: "/pqrs",
};

function ServiceCard({ service }) {
  const route = `/services/${service.id}`;

  return (
    <article className="service-card">
      <div className="service-card__top">
        <span className="service-card__icon" aria-hidden="true">
          <Icon name={service.icon} size={21} />
        </span>

        <span className="service-card__arrow" aria-hidden="true">
          <Icon name="arrowUpRight" size={17} />
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
        <Icon name="arrowRight" size={17} />
      </Link>
    </article>
  );
}

export default ServiceCard;
