-- One2OneLove relaunch: private member subscription state
-- DEVELOPMENT MIGRATION ONLY. Apply to production only through an approved batch.
--
-- Billing state no longer belongs in browser-editable public.users columns. Stripe and
-- server-side billing functions are the only writers. Authenticated members receive
-- SELECT permission only for the privacy-safe status columns needed by my_membership.

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
  pricing_transition_status text not null default 'not_started' check (
    pricing_transition_status in ('not_started', 'pending', 'configured', 'reconciliation_required')
  ),
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

create index if not exists member_subscriptions_reconciliation_idx
  on public.member_subscriptions(pricing_transition_status, updated_at desc)
  where pricing_transition_status = 'reconciliation_required';

alter table public.member_subscriptions enable row level security;

-- Start from zero browser privileges, then grant only the privacy-safe membership status
-- fields required by the security-invoker view. No browser role receives INSERT/UPDATE/
-- DELETE or SELECT access to Stripe IDs, price IDs, checkout internals or reconciliation.
revoke all on table public.member_subscriptions from public, anon, authenticated;
grant select (
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
) on table public.member_subscriptions to authenticated;

drop policy if exists "member_subscriptions_select_own_safe" on public.member_subscriptions;
create policy "member_subscriptions_select_own_safe"
on public.member_subscriptions
for select
to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.set_member_subscription_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_member_subscription_updated_at() from public, anon, authenticated;

drop trigger if exists member_subscriptions_updated_at on public.member_subscriptions;
create trigger member_subscriptions_updated_at
before update on public.member_subscriptions
for each row execute function public.set_member_subscription_updated_at();

-- Browser-safe own-membership projection. security_invoker makes the view obey the
-- authenticated caller's underlying column privileges and own-row RLS instead of
-- relying on view-owner privileges.
drop view if exists public.my_membership;
create view public.my_membership
with (security_barrier = true, security_invoker = true)
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
where user_id = (select auth.uid());

revoke all on public.my_membership from public, anon, authenticated;
grant select on public.my_membership to authenticated;

comment on table public.member_subscriptions is
  'Private server-managed Stripe membership state. Browser roles can read only explicitly granted safe status columns on their own RLS row; Stripe IDs and reconciliation internals remain server-only.';
comment on view public.my_membership is
  'Security-invoker authenticated own-membership projection; excludes Stripe customer/subscription/schedule, raw price IDs, checkout internals and reconciliation internals.';

commit;

-- PRE-APPLY / CONTROLLED TESTS
-- 1. Deploy hardened checkout/webhook functions with PAYMENTS_ENABLED=false first.
-- 2. Confirm anon cannot read/write this table.
-- 3. Confirm authenticated user can SELECT only the explicitly granted safe columns and
--    only their own row; selecting stripe_customer_id/stripe_subscription_id must fail.
-- 4. Confirm my_membership is security_invoker + security_barrier and returns own row only.
-- 5. Confirm browser INSERT/UPDATE/DELETE fails while service_role can upsert Stripe state.
-- 6. Confirm a failed intro->standard schedule setup is recorded as
--    pricing_transition_status='reconciliation_required' and is never silently ignored.
-- 7. Do not delete legacy public.users subscription columns yet; leave them read-only
--    during the relaunch transition until all legacy consumers are removed.
