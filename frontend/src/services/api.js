import { clearSession, getRefreshToken, getToken, getSessionVersion, updateSession, subscribe } from './session.js';

let refreshState = null;
export class SessionChangedError extends Error {
  constructor() { super('La sesión cambió; se descartó la operación anterior.'); this.name = 'SessionChangedError'; this.cancelled = true; }
}
function checkSession(version) {
  if (version !== getSessionVersion()) throw new SessionChangedError();
}
const isAuth = url => ['/api/auth/login', '/api/auth/refresh'].includes(url.split('?')[0].replace(/\/$/, ''));

async function refreshAccessToken(version) {
  checkSession(version);
  if (refreshState?.version === version) return refreshState.promise;
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  const state = { version };
  const controller = new AbortController();
  const unsubscribe = subscribe(() => { if (getSessionVersion() !== version) controller.abort(); });
  state.promise = (async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)])
      });
      checkSession(version);
      if (!response.ok) return null;
      const data = await response.json();
      checkSession(version);
      if (getRefreshToken() !== refreshToken) throw new SessionChangedError();
      if (!data.accessToken || !data.usuario) return null;
      updateSession(data);
      return data.accessToken;
    } catch (error) {
      checkSession(version);
      if (error.cancelled) throw error;
      return null;
    } finally {
      unsubscribe();
      if (refreshState === state) refreshState = null;
    }
  })();
  refreshState = state;
  return state.promise;
}

async function request(url, options = {}, retried = false, version = getSessionVersion()) {
  checkSession(version);
  const token = getToken();
  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
      signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(20000)]) : AbortSignal.timeout(20000)
    });
  } catch (error) { checkSession(version); throw error; }
  checkSession(version);
  if (response.status === 401 && !isAuth(url)) {
    if (!retried) {
      // Un 401 tardío de un access anterior no debe disparar otro refresh.
      const nextToken = token !== getToken() && getToken() || await refreshAccessToken(version);
      checkSession(version);
      if (nextToken) return request(url, options, true, version);
    }
    checkSession(version);
    clearSession();
    window.location.href = '/login';
    throw Object.assign(new Error('Sesión expirada. Inicia sesión nuevamente.'), { status: 401 });
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    checkSession(version);
    throw Object.assign(new Error(body.error || body.message || (response.status === 401 ? 'Credenciales inválidas' : `Error ${response.status}`)), { status: response.status });
  }
  if (response.status === 204) return null;
  const body = await response.json();
  checkSession(version);
  return body;
}

export const get = url => request(url, { method: 'GET' });
async function mutate(url, options) {
  const data = await request(url, options);
  if (typeof window !== 'undefined' && window.dispatchEvent) window.dispatchEvent(new Event('campus-data-changed'));
  return data;
}
export const post = (url, body) => mutate(url, { method: 'POST', body: JSON.stringify(body) });
export const put = (url, body) => mutate(url, { method: 'PUT', body: JSON.stringify(body) });
export const del = url => mutate(url, { method: 'DELETE' });

// Conserva los arrays de la API. Cada página está limitada; nunca truncar silenciosamente.
export async function getAll(url, select = data => data) {
  const version = getSessionVersion();
  const rows = [];
  for (let offset = 0; offset <= 5000; offset += 100) {
    const target = new URL(url, 'http://local');
    target.searchParams.set('limit', '100'); target.searchParams.set('offset', String(offset));
    const page = select(await request(target.pathname + target.search, { method: 'GET' }, false, version));
    if (!Array.isArray(page)) throw new Error('Respuesta de listado inválida');
    if (rows.length + page.length > 5000) throw new Error('Hay más de 5000 registros; aplica filtros para consultar o exportar.');
    rows.push(...page);
    if (page.length < 100) return rows;
  }
  return rows;
}
