import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getRequestById } from "../services/requestsService";
import Icon from "../components/Icon/Icon";

function RequestDetail() {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRequest() {
      try {
        setLoading(true);
        setError("");
        const data = await getRequestById(id);
        setRequest(data);
      } catch (err) {
        setError(err.message || "Error al cargar la solicitud.");
      } finally {
        setLoading(false);
      }
    }
    loadRequest();
  }, [id]);

  if (loading) {
    return (
      <main className="request-detail">
        <p>Cargando solicitud...</p>
      </main>
    );
  }

  if (error || !request) {
    return (
      <main className="request-detail">
        <section className="request-detail__not-found panel">
          <Icon name="search" size={24} />
          <h1>Solicitud no encontrada</h1>
          <p>{error || "La solicitud que intentas consultar no existe."}</p>
          <Link to="/requests">Volver a solicitudes</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="request-detail">
      <Link className="request-detail__back" to="/requests">
        <><Icon name="arrowLeft" size={17} /> Volver a solicitudes</>
      </Link>

      <section className="request-detail__hero">
        <div>
          <span className="requests-page__eyebrow">DETALLE DE SOLICITUD</span>
          <h1>{request.type}</h1>
          <p>Solicitud #{request.id}</p>
        </div>
        <span className={`request-detail__status request-detail__status--${request.status.toLowerCase().replaceAll(" ", "-")}`}>
          {request.status}
        </span>
      </section>

      <section className="request-detail__grid">
        <article className="request-detail__card panel">
          <span className="panel__eyebrow">INFORMACIÓN</span>
          <h2>Descripción</h2>
          <p>{request.description}</p>

          <div className="request-detail__meta">
            <div>
              <span>Fecha de registro</span>
              <strong>{request.date}</strong>
            </div>
            <div>
              <span>Número</span>
              <strong>#{request.id}</strong>
            </div>
            <div>
              <span>Dependencia</span>
              <strong>{request.dependency || "Por definir"}</strong>
            </div>
            <div>
              <span>Prioridad</span>
              <strong>{request.priority || "MEDIA"}</strong>
            </div>
            <div>
              <span>Responsable</span>
              <strong>{request.responsible || "Pendiente de asignación"}</strong>
            </div>
          </div>
        </article>

        <article className="request-detail__card panel">
          <span className="panel__eyebrow">SEGUIMIENTO</span>
          <h2>Estado de la solicitud</h2>

          <div className="request-detail__timeline">
            <div className="request-detail__step request-detail__step--done">
              <span />
              <div>
                <strong>Solicitud registrada</strong>
                <p>Tu solicitud fue recibida correctamente.</p>
              </div>
            </div>
            <div className="request-detail__step request-detail__step--current">
              <span />
              <div>
                <strong>{request.status}</strong>
                <p>La solicitud se encuentra en seguimiento.</p>
              </div>
            </div>
            <div className="request-detail__step">
              <span />
              <div>
                <strong>Finalizada</strong>
                <p>Se habilitará cuando el proceso haya terminado.</p>
              </div>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}

export default RequestDetail;