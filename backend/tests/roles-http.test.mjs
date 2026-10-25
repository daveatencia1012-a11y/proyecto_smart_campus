import assert from 'node:assert/strict';
import { describe, it, before, after } from 'node:test';
import { startRoleStack } from './helpers/role-stack.mjs';

describe('cuatro roles: HTTP real, gateway, seis servicios y MySQL', { skip:process.env.RUN_MYSQL_TESTS !== '1' }, () => {
  let stack, resource, disabled, request, privateEvent, notice;
  const tokens = {};
  const roles = ['estudiante','docente','administrativo','administrador'];
  let sequence = 0;
  async function call(method, path, role, body) {
    const headers = { 'Content-Type':'application/json' };
    if (role) headers.Authorization = `Bearer ${tokens[role] || 'invalid'}`;
    const response = await fetch(stack.gateway + path, { method, headers, ...(body === undefined ? {} : { body:JSON.stringify(body) }), signal:AbortSignal.timeout(15000) });
    const text = await response.text();
    let data; try { data = text ? JSON.parse(text) : null; } catch { data = { error:text }; }
    return { status:response.status, data };
  }
  const requestBody = () => ({ tipo_servicio:'Soporte académico', dependencia:'Biblioteca', descripcion:`Solicitud ${++sequence}`, prioridad:'media' });
  const eventBody = () => ({ nombre:`Evento ${++sequence}`, descripcion:'Actividad académica', fecha:'2099-11-10', hora:'10:00', lugar:'Campus', tipo:'academico', publico:false });
  const resourceBody = () => ({ codigo:`LAB-${++sequence}`, nombre:'Laboratorio real', tipo:'laboratorio', ubicacion:'Bloque A', estado:'disponible', disponible:true });
  const booking = (hour = '10:00') => ({ recurso_id:resource.id, fecha:'2099-11-10', hora_inicio:hour, hora_fin:`${String(Number(hour.slice(0,2))+1).padStart(2,'0')}:00` });
  before(async () => {
    stack = await startRoleStack();
    for (const [role, account] of Object.entries(stack.accounts)) {
      const result = await call('POST','/api/auth/login',null,{ email:account.email,password:account.password });
      assert.equal(result.status,200,JSON.stringify(result)); tokens[role] = result.data.accessToken;
    }
    resource = (await call('POST','/api/recursos','administrativo',resourceBody())).data;
    disabled = (await call('POST','/api/recursos','administrativo',{ ...resourceBody(), disponible:false })).data;
    request = (await call('POST','/api/solicitudes','estudiante',requestBody())).data;
    privateEvent = (await call('POST','/api/eventos','docente',eventBody())).data;
    const result = await fetch(stack.urls.notifications + '/api/notificaciones', {
      method:'POST', headers:{ 'Content-Type':'application/json', 'x-internal-token':process.env.INTERNAL_API_TOKEN },
      body:JSON.stringify({ usuario_id:stack.accounts.estudiante.id,titulo:'Privada',mensaje:'Solo para el propietario',tipo:'sistema' })
    });
    assert.equal(result.status,201); notice = (await result.json()).id;
  }, { timeout:120000 });
  after(async () => { await stack?.close(); });

  for (const path of ['/api/usuarios','/api/roles','/api/permisos','/api/configuracion','/api/servicios','/api/solicitudes/mis','/api/reservas','/api/notificaciones','/api/eventos','/api/dashboard/personal']) {
    it(`${path}: requiere token y rechaza token inválido`, async () => {
      assert.equal((await call('GET',path)).status,401);
      assert.equal((await call('GET',path,'invalid')).status,401);
    });
  }
  for (const role of roles) {
    it(`${role}: perfil propio, catálogo y notificaciones personales`, async () => {
      const me = await call('GET',`/api/usuarios/${stack.accounts[role].id}`,role);
      assert.equal(me.status,200); assert.equal(me.data.usuario.password_hash,undefined);
      const other = await call('GET',`/api/usuarios/${stack.accounts.otro_estudiante.id}`,role);
      assert.equal(other.status,role === 'administrador' ? 200 : 403);
      assert.equal((await call('GET','/api/servicios',role)).status,200);
      assert.equal((await call('GET','/api/configuracion',role)).status,200);
      const notifications = await call('GET',`/api/notificaciones?usuario_id=${stack.accounts.estudiante.id}`,role);
      assert.equal(notifications.status,200);
      assert.ok(notifications.data.notificaciones.every(row => row.usuario_id === stack.accounts[role].id));
    });
    it(`${role}: listas propias no pueden cambiarse con usuario_id`, async () => {
      const created = await call('POST','/api/solicitudes',role,requestBody());
      assert.equal(created.status,201); assert.equal(created.data.usuario_id,stack.accounts[role].id);
      const mine = await call('GET',`/api/solicitudes/mis?usuario_id=${stack.accounts.otro_estudiante.id}`,role);
      assert.equal(mine.status,200); assert.ok(mine.data.every(row => row.usuario_id === stack.accounts[role].id));
      assert.equal((await call('GET','/api/dashboard/personal',role)).status,200);
    });
    it(`${role}: reportes y gestión son operativos; usuarios y configuración solo de administrador`, async () => {
      const staff = ['administrativo','administrador'].includes(role);
      assert.equal((await call('GET','/api/dashboard/operativo',role)).status,staff ? 200 : 403);
      assert.equal((await call('GET','/api/solicitudes',role)).status,staff ? 200 : 403);
      assert.equal((await call('GET','/api/pqrs',role)).status,staff ? 200 : 403);
      assert.equal((await call('GET','/api/usuarios',role)).status,role === 'administrador' ? 200 : 403);
      assert.equal((await call('GET','/api/roles',role)).status,role === 'administrador' ? 200 : 403);
      assert.equal((await call('GET','/api/permisos',role)).status,role === 'administrador' ? 200 : 403);
      assert.equal((await call('GET','/api/dashboard/salud',role)).status,role === 'administrador' ? 200 : 403);
      assert.equal((await call('PUT','/api/configuracion',role,{ nombre_campus:'Campus de prueba' })).status,role === 'administrador' ? 200 : 403);
    });
    it(`${role}: creación de eventos y visibilidad privada`, async () => {
      const editor = ['docente','administrador'].includes(role);
      assert.equal((await call('POST','/api/eventos',role,eventBody())).status,editor ? 201 : 403);
      const canRead = ['docente','administrador'].includes(role);
      assert.equal((await call('GET',`/api/eventos/${privateEvent.id}`,role)).status,canRead ? 200 : 403);
      const list = await call('GET','/api/eventos',role);
      assert.equal(list.status,200); assert.equal(list.data.some(row => row.id === privateEvent.id),canRead);
      const count = await call('GET','/api/eventos/conteo',role);
      assert.equal(count.status,200); assert.equal(count.data.count,list.data.length);
    });
  }

  it('docente no edita eventos de otro autor y administrativo no edita ni los propios', async () => {
    const other = await call('POST','/api/eventos','administrador',eventBody());
    assert.equal((await call('PUT',`/api/eventos/${other.data.id}`,'docente',{ nombre:'Cambio ajeno' })).status,403);
    assert.equal((await call('PUT',`/api/eventos/${privateEvent.id}`,'administrativo',{ nombre:'Cambio no permitido' })).status,403);
    assert.equal((await call('PUT',`/api/eventos/${privateEvent.id}`,'docente',{ nombre:'Actualizado por su autor' })).status,200);
    assert.equal((await call('DELETE',`/api/eventos/${privateEvent.id}`,'docente')).status,403);
  });

  it('editar un evento no sobrescribe campos omitidos ni cambia su autor', async () => {
    const result = await call('PUT',`/api/eventos/${privateEvent.id}`,'docente',{ descripcion:'Nueva descripción' });
    assert.equal(result.status,200); assert.equal(result.data.nombre,'Actualizado por su autor');
    assert.equal(result.data.publico,0); assert.equal(result.data.creado_por,stack.accounts.docente.id);
    assert.equal((await call('PUT',`/api/eventos/${privateEvent.id}`,'docente',{ creado_por:stack.accounts.administrador.id })).status,400);
  });

  it('solicitudes: propiedad, transición atómica y conservación de campos', async () => {
    assert.equal((await call('GET',`/api/solicitudes/${request.id}`,'otro_estudiante')).status,403);
    assert.equal((await call('PUT',`/api/solicitudes/${request.id}/estado`,'docente',{ estado:'EN_REVISION' })).status,403);
    const updated = await call('PUT',`/api/solicitudes/${request.id}`,'administrativo',{ descripcion:'Descripción actualizada' });
    assert.equal(updated.status,200); assert.equal(updated.data.prioridad,'media'); assert.equal(updated.data.dependencia,'Biblioteca');
    const unassigned = await call('PUT',`/api/solicitudes/${request.id}/estado`,'administrativo',{ estado:'EN_REVISION' });
    assert.equal(unassigned.status,409); assert.match(unassigned.data.error,/responsable/);
    assert.equal((await call('PUT',`/api/solicitudes/${request.id}`,'administrativo',{ responsable_id:stack.accounts.administrativo.id })).status,200);
    assert.equal((await call('PUT',`/api/solicitudes/${request.id}/estado`,'administrativo',{ estado:'EN_REVISION' })).status,200);
    const transitions = await Promise.all(['REGISTRADA','ASIGNADA'].map(estado => call('PUT',`/api/solicitudes/${request.id}/estado`,'administrativo',{ estado })));
    assert.deepEqual(transitions.map(result => result.status).sort(),[200,409]);
    const current = await call('GET',`/api/solicitudes/${request.id}`,'estudiante');
    assert.equal(current.data.historial.length,3);
  });

  it('el directorio de responsables no expone perfiles privados', async () => {
    assert.equal((await call('GET','/api/usuarios/responsables','estudiante')).status,403);
    const directory = await call('GET','/api/usuarios/responsables','administrativo');
    assert.equal(directory.status,200); assert.ok(directory.data.every(row => !('email' in row) && !('password_hash' in row)));
    assert.equal((await call('PUT',`/api/solicitudes/${request.id}`,'administrativo',{ responsable_id:999999 })).status,400);
  });

  it('PQRS: datos privados y atención real con respuesta obligatoria', async () => {
    const pqrs = await call('POST','/api/pqrs','estudiante',{ tipo:'peticion',asunto:'Requerimiento',descripcion:'Necesito atención.' });
    assert.equal(pqrs.status,201);
    assert.equal((await call('GET',`/api/pqrs/${pqrs.data.id}`,'otro_estudiante')).status,403);
    assert.equal((await call('PUT',`/api/pqrs/${pqrs.data.id}`,'administrativo',{ estado:'respondida' })).status,409);
    assert.equal((await call('PUT',`/api/pqrs/${pqrs.data.id}`,'administrativo',{ estado:'en_revision' })).status,200);
    assert.equal((await call('PUT',`/api/pqrs/${pqrs.data.id}`,'administrativo',{ estado:'respondida' })).status,400);
    assert.equal((await call('PUT',`/api/pqrs/${pqrs.data.id}`,'administrativo',{ estado:'respondida',respuesta:'Requerimiento atendido.' })).status,200);
    assert.equal((await call('PUT',`/api/pqrs/${pqrs.data.id}`,'administrador',{ estado:'cerrada' })).status,200);
    assert.equal((await call('PUT',`/api/pqrs/${pqrs.data.id}`,'administrativo',{ respuesta:'Cambio posterior' })).status,409);
  });

  it('recursos: CRUD operativo y baja lógica sin perder el registro', async () => {
    assert.equal((await call('POST','/api/recursos','estudiante',resourceBody())).status,403);
    assert.equal((await call('POST','/api/recursos','docente',resourceBody())).status,403);
    const row = await call('POST','/api/recursos','administrativo',resourceBody());
    assert.equal(row.status,201);
    assert.equal((await call('PUT',`/api/recursos/${row.data.id}`,'administrativo',{ disponible:false })).status,200);
    assert.equal((await call('DELETE',`/api/recursos/${row.data.id}`,'administrativo')).status,204);
    const [[stored]] = await stack.pools.resources.execute('SELECT * FROM recursos WHERE id = ?', [row.data.id]);
    assert.ok(stored.eliminado_en); assert.equal(stored.disponible,0);
    const list = await call('GET','/api/recursos','estudiante');
    assert.ok(!list.data.some(record => record.id === row.data.id));
  });

  it('reservas: confirmación automática y propiedad forzada desde el JWT', async () => {
    const result = await call('POST','/api/reservas','estudiante',{ ...booking(),usuario_id:stack.accounts.docente.id });
    assert.equal(result.status,201); assert.equal(result.data.estado,'confirmada'); assert.equal(result.data.usuario_id,stack.accounts.estudiante.id);
    assert.equal((await call('GET',`/api/reservas/${result.data.id}`,'otro_estudiante')).status,403);
    assert.equal((await call('PUT',`/api/reservas/${result.data.id}`,'docente',{ hora_inicio:'12:00',hora_fin:'13:00' })).status,403);
    assert.equal((await call('PUT',`/api/reservas/${result.data.id}`,'administrativo',{ hora_inicio:'12:00',hora_fin:'13:00' })).status,200);
    assert.equal((await call('PUT',`/api/reservas/${result.data.id}/cancelar`,'estudiante',{})).status,200);
    assert.equal((await call('POST','/api/reservas','estudiante',{ ...booking('15:00'),recurso_id:disabled.id })).status,409);
    const mine = await call('GET',`/api/reservas?usuario_id=${stack.accounts.administrador.id}`,'estudiante');
    assert.ok(mine.data.every(row => row.usuario_id === stack.accounts.estudiante.id));
  });

  it('notificaciones: ni administrador puede modificar una notificación personal ajena', async () => {
    assert.equal((await call('PUT',`/api/notificaciones/${notice}/leer`,'administrador',{})).status,403);
    assert.equal((await call('DELETE',`/api/notificaciones/${notice}`,'otro_estudiante')).status,403);
    assert.equal((await call('PUT',`/api/notificaciones/${notice}/leer`,'estudiante',{})).status,200);
    assert.equal((await call('POST','/api/notificaciones','administrador',{ usuario_id:2,titulo:'No',mensaje:'No',tipo:'sistema' })).status,403);
  });

  it('usuarios: solo administrador registra y no puede eliminar al último administrador', async () => {
    for (const role of roles) {
      const created = await call('POST','/api/auth/register',role,{ nombre:'Nueva cuenta',email:`cuenta-${++sequence}@example.test`,password:'Strong-password-test',rol:'estudiante' });
      assert.equal(created.status,role === 'administrador' ? 201 : 403);
    }
    const id = stack.accounts.administrador.id;
    assert.equal((await call('DELETE',`/api/usuarios/${id}`,'administrador')).status,409);
    assert.equal((await call('PUT',`/api/usuarios/${id}`,'administrador',{ rol:'docente' })).status,409);
    assert.equal((await call('PUT',`/api/usuarios/${stack.accounts.estudiante.id}`,'estudiante',{ rol:'administrador' })).status,403);
    assert.equal((await call('PUT',`/api/usuarios/${stack.accounts.estudiante.id}`,'estudiante',{ nombre:{ rol:'administrador' } })).status,400);
  });

  it('catálogo: administración persistida y servicios inactivos ocultos por API', async () => {
    const body = { codigo:'orientacion',nombre:'Orientación',descripcion:'Servicio institucional real',icono:'help',activo:true };
    assert.equal((await call('POST','/api/servicios','administrativo',body)).status,403);
    const created = await call('POST','/api/servicios','administrador',body);
    assert.equal(created.status,201);
    assert.equal((await call('GET',`/api/servicios/${created.data.id}`,'estudiante')).status,200);
    assert.equal((await call('DELETE',`/api/servicios/${created.data.id}`,'administrador')).status,204);
    assert.equal((await call('GET',`/api/servicios/${created.data.id}`,'estudiante')).status,404);
    assert.equal((await call('GET','/api/servicios?incluir_inactivos=true','docente')).status,403);
    assert.ok((await call('GET','/api/servicios?incluir_inactivos=true','administrador')).data.some(row => row.id === created.data.id));
  });

  it('configuración admite solo los tres campos institucionales y roles permanecen fijos', async () => {
    assert.equal((await call('PUT','/api/configuracion','administrador',{ JWT_SECRET:'not-allowed' })).status,400);
    assert.equal((await call('POST','/api/roles','administrador',{ rol:'nuevo' })).status,404);
    const config = await call('PUT','/api/configuracion','administrador',{ nombre_campus:'UAJS Pruebas',correo_contacto:'contacto@example.test',mensaje_institucional:'Información publicada.' });
    assert.equal(config.status,200);
    assert.equal((await call('GET','/api/configuracion','docente')).data.configuracion.nombre_campus,'UAJS Pruebas');
    assert.deepEqual((await call('GET','/api/roles','administrador')).data.roles,roles);
  });

  it('reportes no se calculan con el listado limitado y conservan la salud técnica', async () => {
    const report = await call('GET','/api/dashboard/operativo?fecha_desde=2000-01-01&fecha_hasta=2100-01-01','administrativo');
    assert.equal(report.status,200); assert.equal(typeof report.data.solicitudes,'number'); assert.ok(report.data.solicitudes_por_estado);
    assert.equal((await call('GET','/api/dashboard/estadisticas-generales','administrativo')).status,403);
    assert.equal((await call('GET','/health')).status,200);
    const catalog = await call('GET','/api/permisos','administrador');
    assert.ok(catalog.data.permisos.length > 0);
    assert.ok(!catalog.data.permisos.some(row => row.rol === 'administrativo' && row.recurso === 'eventos' && row.accion !== 'leer'));
  });
});
