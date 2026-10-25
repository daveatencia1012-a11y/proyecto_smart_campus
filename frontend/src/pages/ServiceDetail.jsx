import { useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import useResource from '../hooks/useResource';
import { get } from '../services/api';
const routes = { solicitudes:'/requests', reservas:'/reservations', recursos:'/resources', eventos:'/events', notificaciones:'/notifications', pqrs:'/pqrs' };
export default function ServiceDetail() {
  const { id } = useParams();
  const load = useCallback(() => get(`/api/servicios/${encodeURIComponent(id)}`), [id]);
  const { data, loading, error } = useResource(load);
  return <section className="role-page"><Link to="/services">← Servicios</Link>{loading ? <p>Cargando…</p> : error ? <p className="role-message" role="alert">{error}</p> : data && <article className="panel role-card"><h1>{data.nombre}</h1><p>{data.descripcion}</p>{routes[data.codigo] ? <Link className="button button--primary" to={routes[data.codigo]}>Abrir servicio</Link> : <p>Servicio informativo. Consulta con el campus para más detalles.</p>}</article>}</section>;
}
