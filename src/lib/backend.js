import { RESERVATIONS_API } from "../data/club.js";

const AUTH_STORAGE_KEY = "club-can-rafel-auth";

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

function readAccessToken() {
  if (typeof window === "undefined") return "";

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return "";
    const auth = JSON.parse(raw);
    return typeof auth?.accessToken === "string" ? auth.accessToken.trim() : "";
  } catch {
    return "";
  }
}

export async function apiFetch(path, options = {}) {
  const baseUrl = requireBackend(
    "Falta configurar VITE_RESERVATIONS_API_URL per connectar el web amb Supabase."
  );
  const accessToken = readAccessToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (accessToken && !("Authorization" in headers)) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const resp = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
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
