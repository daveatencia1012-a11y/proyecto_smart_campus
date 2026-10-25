// Vista manual aislada: nunca utiliza el .env ni el volumen del proyecto.
import { startRoleStack } from '../helpers/role-stack.mjs';
import { writeFile, unlink } from 'node:fs/promises';

const stack = await startRoleStack({ port:43210 });
try {
  const tokens = {};
  for (const [role, account] of Object.entries(stack.accounts)) {
    const response = await fetch(stack.gateway + '/api/auth/login', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ email:account.email,password:account.password }) });
    tokens[role] = (await response.json()).accessToken;
  }
  async function post(path, role, body) {
    const response = await fetch(stack.gateway + path, { method:'POST', headers:{ 'Content-Type':'application/json',Authorization:`Bearer ${tokens[role]}` }, body:JSON.stringify(body) });
    if (!response.ok) throw new Error(`Preparación de preview falló: ${response.status}`);
  }
  await post('/api/recursos','administrativo',{ codigo:'LAB-WEB',nombre:'Laboratorio de prácticas',tipo:'laboratorio',ubicacion:'Bloque A',estado:'disponible',disponible:true });
  await post('/api/solicitudes','estudiante',{ tipo_servicio:'Apoyo académico',dependencia:'Biblioteca',descripcion:'Solicitud real de la cuenta de prueba.',prioridad:'media' });
  await post('/api/pqrs','estudiante',{ tipo:'peticion',asunto:'Consulta del campus',descripcion:'Registro de prueba persistido en MySQL efímero.' });
  const tomorrow = new Date(Date.now()+86400000).toISOString().slice(0,10);
  await post('/api/eventos','docente',{ nombre:'Taller docente privado',descripcion:'Visible únicamente para autor y administrador.',fecha:tomorrow,hora:'10:00',lugar:'Aula A',tipo:'academico',publico:false });
  await post('/api/eventos','administrador',{ nombre:'Actividad académica pública',descripcion:'Información para todos los roles.',fecha:tomorrow,hora:'14:00',lugar:'Auditorio',tipo:'institucional',publico:true });
  await writeFile('/tmp/opencode/role-preview.pid',String(process.pid));
  console.log('Preview backend aislado listo en http://127.0.0.1:43210');
  console.log('Cuentas sintéticas: <rol>@roles.example.test; contraseña definida en tests/helpers/role-stack.mjs.');
} catch (error) { await stack.close(); throw error; }
let closing = false;
async function stop() {
  if (closing) return; closing = true;
  await stack.close(); await unlink('/tmp/opencode/role-preview.pid').catch(() => {}); process.exit(0);
}
process.on('SIGTERM',stop); process.on('SIGINT',stop);
