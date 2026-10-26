import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, it, after } from 'node:test';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { validateUserInput } from '../services/users-service/src/middleware/validation.js';
import { interval, positiveId, withCalendarLocks } from '../services/reservations-service/src/services/calendar.js';

const servers = [];
after(async () => {
  for (const server of servers) {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
async function listen(handler) {
  const server = createServer(handler);
  servers.push(server);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return `http://127.0.0.1:${server.address().port}`;
}
const targets = url => Object.fromEntries(
  ['users', 'requests', 'reservations', 'resources', 'events', 'notifications'].map(name => [name, url])
);

describe('B-002: contratos de tokens', () => {
  it('firma y verifica finalidades, claves y vigencias distintas', async () => {
    process.env.JWT_SECRET = randomBytes(32).toString('hex');
    process.env.JWT_REFRESH_SECRET = randomBytes(32).toString('hex');
    process.env.JWT_EXPIRES_IN = '15m';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
    const tokens = await import('../services/users-service/src/config/tokens.js');
    const user = { id: 7, rol: 'docente', email: 'docente@example.test' };
    const access = tokens.signAccessToken(user);
    const refresh = tokens.signRefreshToken(user);
    assert.equal(jwt.decode(access).token_use, 'access');
    assert.equal(jwt.decode(access).exp - jwt.decode(access).iat, 900);
    assert.equal(jwt.decode(refresh).exp - jwt.decode(refresh).iat, 604800);
    assert.equal(tokens.verifyRefreshToken(refresh).id, 7);
    assert.equal(jwt.decode(refresh).rol, undefined);
    assert.throws(() => tokens.verifyRefreshToken(access));
    assert.throws(() => jwt.verify(refresh, process.env.JWT_SECRET));
    const wrongPurpose = jwt.sign({ id: 7, token_use: 'access' }, process.env.JWT_REFRESH_SECRET, {
      issuer: 'smart-campus-users', audience: 'smart-campus-refresh'
    });
    assert.throws(() => tokens.verifyRefreshToken(wrongPurpose));
  });

  for (const label of ['ausente', 'igual a access', 'corta', 'espacios']) {
    it(`rechaza configuracion refresh ${label}`, () => {
      const secret = randomBytes(32).toString('hex');
      const env = { JWT_SECRET: secret };
      if (label === 'igual a access') env.JWT_REFRESH_SECRET = secret;
      if (label === 'corta') env.JWT_REFRESH_SECRET = 'x';
      if (label === 'espacios') env.JWT_REFRESH_SECRET = ` ${secret} `;
      const url = new URL('../services/users-service/src/config/tokens.js', import.meta.url).href;
      const dependency = import.meta.resolve('jsonwebtoken');
      const code = `import { registerHooks } from 'node:module';
        registerHooks({resolve(s,c,n){return n(s==='jsonwebtoken'?${JSON.stringify(dependency)}:s,c)}});
        await import(${JSON.stringify(url)});`;
      const result = spawnSync(process.execPath, ['--input-type=module', '-e', code], { env, encoding: 'utf8' });
      assert.equal(result.status, 1);
      assert.match(result.stderr, /JWT_REFRESH_SECRET debe/);
      assert.ok(!result.stderr.includes(secret));
    });
  }
});

describe('B-010: entrada estructurada', () => {
  it('rechaza inyeccion de rol dentro del nombre y email', () => {
    for (const field of ['nombre', 'email']) {
      assert.throws(() => validateUserInput({ [field]: { nombre: 'x', rol: 'administrador', activo: 1 } }), { status: 400 });
      assert.throws(() => validateUserInput({ [field]: ['x', 'y'] }), { status: 400 });
    }
    assert.throws(() => validateUserInput({ activo: { activo: 1 } }), { status: 400 });
    assert.doesNotThrow(() => validateUserInput({ nombre: 'Ana', email: 'ana@example.test' }));
  });
});

describe('B-005/B-006: protocolo de calendario', () => {
  it('normaliza segundos, acepta las 22:00 y rechaza formatos ambiguos', () => {
    assert.equal(interval({ fecha: '2026-11-10', hora_inicio: '21:00', hora_fin: '22:00:00' }, true).hora_inicio, '21:00:00');
    for (const data of [
      { fecha: '2026-02-30', hora_inicio: '09:00', hora_fin: '10:00' },
      { fecha: '2026-11-10', hora_inicio: '9:00', hora_fin: '10:00' },
      { fecha: '2026-11-10', hora_inicio: '10:00', hora_fin: '10:00' }
    ]) assert.throws(() => interval(data), { statusCode: 400 });
    assert.throws(() => positiveId({ id: 1 }), { statusCode: 400 });
  });

  it('ordena/deduplica bloqueos y hace rollback/release en errores', async () => {
    const calls = [];
    const conn = {
      beginTransaction: async () => calls.push('begin'),
      execute: async (sql, params) => { calls.push(params); return [[]]; },
      commit: async () => calls.push('commit'),
      rollback: async () => calls.push('rollback'),
      release: () => calls.push('release')
    };
    const keys = [{ recurso_id: 2, fecha: '2026-11-11' }, { recurso_id: 1, fecha: '2026-11-10' }, { recurso_id: 1, fecha: '2026-11-10' }];
    await assert.rejects(withCalendarLocks({ getConnection: async () => conn }, keys, async () => { throw new Error('test'); }), /test/);
    assert.deepEqual(calls, ['begin', [1, '2026-11-10'], [1, '2026-11-10'], [2, '2026-11-11'], [2, '2026-11-11'], 'rollback', 'release']);
  });
});

describe('B-008/B-009: gateway y clientes HTTP', () => {
  it('limita login y refresh sin alterar el cuerpo del proxy', async () => {
    const upstream = await listen((req, res) => {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ body, path: req.url, internal: req.headers['x-internal-token'] ?? null }));
      });
    });
    const base = await listen(createApp({ services: targets(upstream), loginLimit: 2, refreshLimit: 2 }));
    for (const path of ['/api/auth/login', '/api/auth/refresh']) {
      for (let i = 0; i < 3; i++) {
        const response = await fetch(base + path, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'x-internal-token': 'no-forward' },
          body: '{"email":"test@example.test"}'
        });
        assert.equal(response.status, i < 2 ? 200 : 429);
        const json = await response.json();
        if (i < 2) {
          assert.equal(json.path, path);
          assert.equal(json.body, '{"email":"test@example.test"}');
          assert.equal(json.internal, null);
        }
      }
    }
  });

  it('health y proxy terminan si el destino no responde', async () => {
    const stalled = await listen(() => {});
    const base = await listen(createApp({ services: targets(stalled), healthTimeout: 40, proxyTimeout: 60 }));
    const health = await fetch(base + '/health', { signal: AbortSignal.timeout(3000) });
    assert.equal(health.status, 503);
    assert.equal((await health.json()).services.users, 'offline');
    const proxy = await fetch(base + '/api/usuarios', { signal: AbortSignal.timeout(3000) });
    assert.equal(proxy.status, 504);
    assert.equal((await proxy.json()).error, 'Servicio no disponible');
  });

  for (const service of ['users', 'requests', 'reservations', 'events']) {
    it(`${service}: el cliente cancela la espera sin reintentar POST`, async () => {
      const dependency = import.meta.resolve('axios');
      const { registerHooks } = await import('node:module');
      const hook = registerHooks({ resolve(s, c, n) { return n(s === 'axios' ? dependency : s, c); } });
      try {
        const { default: http } = await import(`../services/${service}-service/src/config/http.js`);
        let requests = 0;
        const stalled = await listen(() => { requests++; });
        await assert.rejects(http.post(stalled, {}, { timeout: 40 }), { statusCode: 504 });
        assert.equal(requests, 1);
      } finally {
        hook.deregister();
      }
    });
  }
});

