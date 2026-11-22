const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

export function apiFetch(endpoint, options) {
  return fetch(`${API_BASE_URL}/${endpoint.replace(/^\/+/, "")}`, options);
}
