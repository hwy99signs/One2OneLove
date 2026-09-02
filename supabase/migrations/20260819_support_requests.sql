-- One2OneLove private member support requests.
-- DEVELOPMENT MIGRATION ONLY. Do not apply to live Supabase until explicitly approved.
--
-- This is an in-app support channel for authenticated members. It intentionally does not
-- duplicate member email/phone data and does not depend on an external email/SMS provider.

begin;

create extension if not exists pgcrypto;

create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('account','technical','billing','safety','feedback','other')),
  subject text not null check (char_length(subject) between 3 and 120),
  message text not null check (char_length(message) between 10 and 4000),
  status text not null default 'open' check (status in ('open','in_progress','resolved','closed')),
  staff_response text null check (staff_response is null or char_length(staff_response) <= 4000),
  responded_at timestamptz null,
  closed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_requests_member_idx
  on public.support_requests (user_id, created_at desc);

create index if not exists support_requests_queue_idx
  on public.support_requests (status, created_at)
  where status in ('open','in_progress');

create table if not exists public.support_request_audit (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.support_requests(id) on delete cascade,
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (action in ('created','member_closed','staff_started','staff_resolved','staff_closed','staff_reopened')),
  created_at timestamptz not null default now()
);

create index if not exists support_request_audit_request_idx
  on public.support_request_audit (request_id, created_at);

alter table public.support_requests enable row level security;
alter table public.support_request_audit enable row level security;

revoke all on table public.support_requests from anon, authenticated;
revoke all on table public.support_request_audit from anon, authenticated;

grant select on table public.support_requests to authenticated;

-- Members can read only their own support requests. All writes are mediated by reviewed
-- backend functions so status and staff response fields cannot be forged in the browser.
drop policy if exists "support_requests_select_own" on public.support_requests;
create policy "support_requests_select_own"
on public.support_requests for select
to authenticated
using ((select auth.uid()) = user_id);

-- No browser policy or grant is created for the audit table. It is service-role only.

create or replace function public.set_support_request_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_support_request_updated_at() from public, anon, authenticated;

drop trigger if exists support_requests_updated_at on public.support_requests;
create trigger support_requests_updated_at
before update on public.support_requests
for each row execute function public.set_support_request_updated_at();

comment on table public.support_requests is
  'Private signed-in member support requests. Members can read only their own requests; creation/status/staff-response writes are backend mediated.';
comment on table public.support_request_audit is
  'Service-role-only audit trail for member and allowlisted O2OL support actions.';

commit;

-- PRE-APPLY CHECKLIST
-- 1. Keep VITE_SUPPORT_REQUESTS_ENABLED=false and SUPPORT_REQUESTS_ENABLED=false.
-- 2. Verify anon has zero privileges on both tables.
-- 3. Verify authenticated users can SELECT only their own support_requests rows.
-- 4. Verify authenticated users have no direct INSERT/UPDATE/DELETE privileges.
-- 5. Verify support_request_audit is inaccessible to browser roles.
-- 6. Verify staff_response cannot be supplied through the member-create endpoint.
-- 7. Do not configure email/SMS/push delivery as part of this migration.
