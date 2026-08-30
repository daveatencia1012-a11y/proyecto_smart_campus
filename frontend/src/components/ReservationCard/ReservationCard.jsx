import Icon from "../Icon/Icon";
import { Link } from "react-router-dom";

const statusClass = {
  CONFIRMADA: "reservation-card__status--confirmed",
  PENDIENTE: "reservation-card__status--pending",
  FINALIZADA: "reservation-card__status--finished",
};

function ReservationCard({ reservation, onCancel }) {
  return (
    <article className="reservation-card panel">
      <div className="reservation-card__date">
        <span>{reservation.date.split("/")[0]}</span>
        <small>AGO</small>
      </div>

      <div className="reservation-card__main">
        <div className="reservation-card__top">
          <div>
            <span className="reservation-card__eyebrow">
              {reservation.type}
            </span>
            <h3>{reservation.resource}</h3>
          </div>

          <span
            className={`reservation-card__status ${
              statusClass[reservation.status] || ""
            }`}
          >
            {reservation.status}
          </span>
        </div>

        <div className="reservation-card__meta">
          <span><Icon name="clock" size={16} /> {reservation.startTime} – {reservation.endTime}</span>
          <span><Icon name="location" size={16} /> {reservation.location}</span>
        </div>

        <p>{reservation.description}</p>
      </div>

      <div className="reservation-card__actions">
        <Link
          className="reservation-card__detail"
          to={`/reservations/${reservation.id}`}
        >
          Ver detalle
        </Link>

        {reservation.status !== "FINALIZADA" && (
          <button
            className="reservation-card__cancel"
            type="button"
            onClick={() => onCancel(reservation.id)}
          >
            Cancelar
          </button>
        )}
      </div>
    </article>
  );
}

export default ReservationCard;
