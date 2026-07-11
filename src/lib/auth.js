import { apiFetch } from "./backend.js";

const AUTH_STORAGE_KEY = "club-can-rafel-auth";

export function readStoredAuth() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function storeAuthSession(session) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export async function loginWithOdoo({ login, password }) {
  const identifier = String(login || "").trim();
  const secret = String(password || "");

  if (!identifier || !secret) {
    throw new Error("Cal indicar l'usuari i la contrasenya.");
  }

  const data = await apiFetch("/odoo-login", {
    method: "POST",
    body: JSON.stringify({
      login: identifier,
      email: identifier,
      username: identifier,
      password: secret,
    }),
  });

  const resolvedName =
    data?.name ||
    data?.user?.name ||
    data?.partner?.name ||
    data?.contact_name ||
    identifier;
  const resolvedEmail =
    (identifier.includes("@") ? identifier : "") ||
    data?.email ||
    data?.user?.email ||
    data?.partner?.email ||
    identifier;
  const accessToken = String(
    data?.accessToken || data?.access_token || data?.token || ""
  ).trim();

  if (!accessToken) {
    throw new Error("No s'ha rebut cap token d'accés.");
  }

  return {
    loggedIn: true,
    login: identifier,
    accessToken,
    userId: Number(data?.userId || data?.uid || 0) || null,
    partnerId: Number(data?.partnerId || 0) || null,
    name: normalizePersonName(resolvedName),
    email: String(resolvedEmail || "").trim().toLowerCase(),
    phone: String(data?.phone || data?.partner?.phone || "").trim(),
    memberTags: Array.isArray(data?.memberTags) ? data.memberTags : [],
    hasPortalAccess: Boolean(data?.hasPortalAccess),
    raw: data,
  };
}

function normalizePersonName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
