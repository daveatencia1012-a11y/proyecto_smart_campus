import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../Icon/Icon';
import useSession from '../../hooks/useSession';
import useResource from '../../hooks/useResource';
import { STAFF, EVENT_EDITORS, canEditEvent, ROLE_LABELS } from '../../services/roles';
import { updateSession, clearSession } from '../../services/session';
import { listRecords, saveRecord, deleteRecord, transitionRequest, cancelReservation, reactivateUser, listResponsables, dateKey, exportCSV } from '../../services/campusService';

const labels = {
  id:'ID', nombre:'Nombre', email:'Correo', rol:'Rol', activo:'Activo', codigo:'Código', tipo:'Tipo', ubicacion:'Ubicación', estado:'Estado', disponible:'Habilitado para reservas', descripcion:'Descripción', prioridad:'Prioridad', dependencia:'Dependencia', tipo_servicio:'Servicio solicitado', responsable_id:'Responsable', asunto:'Asunto', respuesta:'Respuesta', recurso_id:'Recurso', usuario_id:'Usuario', fecha:'Fecha', hora:'Hora', hora_inicio:'Inicio', hora_fin:'Fin', lugar:'Lugar', publico:'Público', creado_por:'Autor', icono:'Icono', password:'Contraseña'
};
const titles = { requests:'Solicitudes', pqrs:'PQRS', resources:'Recursos', reservations:'Reservas', events:'Eventos', users:'Usuarios', services:'Servicios institucionales' };
const columns = {
  requests:['codigo','tipo_servicio','dependencia','prioridad','estado','responsable_id'],
  pqrs:['id','tipo','asunto','estado','respuesta'], resources:['id','codigo','nombre','tipo','ubicacion','estado','disponible'],
  reservations:['id','recurso_id','usuario_id','fecha','hora_inicio','hora_fin','estado'],
  events:['id','nombre','tipo','fecha','hora','lugar','publico'], users:['id','nombre','email','rol','activo'], services:['id','codigo','nombre','descripcion','activo']
};
const options = {
  prioridad:['baja','media','alta','critica'], estado:['disponible','en_mantenimiento','fuera_servicio'],
  tipo:['academico','institucional','cultural','deportivo','otro'],
  rol:['estudiante','docente','administrativo','administrador'],
  icono:['requests','reservations','resources','events','notifications','pqrs','services','help','building']
};
const createFields = {
  requests:['tipo_servicio','dependencia','descripcion','prioridad'], pqrs:['tipo','asunto','descripcion'],
  resources:['codigo','nombre','tipo','ubicacion','estado','disponible','descripcion'], reservations:['recurso_id','fecha','hora_inicio','hora_fin'],
  events:['nombre','descripcion','fecha','hora','lugar','tipo','publico'], users:['nombre','email','password','rol'], services:['codigo','nombre','descripcion','icono','activo']
};
const initial = { prioridad:'media', tipo:'academico', estado:'disponible', rol:'estudiante', icono:'services', disponible:true, publico:true, activo:true };
function display(key, value) {
  if (['activo','disponible','publico'].includes(key)) return value ? 'Sí' : 'No';
  if (key === 'rol') return ROLE_LABELS[value] || value;
  if (key === 'fecha') return dateKey(value);
  return String(value ?? '—').replaceAll('_',' ');
}

// Presentación de la tabla: icono por módulo y color por estado o prioridad.
const kindIcons = { requests:'requests', pqrs:'pqrs', resources:'resources', reservations:'reservations', events:'events', users:'profile', services:'services' };
const tones = {
  success:['resuelta','cerrada','confirmada','disponible','respondida','finalizada','completada'],
  warning:['en_revision','asignada','en_proceso','en_mantenimiento','pendiente'],
  danger:['cancelada','fuera_servicio','rechazada','vencida'],
};
const priorityTones = { baja:'success', media:'warning', alta:'danger', critica:'critical' };
const toneOf = value => Object.keys(tones).find(tone => tones[tone].includes(String(value).toLowerCase())) || 'info';
// Los valores vienen sin tildes desde la base de datos; solo se corrigen al mostrarlos.
const accents = { 'en revision':'En revisión', critica:'Crítica', peticion:'Petición', academico:'Académico' };
const capitalize = text => accents[text.toLowerCase()] || text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
const shortColumns = ['id','codigo','prioridad','estado','fecha','hora','hora_inicio','hora_fin','activo','disponible','publico','rol'];

