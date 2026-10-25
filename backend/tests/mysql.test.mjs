import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { describe, it, before, beforeEach, after } from 'node:test';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import { assertFree, withCalendarLocks } from '../services/reservations-service/src/services/calendar.js';

describe('MySQL 8 aislado: cuentas, calendario y eventos', { skip: process.env.RUN_MYSQL_TESTS !== '1' }, () => {
  const name = `smart-campus-security-test-${randomBytes(5).toString('hex')}`;
  const env = { PATH: process.env.PATH, MYSQL_ROOT_PASSWORD: randomBytes(32).toString('hex') };
  const names = ['users', 'requests', 'reservations', 'resources', 'events', 'notifications'];
  for (const service of names) env[`${service.toUpperCase()}_DB_PASSWORD`] = randomBytes(32).toString('hex');
  let root, port, hook, server, reserva, disponibilidad, evento, EventoModel, User, auth, users;
  let resourceAvailable = true;
  const pools = {};
  const docker = args => {
    const result = spawnSync('docker', args, { env, encoding: 'utf8', timeout: 120000 });
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  };

  before(async () => {
    const base = fileURLToPath(new URL('../sql/', import.meta.url));
    docker(['run', '--rm', '-d', '--name', name, '--tmpfs', '/var/lib/mysql',
      '-p', '127.0.0.1::3306', '-e', 'MYSQL_ROOT_PASSWORD', '-e', 'MYSQL_ROOT_HOST=%',
      ...names.flatMap(service => ['-e', `${service.toUpperCase()}_DB_PASSWORD`]),
      '-v', `${base}init.sql:/docker-entrypoint-initdb.d/init.sql:ro`,
      '-v', `${base}provision-users.sh:/docker-entrypoint-initdb.d/zz-app-users.sh:ro`, 'mysql:8.0']);
    port = Number(docker(['port', name, '3306/tcp']).split(':').at(-1));
    for (let attempt = 0; attempt < 120; attempt++) {
      try {
        root = await mysql.createConnection({ host: '127.0.0.1', port, user: 'root', password: env.MYSQL_ROOT_PASSWORD, multipleStatements: true, dateStrings: true });
        await root.query('SELECT 1');
        break;
      } catch {
        if (root) await root.end().catch(() => {});
        root = null;
        await delay(500);
      }
    }
    assert.ok(root, 'MySQL de pruebas no inició; revisar el contenedor efímero');
    const migration = readFileSync(new URL('../sql/migrations/001-calendar.sql', import.meta.url), 'utf8');
    await root.query(migration);
    await root.query(migration);
    const features = readFileSync(new URL('../sql/migrations/002-role-interfaces.sql', import.meta.url), 'utf8');
    await root.query(features);
    await root.query(features);
    for (const service of names) {
      pools[service] = mysql.createPool({
        host: '127.0.0.1', port, user: `campus_${service}`,
        password: env[`${service.toUpperCase()}_DB_PASSWORD`], database: `${service}_db`,
        dateStrings: true, stringifyObjects: true, connectionLimit: 12
      });
    }
    globalThis.__securityPools = pools;
    const axiosURL = import.meta.resolve('axios');
    const bcryptURL = import.meta.resolve('bcrypt');
    const jwtURL = import.meta.resolve('jsonwebtoken');
    hook = registerHooks({
      resolve(specifier, context, next) {
        if (specifier === 'axios') return next(axiosURL, context);
        if (specifier === 'bcrypt') return next(bcryptURL, context);
        if (specifier === 'jsonwebtoken') return next(jwtURL, context);
        if (specifier === '../config/db.js') {
          const match = context.parentURL?.match(/\/services\/([^/]+)-service\//);
          if (match) return { shortCircuit: true, url: `data:text/javascript,${encodeURIComponent(`export const pool = globalThis.__securityPools[${JSON.stringify(match[1])}]; export default pool;`)}` };
        }
        return next(specifier, context);
      }
    });
    server = createServer((req, res) => {
      res.setHeader('Content-Type', 'application/json');
      if (req.url === '/api/recursos/1') res.end(JSON.stringify({ id: 1, estado: 'disponible', disponible: resourceAvailable ? 1 : 0 }));
      else if (req.url === '/api/notificaciones') { res.statusCode = 201; res.end('{}'); }
      else { res.statusCode = 404; res.end('{}'); }
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const url = `http://127.0.0.1:${server.address().port}`;
    process.env.RESOURCES_SERVICE_URL = url;
    process.env.NOTIFICATIONS_SERVICE_URL = url;
    process.env.BUSINESS_HOURS_START = '08:00';
    process.env.BUSINESS_HOURS_END = '22:00';
    reserva = (await import('../services/reservations-service/src/controllers/reservaController.js')).reservaController;
    disponibilidad = (await import('../services/reservations-service/src/controllers/disponibilidadController.js')).disponibilidadController;
    evento = (await import('../services/events-service/src/controllers/eventoController.js')).eventoController;
    EventoModel = (await import('../services/events-service/src/models/Evento.js')).EventoModel;
    User = (await import('../services/users-service/src/models/User.js')).default;
    process.env.JWT_SECRET = randomBytes(32).toString('hex');
    process.env.JWT_REFRESH_SECRET = randomBytes(32).toString('hex');
    auth = await import('../services/users-service/src/controllers/authController.js');
    users = await import('../services/users-service/src/controllers/userController.js');
  }, { timeout: 120000 });

  after(async () => {
    hook?.deregister();
    await Promise.all(Object.values(pools).map(pool => pool.end()));
    await root?.end();
    if (server) {
      server.closeAllConnections();
      await new Promise(resolve => server.close(resolve));
    }
    // Solo se elimina el contenedor efímero creado por esta suite, nunca el del proyecto.
    spawnSync('docker', ['rm', '-f', name], { env, encoding: 'utf8' });
    delete globalThis.__securityPools;
  });

  beforeEach(async () => {
    resourceAvailable = true;
    await root.query('DELETE FROM reservations_db.reservas; DELETE FROM reservations_db.disponibilidad; DELETE FROM reservations_db.calendario_locks; DELETE FROM events_db.eventos;');
  });

  async function invoke(fn, options = {}) {
    const req = { user: { id: 7, rol: 'estudiante' }, headers: { authorization: 'Bearer test-only' }, body: {}, params: {}, query: {}, ...options };
    const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
    await fn(req, res, error => { res.statusCode = error.statusCode || error.status || 500; res.body = { error: error.message }; });
    return { status: res.statusCode, body: res.body };
  }
  const slot = { recurso_id: 1, fecha: '2026-11-10', hora_inicio: '10:00', hora_fin: '11:00' };
  const create = body => invoke(reserva.createReserva, { body: { ...slot, ...body } });
  const block = body => invoke(disponibilidad.createDisponibilidad, { body: { ...slot, tipo: 'mantenimiento', ...body }, user: { id: 1, rol: 'administrador' } });

  it('cada cuenta tiene CRUD propio, sin acceso cruzado ni DDL', async () => {
    const tables = { users: 'users', requests: 'solicitudes', reservations: 'reservas', resources: 'recursos', events: 'eventos', notifications: 'notificaciones' };
    for (const service of names) {
      await pools[service].execute(`SELECT * FROM ${tables[service]} LIMIT 1`);
      const other = service === 'users' ? 'events' : 'users';
      const table = other === 'users' ? 'users' : 'eventos';
      await assert.rejects(pools[service].execute(`SELECT * FROM ${other}_db.${table}`), error => error.code === 'ER_TABLEACCESS_DENIED_ERROR' || error.code === 'ER_DBACCESS_DENIED_ERROR');
      await assert.rejects(pools[service].execute('CREATE TABLE unauthorized (id INT)'), error => error.code === 'ER_TABLEACCESS_DENIED_ERROR');
    }
  });

  it('el aprovisionamiento puede repetirse en un volumen existente', async () => {
    docker(['exec', name, 'bash', '/docker-entrypoint-initdb.d/zz-app-users.sh']);
    for (const service of names) {
      const connection = await mysql.createConnection({
        host: '127.0.0.1', port, user: `campus_${service}`,
        password: env[`${service.toUpperCase()}_DB_PASSWORD`], database: `${service}_db`
      });
      try { await connection.execute('SELECT 1'); } finally { await connection.end(); }
    }
  });

  it('diez reservas simultaneas: exactamente una prospera', async () => {
    const results = await Promise.all(Array.from({ length: 10 }, () => create()));
    assert.equal(results.filter(r => r.status === 201).length, 1, JSON.stringify(results));
    assert.equal(results.filter(r => r.status === 409).length, 9, JSON.stringify(results));
    const [[row]] = await pools.reservations.execute('SELECT COUNT(*) AS total FROM reservas');
    assert.equal(row.total, 1);
  });

  it('mantenimiento y reserva simultaneos no coexisten', async () => {
    const results = await Promise.all([create(), block()]);
    assert.deepEqual(results.map(r => r.status).sort(), [201, 409]);
  });

  it('bloqueo sobre reserva se rechaza; cancelarla libera el intervalo', async () => {
    const first = await create();
    assert.equal((await block()).status, 409);
    assert.equal((await invoke(reserva.cancelReserva, { params: { id: String(first.body.id) } })).status, 200);
    assert.equal((await block()).status, 201);
    assert.equal((await create()).status, 409);
    assert.equal((await block({ tipo: 'reserva', hora_inicio: '12:00', hora_fin: '13:00' })).status, 400);
  });

  it('dos reservas movidas al mismo horario: solo una se mueve', async () => {
    const a = await create({ hora_inicio: '09:00', hora_fin: '10:00' });
    const b = await create({ hora_inicio: '11:00', hora_fin: '12:00' });
    const results = await Promise.all([a, b].map(r => invoke(reserva.updateReserva, {
      params: { id: String(r.body.id) }, body: { hora_inicio: '10:00', hora_fin: '11:00' }
    })));
    assert.deepEqual(results.map(r => r.status).sort(), [200, 409]);
  });

  it('permite horarios adyacentes y mover a otra fecha', async () => {
    const a = await create();
    assert.equal((await create({ hora_inicio: '11:00', hora_fin: '12:00' })).status, 201);
    const moved = await invoke(reserva.updateReserva, { params: { id: String(a.body.id) }, body: { fecha: '2026-11-11' } });
    assert.equal(moved.status, 200);
    assert.equal(moved.body.fecha, '2026-11-11');
    assert.equal((await create()).status, 201);
  });

  it('recurso deshabilitado impide crear y mover, sin alterar la reserva', async () => {
    const a = await create();
    resourceAvailable = false;
    assert.equal((await create({ hora_inicio: '12:00', hora_fin: '13:00' })).status, 409);
    assert.equal((await invoke(reserva.updateReserva, { params: { id: String(a.body.id) }, body: { fecha: '2026-11-11' } })).status, 409);
    const [[stored]] = await pools.reservations.execute('SELECT fecha FROM reservas WHERE id = ?', [a.body.id]);
    assert.equal(stored.fecha, '2026-11-10');
  });

  it('calendario une reservas y bloqueos sin revelar propietario', async () => {
    await create();
    await block({ hora_inicio: '12:00', hora_fin: '13:00' });
    const result = await invoke(disponibilidad.getDisponibilidad, { params: { recurso_id: '1' }, query: { fecha: slot.fecha } });
    assert.equal(result.status, 200);
    assert.deepEqual(result.body.map(r => r.fuente).sort(), ['disponibilidad', 'reservas']);
    assert.ok(result.body.every(r => r.usuario_id === undefined));
  });

  it('rollback no deja reservas ni bloqueos retenidos', async () => {
    const data = { fecha: slot.fecha, hora_inicio: '10:00:00', hora_fin: '11:00:00' };
    await assert.rejects(withCalendarLocks(pools.reservations, [{ recurso_id: 1, fecha: slot.fecha }], async conn => {
      await assertFree(conn, 1, data);
      await conn.execute("INSERT INTO reservas (usuario_id, recurso_id, fecha, hora_inicio, hora_fin) VALUES (7, 1, ?, ?, ?)", [data.fecha, data.hora_inicio, data.hora_fin]);
      throw new Error('rollback-test');
    }), /rollback-test/);
    assert.equal((await create()).status, 201);
  });

  it('modelos de usuario rechazan objetos sin modificar roles', async () => {
    await assert.rejects(User.update(1, { nombre: { nombre: 'x', rol: 'administrador' } }), { status: 400 });
    const [users] = await User.list({ limit: 10, offset: 0 }).then(data => [data.users]);
    assert.equal(users[0].rol, 'administrador');
    assert.equal(users[0].nombre, 'Administrador');
  });

  it('login/refresh reales: rechaza intercambiar tokens y usuarios inactivos', async () => {
    assert.equal((await invoke(auth.refresh, { body: undefined })).status, 400);
    const email = `security-${randomBytes(5).toString('hex')}@example.test`;
    const password = 'password-test-only';
    const user = await User.create({ nombre: 'Prueba', email, rol: 'estudiante', password_hash: await bcrypt.hash(password, 4) });
    const login = await invoke(auth.login, { body: { email, password } });
    assert.equal(login.status, 200);
    const { accessToken, refreshToken } = login.body;
    assert.equal((await invoke(auth.refresh, { body: { refreshToken: accessToken } })).status, 401);
    assert.equal((await invoke(auth.refresh, { body: { refreshToken } })).status, 200);
    const malicious = await invoke(users.update, {
      user: { id: user.id, rol: 'estudiante' }, params: { id: String(user.id) },
      body: { nombre: { nombre: 'x', rol: 'administrador', activo: 1 } }
    });
    assert.equal(malicious.status, 400);
    assert.equal((await User.findById(user.id)).rol, 'estudiante');
    const roleChange = await invoke(users.update, {
      user: { id: user.id, rol: 'estudiante' }, params: { id: String(user.id) }, body: { rol: 'administrador' }
    });
    assert.equal(roleChange.status, 403);
    await User.softDelete(user.id);
    assert.equal((await invoke(auth.refresh, { body: { refreshToken } })).status, 401);
  });

  it('eventos privados respetan creador/gestores en lista, proximos e ID', async () => {
    const [[{ fecha }]] = await pools.events.execute("SELECT DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 1 DAY), '%Y-%m-%d') AS fecha");
    const privateEvent = await EventoModel.create({ nombre: 'Privado', descripcion: '', fecha, hora: '10:00', lugar: 'Aula', tipo: 'academico', creado_por: 7, publico: 0 });
    await EventoModel.create({ nombre: 'Publico', descripcion: '', fecha, hora: '11:00', lugar: 'Aula', tipo: 'academico', creado_por: 7, publico: 1 });
    for (const [user, allowed] of [
      [{ id: 7, rol: 'docente' }, true], [{ id: 8, rol: 'docente' }, false],
      [{ id: 9, rol: 'estudiante' }, false], [{ id: 10, rol: 'administrativo' }, false],
      [{ id: 1, rol: 'administrador' }, true]
    ]) {
      for (const fn of [evento.getEventos, evento.getProximosEventos]) {
        const result = await invoke(fn, { user });
        assert.equal(result.status, 200);
        assert.equal(result.body.some(r => r.id === privateEvent.id), allowed);
      }
      const result = await invoke(evento.getEventoById, { user, params: { id: String(privateEvent.id) } });
      assert.equal(result.status, allowed ? 200 : 403);
    }
  });
});
