-- One2OneLove relaunch Stripe webhook replay/idempotency foundation.
-- DEVELOPMENT MIGRATION ONLY. Do not apply to live Supabase until Approval #22.
--
-- Stores only operational Stripe event metadata needed for replay protection. Raw Stripe
-- payloads, card data, member email, billing address and other provider payload content
-- are intentionally not duplicated into this table.

begin;

create table if not exists public.stripe_webhook_events (
  event_id text primary key check (event_id ~ '^evt_[A-Za-z0-9]+$'),
  event_type text not null check (char_length(event_type) between 1 and 120),
  livemode boolean not null,
  event_created integer null check (event_created is null or event_created > 0),
  status text not null default 'processing'
    check (status in ('processing','processed','failed')),
  attempts integer not null default 1 check (attempts between 1 and 1000),
  first_received_at timestamptz not null default now(),
  last_attempt_at timestamptz not null default now(),
  processed_at timestamptz null,
  last_error_code text null check (
    last_error_code is null
    or last_error_code ~ '^[A-Z][A-Z0-9_]{2,79}$'
  ),
  constraint stripe_webhook_event_state check (
    (status = 'processed' and processed_at is not null and last_error_code is null)
    or (status = 'processing' and processed_at is null)
    or (status = 'failed' and processed_at is null and last_error_code is not null)
  )
);

create index if not exists stripe_webhook_events_retry_idx
  on public.stripe_webhook_events(status, last_attempt_at)
  where status in ('processing','failed');

alter table public.stripe_webhook_events enable row level security;
revoke all on table public.stripe_webhook_events from public, anon, authenticated;

-- A retried customer.subscription.deleted event must not create duplicate membership
-- change audit rows if earlier processing completed that insert but failed later.
alter table public.subscription_changes
  add column if not exists stripe_event_id text null;

create unique index if not exists subscription_changes_stripe_event_uidx
  on public.subscription_changes(stripe_event_id)
  where stripe_event_id is not null;

comment on table public.stripe_webhook_events is
  'Server-only Stripe event replay ledger. Stores event ID/type/mode/status only; no raw provider payload or member contact/payment details.';
comment on column public.subscription_changes.stripe_event_id is
  'Server-written Stripe event ID used only to make webhook-created membership-change audit rows idempotent.';

commit;

-- PRE-APPLY CHECKLIST
-- 1. Keep VITE_PAYMENTS_ENABLED=false and server PAYMENTS_ENABLED=false.
-- 2. Verify anon/authenticated have zero privileges on stripe_webhook_events.
-- 3. Verify the same event_id cannot be inserted twice.
-- 4. Verify processed events require processed_at and cannot carry last_error_code.
-- 5. Verify failed events require a stable last_error_code and remain retryable.
-- 6. Verify duplicate stripe_event_id cancellation-history insertion is rejected.
-- 7. Do not deploy/replace the production Stripe webhook from this migration alone.
