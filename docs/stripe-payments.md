# Pagament previ per pistes

## Flux mínim

1. La web o app construeix la reserva de pista.
2. Si hi ha convidats no socis, crida `create-checkout-session`.
3. Stripe mostra Checkout i cobra `7 EUR` per convidat.
4. Stripe envia `checkout.session.completed` a `stripe-webhook`.
5. El webhook revalida disponibilitat, crea la reserva a Odoo i intenta generar la factura pagada.

## Secrets necessaris a Supabase

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_CHECKOUT_SUCCESS_URL`
- `STRIPE_CHECKOUT_CANCEL_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ODOO_BASE_URL`
- `ODOO_DATABASE`
- `ODOO_API_KEY`
- `ODOO_STRIPE_PRODUCT_ID` (opcional, si no es vol que la funció el resolgui/creï)
- `ODOO_STRIPE_PAYMENT_JOURNAL_ID` (recomanat)

## Funcions

- `create-checkout-session`
- `payment-status`
- `stripe-webhook`

## Taula

- `public.reservation_payment_intents`

## Desplegament

```bash
supabase functions deploy create-checkout-session --no-verify-jwt
supabase functions deploy payment-status --no-verify-jwt
supabase functions deploy stripe-webhook --no-verify-jwt
```
