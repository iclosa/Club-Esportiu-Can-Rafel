create extension if not exists pgcrypto;

create table if not exists public.reservation_payment_intents (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null,
  status text not null check (
    status in (
      'pending_payment',
      'paid',
      'reservation_created',
      'cancelled',
      'expired',
      'failed'
    )
  ),
  source text not null,
  appointment_type_id integer not null,
  zona_id text not null,
  zona_nom text not null,
  auth_user_id integer,
  auth_partner_id integer not null,
  nom text not null,
  email text not null,
  telefon text,
  persones integer not null,
  motiu text not null,
  selected_partner_ids integer[] not null default '{}',
  slot_start text not null,
  slot_end text not null,
  amount_cents integer not null,
  currency text not null default 'eur',
  guest_count integer not null default 0,
  stripe_session_id text,
  stripe_payment_intent_id text,
  odoo_event_id integer,
  raw_payload jsonb not null default '{}'::jsonb
);

create index if not exists reservation_payment_intents_status_idx
  on public.reservation_payment_intents (status);

create index if not exists reservation_payment_intents_stripe_session_idx
  on public.reservation_payment_intents (stripe_session_id);

create index if not exists reservation_payment_intents_slot_idx
  on public.reservation_payment_intents (appointment_type_id, slot_start, slot_end);

create or replace function public.touch_reservation_payment_intents_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_reservation_payment_intents_updated_at
  on public.reservation_payment_intents;

create trigger trg_touch_reservation_payment_intents_updated_at
before update on public.reservation_payment_intents
for each row
execute function public.touch_reservation_payment_intents_updated_at();
