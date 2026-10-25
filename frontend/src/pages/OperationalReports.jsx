import { useCallback, useState } from 'react';
import useResource from '../hooks/useResource';
import { get } from '../services/api';
import { listRecords, query, exportCSV } from '../services/campusService';

export default function OperationalReports() {
  const [range, setRange] = useState({ fecha_desde:'', fecha_hasta:'' });
  const [message, setMessage] = useState('');
  const loader = useCallback(() => get(`/api/dashboard/operativo?${query(range)}`), [range]);
  const { data, error, loading, reload } = useResource(loader);
  async function download(kind) {
    setMessage('Preparando exportación…');
    try {
      const rows = await listRecords(kind, { operational:true, ...range });
      const fields = kind === 'requests' ? ['id','tipo_servicio','dependencia','prioridad','estado','descripcion'] : kind === 'pqrs' ? ['id','tipo','asunto','estado','respuesta'] : ['id','usuario_id','recurso_id','fecha','hora_inicio','hora_fin','estado'];
      exportCSV(`reporte-${kind}`, rows, fields.map(key => ({ key, label:key })));
      setMessage(`${rows.length} registros exportados.`);
    } catch (err) { if (!err.cancelled) setMessage(err.message); }
  }
  return <section className="role-page"><header className="role-page__heading"><div><span className="panel__eyebrow">GESTIÓN OPERATIVA</span><h1>Reportes administrativos</h1><p>Solicitudes, reservas y PQRS del período; el inventario disponible corresponde al estado actual.</p></div><button className="button button--secondary" onClick={reload}>Actualizar</button></header>
    <div className="panel role-toolbar"><label>Desde<input type="date" value={range.fecha_desde} onChange={e => setRange(current => ({ ...current, fecha_desde:e.target.value }))}/></label><label>Hasta<input type="date" value={range.fecha_hasta} onChange={e => setRange(current => ({ ...current, fecha_hasta:e.target.value }))}/></label></div>
    {(error || message) && <p className="role-message" role="status">{error || message}</p>}
    <div className="role-kpis">{[['solicitudes','Solicitudes'],['reservas','Reservas'],['pqrs','PQRS'],['recursos_disponibles','Recursos disponibles ahora']].map(([key,label]) => <article className="panel role-kpi" key={key}><span>{label}</span><strong>{loading ? '…' : data?.[key] ?? '—'}</strong></article>)}</div>
    <div className="role-grid">{['solicitudes','reservas','pqrs'].map(key => <article className="panel role-card" key={key}><h2>{key.toUpperCase()} por estado</h2>{Object.entries(data?.[`${key}_por_estado`] || {}).map(([state,total]) => <p key={state}>{state.replaceAll('_',' ')}: <strong>{total}</strong></p>)}</article>)}</div>
    <div className="role-actions"><button className="button button--secondary" onClick={() => download('requests')}>Exportar solicitudes CSV</button><button className="button button--secondary" onClick={() => download('reservations')}>Exportar reservas CSV</button><button className="button button--secondary" onClick={() => download('pqrs')}>Exportar PQRS CSV</button></div>
  </section>;
}
