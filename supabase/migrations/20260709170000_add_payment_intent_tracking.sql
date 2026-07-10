alter table if exists public.reservation_payment_intents
  add column if not exists last_error text,
  add column if not exists odoo_invoice_id integer;
