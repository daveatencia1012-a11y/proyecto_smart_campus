import { useState } from 'react';
import useResource from '../hooks/useResource';
import { listNotifications, markNotification, markAllNotifications, removeNotification } from '../services/campusService';

export default function Notifications() {
  const { data, loading, error, reload } = useResource(listNotifications);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('todas');
  async function act(fn) {
    setMessage('');
    try { await fn(); await reload(); }
    catch (err) { if (!err.cancelled) setMessage(err.message); }
  }
  const rows = (data || []).filter(row => filter === 'todas' || filter === 'pendientes' && !row.leida || filter === 'leidas' && row.leida);
  return <section className="role-page"><header className="role-page__heading"><div><h1>Mis notificaciones</h1><p>Comunicaciones asociadas exclusivamente a tu usuario.</p></div><div className="role-actions"><button className="button button--secondary" onClick={() => act(markAllNotifications)}>Marcar todas como leídas</button><button className="button button--secondary" onClick={reload}>Actualizar</button></div></header>
    <label>Mostrar<select value={filter} onChange={e => setFilter(e.target.value)}><option value="todas">Todas</option><option value="pendientes">Sin leer</option><option value="leidas">Leídas</option></select></label>
    {(error || message) && <p className="role-message" role="status">{error || message}</p>}{loading && <p>Cargando…</p>}
    {rows.map(row => <article key={row.id} className={`panel role-card ${row.leida ? '' : 'role-notification'}`}><h2>{row.titulo}</h2><p>{row.mensaje}</p><small>{new Date(row.fecha_creacion).toLocaleString('es-CO')} · {row.leida ? 'Leída' : 'Sin leer'}</small><div className="role-actions">{!row.leida && <button className="button button--secondary" onClick={() => act(() => markNotification(row.id))}>Marcar como leída</button>}<button className="button button--secondary" onClick={() => act(() => removeNotification(row.id))}>Eliminar</button></div></article>)}
    {!loading && !rows.length && <p className="panel role-empty">No hay notificaciones.</p>}
  </section>;
}
