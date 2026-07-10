const STORAGE_KEY = "club-can-rafel-reservation-confirmation";
const ERROR_STORAGE_KEY = "club-can-rafel-reservation-error";

export function storeReservationConfirmation(data) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function readReservationConfirmation() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearReservationConfirmation() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
}

export function storeReservationError(data) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(data));
}

export function readReservationError() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(ERROR_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearReservationError() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(ERROR_STORAGE_KEY);
}

export function goToReservationConfirmation(query = "") {
  const suffix = query ? `?${query}` : "";
  window.location.assign(`/reserva-confirmada${suffix}`);
}

export function goToReservationCancelled(query = "") {
  const suffix = query ? `?${query}` : "";
  window.location.assign(`/reserva-cancelada${suffix}`);
}
