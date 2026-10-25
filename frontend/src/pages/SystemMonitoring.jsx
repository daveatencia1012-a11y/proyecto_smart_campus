import useResource from '../hooks/useResource';
import { get } from '../services/api';
const load = () => get('/api/dashboard/salud');
export default function SystemMonitoring() {
  const { data, loading, error, reload } = useResource(load);
  return <section className="role-page"><header className="role-page__heading"><div><h1>Estado de los componentes</h1><p>Estado informado por los healthchecks del sistema. No representa un porcentaje histórico de disponibilidad.</p></div><button className="button button--secondary" onClick={reload}>Comprobar ahora</button></header>
    {error && <p className="role-message" role="alert">{error}</p>}{loading && <p>Consultando…</p>}
    {data && <><p>Última comprobación: {new Date(data.consultado_en).toLocaleString('es-CO')}</p><div className="role-grid"><article className="panel role-card"><h2>Gateway</h2><strong>{data.gateway}</strong></article>{Object.entries(data.services || {}).map(([name,status]) => <article className="panel role-card" key={name}><h2>{name}</h2><strong>{status === 'ok' ? 'Responde correctamente' : status === 'offline' ? 'Sin respuesta' : 'Error reportado'}</strong></article>)}</div></>}
  </section>;
}
