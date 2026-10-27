import { Link } from "react-router-dom";
import Icon from "../Icon/Icon";
import ServiceIllustration from "../ServiceIllustration/ServiceIllustration";

// Iconos con ilustración y color propios; el resto usa el edificio y el color institucional.
const THEMES = ["requests", "reservations", "resources", "events", "notifications", "pqrs"];

// Módulo de la aplicación al que lleva cada servicio del catálogo.
const MODULES = {
  solicitudes: "/requests",
  reservas: "/reservations",
  recursos: "/resources",
  eventos: "/events",
  notificaciones: "/notifications",
  pqrs: "/pqrs",
};

function ServiceCard({ service }) {
  const route = MODULES[service.code] || `/services/${service.id}`;
  const theme = THEMES.includes(service.icon) ? service.icon : "building";

  return (
    <article className={`service-tile service-tile--${theme}`}>
      <div className="service-tile__media">
        <ServiceIllustration name={service.icon} />
        <span className="service-tile__badge" aria-hidden="true">
          <Icon name={service.icon} size={20} />
        </span>
      </div>

      <div className="service-tile__body">
        <h3 className="service-tile__title">{service.name}</h3>
        <p className="service-tile__description">{service.description}</p>
        <Link className="service-tile__link" to={route}>
          Abrir servicio
          <Icon name="arrowRight" size={16} />
        </Link>
      </div>
    </article>
  );
}

export default ServiceCard;
