import { Link } from "react-router-dom";
import Icon from "../Icon/Icon";

function RequestCard({ request, onDelete }) {
  return (
    <article className="request-card">
      <div className="request-card__icon" aria-hidden="true">
        <Icon name={request.type.includes("Reserva") ? "reservations" : "requests"} size={19} />
      </div>

      <div className="request-card__content">
        <div className="request-card__header">
          <div>
            <h3>{request.type}</h3>
            <small>{request.date}</small>
          </div>

          <span
            className={`request-card__status request-card__status--${request.status
              .toLowerCase()
              .replaceAll(" ", "-")}`}
          >
            {request.status}
          </span>
        </div>

        <p className="request-card__description">{request.description}</p>
        {(request.dependency || request.priority) && (
          <div className="request-card__meta">
            {request.dependency && <span>{request.dependency}</span>}
            {request.priority && <span>Prioridad {request.priority}</span>}
          </div>
        )}
      </div>

      <div className="request-card__actions">
        <Link
          className="request-card__view"
          to={`/requests/${request.id}`}
          aria-label={`Ver ${request.type}`}
        >
          <Icon name="arrowRight" size={17} />
        </Link>

        {onDelete && (
          <button
            className="request-card__delete"
            type="button"
            onClick={() => onDelete(request.id)}
          >
            <Icon name="close" size={18} />
          </button>
        )}
      </div>
    </article>
  );
}

export default RequestCard;
