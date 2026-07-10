import { corsHeaders, withCorsHeaders } from "../_shared/cors.ts";
import { getPaymentIntentById } from "../_shared/payment_intents.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return json({ error: "Method not allowed." }, 405);
  }

  try {
    const url = new URL(req.url);
    const reservationIntentId = String(
      url.searchParams.get("reservation_intent_id") || ""
    ).trim();

    if (!reservationIntentId) {
      return json({ error: "Falta reservation_intent_id." }, 400);
    }

    const intent = await getPaymentIntentById(reservationIntentId);
    if (!intent) {
      return json({ error: "No s'ha trobat el pagament." }, 404);
    }

    return json({
      id: intent.id,
      status: intent.status,
      lastError: intent.last_error,
      guestCount: intent.guest_count,
      amountCents: intent.amount_cents,
      eventId: intent.odoo_event_id,
      invoiceId: intent.odoo_invoice_id,
      zonaNom: intent.zona_nom,
      slotStart: intent.slot_start,
      slotEnd: intent.slot_end,
      nom: intent.nom,
      email: intent.email,
      persones: intent.persones,
    });
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No s'ha pogut consultar l'estat del pagament.",
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
