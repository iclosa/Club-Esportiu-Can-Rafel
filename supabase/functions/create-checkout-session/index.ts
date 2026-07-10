import { corsHeaders, withCorsHeaders } from "../_shared/cors.ts";
import {
  computeAmountCents,
  computeGuestCount,
  createStripeCheckoutSession,
  ensureReservationStillAvailable,
  insertPaymentIntent,
  updatePaymentIntent,
} from "../_shared/payment_intents.ts";
import { validateReservationInput } from "../_shared/reservations.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  try {
    const payload = validateReservationInput(await req.json());
    await ensureReservationStillAvailable(payload);

    const guestCount = computeGuestCount(payload);
    const amountCents = computeAmountCents(payload);

    if (guestCount <= 0 || amountCents <= 0) {
      return json({
        requiresPayment: false,
        guestCount,
        amountCents,
      });
    }

    const intent = await insertPaymentIntent(payload, "court");
    const session = await createStripeCheckoutSession(intent);
    await updatePaymentIntent(intent.id, {
      stripe_session_id: session.id,
    });

    return json({
      requiresPayment: true,
      checkoutUrl: session.url,
      sessionId: session.id,
      guestCount,
      amountCents,
      reservationIntentId: intent.id,
    });
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No s'ha pogut iniciar el pagament.",
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
