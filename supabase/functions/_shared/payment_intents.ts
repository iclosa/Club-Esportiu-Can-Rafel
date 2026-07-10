import {
  ReservationPayload,
  createAppointmentReservation,
  createPaidGuestInvoice,
} from "./appointments.ts";
import { buildAvailabilityDays } from "./reservations.ts";
import { getAppointmentEvents, getAppointmentSlots, getAppointmentType } from "./appointments.ts";
import {
  localDateStartToOdooDateTime,
  nextLocalDateStartToOdooDateTime,
} from "./appointments.ts";

export type PaymentIntentRecord = {
  id: string;
  status: string;
  source: string;
  appointment_type_id: number;
  zona_id: string;
  zona_nom: string;
  auth_user_id: number | null;
  auth_partner_id: number;
  nom: string;
  email: string;
  telefon: string | null;
  persones: number;
  motiu: string;
  selected_partner_ids: number[];
  slot_start: string;
  slot_end: string;
  amount_cents: number;
  currency: string;
  guest_count: number;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  odoo_event_id: number | null;
  odoo_invoice_id: number | null;
  last_error: string | null;
  expires_at: string;
  raw_payload: ReservationPayload;
};

export async function ensureReservationStillAvailable(payload: ReservationPayload) {
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
    throw new Error("Aquesta franja ja no està disponible.");
  }
}

export function computeGuestCount(payload: ReservationPayload) {
  const memberCount = 1 + (payload.selectedPartnerIds?.length || 0);
  return Math.max(0, payload.persones - memberCount);
}

export function computeAmountCents(payload: ReservationPayload) {
  return computeGuestCount(payload) * 700;
}

export async function createReservationFromIntent(intent: PaymentIntentRecord) {
  const payload: ReservationPayload = {
    appointmentTypeId: intent.appointment_type_id,
    authUserId: intent.auth_user_id,
    authPartnerId: intent.auth_partner_id,
    zonaId: intent.zona_id,
    zonaNom: intent.zona_nom,
    nom: intent.nom,
    email: intent.email,
    telefon: intent.telefon,
    persones: intent.persones,
    motiu: intent.motiu,
    selectedPartnerIds: intent.selected_partner_ids || [],
    soci: true,
    slotStart: intent.slot_start,
    slotEnd: intent.slot_end,
  };

  await ensureReservationStillAvailable(payload);
  return createAppointmentReservation(payload);
}

export async function createInvoiceFromIntent(intent: PaymentIntentRecord) {
  if (intent.guest_count <= 0 || intent.amount_cents <= 0) {
    return null;
  }

  return createPaidGuestInvoice({
    partnerId: intent.auth_partner_id,
    zonaNom: intent.zona_nom,
    guestCount: intent.guest_count,
    amountCents: intent.amount_cents,
    slotStart: intent.slot_start,
    stripeSessionId: intent.stripe_session_id,
  });
}

function getSupabaseConfig() {
  const url = Deno.env.get("SUPABASE_URL") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

  if (!url || !serviceRoleKey) {
    throw new Error("Falten els secrets de Supabase per gestionar pagaments.");
  }

  return { url: url.replace(/\/+$/, ""), serviceRoleKey };
}

