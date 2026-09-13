import { post } from "./api";

const TOKEN_KEY = "smart-campus-token";
const USER_KEY = "smart-campus-user";
const ROLE_KEY = "smart-campus-role";

export async function login(email, password) {
  const data = await post("/api/auth/login", { email, password });

  localStorage.setItem(TOKEN_KEY, data.accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(data.usuario));
  localStorage.setItem(ROLE_KEY, data.usuario.rol);

  return data.usuario;
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ROLE_KEY);
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function isAuthenticated() {
  return !!getToken();
}