function IconAction({ icon, label, tone = 'default', ...props }) {
  return <button type="button" className={`records-action records-action--${tone}`} aria-label={label} title={label} {...props}><Icon name={icon} size={16} /></button>;
}

// Detalle de un registro: secciones legibles en lugar de volcar el JSON crudo.
const dateLabels = { fecha_creacion:'Creado', creado_en:'Creado', fecha_actualizacion:'Última actualización', actualizado_en:'Última actualización', eliminado_en:'Dado de baja' };
const textLabels = { descripcion:'Descripción', respuesta:'Respuesta', motivo_cancelacion:'Motivo de cancelación' };
const singular = { requests:'Solicitud', pqrs:'PQRS', resources:'Recurso', reservations:'Reserva', events:'Evento', users:'Usuario', services:'Servicio' };
const hiddenKeys = ['id','codigo','estado','prioridad','historial','transiciones_permitidas','password_hash'];
const formatDate = value => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('es-CO', { dateStyle:'medium', timeStyle:'short' });
};
const humanize = key => labels[key] || capitalize(key.replaceAll('_', ' '));
function parseHistory(value) {
  if (Array.isArray(value)) return value;
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
}

function DetailModal({ kind, row, cell, personName, operational, onClose }) {
  useEffect(() => {
    const onKey = event => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const keys = Object.keys(row);
  const fields = keys.filter(key => !hiddenKeys.includes(key) && !dateLabels[key] && !textLabels[key] && (typeof row[key] !== 'object' || row[key] === null));
  const texts = keys.filter(key => textLabels[key] && row[key]);
  const dates = keys.filter(key => dateLabels[key] && row[key]);
  const history = parseHistory(row.historial);
  const title = row.codigo || row.nombre || row.asunto || `${singular[kind]} #${row.id}`;

  return <div className="role-modal-backdrop records-detail__backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="records-detail" role="dialog" aria-modal="true" aria-labelledby="records-detail-title">
      <header className="records-detail__header">
        <span className="records-view__icon records-detail__icon"><Icon name={kindIcons[kind]} size={22} /></span>
        <div className="records-detail__heading">
          <span className="panel__eyebrow">{titles[kind].toUpperCase()} · #{row.id}</span>
          <h2 id="records-detail-title">{title}</h2>
          <div className="records-detail__badges">
            {row.estado && cell('estado', row)}
            {row.prioridad && <>{cell('prioridad', row)}<small>prioridad</small></>}
          </div>
        </div>
        <button type="button" className="records-action" onClick={onClose} aria-label="Cerrar" title="Cerrar"><Icon name="close" size={16} /></button>
      </header>

      <div className="records-detail__body">
        {fields.length > 0 && <section className="records-detail__section">
          <h3>Información</h3>
          <dl className="records-detail__grid">
            {fields.map(key => <div key={key}><dt>{humanize(key)}</dt><dd>{key === 'usuario_id' || key === 'creado_por' ? personName(row[key], row, false) : cell(key, row)}</dd></div>)}
          </dl>
        </section>}

        {texts.map(key => <section key={key} className="records-detail__section">
          <h3>{textLabels[key]}</h3>
          <p className="records-detail__text">{row[key]}</p>
        </section>)}

        {history.length > 0 && <section className="records-detail__section">
          <h3>Historial de estados</h3>
          <ol className="records-timeline">
            {[...history].reverse().map((entry, index) => <li key={`${entry.fecha}-${index}`} className={`records-timeline__item records-timeline__item--${toneOf(entry.estado)}`}>
              <span className="records-timeline__dot" aria-hidden="true" />
              <div>
                <strong>{entry.anterior ? <>{capitalize(display('estado', entry.anterior))} <Icon name="arrowRight" size={13} /> {capitalize(display('estado', entry.estado))}</> : `Solicitud ${capitalize(display('estado', entry.estado)).toLowerCase()}`}</strong>
                <small>{formatDate(entry.fecha)} · {personName(entry.actor_id, row)}</small>
              </div>
            </li>)}
          </ol>
        </section>}

        {dates.length > 0 && <section className="records-detail__section">
          <h3>Fechas</h3>
          <dl className="records-detail__grid">
            {dates.map(key => <div key={key}><dt>{dateLabels[key]}</dt><dd>{formatDate(row[key])}</dd></div>)}
          </dl>
        </section>}
      </div>

      <footer className="records-detail__footer">
        {['requests','reservations'].includes(kind) && <Link className="button button--secondary" to={`/${kind}/${row.id}`} state={{ from: operational ? window.location.pathname : null }}><Icon name="arrowUpRight" size={16} /> Abrir detalle completo</Link>}
        <button type="button" className="button button--primary" onClick={onClose}>Cerrar</button>
      </footer>
    </section>
  </div>;
}

export default function RecordsPage({ kind, operational = false }) {
  const { user, role } = useSession();
  const [filters, setFilters] = useState({});
  const [mine, setMine] = useState(false);
  const loader = useCallback(() => listRecords(kind, { operational, mine, ...filters }), [kind, operational, mine, filters]);
  const { data, loading, error, reload } = useResource(loader);
  const [editor, setEditor] = useState(null);
  const [detail, setDetail] = useState(null);
  const [draft, setDraft] = useState({});
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [aux, setAux] = useState({ resources:[], responsables:[] });
  const staff = STAFF.includes(role);
  const admin = role === 'administrador';
  const canCreate = ['requests','pqrs'].includes(kind) || kind === 'events' && EVENT_EDITORS.includes(role) || kind === 'resources' && operational && staff || kind === 'users' && admin || kind === 'services' && admin;

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const resources = kind === 'reservations' ? await listRecords('resources') : [];
        const responsables = kind === 'requests' && operational ? await listResponsables() : [];
        if (active) setAux({ resources, responsables });
      } catch (err) { if (active && !err.cancelled) setMessage(err.message); }
    };
    load();
    return () => { active = false; };
  }, [kind, operational, user?.id]);

  function open(mode, row = null) {
    setMessage(''); setEditor({ mode, row });
    setDraft({ ...initial, ...(kind === 'pqrs' ? { tipo:'peticion' } : kind === 'resources' ? { tipo:'sala' } : {}), ...row,
      ...(row ? { fecha:dateKey(row.fecha), disponible:Boolean(row.disponible), activo:Boolean(row.activo), publico:Boolean(row.publico) } : {}) });
  }
  function fieldNames() {
    if (editor.mode === 'transition') return ['estado'];
    if (editor.mode === 'edit' && kind === 'pqrs') return ['estado','respuesta'];
    if (editor.mode === 'edit' && kind === 'reservations') return ['fecha','hora_inicio','hora_fin'];
    const fields = [...createFields[kind]];
    if (editor.mode === 'edit' && ['services'].includes(kind)) return fields.filter(key => key !== 'codigo');
    if (editor.mode === 'edit' && kind === 'users') return [...fields, 'activo'];
    if (editor.mode === 'edit' && kind === 'requests') return [...fields, 'responsable_id'];
    return fields;
  }
  function choices(key) {
    if (key === 'responsable_id') return [{ value:'', label:'Sin asignar' }, ...aux.responsables.map(row => ({ value:row.id, label:`${row.nombre} (${ROLE_LABELS[row.rol]})` }))];
    if (key === 'recurso_id') return aux.resources.filter(row => row.disponible && row.estado === 'disponible').map(row => ({ value:row.id, label:`${row.codigo} · ${row.nombre}` }));
    if (key === 'estado' && ['requests','pqrs'].includes(kind)) return [editor.row.estado, ...(editor.row.transiciones_permitidas || [])];
    if (key === 'tipo' && kind === 'pqrs') return ['peticion','queja','reclamo','sugerencia'];
    if (key === 'tipo' && kind !== 'events') return null;
    if (key === 'estado' && kind !== 'resources') return null;
    return options[key];
  }
  async function submit(event) {
    event.preventDefault(); setMessage(''); setSaving(true);
    try {
      const fields = {};
      for (const key of fieldNames()) {
        if (['password','respuesta'].includes(key) && !draft[key] && editor.mode === 'edit') continue;
        fields[key] = key === 'responsable_id' ? draft[key] ? Number(draft[key]) : null : key === 'recurso_id' ? Number(draft[key]) : draft[key] ?? '';
        if (editor.mode === 'edit') {
          const old = editor.row[key], value = fields[key];
          const same = ['activo','disponible','publico'].includes(key) ? Boolean(old) === Boolean(value) : key === 'fecha' ? dateKey(old) === value : key.startsWith('hora') ? String(old).slice(0,5) === String(value).slice(0,5) : String(old ?? '') === String(value ?? '');
          if (same) delete fields[key];
        }
      }
      if (!Object.keys(fields).length) { setEditor(null); setMessage('No hay cambios para guardar.'); return; }
      if (editor.mode === 'transition') await transitionRequest(editor.row.id, fields.estado);
      else {
        const result = await saveRecord(kind, fields, editor.row?.id);
        if (kind === 'users' && editor.row?.id === user.id) {
          if (!result.usuario.activo) { clearSession(); window.location.href = '/login'; return; }
          updateSession({ usuario: result.usuario });
        }
      }
      setEditor(null); setMessage('Cambios guardados en el servidor.'); await reload();
    } catch (err) { if (!err.cancelled) setMessage(err.message); }
    finally { setSaving(false); }
  }
  async function action(fn, confirmation) {
    if (confirmation && !window.confirm(confirmation)) return;
    setSaving(true); setMessage('');
    try { await fn(); setMessage('Operación completada.'); await reload(); }
    catch (err) { if (!err.cancelled) setMessage(err.message); }
    finally { setSaving(false); }
  }
  const closeDetail = useCallback(() => setDetail(null), []);
  // Nombre de una persona por id: "Tú", un responsable conocido, el solicitante o "Usuario #n".
  function personName(id, row, asActor = true) {
    if (!id) return 'Sistema';
    if (id === user?.id) return 'Tú';
    const person = aux.responsables.find(item => item.id === id);
    if (person) return person.nombre;
    if (asActor && id === row.usuario_id) return 'Solicitante';
    return `Usuario #${id}`;
  }
  const visibleColumns = columns[kind].filter(key => operational || key !== 'usuario_id');
  const dateFilters = ['requests','pqrs','reservations'].includes(kind);
  const filtered = Boolean(filters.fecha_desde || filters.fecha_hasta || filters.q || mine);
  const count = data?.length ?? 0;
  const isError = message && !['Cambios guardados en el servidor.', 'Operación completada.', 'No hay cambios para guardar.'].includes(message);

  function cell(key, row) {
    const value = row[key];
    if (key === 'estado') return <span className={`records-badge records-badge--${toneOf(value)}`}><i aria-hidden="true" />{capitalize(display(key, value))}</span>;
    if (key === 'prioridad') return <span className={`records-badge records-badge--${priorityTones[String(value).toLowerCase()] || 'info'}`}>{capitalize(display(key, value))}</span>;
    if (['activo','disponible','publico'].includes(key)) return <span className={`records-flag records-flag--${value ? 'yes' : 'no'}`}><Icon name={value ? 'check' : 'close'} size={13} />{value ? 'Sí' : 'No'}</span>;
    if (key === 'id') return <span className="records-table__code">#{value}</span>;
    if (key === 'codigo') return <span className="records-table__code">{value}</span>;
    if (key === 'rol') return <span className="records-badge records-badge--info">{ROLE_LABELS[value] || value}</span>;
    if (key === 'responsable_id') {
      if (!value) return <span className="records-table__muted">Sin asignar</span>;
      const person = aux.responsables.find(item => item.id === value);
      return person ? <span className="records-person"><span>{person.nombre.charAt(0)}</span>{person.nombre}</span> : `Usuario #${value}`;
    }
    if (key === 'recurso_id') {
      const resource = aux.resources.find(item => item.id === value);
      return resource ? <span className="records-table__stack"><strong>{resource.nombre}</strong><small>{resource.codigo}</small></span> : `Recurso #${value}`;
    }
    if (key === 'usuario_id') return `Usuario #${value}`;
    if (key.startsWith('hora')) return String(value ?? '—').slice(0, 5);
    if (['descripcion','respuesta','asunto'].includes(key)) return value ? <span className="records-table__clamp" title={value}>{value}</span> : <span className="records-table__muted">—</span>;
    if (key === 'email') return <span className="records-table__muted">{value}</span>;
    if (key === 'tipo' && value) return capitalize(display(key, value));
    return display(key, value);
  }

  return <section className="role-page records-view">
    <header className="records-view__heading">
      <div className="records-view__title">
        <span className="records-view__icon"><Icon name={kindIcons[kind]} size={22} /></span>
        <div>
          <span className="panel__eyebrow">{operational ? 'GESTIÓN OPERATIVA' : 'MI CAMPUS'}</span>
          <h1>{titles[kind]}</h1>
          <p>{operational ? 'Registros reales del sistema, según tus atribuciones.' : 'Información obtenida de los servicios del campus.'}</p>
        </div>
      </div>
      <div className="records-view__actions">
        <button className="button button--secondary records-view__icon-button" onClick={reload} disabled={loading} aria-label="Actualizar" title="Actualizar"><Icon name="refresh" size={17} /></button>
        {operational && <button className="button button--secondary" disabled={!data?.length} onClick={() => exportCSV(kind, data, visibleColumns.map(key => ({ key, label: labels[key] })))}><Icon name="file" size={16} /> Exportar CSV</button>}
        {canCreate && <button className="button button--primary" onClick={() => open('create')}><Icon name="plus" size={16} /> Crear {kind === 'users' ? 'usuario' : 'registro'}</button>}
      </div>
    </header>

    <div className={`records-view__toolbar${dateFilters || kind === 'users' || (kind === 'events' && EVENT_EDITORS.includes(role)) ? '' : ' records-view__toolbar--compact'}`}>
      <div className="records-view__filters">
        {dateFilters && <>
          <label className="records-view__filter"><span>Desde</span><input type="date" value={filters.fecha_desde || ''} onChange={e => setFilters(current => ({ ...current, fecha_desde:e.target.value }))}/></label>
          <label className="records-view__filter"><span>Hasta</span><input type="date" value={filters.fecha_hasta || ''} onChange={e => setFilters(current => ({ ...current, fecha_hasta:e.target.value }))}/></label>
        </>}
        {kind === 'events' && EVENT_EDITORS.includes(role) && <label className="records-view__check"><input type="checkbox" checked={mine} onChange={e => setMine(e.target.checked)}/> Solo mis eventos</label>}
        {kind === 'users' && <label className="records-view__search"><Icon name="search" size={17} /><input type="search" placeholder="Buscar por nombre o correo…" aria-label="Buscar usuario" value={filters.q || ''} onChange={e => setFilters({ q:e.target.value })}/></label>}
        {filtered && <button type="button" className="records-view__clear" onClick={() => { setFilters({}); setMine(false); }}><Icon name="close" size={14} /> Limpiar filtros</button>}
      </div>
      <span className="records-view__count"><strong>{loading ? '…' : count}</strong> {count === 1 ? 'registro' : 'registros'}</span>
    </div>

    {message && !editor && <p role={isError ? 'alert' : 'status'} className={`records-view__notice records-view__notice--${isError ? 'error' : 'success'}`}><Icon name={isError ? 'alert' : 'checkCircle'} size={17} /> {message}</p>}

    {error ? (
      <div className="records-view__state" role="alert">
        <Icon name="alert" size={26} />
        <h2>No fue posible cargar los registros</h2>
        <p>{error}</p>
        <button className="button button--secondary" onClick={reload}>Reintentar</button>
      </div>
    ) : !loading && !count ? (
      <div className="records-view__state">
        <Icon name={kindIcons[kind]} size={26} />
        <h2>{filtered ? 'No hay registros con estos filtros' : 'Aún no hay registros'}</h2>
        <p>{filtered ? 'Prueba con otro rango de fechas o limpia los filtros.' : canCreate ? 'Crea el primer registro con el botón de arriba.' : 'Cuando haya información, aparecerá aquí.'}</p>
      </div>
    ) : (
      <div className="records-view__table-wrap">
        <table className="records-table" aria-busy={loading}>
          <thead><tr>{visibleColumns.map(key => <th key={key}>{labels[key]}</th>)}<th className="records-table__actions">Acciones</th></tr></thead>
          <tbody>
            {loading ? [0, 1, 2, 3, 4].map(index => <tr key={index} className="records-table__skeleton">{visibleColumns.map(key => <td key={key}><span /></td>)}<td className="records-table__actions"><span /></td></tr>) : data.map(row => {
              const editable = kind === 'events' ? canEditEvent(user, row) : operational && staff && ['requests','pqrs','resources','reservations'].includes(kind) || admin && ['users','services'].includes(kind);
              const removable = kind === 'resources' ? operational && staff : admin && ['users','services','events'].includes(kind);
              return <tr key={row.id}>
                {visibleColumns.map(key => <td key={key} className={shortColumns.includes(key) ? 'records-table__nowrap' : undefined}>{cell(key, row)}</td>)}
                <td className="records-table__actions"><div>
                  {kind === 'requests' && operational && row.transiciones_permitidas?.length > 0 && <IconAction icon="arrowRight" label="Cambiar estado" tone="primary" onClick={() => open('transition', row)} />}
                  <IconAction icon="eye" label="Ver registro" onClick={() => setDetail(row)} />
                  {['requests','reservations'].includes(kind) && <Link className="records-action" to={`/${kind}/${row.id}`} state={{ from: operational ? window.location.pathname : null }} aria-label="Abrir detalle" title="Abrir detalle"><Icon name="arrowUpRight" size={16} /></Link>}
                  {editable && !(kind === 'reservations' && row.estado === 'cancelada') && <IconAction icon="edit" label="Editar" disabled={saving} onClick={() => open('edit', row)} />}
                  {kind === 'reservations' && operational && row.estado !== 'cancelada' && <IconAction icon="close" label="Cancelar reserva" tone="danger" disabled={saving} onClick={() => action(() => cancelReservation(row.id), '¿Cancelar esta reserva?')} />}
                  {removable && (kind !== 'users' || row.activo) && <IconAction icon="trash" label={kind === 'users' ? 'Desactivar' : 'Dar de baja'} tone="danger" disabled={saving} onClick={() => action(async () => { await deleteRecord(kind, row.id); if (kind === 'users' && row.id === user.id) { clearSession(); window.location.href = '/login'; } }, '¿Dar de baja este registro?')} />}
                  {kind === 'users' && !row.activo && <IconAction icon="refresh" label="Reactivar" tone="success" disabled={saving} onClick={() => action(() => reactivateUser(row.id))} />}
                </div></td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
    )}
    {editor && <div className="role-modal-backdrop"><form className="role-modal panel" onSubmit={submit} aria-label="Formulario de registro"><h2>{editor.mode === 'transition' ? 'Cambiar estado' : editor.row ? 'Editar registro' : 'Nuevo registro'}</h2>
      {fieldNames().map(key => {
        const opts = choices(key);
        return <label key={key}>{labels[key]}
          {['activo','disponible','publico'].includes(key) ? <input type="checkbox" checked={Boolean(draft[key])} onChange={e => setDraft(current => ({ ...current, [key]:e.target.checked }))}/> : opts ? <select value={draft[key] ?? ''} onChange={e => setDraft(current => ({ ...current, [key]:e.target.value }))}>{opts.map(opt => <option key={opt.value ?? opt} value={opt.value ?? opt}>{opt.label ?? display(key, opt)}</option>)}</select> : ['descripcion','respuesta'].includes(key) ? <textarea rows="4" value={draft[key] ?? ''} maxLength={10000} onChange={e => setDraft(current => ({ ...current, [key]:e.target.value }))}/> : <input required={key !== 'password' || !editor.row} type={key === 'email' ? 'email' : key === 'password' ? 'password' : key === 'fecha' ? 'date' : key.startsWith('hora') ? 'time' : 'text'} value={draft[key] ?? ''} minLength={key === 'password' ? 8 : undefined} onChange={e => setDraft(current => ({ ...current, [key]:e.target.value }))}/>}
        </label>;
      })}
      {message && <p role="alert">{message}</p>}<div className="role-actions"><button type="button" className="button button--secondary" onClick={() => setEditor(null)} disabled={saving}>Cerrar</button><button className="button button--primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button></div>
    </form></div>}
    {detail && <DetailModal kind={kind} row={detail} cell={cell} personName={personName} operational={operational} onClose={closeDetail} />}
  </section>;
}
