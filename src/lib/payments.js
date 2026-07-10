import { apiFetch } from "./backend.js";

export async function createCheckoutSession(payload) {
  return apiFetch("/create-checkout-session", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getPaymentStatus(reservationIntentId) {
  const qs = new URLSearchParams({
    reservation_intent_id: String(reservationIntentId),
  });
  return apiFetch(`/payment-status?${qs.toString()}`, {
    method: "GET",
  });
}
