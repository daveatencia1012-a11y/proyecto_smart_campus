const TOKEN_KEY = "smart-campus-token";
const REFRESH_KEY = "smart-campus-refresh";
const USER_KEY = "smart-campus-user";
const ROLE_KEY = "smart-campus-role";

const DEFAULT_ROLE = "estudiante";
const ADMIN_ROLE = "administrador";
const STAFF_ROLE = "administrativo";

const SESSION_KEYS = [TOKEN_KEY, REFRESH_KEY, USER_KEY, ROLE_KEY];

const listeners = new Set();

let storageListenerAttached = false;
let userCache = { raw: null, value: null };
let snapshotCache = null;
let sessionVersion = 0;
const memory = new Map();
const volatileKeys = new Set();
const ROLES = ['estudiante', 'docente', 'administrativo', 'administrador'];

export function getSessionVersion() { return sessionVersion; }

function safeGet(key) {
  if (volatileKeys.has(key)) return memory.get(key) ?? null;
  try {
    return localStorage.getItem(key);
  } catch {
    return memory.get(key) ?? null;
  }
}

function safeSet(key, value) {
  memory.set(key, String(value));
  try {
    localStorage.setItem(key, value);
    volatileKeys.delete(key);
  } catch {
    volatileKeys.add(key);
  }
}

function safeRemove(key) {
  memory.delete(key);
  try {
    localStorage.removeItem(key);
    volatileKeys.delete(key);
  } catch {
    volatileKeys.add(key);
  }
}

function notify() {
  for (const listener of Array.from(listeners)) {
    listener();
  }
}

function handleStorage(event) {
  if (event.key && !SESSION_KEYS.includes(event.key)) return;
  if (!event.key || event.key === REFRESH_KEY && event.oldValue !== event.newValue) sessionVersion++;
  if (!event.key) { memory.clear(); volatileKeys.clear(); }
  else {
    volatileKeys.delete(event.key);
    if (event.newValue === null) memory.delete(event.key);
    else memory.set(event.key, event.newValue);
  }
  notify();
}

function attachStorageListener() {
  if (storageListenerAttached || typeof window === "undefined") return;

  window.addEventListener("storage", handleStorage);
  storageListenerAttached = true;
}

export function subscribe(callback) {
  attachStorageListener();
  listeners.add(callback);

  return () => {
    listeners.delete(callback);
  };
}

export function getToken() {
  return safeGet(TOKEN_KEY);
}

export function getRefreshToken() {
  return safeGet(REFRESH_KEY);
}

export function getUser() {
  const raw = safeGet(USER_KEY);
  if (raw === userCache.raw) return userCache.value;

  let value = null;
  if (raw) {
    try {
      value = JSON.parse(raw);
    } catch {
      value = null;
    }
  }

  userCache = { raw, value };
  return value;
}

export function getRole() {
  const role = getUser()?.rol || safeGet(ROLE_KEY);
  return ROLES.includes(role) ? role : DEFAULT_ROLE;
}

export function isAdmin() {
  return getRole() === ADMIN_ROLE;
}

export function isStaff() {
  const role = getRole();
  return role === ADMIN_ROLE || role === STAFF_ROLE;
}

export function setSession({ accessToken, refreshToken, usuario } = {}) {
  if (!accessToken || !refreshToken || !usuario || !ROLES.includes(usuario.rol)) throw new Error('Respuesta de autenticación inválida');
  sessionVersion++;
  SESSION_KEYS.forEach(safeRemove);
  if (accessToken) safeSet(TOKEN_KEY, accessToken);
  if (refreshToken) safeSet(REFRESH_KEY, refreshToken);
  if (usuario) {
    safeSet(USER_KEY, JSON.stringify(usuario));
    safeSet(ROLE_KEY, usuario.rol);
  }
  notify();
}

export function updateSession({ accessToken, usuario } = {}) {
  if (accessToken) safeSet(TOKEN_KEY, accessToken);
  if (usuario) {
    safeSet(USER_KEY, JSON.stringify(usuario));
    safeSet(ROLE_KEY, usuario.rol);
  }
  notify();
}

export function clearSession() {
  sessionVersion++;
  safeRemove(TOKEN_KEY);
  safeRemove(REFRESH_KEY);
  safeRemove(USER_KEY);
  safeRemove(ROLE_KEY);
  notify();
}

function buildSnapshot() {
  const user = getUser();
  const role = getRole();

  return {
    user,
    role,
    isAdmin: role === ADMIN_ROLE,
    isStaff: role === ADMIN_ROLE || role === STAFF_ROLE,
    isAuthenticated: !!getToken(),
  };
}

function isSameSnapshot(current, next) {
  return (
    current.user === next.user &&
    current.role === next.role &&
    current.isAdmin === next.isAdmin &&
    current.isStaff === next.isStaff &&
    current.isAuthenticated === next.isAuthenticated
  );
}

export function getSessionSnapshot() {
  const next = buildSnapshot();
  if (!snapshotCache || !isSameSnapshot(snapshotCache, next)) {
    snapshotCache = next;
  }
  return snapshotCache;
}