async function dbFetch(path: string, init: RequestInit = {}) {
  const cfg = getSupabaseConfig();
  const resp = await fetch(`${cfg.url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: cfg.serviceRoleKey,
      Authorization: `Bearer ${cfg.serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers || {}),
    },
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Supabase DB ha respost ${resp.status}: ${text}`);
  }

  return resp;
}

export async function insertPaymentIntent(
  payload: ReservationPayload,
  source: string
): Promise<PaymentIntentRecord> {
  const guestCount = computeGuestCount(payload);
  const amountCents = computeAmountCents(payload);
  const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString();

  const resp = await dbFetch("reservation_payment_intents", {
    method: "POST",
    body: JSON.stringify([
      {
        status: "pending_payment",
        source,
        appointment_type_id: payload.appointmentTypeId,
        zona_id: payload.zonaId,
        zona_nom: payload.zonaNom,
        auth_user_id: payload.authUserId,
        auth_partner_id: payload.authPartnerId,
        nom: payload.nom,
        email: payload.email,
        telefon: payload.telefon,
        persones: payload.persones,
        motiu: payload.motiu,
        selected_partner_ids: payload.selectedPartnerIds || [],
        slot_start: payload.slotStart,
        slot_end: payload.slotEnd,
        amount_cents: amountCents,
        guest_count: guestCount,
        expires_at: expiresAt,
        raw_payload: payload,
      },
    ]),
  });

  const rows = (await resp.json()) as PaymentIntentRecord[];
  return rows[0];
}

export async function getPaymentIntentById(id: string) {
  const resp = await dbFetch(
    `reservation_payment_intents?id=eq.${encodeURIComponent(id)}&select=*`
  );
  const rows = (await resp.json()) as PaymentIntentRecord[];
  return rows[0] || null;
}

export async function getPaymentIntentByStripeSessionId(sessionId: string) {
  const resp = await dbFetch(
    `reservation_payment_intents?stripe_session_id=eq.${encodeURIComponent(sessionId)}&select=*`
  );
  const rows = (await resp.json()) as PaymentIntentRecord[];
  return rows[0] || null;
}

export async function updatePaymentIntent(
  id: string,
  values: Record<string, unknown>
): Promise<PaymentIntentRecord> {
  const resp = await dbFetch(
    `reservation_payment_intents?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify(values),
    }
  );
  const rows = (await resp.json()) as PaymentIntentRecord[];
  return rows[0];
}

function getStripeConfig() {
  const secretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
  const successUrl = Deno.env.get("STRIPE_CHECKOUT_SUCCESS_URL") || "";
  const cancelUrl = Deno.env.get("STRIPE_CHECKOUT_CANCEL_URL") || "";

  if (!secretKey || !successUrl || !cancelUrl) {
    throw new Error("Falten els secrets/config de Stripe.");
  }

  return { secretKey, successUrl, cancelUrl };
}

export async function createStripeCheckoutSession(intent: PaymentIntentRecord) {
  const cfg = getStripeConfig();
  const successUrl = appendCheckoutParams(cfg.successUrl, {
    payment: "success",
    reservation_intent_id: intent.id,
    session_id: "{CHECKOUT_SESSION_ID}",
  });
  const cancelUrl = appendCheckoutParams(cfg.cancelUrl, {
    payment: "cancel",
    reservation_intent_id: intent.id,
  });
  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("success_url", successUrl);
  params.set("cancel_url", cancelUrl);
  params.set("billing_address_collection", "auto");
  params.set("locale", "es");
  params.set("customer_email", intent.email);
  params.set("metadata[reservation_intent_id]", intent.id);
  params.set("line_items[0][price_data][currency]", intent.currency);
  params.set("line_items[0][price_data][unit_amount]", String(700));
  params.set(
    "line_items[0][price_data][product_data][name]",
    "Jugador no soci"
  );
  params.set(
    "line_items[0][price_data][product_data][description]",
    `${intent.zona_nom} · ${intent.guest_count} convidat(s) no soci(s)`
  );
  params.set("line_items[0][quantity]", String(intent.guest_count));

  const resp = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(data?.error?.message || "No s'ha pogut crear el pagament.");
  }

  return data as { id: string; url: string };
}

function appendCheckoutParams(
  baseUrl: string,
  params: Record<string, string>
) {
  const url = new URL(baseUrl);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

export async function verifyStripeWebhook(req: Request, rawBody: string) {
  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
  if (!secret) {
    throw new Error("Falta STRIPE_WEBHOOK_SECRET.");
  }

  const signatureHeader = req.headers.get("stripe-signature") || "";
  const parts = signatureHeader.split(",").map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2) || "";
  const signatures = parts
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3));

  if (!timestamp || !signatures.length) {
    throw new Error("Signatura de Stripe no vàlida.");
  }

  const signedPayload = `${timestamp}.${rawBody}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(signedPayload)
  );
  const expected = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  if (!signatures.includes(expected)) {
    throw new Error("La signatura del webhook de Stripe no coincideix.");
  }

  return JSON.parse(rawBody);
}
