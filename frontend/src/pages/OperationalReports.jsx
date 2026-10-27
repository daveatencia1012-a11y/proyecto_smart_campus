import { useCallback, useState } from 'react';
import Icon from '../components/Icon/Icon';
import useResource from '../hooks/useResource';
import { get } from '../services/api';
import { listRecords, query, exportCSV } from '../services/campusService';

const KPIS = [
  ['solicitudes', 'Solicitudes', 'requests', 'en el período'],
  ['reservas', 'Reservas', 'reservations', 'en el período'],
  ['pqrs', 'PQRS', 'pqrs', 'en el período'],
  ['recursos_disponibles', 'Recursos disponibles', 'resources', 'estado actual'],
];
// Estados en el orden de su ciclo de vida, con su nombre legible.
const BREAKDOWNS = [
  ['solicitudes', 'Solicitudes por estado', [['REGISTRADA', 'Registrada'], ['EN_REVISION', 'En revisión'], ['ASIGNADA', 'Asignada'], ['EN_PROCESO', 'En proceso'], ['RESUELTA', 'Resuelta'], ['CERRADA', 'Cerrada']]],
  ['reservas', 'Reservas por estado', [['confirmada', 'Confirmada'], ['pendiente', 'Pendiente'], ['cancelada', 'Cancelada']]],
  ['pqrs', 'PQRS por estado', [['registrada', 'Registrada'], ['en_revision', 'En revisión'], ['respondida', 'Respondida'], ['cerrada', 'Cerrada']]],
];
const EXPORTS = [
  ['requests', 'Solicitudes', ['id', 'tipo_servicio', 'dependencia', 'prioridad', 'estado', 'descripcion']],
  ['reservations', 'Reservas', ['id', 'usuario_id', 'recurso_id', 'fecha', 'hora_inicio', 'hora_fin', 'estado']],
  ['pqrs', 'PQRS', ['id', 'tipo', 'asunto', 'estado', 'respuesta']],
];

const toKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
function presetRange(preset) {
  const today = new Date();
  if (preset === 'todo') return { fecha_desde: '', fecha_hasta: '' };
  if (preset === 'mes') return { fecha_desde: toKey(new Date(today.getFullYear(), today.getMonth(), 1)), fecha_hasta: toKey(today) };
  const days = preset === '7' ? 6 : 29;
  return { fecha_desde: toKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - days)), fecha_hasta: toKey(today) };
}
const PRESETS = [['todo', 'Todo'], ['7', 'Últimos 7 días'], ['30', 'Últimos 30 días'], ['mes', 'Este mes']];

function StateBars({ title, states, counts, loading }) {
  const known = states.map(([key, label]) => [key, label, counts?.[key] || 0]);
  const extra = Object.entries(counts || {}).filter(([key]) => !states.some(([state]) => state === key)).map(([key, total]) => [key, key.replaceAll('_', ' '), total]);
  const rows = [...known, ...extra];
  const total = rows.reduce((sum, [, , count]) => sum + count, 0);
  return (
    <article className="panel reports__breakdown">
      <header>
        <h2>{title}</h2>
        <span>{loading ? '…' : `${total} en total`}</span>
      </header>
      {!loading && total === 0
        ? <p className="reports__empty">Sin registros en el período.</p>
        : (
          <ul>
            {rows.map(([key, label, count]) => {
              const percent = total ? Math.round((count / total) * 100) : 0;
              return (
                <li key={key} title={`${label}: ${count} (${percent} %)`}>
                  <span className="reports__state">{label}</span>
                  <span className="reports__track"><span className="reports__fill" style={{ width: `${total ? (count / total) * 100 : 0}%` }} /></span>
                  <span className="reports__count">{count}<small>{percent} %</small></span>
                </li>
              );
            })}
          </ul>
        )}
    </article>
  );
}

export default function OperationalReports() {
  const [range, setRange] = useState({ fecha_desde: '', fecha_hasta: '' });
  const [preset, setPreset] = useState('todo');
  const [message, setMessage] = useState('');
  const [exporting, setExporting] = useState('');
  const loader = useCallback(() => get(`/api/dashboard/operativo?${query(range)}`), [range]);
  const { data, error, loading, reload } = useResource(loader);

  const choosePreset = (key) => { setPreset(key); setRange(presetRange(key)); };
  const changeDate = (field, value) => { setPreset(''); setRange((current) => ({ ...current, [field]: value })); };

  async function download(kind, label, fields) {
    setExporting(kind);
    setMessage('');
    try {
      const rows = await listRecords(kind, { operational: true, ...range });
      exportCSV(`reporte-${kind}`, rows, fields.map((key) => ({ key, label: key })));
      setMessage(`${label}: ${rows.length} registros exportados.`);
    } catch (err) {
      if (!err.cancelled) setMessage(err.message);
    } finally {
      setExporting('');
    }
  }

  return (
    <section className="role-page reports">
      <header className="reports__heading">
        <div>
          <span className="panel__eyebrow">ESTADÍSTICAS</span>
          <h1>Reportes administrativos</h1>
          <p>Solicitudes, reservas y PQRS registradas en el período elegido. Los recursos disponibles muestran el estado actual.</p>
        </div>
        <button className="button button--secondary" onClick={reload} disabled={loading}>
          <Icon name="refresh" size={16} /> Actualizar
        </button>
      </header>

      <div className="panel reports__filters">
        <div className="reports__presets" role="group" aria-label="Período">
          {PRESETS.map(([key, label]) => (
            <button key={key} type="button" className={preset === key ? 'is-active' : ''} aria-pressed={preset === key} onClick={() => choosePreset(key)}>{label}</button>
          ))}
        </div>
        <div className="reports__dates">
          <label><span>Desde</span><input type="date" value={range.fecha_desde} max={range.fecha_hasta || undefined} onChange={(e) => changeDate('fecha_desde', e.target.value)} /></label>
          <label><span>Hasta</span><input type="date" value={range.fecha_hasta} min={range.fecha_desde || undefined} onChange={(e) => changeDate('fecha_hasta', e.target.value)} /></label>
        </div>
      </div>

      {error && <p className="role-message" role="alert">{error}</p>}

      <div className="reports__kpis">
        {KPIS.map(([key, label, icon, hint]) => (
          <article className="panel reports__kpi" key={key}>
            <span className="reports__kpi-icon" aria-hidden="true"><Icon name={icon} size={20} /></span>
            <div>
              <span>{label}</span>
              <strong>{loading ? '…' : data?.[key] ?? '—'}</strong>
              <small>{hint}</small>
            </div>
          </article>
        ))}
      </div>

      <div className="reports__breakdowns">
        {BREAKDOWNS.map(([key, title, states]) => (
          <StateBars key={key} title={title} states={states} counts={data?.[`${key}_por_estado`]} loading={loading} />
        ))}
      </div>

      <article className="panel reports__export">
        <div>
          <h2>Exportar datos</h2>
          <p>Descarga en CSV los registros del período elegido para abrirlos en Excel.</p>
        </div>
        <div className="reports__export-actions">
          {EXPORTS.map(([kind, label, fields]) => (
            <button key={kind} className="button button--secondary" onClick={() => download(kind, label, fields)} disabled={Boolean(exporting)}>
              <Icon name="file" size={16} /> {exporting === kind ? 'Exportando…' : label}
            </button>
          ))}
        </div>
        {message && <p className="reports__export-message" role="status">{message}</p>}
      </article>
    </section>
  );
}