describe('B-003/B-004/B-012: despliegue versionado', () => {
  it('el aprovisionamiento rechaza contraseñas ausentes, repetidas o no hex sin mostrarlas', t => {
    // En Windows, "bash" puede ser el de WSL sin distribución instalada (DEF-07).
    if (spawnSync('bash', ['-c', 'exit 0']).status !== 0) return t.skip('bash no disponible');
    const path = fileURLToPath(new URL('../sql/provision-users.sh', import.meta.url));
    const keys = ['USERS_DB_PASSWORD', 'REQUESTS_DB_PASSWORD', 'RESERVATIONS_DB_PASSWORD',
      'RESOURCES_DB_PASSWORD', 'EVENTS_DB_PASSWORD', 'NOTIFICATIONS_DB_PASSWORD'];
    for (const kind of ['ausente', 'repetida', 'no-hex', 'igual-root']) {
      const env = { PATH: process.env.PATH, MYSQL_ROOT_PASSWORD: randomBytes(32).toString('hex') };
      for (const key of keys) env[key] = randomBytes(32).toString('hex');
      if (kind === 'ausente') delete env.USERS_DB_PASSWORD;
      if (kind === 'repetida') env.REQUESTS_DB_PASSWORD = env.USERS_DB_PASSWORD;
      if (kind === 'no-hex') env.USERS_DB_PASSWORD = "invalid'password";
      if (kind === 'igual-root') env.USERS_DB_PASSWORD = env.MYSQL_ROOT_PASSWORD;
      const result = spawnSync('bash', [path], { env, encoding: 'utf8' });
      assert.equal(result.status, 1);
      assert.match(result.stderr, /La (variable|contraseña)/);
      for (const key of keys) if (env[key]) assert.ok(!result.stderr.includes(env[key]));
    }
  });

  it('solo publica el gateway y no distribuye .env a los servicios', () => {
    const compose = readFileSync(new URL('../docker-compose.yml', import.meta.url), 'utf8');
    assert.equal([...compose.matchAll(/^\s+ports:/gm)].length, 1);
    assert.match(compose, /"3200:3200"/);
    assert.doesNotMatch(compose, /env_file:|DB_USER:.*root|campus_password/);
    for (const name of ['users', 'requests', 'reservations', 'resources', 'events', 'notifications']) {
      assert.match(compose, new RegExp(`DB_USER: campus_${name}`));
    }
    const dockerfile = readFileSync(new URL('../dockerfile', import.meta.url), 'utf8');
    assert.doesNotMatch(dockerfile, /COPY \. \./);
    assert.match(dockerfile, /COPY src \.\/src/);
    const ignore = readFileSync(new URL('../.dockerignore', import.meta.url), 'utf8');
    assert.match(ignore, /^\.env$/m);
    assert.match(ignore, /^\*\*\/\.env$/m);
  });

  it('Compose valida con valores sinteticos sin leer .env', t => {
    const version = spawnSync('docker', ['compose', 'version'], { encoding: 'utf8' });
    if (version.status !== 0) return t.skip('Docker Compose no disponible');
    const env = { PATH: process.env.PATH };
    const variables = ['MYSQL_ROOT_PASSWORD', 'JWT_SECRET', 'JWT_REFRESH_SECRET', 'INTERNAL_API_TOKEN',
      'USERS_DB_PASSWORD', 'REQUESTS_DB_PASSWORD', 'RESERVATIONS_DB_PASSWORD', 'RESOURCES_DB_PASSWORD', 'EVENTS_DB_PASSWORD', 'NOTIFICATIONS_DB_PASSWORD'];
    for (const key of variables) env[key] = randomBytes(32).toString('hex');
    const path = fileURLToPath(new URL('../docker-compose.yml', import.meta.url));
    // .env vacío temporal en vez de /dev/null, que no existe en Windows (DEF-07).
    const dir = mkdtempSync(join(tmpdir(), 'campus-compose-'));
    t.after(() => rmSync(dir, { recursive: true, force: true }));
    const emptyEnv = join(dir, '.env');
    writeFileSync(emptyEnv, '');
    const args = ['compose', '--env-file', emptyEnv, '-f', path, 'config', '--no-env-resolution', '--quiet'];
    const ok = spawnSync('docker', args, { env, encoding: 'utf8' });
    assert.equal(ok.status, 0, ok.stderr);
    for (const value of [undefined, '']) {
      const invalid = { ...env };
      if (value === undefined) delete invalid.JWT_SECRET;
      else invalid.JWT_SECRET = value;
      const result = spawnSync('docker', args, { env: invalid, encoding: 'utf8' });
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /Debes definir JWT_SECRET/);
    }
  });
});
