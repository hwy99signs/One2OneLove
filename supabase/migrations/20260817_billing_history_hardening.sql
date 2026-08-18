-- One2OneLove relaunch: legacy billing-history hardening
-- DEVELOPMENT MIGRATION ONLY. Apply to production only through an approved batch.
--
-- Keeps the existing payment_history/subscription_changes audit tables usable while
-- removing browser mutation access and making Stripe invoice recording idempotent.

begin;

alter table public.payment_history enable row level security;
alter table public.subscription_changes enable row level security;

revoke all on table public.payment_history from anon, authenticated;
revoke all on table public.subscription_changes from anon, authenticated;
grant select on table public.payment_history to authenticated;
grant select on table public.subscription_changes to authenticated;

-- Own-history read only. Stripe/service-role code remains the writer.
drop policy if exists "Users can view own payment history" on public.payment_history;
create policy "Users can view own payment history"
on public.payment_history
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can view own subscription changes" on public.subscription_changes;
create policy "Users can view own subscription changes"
on public.subscription_changes
for select
to authenticated
using (auth.uid() = user_id);

-- Browser roles are not granted INSERT, so legacy service-role INSERT policies are not
-- needed for enforcement. service_role bypasses RLS.
drop policy if exists "Service role can insert payment history" on public.payment_history;
drop policy if exists "Service role can insert subscription changes" on public.subscription_changes;

-- Stripe can redeliver webhook events. One invoice must create at most one payment row.
create unique index if not exists payment_history_stripe_invoice_uidx
  on public.payment_history(stripe_invoice_id)
  where stripe_invoice_id is not null;

comment on table public.payment_history is
  'Server-written Stripe payment audit history; authenticated members may read only their own rows.';
comment on table public.subscription_changes is
  'Server-written membership change audit history; authenticated members may read only their own rows.';

commit;

-- CONTROLLED TESTS
-- 1. Authenticated user can SELECT only own history.
-- 2. Browser INSERT/UPDATE/DELETE fails.
-- 3. service_role can insert.
-- 4. Duplicate stripe_invoice_id insertion fails, allowing webhook idempotency handling.
