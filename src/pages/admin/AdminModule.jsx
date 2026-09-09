import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Icon from "../../components/Icon/Icon";

const usersSeed = [
  ["USR-1001","Ismael Pérez","ismael@uniajs.edu.co","ESTUDIANTE","Ingeniería de Sistemas","ACTIVO"],
  ["USR-1002","Laura Gómez","laura@uniajs.edu.co","DOCENTE","Ingeniería de Sistemas","ACTIVO"],
  ["USR-1003","Carlos Mendoza","carlos@uniajs.edu.co","ADMINISTRATIVO","Gestión Institucional","ACTIVO"],
  ["USR-1004","Ana Torres","ana@uniajs.edu.co","ESTUDIANTE","Administración","PENDIENTE"],
  ["USR-1005","Miguel Rojas","miguel@uniajs.edu.co","DOCENTE","Derecho","ACTIVO"],
  ["USR-1006","Sofía Martínez","sofia@uniajs.edu.co","ESTUDIANTE","Contaduría","INACTIVO"],
];
const requestsSeed = [
  ["REQ-10482","Certificado académico","Registro Académico","ALTA","EN PROCESO","Laura Gómez"],
  ["REQ-10481","Soporte de laboratorio","Sistemas","MEDIA","EN REVISIÓN","Mesa de servicios"],
  ["REQ-10479","Préstamo de equipo","Biblioteca","BAJA","ASIGNADA","Recursos físicos"],
  ["REQ-10472","Actualización de datos","Admisiones","MEDIA","RESUELTA","Atención institucional"],
  ["REQ-10466","Acceso a plataforma","Sistemas","ALTA","REGISTRADA","Mesa de servicios"],
];
const resourcesSeed = [
  ["REC-201","LAB-204","Laboratorio de cómputo","Bloque B","DISPONIBLE"],
  ["REC-202","PR-019","Proyector","Bloque B - 204","EN USO"],
  ["REC-203","AUD-001","Auditorio Principal","Bloque A","DISPONIBLE"],
  ["REC-204","LAB-102","Laboratorio de redes","Bloque A","MANTENIMIENTO"],
  ["REC-205","CAM-014","Cámara audiovisual","Medios","DISPONIBLE"],
];
const services = [
  ["Solicitudes","Gestión y seguimiento de requerimientos","ACTIVO","Mesa de servicios"],
  ["Reservas","Espacios, salas y equipos","ACTIVO","Recursos físicos"],
  ["Recursos","Inventario y disponibilidad","ACTIVO","Recursos físicos"],
  ["Eventos","Actividades académicas e institucionales","ACTIVO","Bienestar"],
  ["Notificaciones","Comunicaciones y alertas","ACTIVO","Sistemas"],
  ["PQRS","Peticiones, quejas, reclamos y sugerencias","ACTIVO","Atención institucional"],
];
const deps = ["Registro Académico","Sistemas","Bienestar Universitario","Biblioteca","Admisiones","Recursos Físicos","Gestión Institucional"];
const roles = [
  ["ADMINISTRADOR","Control total de la plataforma",["Usuarios","Roles","Servicios","Solicitudes","Reservas","Recursos","Analítica","Auditoría"]],
  ["ADMINISTRATIVO","Gestión operativa universitaria",["Solicitudes","Reservas","Recursos","PQRS","Eventos"]],
  ["DOCENTE","Servicios académicos y reservas",["Servicios","Solicitudes","Reservas","Eventos"]],
  ["ESTUDIANTE","Consulta y gestión personal",["Servicios","Solicitudes","Reservas","Eventos","PQRS"]],
];
const modules = {
  analytics:["Analítica institucional","Indicadores para entender demanda, operación y desempeño del campus."],
  users:["Gestión de usuarios","Administra cuentas, roles, estado y actividad de la comunidad universitaria."],
  roles:["Roles y permisos","Define qué puede consultar y administrar cada perfil."],
  dependencies:["Dependencias","Organiza las áreas responsables de atender los servicios universitarios."],
  services:["Servicios universitarios","Controla catálogo, disponibilidad y responsable de cada servicio."],
  requests:["Gestión de solicitudes","Supervisa el ciclo completo de atención y asignación."],
  reservations:["Gestión de reservas","Controla la agenda global y el uso de espacios y recursos."],
  resources:["Inventario de recursos","Supervisa disponibilidad, uso y mantenimiento de activos."],
  events:["Gestión de eventos","Publica actividades, administra cupos y controla inscripciones."],
  notifications:["Centro de comunicaciones","Envía avisos segmentados y revisa comunicaciones recientes."],
  pqrs:["Centro PQRS","Gestiona peticiones, quejas, reclamos y sugerencias."],
  monitoring:["Estado del sistema","Supervisa la salud de Gateway y microservicios."],
  audit:["Auditoría","Consulta las acciones relevantes realizadas en la plataforma."],
  settings:["Configuración administrativa","Define políticas operativas del Smart Campus."],
};

