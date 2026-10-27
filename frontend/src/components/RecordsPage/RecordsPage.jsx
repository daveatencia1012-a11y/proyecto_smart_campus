import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  const visibleColumns = columns[kind].filter(key => operational || key !== 'usuario_id');
  return <section className="role-page">
    <header className="role-page__heading"><div><span className="panel__eyebrow">{operational ? 'GESTIÓN OPERATIVA' : 'MI CAMPUS'}</span><h1>{titles[kind]}</h1><p>{operational ? 'Registros reales del sistema, según tus atribuciones.' : 'Información obtenida de los servicios del campus.'}</p></div>
      <div className="role-actions">{canCreate && <button className="button button--primary" onClick={() => open('create')}>Crear {kind === 'users' ? 'usuario' : 'registro'}</button>}
        {operational && <button className="button button--secondary" disabled={!data?.length} onClick={() => exportCSV(kind, data, visibleColumns.map(key => ({ key, label: labels[key] })))}>Exportar CSV</button>}
        <button className="button button--secondary" onClick={reload}>Actualizar</button></div>
    </header>
    <div className="role-toolbar panel">
      {['requests','pqrs','reservations'].includes(kind) && <><label>Desde<input type="date" value={filters.fecha_desde || ''} onChange={e => setFilters(current => ({ ...current, fecha_desde:e.target.value }))}/></label><label>Hasta<input type="date" value={filters.fecha_hasta || ''} onChange={e => setFilters(current => ({ ...current, fecha_hasta:e.target.value }))}/></label></>}
      {kind === 'events' && EVENT_EDITORS.includes(role) && <label><input type="checkbox" checked={mine} onChange={e => setMine(e.target.checked)}/> Solo mis eventos</label>}
      {kind === 'users' && <label>Buscar usuario<input type="search" value={filters.q || ''} onChange={e => setFilters({ q:e.target.value })}/></label>}
      <span>{data?.length ?? 0} registros</span>
    </div>
    {message && !editor && <p role="status" className="role-message">{message}</p>}
    {loading ? <p role="status">Cargando…</p> : error ? <div className="panel role-empty" role="alert"><p>{error}</p><button className="button button--secondary" onClick={reload}>Reintentar</button></div> : <div className="panel role-table-wrap"><table className="role-table"><thead><tr>{visibleColumns.map(key => <th key={key}>{labels[key]}</th>)}<th>Acciones</th></tr></thead><tbody>
      {(data || []).map(row => {
        const editable = kind === 'events' ? canEditEvent(user, row) : operational && staff && ['requests','pqrs','resources','reservations'].includes(kind) || admin && ['users','services'].includes(kind);
        const removable = kind === 'resources' ? operational && staff : admin && ['users','services','events'].includes(kind);
        return <tr key={row.id}>{visibleColumns.map(key => <td key={key}>{display(key, row[key])}</td>)}<td><div className="role-actions">
          <button className="table-action" onClick={() => setDetail(row)}>Ver</button>
          {['requests','reservations'].includes(kind) && <Link className="table-action" to={`/${kind}/${row.id}`} state={{ from: operational ? window.location.pathname : null }}>Detalle</Link>}
          {editable && !(kind === 'reservations' && row.estado === 'cancelada') && <button className="table-action" disabled={saving} onClick={() => open('edit', row)}>Editar</button>}
          {kind === 'requests' && operational && row.transiciones_permitidas?.length > 0 && <button className="table-action" onClick={() => open('transition', row)}>Cambiar estado</button>}
          {kind === 'reservations' && operational && row.estado !== 'cancelada' && <button className="table-action" disabled={saving} onClick={() => action(() => cancelReservation(row.id), '¿Cancelar esta reserva?')}>Cancelar</button>}
          {removable && (kind !== 'users' || row.activo) && <button className="table-action" disabled={saving} onClick={() => action(async () => { await deleteRecord(kind, row.id); if (kind === 'users' && row.id === user.id) { clearSession(); window.location.href = '/login'; } }, '¿Dar de baja este registro?')}>{kind === 'users' ? 'Desactivar' : 'Dar de baja'}</button>}
          {kind === 'users' && !row.activo && <button className="table-action" disabled={saving} onClick={() => action(() => reactivateUser(row.id))}>Reactivar</button>}
        </div></td></tr>;
      })}
    </tbody></table>{!data?.length && <p className="role-empty">No hay registros para mostrar.</p>}</div>}
    {editor && <div className="role-modal-backdrop"><form className="role-modal panel" onSubmit={submit} aria-label="Formulario de registro"><h2>{editor.mode === 'transition' ? 'Cambiar estado' : editor.row ? 'Editar registro' : 'Nuevo registro'}</h2>
      {fieldNames().map(key => {
        const opts = choices(key);
        return <label key={key}>{labels[key]}
          {['activo','disponible','publico'].includes(key) ? <input type="checkbox" checked={Boolean(draft[key])} onChange={e => setDraft(current => ({ ...current, [key]:e.target.checked }))}/> : opts ? <select value={draft[key] ?? ''} onChange={e => setDraft(current => ({ ...current, [key]:e.target.value }))}>{opts.map(opt => <option key={opt.value ?? opt} value={opt.value ?? opt}>{opt.label ?? display(key, opt)}</option>)}</select> : ['descripcion','respuesta'].includes(key) ? <textarea rows="4" value={draft[key] ?? ''} maxLength={10000} onChange={e => setDraft(current => ({ ...current, [key]:e.target.value }))}/> : <input required={key !== 'password' || !editor.row} type={key === 'email' ? 'email' : key === 'password' ? 'password' : key === 'fecha' ? 'date' : key.startsWith('hora') ? 'time' : 'text'} value={draft[key] ?? ''} minLength={key === 'password' ? 8 : undefined} onChange={e => setDraft(current => ({ ...current, [key]:e.target.value }))}/>}
        </label>;
      })}
      {message && <p role="alert">{message}</p>}<div className="role-actions"><button type="button" className="button button--secondary" onClick={() => setEditor(null)} disabled={saving}>Cerrar</button><button className="button button--primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button></div>
    </form></div>}
    {detail && <div className="role-modal-backdrop"><section className="role-modal panel" role="dialog" aria-modal="true" aria-label="Detalle"><h2>Registro #{detail.id}</h2><dl>{Object.entries(detail).filter(([key]) => key !== 'transiciones_permitidas').map(([key,value]) => <div key={key}><dt>{labels[key] || key}</dt><dd>{typeof value === 'object' ? JSON.stringify(value) : display(key,value)}</dd></div>)}</dl><button className="button button--secondary" onClick={() => setDetail(null)}>Cerrar</button></section></div>}
  </section>;
}
