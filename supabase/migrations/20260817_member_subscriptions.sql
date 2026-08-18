-- One2OneLove relaunch: private member subscription state
-- DEVELOPMENT MIGRATION ONLY. Apply to production only through an approved batch.
--
-- Billing state no longer belongs in browser-editable public.users columns. Stripe and
-- server-side billing functions are the only writers; authenticated members can read a
-- deliberately small own-membership projection.

begin;

create table if not exists public.member_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan_key text not null default 'membership' check (plan_key in ('membership')),
  pricing_version text not null default 'launch_2026',
  status text not null default 'inactive' check (status in (
    'inactive',
    'checkout_pending',
    'trialing',
    'active',
    'past_due',
    'canceled',
    'unpaid',
    'incomplete',
    'incomplete_expired',
    'paused'
  )),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_schedule_id text unique,
  current_price_id text,
  intro_ends_at timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  checkout_started_at timestamptz,
  activated_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists member_subscriptions_status_idx
  on public.member_subscriptions(status, updated_at desc);

alter table public.member_subscriptions enable row level security;

-- No direct browser access to Stripe identifiers or server-managed billing state.
revoke all on table public.member_subscriptions from anon, authenticated;

create or replace function public.set_member_subscription_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_member_subscription_updated_at() from public;

drop trigger if exists member_subscriptions_updated_at on public.member_subscriptions;
create trigger member_subscriptions_updated_at
before update on public.member_subscriptions
for each row execute function public.set_member_subscription_updated_at();

-- Browser-safe own-membership projection. Stripe IDs, raw price IDs and internal
-- reconciliation fields stay server-only.
drop view if exists public.my_membership;
create view public.my_membership
with (security_barrier = true)
as
select
  user_id,
  plan_key,
  pricing_version,
  status,
  intro_ends_at,
  current_period_end,
  cancel_at_period_end,
  activated_at,
  canceled_at,
  updated_at
from public.member_subscriptions
where user_id = auth.uid();

revoke all on public.my_membership from public;
revoke all on public.my_membership from anon;
grant select on public.my_membership to authenticated;

comment on table public.member_subscriptions is
  'Private server-managed Stripe membership state. Browser roles have no direct table access.';
comment on view public.my_membership is
  'Authenticated member own billing-status projection; excludes Stripe customer/subscription/schedule and price identifiers.';

commit;

-- PRE-APPLY / CONTROLLED TESTS
-- 1. Deploy hardened checkout/webhook functions with PAYMENTS_ENABLED=false first.
-- 2. Confirm anon cannot read/write this table and authenticated browser cannot mutate it.
-- 3. Confirm authenticated user can read only their own my_membership row.
-- 4. Confirm service_role can upsert Stripe state.
-- 5. Do not delete legacy public.users subscription columns yet; leave them read-only
--    during the relaunch transition until all legacy consumers are removed.