function Kpi({label,value,detail,icon}){return <article className="admin-v2-kpi"><span className="admin-v2-kpi__icon"><Icon name={icon} size={19}/></span><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></article>}
function Pill({children}){return <span className={`admin-v2-pill admin-v2-pill--${String(children).toLowerCase().replaceAll(" ","-")}`}>{children}</span>}
function AdminModule(){
  const { pathname } = useLocation();
  const key = pathname.split("/")[2] || "analytics";
  const [users,setUsers]=useState(usersSeed.map(x=>({id:x[0],name:x[1],email:x[2],role:x[3],program:x[4],status:x[5]})));
  const [requests,setRequests]=useState(requestsSeed.map(x=>({id:x[0],type:x[1],dep:x[2],priority:x[3],status:x[4],responsible:x[5]})));
  const [resources,setResources]=useState(resourcesSeed.map(x=>({id:x[0],name:x[1],type:x[2],location:x[3],status:x[4]})));
  const [query,setQuery]=useState(""); const [toast,setToast]=useState("");
  const [modal,setModal]=useState(false);
  const info=modules[key]||modules.analytics;
  const notify=(m)=>{setToast(m);setTimeout(()=>setToast(""),2200)};
  const filteredUsers=useMemo(()=>users.filter(u=>`${u.name} ${u.email} ${u.role} ${u.program}`.toLowerCase().includes(query.toLowerCase())),[users,query]);
  const filteredRequests=useMemo(()=>requests.filter(r=>`${r.id} ${r.type} ${r.dep} ${r.status}`.toLowerCase().includes(query.toLowerCase())),[requests,query]);
  const toggleUser=id=>{setUsers(v=>v.map(u=>u.id===id?{...u,status:u.status==="ACTIVO"?"INACTIVO":"ACTIVO"}:u));notify("Estado de usuario actualizado.")};
  const advance=id=>{const flow=["REGISTRADA","EN REVISIÓN","ASIGNADA","EN PROCESO","RESUELTA","CERRADA"];setRequests(v=>v.map(r=>{if(r.id!==id)return r;const i=flow.indexOf(r.status);return {...r,status:flow[Math.min(i+1,5)]}}));notify("Flujo de solicitud actualizado.")};
  const toggleResource=id=>{setResources(v=>v.map(r=>r.id===id?{...r,status:r.status==="DISPONIBLE"?"EN USO":"DISPONIBLE"}:r));notify("Estado del recurso actualizado.")};

  if(key==="analytics") return <Page title={info[0]} subtitle={info[1]} action={<button className="button button--secondary" onClick={()=>notify("Datos actualizados.")}><Icon name="refresh" size={16}/> Actualizar</button>}>
    <div className="admin-v2-kpis"><Kpi label="Solicitudes este mes" value="1.284" detail="+12.8% vs. mes anterior" icon="requests"/><Kpi label="Resolución promedio" value="18h 42m" detail="↓ 2h 14m de mejora" icon="clock"/><Kpi label="Uso de recursos" value="73.2%" detail="846 activos registrados" icon="resources"/><Kpi label="Satisfacción" value="92.4%" detail="1.106 valoraciones" icon="checkCircle"/></div>
    <div className="admin-v2-grid">
      <Panel title="Solicitudes por estado" kicker="OPERACIÓN"><div className="bars">{[["Registradas",320,100],["En revisión",184,58],["Asignadas",121,38],["En proceso",203,64],["Resueltas",298,93],["Cerradas",350,100]].map(x=><div className="bar-row" key={x[0]}><span>{x[0]}</span><div><i style={{width:`${x[2]}%`}}/></div><b>{x[1]}</b></div>)}</div></Panel>
      <Panel title="Uso por servicio" kicker="DEMANDA"><div className="donut-card"><div className="donut"><strong>73%</strong><span>ocupación</span></div><div>{[["Reservas","38%"],["Solicitudes","27%"],["Recursos","19%"],["Eventos","16%"]].map(x=><p className="legend" key={x[0]}><i/>{x[0]} <b>{x[1]}</b></p>)}</div></div></Panel>
      <Panel title="Actividad mensual" kicker="TENDENCIA" wide><div className="spark-bars">{[52,61,48,74,67,82,72,91,78,86,94,100].map((v,i)=><div key={i}><i style={{height:`${v}%`}}/><small>{["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][i]}</small></div>)}</div></Panel>
    </div>
  </Page>;

  if(key==="users") return <Page title={info[0]} subtitle={info[1]} action={<button className="button button--primary" onClick={()=>setModal(true)}><Icon name="plus" size={16}/> Nuevo usuario</button>}>
    <Toolbar value={query} setValue={setQuery} placeholder="Buscar por nombre, correo, rol o programa"/>
    <Panel title={`${filteredUsers.length} usuarios`} kicker="DIRECTORIO"><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Usuario</th><th>Rol</th><th>Programa / dependencia</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{filteredUsers.map(u=><tr key={u.id}><td><strong>{u.name}</strong><small>{u.email} · {u.id}</small></td><td><Pill>{u.role}</Pill></td><td>{u.program}</td><td><Pill>{u.status}</Pill></td><td><button className="table-action" onClick={()=>toggleUser(u.id)}>{u.status==="ACTIVO"?"Desactivar":"Activar"}</button></td></tr>)}</tbody></table></div></Panel>
    {modal&&<Modal title="Registrar usuario" close={()=>setModal(false)} onSave={()=>{setModal(false);notify("Usuario creado en el entorno de demostración.")}}/>}
  </Page>;

  if(key==="roles") return <Page title={info[0]} subtitle={info[1]} action={<button className="button button--primary" onClick={()=>notify("Editor de rol preparado para la API.")}><Icon name="plus" size={16}/> Crear rol</button>}><div className="role-grid">{roles.map(r=><article className="role-card" key={r[0]}><div><span className="role-icon"><Icon name="shield" size={20}/></span><Pill>{r[0]}</Pill></div><h3>{r[0]}</h3><p>{r[1]}</p><div className="permission-list">{r[2].map(p=><span key={p}>✓ {p}</span>)}</div><button className="table-action" onClick={()=>notify(`Editando permisos de ${r[0].toLowerCase()}.`)}>Editar permisos</button></article>)}</div></Page>;

  if(key==="dependencies") return <Page title={info[0]} subtitle={info[1]} action={<button className="button button--primary" onClick={()=>notify("Nueva dependencia: formulario listo.")}><Icon name="plus" size={16}/> Nueva dependencia</button>}><div className="dependency-grid">{deps.map((d,i)=><article className="dependency-card" key={d}><span><Icon name="building" size={20}/></span><h3>{d}</h3><p>{[184,96,142,88,117,74,63][i]} solicitudes asignadas</p><div className="mini-progress"><i style={{width:`${35+i*7}%`}}/></div><small>Responsable: {["María R.","Laura G.","Carlos M.","Ana P."][i%4]}</small></article>)}</div></Page>;

  if(key==="services") return <Page title={info[0]} subtitle={info[1]} action={<button className="button button--primary" onClick={()=>notify("Editor de servicio abierto.")}><Icon name="plus" size={16}/> Nuevo servicio</button>}><div className="service-admin-grid">{services.map(s=><article className="service-admin-card" key={s[0]}><div className="service-admin-card__top"><span className="role-icon"><Icon name="services" size={19}/></span><Pill>{s[2]}</Pill></div><h3>{s[0]}</h3><p>{s[1]}</p><small>Responsable · {s[3]}</small><div><button className="table-action" onClick={()=>notify(`${s[0]}: configuración actualizada.`)}>Configurar</button><button className="table-action" onClick={()=>notify(`${s[0]} ${s[2]==="ACTIVO"?"desactivado":"activado"}.`)}>{s[2]==="ACTIVO"?"Desactivar":"Activar"}</button></div></article>)}</div></Page>;

  if(key==="requests") return <Page title={info[0]} subtitle={info[1]} action={<button className="button button--secondary" onClick={()=>notify("Reporte de solicitudes generado.")}><Icon name="file" size={16}/> Exportar</button>}><Toolbar value={query} setValue={setQuery} placeholder="Buscar ID, tipo, dependencia o estado"/><Panel title="Cola operativa" kicker="SEGUIMIENTO"><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Solicitud</th><th>Dependencia</th><th>Prioridad</th><th>Estado</th><th>Responsable</th><th></th></tr></thead><tbody>{filteredRequests.map(r=><tr key={r.id}><td><strong>#{r.id}</strong><small>{r.type}</small></td><td>{r.dep}</td><td><Pill>{r.priority}</Pill></td><td><Pill>{r.status}</Pill></td><td>{r.responsible}</td><td><button className="table-action" onClick={()=>advance(r.id)}>Avanzar</button></td></tr>)}</tbody></table></div></Panel></Page>;

  if(key==="resources") return <Page title={info[0]} subtitle={info[1]} action={<button className="button button--primary" onClick={()=>notify("Formulario de recurso preparado.")}><Icon name="plus" size={16}/> Registrar recurso</button>}><div className="admin-v2-kpis"><Kpi label="Total" value={resources.length+841} detail="inventario institucional" icon="resources"/><Kpi label="Disponibles" value={resources.filter(r=>r.status==="DISPONIBLE").length+728} detail="listos para reservar" icon="checkCircle"/><Kpi label="En uso" value={resources.filter(r=>r.status==="EN USO").length+81} detail="ocupación actual" icon="monitor"/><Kpi label="Mantenimiento" value={resources.filter(r=>r.status==="MANTENIMIENTO").length+32} detail="requieren atención" icon="alert"/></div><Panel title="Inventario operativo" kicker="RECURSOS"><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Código</th><th>Recurso</th><th>Tipo</th><th>Ubicación</th><th>Estado</th><th></th></tr></thead><tbody>{resources.map(r=><tr key={r.id}><td><strong>{r.id}</strong><small>{r.name}</small></td><td>{r.name}</td><td>{r.type}</td><td>{r.location}</td><td><Pill>{r.status}</Pill></td><td><button className="table-action" onClick={()=>toggleResource(r.id)}>Cambiar estado</button></td></tr>)}</tbody></table></div></Panel></Page>;

  if(key==="reservations") return <Page title={info[0]} subtitle={info[1]} action={<Link className="button button--secondary" to="/calendar"><Icon name="calendar" size={16}/> Abrir calendario</Link>}><div className="admin-v2-kpis"><Kpi label="Reservas hoy" value="92" detail="18 espacios ocupados ahora" icon="reservations"/><Kpi label="Esta semana" value="487" detail="+6.2% demanda" icon="calendar"/><Kpi label="Conflictos" value="4" detail="requieren revisión" icon="alert"/><Kpi label="Canceladas" value="17" detail="este mes" icon="close"/></div><Panel title="Agenda global" kicker="CAMPUS"><div className="timeline">{["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00"].map((t,i)=><div className="timeline-row" key={t}><b>{t}</b><div>{i===1?<span>LAB-204 · Ingeniería de Sistemas</span>:i===3?<span>Auditorio Principal · Conferencia</span>:i===5?<span>LAB-102 · Redes</span>:<em>Disponible</em>}</div></div>)}</div></Panel></Page>;

  if(key==="events") return <Page title={info[0]} subtitle={info[1]} action={<button className="button button--primary" onClick={()=>notify("Editor de evento abierto.")}><Icon name="plus" size={16}/> Crear evento</button>}><div className="event-admin-grid">{["Feria Tecnológica 2026","Seminario de Sistemas Distribuidos","Taller de Innovación","Jornada de Bienestar"].map((e,i)=><article className="event-admin-card" key={e}><span>0{i+4} SEP</span><h3>{e}</h3><p>{["Auditorio Principal","Bloque B · 204","Sala de Innovación","Plaza Central"][i]}</p><div><strong>{[184,76,42,219][i]} inscritos</strong><small> · capacidad {[250,100,60,300][i]}</small></div><div className="mini-progress"><i style={{width:`${[74,76,70,73][i]}%`}}/></div><button className="table-action" onClick={()=>notify("Evento editado.")}>Gestionar</button></article>)}</div></Page>;

  if(key==="notifications") return <Page title={info[0]} subtitle={info[1]} action={<button className="button button--primary" onClick={()=>notify("Editor de comunicación abierto.")}><Icon name="plus" size={16}/> Nueva comunicación</button>}><div className="notification-composer"><div><span className="panel-kicker">ENVÍO SEGMENTADO</span><h2>Comunicar al campus</h2><p>Selecciona audiencia, prioridad y canal para distribuir una comunicación institucional.</p></div><div className="segment-row">{["Todos","Estudiantes","Docentes","Administrativos","Dependencia"].map((x,i)=><button className={i===0?"segment segment--active":"segment"} key={x} onClick={()=>notify(`Audiencia: ${x}`)}>{x}</button>)}</div><button className="button button--primary" onClick={()=>notify("Comunicación programada en modo demostración.")}>Programar envío</button></div><Panel title="Historial reciente" kicker="COMUNICACIONES"><div className="simple-list">{["Mantenimiento de plataforma","Confirmación de reserva","Nueva actividad académica","Actualización de servicio"].map((x,i)=><div key={x}><span className="role-icon"><Icon name="bell" size={17}/></span><div><strong>{x}</strong><small>{["Todos los usuarios","Estudiantes","Docentes","Ingeniería"][i]} · hace {[12,38,64,91][i]} min</small></div><Pill>{i===0?"URGENTE":"ENVIADA"}</Pill></div>)}</div></Panel></Page>;

  if(key==="pqrs") return <Page title={info[0]} subtitle={info[1]}><div className="admin-v2-kpis"><Kpi label="Total PQRS" value="126" detail="+8 este mes" icon="pqrs"/><Kpi label="Sin atender" value="18" detail="requieren asignación" icon="alert"/><Kpi label="En proceso" value="37" detail="seguimiento activo" icon="clock"/><Kpi label="Tiempo medio" value="26h" detail="meta: 48h" icon="checkCircle"/></div><Panel title="Bandeja PQRS" kicker="ATENCIÓN"><div className="simple-list">{["Petición de certificado","Queja por disponibilidad de sala","Sugerencia de horarios","Reclamo sobre reserva"].map((x,i)=><div key={x}><span className="role-icon"><Icon name="pqrs" size={17}/></span><div><strong>{x}</strong><small>#{1040+i} · {["Petición","Queja","Sugerencia","Reclamo"][i]} · hace {i+2}h</small></div><Pill>{["NUEVA","EN REVISIÓN","ASIGNADA","EN PROCESO"][i]}</Pill><button className="table-action" onClick={()=>notify("PQRS asignada para seguimiento.")}>Gestionar</button></div>)}</div></Panel></Page>;

  if(key==="monitoring") return <Page title={info[0]} subtitle={info[1]} action={<button className="button button--secondary" onClick={()=>notify("Monitoreo actualizado.")}><Icon name="refresh" size={16}/> Actualizar</button>}><div className="system-banner"><span className="admin-dot admin-dot--success"/><div><strong>Todos los componentes operativos</strong><small>Última comprobación · hace 12 segundos</small></div><b>99.82% disponibilidad</b></div><div className="service-health-grid">{["API Gateway","MS Usuarios","MS Solicitudes","MS Reservas","MS Recursos","MS Eventos","MS Notificaciones"].map((x,i)=><article key={x}><div><span className={`health-dot ${i===3?"health-dot--warning":""}`}/><strong>{x}</strong></div><span>{i===3?"Degradado":"Operativo"}</span><small>{[36,42,58,428,43,47,36][i]} ms · {i===3?"revisar latencia":"saludable"}</small><div className="health-meter"><i style={{width:`${[92,96,94,51,97,95,98][i]}%`}}/></div></article>)}</div></Page>;

  if(key==="audit") return <Page title={info[0]} subtitle={info[1]} action={<button className="button button--secondary" onClick={()=>notify("Registro de auditoría exportado.")}><Icon name="file" size={16}/> Exportar</button>}><Toolbar value={query} setValue={setQuery} placeholder="Buscar usuario, acción o módulo"/><Panel title="Registro de actividad" kicker="TRAZABILIDAD"><div className="audit-list">{[["10:42","admin@uniajs.edu.co","UPDATE","Solicitudes","REQ-10482 pasó a EN PROCESO"],["10:38","admin@uniajs.edu.co","CREATE","Usuarios","Creó USR-1007"],["10:21","laura@uniajs.edu.co","UPDATE","Recursos","PR-019 cambió a EN USO"],["09:57","admin@uniajs.edu.co","CLOSE","Solicitudes","REQ-10392 fue cerrada"],["09:32","admin@uniajs.edu.co","PUBLISH","Eventos","Publicó Feria Tecnológica 2026"],["09:14","carlos@uniajs.edu.co","LOGIN","Seguridad","Inicio de sesión correcto"]].filter(x=>x.join(" ").toLowerCase().includes(query.toLowerCase())).map(x=><div key={x[0]+x[2]}><time>{x[0]}</time><span className="audit-action">{x[2]}</span><div><strong>{x[3]}</strong><p>{x[4]}</p></div><small>{x[1]}</small></div>)}</div></Panel></Page>;

  return <Page title={info[0]} subtitle={info[1]} action={<button className="button button--primary" onClick={()=>notify("Configuración guardada.")}><Icon name="check" size={16}/> Guardar cambios</button>}><div className="settings-admin-grid">{[["Políticas de reservas","Máximo de reservas por usuario","5","Tiempo mínimo de anticipación","2 horas"],["Atención de solicitudes","Tiempo objetivo de respuesta","48 horas","Escalamiento automático","Activado"],["Mantenimiento","Modo mantenimiento","Desactivado","Mensaje institucional","Campus operativo"],["Seguridad","Sesiones simultáneas","3","Caducidad de sesión","60 minutos"]].map(x=><article className="admin-setting-card" key={x[0]}><span className="panel-kicker">CONFIGURACIÓN</span><h3>{x[0]}</h3><label>{x[1]}<input defaultValue={x[2]}/></label><label>{x[3]}<input defaultValue={x[4]}/></label></article>)}</div></Page>;
}
function Page({title,subtitle,action,children}){return <section className="admin-v2-page"><div className="admin-v2-head"><div><span className="page-eyebrow"><span/> CENTRO DE CONTROL</span><h1>{title}</h1><p>{subtitle}</p></div><div>{action}</div></div>{children}</section>}
function Panel({title,kicker,children,wide}){return <article className={`admin-v2-panel ${wide?"admin-v2-panel--wide":""}`}><div className="admin-v2-panel__head"><div><span>{kicker}</span><h2>{title}</h2></div></div>{children}</article>}
function Toolbar({value,setValue,placeholder}){return <div className="admin-v2-toolbar"><div className="admin-v2-search"><Icon name="search" size={17}/><input value={value} onChange={e=>setValue(e.target.value)} placeholder={placeholder}/></div><button className="filter-button" type="button"><Icon name="settings" size={16}/> Filtros</button></div>}
function Modal({title,close,onSave}){return <div className="admin-v2-modal-backdrop" onClick={close}><form className="admin-v2-modal" onSubmit={e=>{e.preventDefault();onSave()}} onClick={e=>e.stopPropagation()}><button type="button" className="icon-button admin-v2-modal__close" onClick={close}><Icon name="close" size={18}/></button><span className="panel-kicker">NUEVO REGISTRO</span><h2>{title}</h2><div className="admin-form-grid"><label>Nombre<input required placeholder="Nombre completo"/></label><label>Correo institucional<input required type="email" placeholder="usuario@uniajs.edu.co"/></label><label>Rol<select defaultValue="ESTUDIANTE"><option>ESTUDIANTE</option><option>DOCENTE</option><option>ADMINISTRATIVO</option></select></label><label>Programa / dependencia<input placeholder="Ingeniería de Sistemas"/></label></div><div className="admin-v2-modal__actions"><button type="button" className="button button--secondary" onClick={close}>Cancelar</button><button className="button button--primary">Crear usuario</button></div></form></div>}
export default AdminModule;
