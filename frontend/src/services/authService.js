import { post } from "./api";
import { clearSession, getToken, getUser, setSession } from "./session";

export async function login(email, password) {
  const data = await post("/api/auth/login", { email, password });
  setSession(data);
  return data.usuario;
}

export function logout() {
  clearSession();
}

export function getCurrentUser() {
  return getUser();
}

export function isAuthenticated() {
  return !!getToken();
}
