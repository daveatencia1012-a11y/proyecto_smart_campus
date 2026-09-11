const API_URL = "";

function getToken() {
  return localStorage.getItem("smart-campus-token");
}

function getHeaders() {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function request(url, options = {}) {
  const config = {
    headers: getHeaders(),
    ...options,
  };

  const response = await fetch(`${API_URL}${url}`, config);

  if (response.status === 401) {
    localStorage.removeItem("smart-campus-token");
    localStorage.removeItem("smart-campus-user");
    localStorage.removeItem("smart-campus-role");
    window.location.href = "/login";
    throw new Error("Sesión expirada. Inicia sesión nuevamente.");
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Error ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export function get(url) {
  return request(url, { method: "GET" });
}

export function post(url, data) {
  return request(url, { method: "POST", body: JSON.stringify(data) });
}

export function put(url, data) {
  return request(url, { method: "PUT", body: JSON.stringify(data) });
}

export function del(url) {
  return request(url, { method: "DELETE" });
}