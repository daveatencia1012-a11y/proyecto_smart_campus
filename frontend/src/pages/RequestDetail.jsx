import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { getRequestById, updateRequest, updateRequestStatus } from "../services/requestsService";
import { listResponsables } from "../services/campusService";
import useSession from "../hooks/useSession";
import { STAFF, ROLE_LABELS } from "../services/roles";
import Icon from "../components/Icon/Icon";

const LIFECYCLE = ["REGISTRADA", "EN_REVISION", "ASIGNADA", "EN_PROCESO", "RESUELTA", "CERRADA"];
const label = (state = "") => state.replaceAll("_", " ");

function RequestDetail() {
  const { id } = useParams();
  const location = useLocation();
  const { user, role } = useSession();
  const staff = STAFF.includes(role);
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [responsables, setResponsables] = useState([]);
  const [selected, setSelected] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  // Si se llegó desde Gestión operativa, "Volver" regresa a esa tabla.
  const backTo = location.state?.from || "/requests";
  const backLabel = backTo.startsWith("/gestion") || backTo.startsWith("/admin") ? "Volver a atender solicitudes" : "Volver a solicitudes";

  const applyRequest = (data) => {
    setError("");
    setRequest(data);
    setSelected(data.responsibleId ? String(data.responsibleId) : "");
  };

  const loadRequest = useCallback(() => getRequestById(id).then(applyRequest), [id]);

  useEffect(() => {
    let active = true;
    getRequestById(id)
      .then((data) => { if (active) applyRequest(data); })
      .catch((err) => { if (active && !err.cancelled) setError(err.message || "Error al cargar la solicitud."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    if (!staff) return undefined;
    let active = true;
    listResponsables()
      .then((rows) => { if (active) setResponsables(rows); })
      .catch(() => { if (active) setResponsables([]); });
    return () => { active = false; };
  }, [staff]);

  const personName = (personId) => {
    if (!personId) return "Sistema";
    if (request && personId === request.usuario_id) return "Solicitante";
    if (personId === user?.id) return "Tú";
    const person = responsables.find((row) => row.id === personId);
    return person ? `${person.nombre} (${ROLE_LABELS[person.rol]})` : `Usuario #${personId}`;
  };

  const run = async (action, success) => {
    setSaving(true);
    setMessage("");
    try {
      await action();
      setMessage(success);
      await loadRequest();
    } catch (err) {
      if (!err.cancelled) setMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

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
          <Link to={backTo}>{backLabel}</Link>
        </section>
      </main>
    );
  }

  const currentIndex = LIFECYCLE.indexOf(request.rawStatus);
  const responsibleName = request.responsibleId
    ? staff ? personName(request.responsibleId) : request.responsible
    : "Pendiente de asignación";
  const lastChange = (state) => [...request.history].reverse().find((entry) => entry.estado === state);

  return (
    <main className="request-detail">
      <Link className="request-detail__back" to={backTo}>
        <><Icon name="arrowLeft" size={17} /> {backLabel}</>
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

      {message && !staff && <p className="role-message" role="status">{message}</p>}

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
              <strong>{responsibleName}</strong>
            </div>
            {staff && (
              <div>
                <span>Solicitante</span>
                <strong>Usuario #{request.usuario_id}</strong>
              </div>
            )}
          </div>

          {staff && (
            <div className="request-detail__manage">
              <span className="panel__eyebrow">GESTIÓN</span>
              <h2>Atender solicitud</h2>
              <div className="request-detail__assign">
                <label>
                  Responsable
                  <select value={selected} onChange={(event) => setSelected(event.target.value)} disabled={saving}>
                    <option value="">Sin asignar</option>
                    {responsables.map((row) => (
                      <option key={row.id} value={row.id}>{row.nombre} ({ROLE_LABELS[row.rol]})</option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="button button--secondary"
                  disabled={saving || selected === (request.responsibleId ? String(request.responsibleId) : "")}
                  onClick={() => run(() => updateRequest(request.id, { responsable_id: selected ? Number(selected) : null }), "Responsable actualizado.")}
                >
                  Guardar responsable
                </button>
              </div>
              {request.transitions.length > 0 ? (
                <div className="role-actions">
                  {request.transitions.map((state) => {
                    const forward = LIFECYCLE.indexOf(state) > currentIndex;
                    // El backend no deja avanzar sin responsable (SD2-04); aquí se avisa antes de intentarlo.
                    const needsResponsible = state !== "REGISTRADA" && !request.responsibleId;
                    return (
                      <button
                        key={state}
                        type="button"
                        className={`button ${forward ? "button--primary" : "button--secondary"}`}
                        disabled={saving || needsResponsible}
                        title={needsResponsible ? "Asigna y guarda un responsable primero" : undefined}
                        onClick={() => run(() => updateRequestStatus(request.id, state), `Estado cambiado a ${label(state)}.`)}
                      >
                        {forward ? `Pasar a ${label(state)}` : `Devolver a ${label(state)}`}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p>La solicitud está cerrada; no admite más cambios de estado.</p>
              )}
              {request.transitions.some((state) => state !== "REGISTRADA") && !request.responsibleId && (
                <p className="request-detail__hint">Para avanzar la solicitud, primero elige un responsable y pulsa "Guardar responsable".</p>
              )}
              {message && <p className="role-message" role="status">{message}</p>}
            </div>
          )}
        </article>

        <article className="request-detail__card panel">
          <span className="panel__eyebrow">SEGUIMIENTO</span>
          <h2>Estado de la solicitud</h2>

          <div className="request-detail__timeline">
            {LIFECYCLE.map((state, index) => {
              const entry = lastChange(state);
              const stepClass = index < currentIndex ? "request-detail__step--done" : index === currentIndex ? "request-detail__step--current" : "";
              return (
                <div className={`request-detail__step ${stepClass}`} key={state}>
                  <span />
                  <div>
                    <strong>{label(state)}</strong>
                    <p>
                      {entry
                        ? `${new Date(entry.fecha).toLocaleString("es-CO")} · ${personName(entry.actor_id)}`
                        : index === currentIndex ? "Estado actual" : index < currentIndex ? "Completado" : "Pendiente"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </section>
    </main>
  );
}

export default RequestDetail;
