import { apiFetch } from "./backend.js";

export async function fetchAvailability(
  appointmentTypeId,
  year,
  month,
  options = {}
) {
  const qs = new URLSearchParams({
    appointmentTypeId: String(appointmentTypeId),
    year: String(year),
    month: String(month + 1),
  });
  if (options.durationMinutes) {
    qs.set("durationMinutes", String(options.durationMinutes));
  }
  return apiFetch(`/availability?${qs.toString()}`, { method: "GET" });
}

export async function createReservation(payload) {
  try {
    const data = await apiFetch("/reservations", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return { ok: true, reserva: data?.reservation || null };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No s'ha pogut crear la reserva.",
    };
  }
}
