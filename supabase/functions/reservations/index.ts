import { corsHeaders, withCorsHeaders } from "../_shared/cors.ts";
import {
  createAppointmentReservation,
  getAppointmentEvents,
  localDateStartToOdooDateTime,
  nextLocalDateStartToOdooDateTime,
} from "../_shared/appointments.ts";
import {
  buildAvailabilityDays,
  validateReservationInput,
} from "../_shared/reservations.ts";
import {
  getAppointmentSlots,
  getAppointmentType,
} from "../_shared/appointments.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  try {
    const payload = validateReservationInput(await req.json());

    const type = await getAppointmentType(payload.appointmentTypeId);
    const slots = await getAppointmentSlots(payload.appointmentTypeId);
    const slotDate = payload.slotStart.slice(0, 10);
    const rangeStart = localDateStartToOdooDateTime(slotDate);
    const rangeEnd = nextLocalDateStartToOdooDateTime(slotDate);
    const events = await getAppointmentEvents(payload.appointmentTypeId, rangeStart, rangeEnd);

    const days = buildAvailabilityDays({
      year: Number(slotDate.slice(0, 4)),
      month: Number(slotDate.slice(5, 7)),
      type,
      slots,
      events,
      now: new Date(),
    });
    const slotStillAvailable = days
      .find((day) => day.date === slotDate)
      ?.slots.some(
        (slot) => slot.start === payload.slotStart && slot.end === payload.slotEnd
      );

    if (!slotStillAvailable) {
      return json({ error: "Aquesta franja ja no està disponible." }, 409);
    }

    const created = await createAppointmentReservation(payload);

    return json({
      reservation: {
        id: `odoo-${created.id}`,
        status: "pending",
      },
    });
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No s'ha pogut crear la reserva.",
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
