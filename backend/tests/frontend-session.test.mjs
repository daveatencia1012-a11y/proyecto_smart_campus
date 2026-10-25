import assert from 'node:assert/strict';
import { before, beforeEach, describe, it } from 'node:test';

describe('sesión del frontend: aislamiento, refresh y cambio de rol', () => {
  const values = new Map();
  const storage = { getItem:key => values.get(key) ?? null, setItem:(key,value) => values.set(key,String(value)), removeItem:key => values.delete(key) };
  const windowMock = new EventTarget();
  windowMock.location = { href:'' };
  let session, api;
  const account = (id = 7, rol = 'estudiante') => ({ accessToken:`access-${id}`, refreshToken:`refresh-${id}`, usuario:{ id, rol, nombre:`Usuario ${id}` } });
  const response = (status, body = {}) => ({ status, ok:status >= 200 && status < 300, json:async () => body });
  before(async () => {
    globalThis.window = windowMock;
    globalThis.localStorage = storage;
    session = await import('../../frontend/src/services/session.js');
    api = await import('../../frontend/src/services/api.js');
  });
  beforeEach(() => {
    globalThis.localStorage = storage;
    values.clear(); session.clearSession(); window.location.href = '';
  });

  it('conserva las cuatro claves y actualiza el rol con la respuesta del servidor', () => {
    session.setSession(account());
    assert.equal(values.size, 4);
    session.updateSession({ accessToken:'updated', usuario:{ id:7, rol:'docente' } });
    assert.equal(session.getRole(), 'docente');
    assert.equal(session.getRefreshToken(), 'refresh-7');
  });

  it('funciona en memoria si localStorage está bloqueado, incluido logout', () => {
    globalThis.localStorage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() { throw new Error('blocked'); } };
    session.setSession(account());
    assert.equal(session.getToken(), 'access-7');
    assert.equal(session.getUser().id, 7);
    session.clearSession();
    assert.equal(session.getToken(), null);
  });

  it('un 401 del login no borra ni redirige la sesión', async () => {
    session.setSession(account());
    globalThis.fetch = async () => response(401, { error:'Credenciales inválidas' });
    await assert.rejects(api.post('/api/auth/login', {}), { status:401 });
    assert.equal(window.location.href, '');
    assert.equal(session.getToken(), 'access-7');
  });

  it('varios 401 simultáneos comparten un refresh y actualizan el rol', async () => {
    session.setSession(account());
    let refreshes = 0;
    globalThis.fetch = async (url, options) => {
      if (url === '/api/auth/refresh') {
        refreshes++;
        return response(200, { accessToken:'renewed', usuario:{ id:7, rol:'docente' } });
      }
      return response(options.headers.Authorization === 'Bearer renewed' ? 200 : 401, []);
    };
    await Promise.all([api.get('/api/recursos'),api.get('/api/eventos'),api.get('/api/servicios')]);
    assert.equal(refreshes, 1);
    assert.equal(session.getRole(), 'docente');
  });

  for (const scenario of ['logout', 'cambio de cuenta']) {
    it(`un refresh pendiente no restaura ni mezcla sesiones después de ${scenario}`, async () => {
      session.setSession(account());
      let finish, started;
      const beginning = new Promise(resolve => { started = resolve; });
      globalThis.fetch = async url => {
        if (url === '/api/auth/refresh') {
          started();
          return new Promise(resolve => { finish = () => resolve(response(200, { accessToken:'stale', usuario:{ id:7, rol:'administrador' } })); });
        }
        return response(401);
      };
      const pending = api.get('/api/recursos').catch(error => error);
      await beginning;
      if (scenario === 'logout') session.clearSession();
      else session.setSession(account(8, 'docente'));
      finish();
      assert.ok((await pending) instanceof api.SessionChangedError);
      assert.equal(session.getToken(), scenario === 'logout' ? null : 'access-8');
      assert.equal(window.location.href, '');
    });
  }

  it('un 401 tardío reutiliza el access renovado sin otro refresh', async () => {
    session.setSession(account());
    let late, refreshes = 0;
    globalThis.fetch = async (url, options) => {
      if (url === '/api/auth/refresh') { refreshes++; return response(200, { accessToken:'renewed', usuario:{ id:7, rol:'estudiante' } }); }
      if (options.headers.Authorization === 'Bearer renewed') return response(200, []);
      if (url === '/late') return new Promise(resolve => { late = () => resolve(response(401)); });
      return response(401);
    };
    const pending = api.get('/late');
    await api.get('/first'); late(); await pending;
    assert.equal(refreshes, 1);
  });

  it('no reproduce una escritura antigua con la identidad de otra cuenta', async () => {
    session.setSession(account());
    let finish, writes = 0;
    globalThis.fetch = async () => { writes++; return new Promise(resolve => { finish = () => resolve(response(401)); }); };
    const pending = api.post('/api/solicitudes', {}).catch(error => error);
    session.setSession(account(8)); finish();
    assert.ok((await pending).cancelled);
    assert.equal(writes, 1);
    assert.equal(session.getUser().id, 8);
  });

  it('un refresh rechazado limpia la sesión y no se reintenta en bucle', async () => {
    session.setSession(account());
    let calls = 0;
    globalThis.fetch = async () => { calls++; return response(401); };
    await assert.rejects(api.get('/api/recursos'), { status:401 });
    assert.equal(calls, 2);
    assert.equal(session.getToken(), null);
    assert.equal(window.location.href, '/login');
  });
});
