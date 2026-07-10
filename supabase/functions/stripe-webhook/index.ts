import { withCorsHeaders } from "../_shared/cors.ts";
import {
  createInvoiceFromIntent,
  createReservationFromIntent,
  getPaymentIntentById,
  getPaymentIntentByStripeSessionId,
  updatePaymentIntent,
  verifyStripeWebhook,
} from "../_shared/payment_intents.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  try {
    const rawBody = await req.text();
    const event = await verifyStripeWebhook(req, rawBody);

    if (event?.type === "checkout.session.completed") {
      const session = event.data?.object || {};
      const sessionId = String(session.id || "");
      const intentId = String(session.metadata?.reservation_intent_id || "");

      const paymentIntent =
        (intentId && (await getPaymentIntentById(intentId))) ||
        (sessionId && (await getPaymentIntentByStripeSessionId(sessionId)));

      if (!paymentIntent) {
        return json({ ok: true, ignored: true });
      }

      if (paymentIntent.status === "reservation_created") {
        return json({ ok: true, alreadyProcessed: true });
      }

      await updatePaymentIntent(paymentIntent.id, {
        status: "paid",
        stripe_session_id: sessionId || paymentIntent.stripe_session_id,
        stripe_payment_intent_id: String(session.payment_intent || ""),
        last_error: null,
      });

      try {
        const created = await createReservationFromIntent(paymentIntent);
        const updates: Record<string, unknown> = {
          status: "reservation_created",
          odoo_event_id: created.id,
          stripe_session_id: sessionId || paymentIntent.stripe_session_id,
          stripe_payment_intent_id: String(session.payment_intent || ""),
          last_error: null,
        };

        try {
          const invoice = await createInvoiceFromIntent({
            ...paymentIntent,
            stripe_session_id: sessionId || paymentIntent.stripe_session_id,
          });
          if (invoice?.invoiceId) {
            updates.odoo_invoice_id = invoice.invoiceId;
          }
        } catch (invoiceError) {
          updates.last_error =
            invoiceError instanceof Error
              ? invoiceError.message
              : "La reserva s'ha creat però la factura no s'ha pogut generar.";
        }

        await updatePaymentIntent(paymentIntent.id, updates);
      } catch (reservationError) {
        await updatePaymentIntent(paymentIntent.id, {
          status: "failed",
          stripe_session_id: sessionId || paymentIntent.stripe_session_id,
          stripe_payment_intent_id: String(session.payment_intent || ""),
          last_error:
            reservationError instanceof Error
              ? reservationError.message
              : "No s'ha pogut confirmar la reserva després del pagament.",
        });
      }
    }

    if (event?.type === "checkout.session.expired") {
      const session = event.data?.object || {};
      const sessionId = String(session.id || "");
      const paymentIntent = sessionId
        ? await getPaymentIntentByStripeSessionId(sessionId)
        : null;

      if (paymentIntent && paymentIntent.status === "pending_payment") {
        await updatePaymentIntent(paymentIntent.id, {
          status: "expired",
          last_error: "La sessió de pagament ha caducat abans de completar-se.",
        });
      }
    }

    return json({ ok: true });
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No s'ha pogut processar el webhook de Stripe.",
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
