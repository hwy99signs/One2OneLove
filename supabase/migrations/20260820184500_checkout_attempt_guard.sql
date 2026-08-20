-- One2OneLove relaunch single-active Stripe Checkout attempt guard.
-- DEVELOPMENT MIGRATION ONLY. Do not apply to live Supabase until Approval #22.
--
-- Prevents rapid/retried checkout requests from creating multiple concurrent Stripe
-- Checkout Sessions for the same member. The table is server-only and stores no card,
-- billing-address or payment-method data.

begin;

create extension if not exists pgcrypto;

create table if not exists public.stripe_checkout_attempts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  attempt_token uuid not null default gen_random_uuid(),
  status text not null default 'processing'
    check (status in ('processing','open','completed','expired','failed')),
  stripe_checkout_session_id text null unique,
  attempts integer not null default 1 check (attempts between 1 and 1000),
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz null,
  last_error_code text null check (
    last_error_code is null
    or last_error_code ~ '^[A-Z][A-Z0-9_]{2,79}$'
  ),
  constraint stripe_checkout_attempt_state check (
    (status = 'processing' and stripe_checkout_session_id is null and expires_at is null)
    or (status = 'open' and stripe_checkout_session_id is not null and expires_at is not null and last_error_code is null)
    or (status = 'completed' and stripe_checkout_session_id is not null and last_error_code is null)
    or (status = 'expired' and stripe_checkout_session_id is not null)
    or (status = 'failed' and last_error_code is not null)
  )
);

create index if not exists stripe_checkout_attempts_status_idx
  on public.stripe_checkout_attempts(status, updated_at);

alter table public.stripe_checkout_attempts enable row level security;
revoke all on table public.stripe_checkout_attempts from public, anon, authenticated;

comment on table public.stripe_checkout_attempts is
  'Server-only one-row-per-member Stripe Checkout attempt state used for concurrency/idempotency. Contains no raw payment method or billing-address data.';

commit;

-- PRE-APPLY CHECKLIST
-- 1. Keep VITE_PAYMENTS_ENABLED=false and server PAYMENTS_ENABLED=false.
-- 2. Verify browser roles have zero privileges on stripe_checkout_attempts.
-- 3. Verify two simultaneous first-checkout claims cannot both insert for one user_id.
-- 4. Verify stale/failed processing retries preserve the same attempt_token so Stripe
--    Idempotency-Key reuse cannot manufacture a second session.
-- 5. Verify an open non-expired Stripe session is reused rather than recreated.
-- 6. Verify an expired session can be replaced with a new attempt_token.
-- 7. Do not activate Stripe or production billing from this migration alone.
