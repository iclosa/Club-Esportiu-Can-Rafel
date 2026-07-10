import { corsHeaders, withCorsHeaders } from "../_shared/cors.ts";
import {
  getAppointmentEvents,
  getAppointmentSlots,
  getAppointmentType,
  localDateStartToOdooDateTime,
} from "../_shared/appointments.ts";
import { buildAvailabilityDays } from "../_shared/reservations.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return json({ error: "Method not allowed." }, 405);
  }

  try {
    const url = new URL(req.url);
    const appointmentTypeId = Number(url.searchParams.get("appointmentTypeId"));
    const year = Number(url.searchParams.get("year"));
    const month = Number(url.searchParams.get("month"));
    const durationMinutesRaw = url.searchParams.get("durationMinutes");
    const durationMinutes = durationMinutesRaw ? Number(durationMinutesRaw) : null;

    if (!Number.isInteger(appointmentTypeId) || appointmentTypeId <= 0) {
      throw new Error("appointmentTypeId no vàlid.");
    }
    if (!Number.isInteger(year) || year < 2024 || year > 2100) {
      throw new Error("Any no vàlid.");
    }
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new Error("Mes no vàlid.");
    }
    if (
      durationMinutes !== null &&
      (!Number.isFinite(durationMinutes) || durationMinutes <= 0)
    ) {
      throw new Error("Durada no vàlida.");
    }

    const type = await getAppointmentType(appointmentTypeId);
    const slots = await getAppointmentSlots(appointmentTypeId);
    const firstDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const rangeStart = localDateStartToOdooDateTime(firstDate);
    const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
    const rangeEnd = localDateStartToOdooDateTime(
      `${nextMonth.year}-${String(nextMonth.month).padStart(2, "0")}-01`
    );
    const events = await getAppointmentEvents(appointmentTypeId, rangeStart, rangeEnd);

    const days = buildAvailabilityDays({
      year,
      month,
      type,
      slots,
      events,
      durationHoursOverride:
        durationMinutes !== null ? durationMinutes / 60 : undefined,
    });

    return json({
      appointmentTypeId,
      appointmentName: type.name,
      durationHours: type.appointment_duration,
      days,
    });
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No s'ha pogut carregar la disponibilitat.",
      },
      400
    );
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: withCorsHeaders({ "Content-Type": "application/json" }),
  });
}
