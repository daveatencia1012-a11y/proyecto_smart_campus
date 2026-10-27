import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getReservationById } from "../services/reservationsService";
import Icon from "../components/Icon/Icon";

function ReservationDetail() {
  const { id } = useParams();
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    async function loadReservation() {
      try {
        setLoading(true);
        setError(null);
        const data = await getReservationById(id);
        setReservation(data);
      } catch (err) {
        setError({ status: err.status, message: err.message || "Error al cargar la reserva." });
      } finally {
        setLoading(false);
      }
    }
    loadReservation();
  }, [id, attempt]);

  if (loading) {
    return (
      <main className="reservation-detail">
        <p>Cargando reserva...</p>
      </main>
    );
  }

  // Un fallo de servidor o de conexión permite reintentar; un 4xx (404, id inválido) es "no encontrada".
  if (error && (!error.status || error.status >= 500)) {
    return (
      <main className="reservation-detail">
        <section className="reservation-detail__not-found panel" role="alert">
          <Icon name="alert" size={24} />
          <h1>No fue posible cargar la reserva</h1>
          <p>{error.message}</p>
          <button type="button" className="button button--secondary" onClick={() => setAttempt((value) => value + 1)}>Reintentar</button>
          <Link to="/reservations">Volver a reservas</Link>
        </section>
      </main>
    );
  }

  if (error || !reservation) {
    return (
      <main className="reservation-detail">
        <section className="reservation-detail__not-found panel">
          <Icon name="search" size={24} />
          <h1>Reserva no encontrada</h1>
          <p>{error?.message || "La reserva que buscas no existe o ya no está disponible."}</p>
          <Link to="/reservations">Volver a reservas</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="reservation-detail">
      <Link className="reservation-detail__back" to="/reservations">
        <><Icon name="arrowLeft" size={17} /> Volver a reservas</>
      </Link>

      <section className="reservation-detail__hero">
        <div>
          <span className="reservations-page__eyebrow">DETALLE DE RESERVA</span>
          <h1>{reservation.resource}</h1>
          <p>Reserva #{reservation.id}</p>
        </div>
        <span className="reservation-detail__status">
          {reservation.status}
        </span>
      </section>

      <section className="reservation-detail__grid">
        <article className="reservation-detail__card panel">
          <span className="panel__eyebrow">INFORMACIÓN</span>
          <h2>Datos de la reserva</h2>

          <div className="reservation-detail__meta">
            <div>
              <span>Tipo</span>
              <strong>{reservation.type}</strong>
            </div>
            <div>
              <span>Fecha</span>
              <strong>{reservation.date}</strong>
            </div>
            <div>
              <span>Horario</span>
              <strong>{reservation.startTime} – {reservation.endTime}</strong>
            </div>
            <div>
              <span>Ubicación</span>
              <strong>{reservation.location}</strong>
            </div>
          </div>
        </article>

        <article className="reservation-detail__card panel">
          <span className="panel__eyebrow">SEGUIMIENTO</span>
          <h2>Estado actual</h2>
          <p>
            Esta reserva se encuentra en estado <strong>{reservation.status}</strong>.
          </p>

          <div className="reservation-detail__timeline">
            <div className="reservation-detail__step reservation-detail__step--done">
              <span />
              <div>
                <strong>Reserva registrada</strong>
                <p>La reserva fue creada correctamente.</p>
              </div>
            </div>
            <div
              className={`reservation-detail__step ${
                reservation.status === "PENDIENTE"
                  ? "reservation-detail__step--current"
                  : "reservation-detail__step--done"
              }`}
            >
              <span />
              <div>
                <strong>Validación de disponibilidad</strong>
                <p>Se verifica el recurso y el horario solicitado.</p>
              </div>
            </div>
            <div
              className={`reservation-detail__step ${
                reservation.status === "CONFIRMADA"
                  ? "reservation-detail__step--current"
                  : ""
              }`}
            >
              <span />
              <div>
                <strong>Reserva confirmada</strong>
                <p>El espacio o recurso queda asignado al usuario.</p>
              </div>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}

export default ReservationDetail;