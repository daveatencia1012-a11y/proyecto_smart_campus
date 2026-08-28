import { Link } from "react-router-dom";

function RequestCard({ request, onDelete }) {
  return (
    <article className="request-card">
      <div className="request-card__icon" aria-hidden="true">
        {request.type.includes("Reserva") ? "□" : "▤"}
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

        <p className="request-card__description">
          {request.description}
        </p>
      </div>

      <div className="request-card__actions">
        <Link
          className="request-card__view"
          to={`/requests/${request.id}`}
          aria-label={`Ver ${request.type}`}
        >
          →
        </Link>

        {onDelete && (
          <button
            className="request-card__delete"
            type="button"
            onClick={() => onDelete(request.id)}
          >
            ×
          </button>
        )}
      </div>
    </article>
  );
}

export default RequestCard;
