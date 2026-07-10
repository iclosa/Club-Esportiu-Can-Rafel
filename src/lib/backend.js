import { RESERVATIONS_API } from "../data/club.js";

export function getApiBaseUrl() {
  return RESERVATIONS_API.baseUrl.replace(/\/+$/, "");
}

export function requireBackend(message) {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new Error(message);
  }
  return baseUrl;
}

export async function apiFetch(path, options = {}) {
  const baseUrl = requireBackend(
    "Falta configurar VITE_RESERVATIONS_API_URL per connectar el web amb Supabase."
  );

  const resp = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!resp.ok) {
    let message = "No s'ha pogut completar l'operació.";
    try {
      const data = await resp.json();
      if (typeof data?.error === "string" && data.error.trim()) {
        message = data.error;
      }
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  return resp.json();
}
