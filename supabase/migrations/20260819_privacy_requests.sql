-- One2OneLove private privacy-request workflow.
-- DEVELOPMENT MIGRATION ONLY. Do not apply to live Supabase until explicitly approved.
--
-- This migration stages a request/queue workflow only. It does NOT automatically export
-- data, modify profile data, or delete accounts. Destructive/execution steps require a
-- separate reviewed backend implementation and explicit production approval.

begin;

create extension if not exists pgcrypto;

create table if not exists public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_type text not null check (request_type in ('data_export','account_deletion','data_correction')),
  description text not null default '' check (char_length(description) <= 2000),
  status text not null default 'submitted' check (status in ('submitted','in_review','completed','cancelled','rejected')),
  staff_response text null check (staff_response is null or char_length(staff_response) <= 4000),
  reviewed_at timestamptz null,
  completed_at timestamptz null,
  cancelled_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists privacy_requests_one_active_type_per_member
  on public.privacy_requests (user_id, request_type)
  where status in ('submitted','in_review');

create index if not exists privacy_requests_queue_idx
  on public.privacy_requests (status, created_at)
  where status in ('submitted','in_review');

create index if not exists privacy_requests_member_idx
  on public.privacy_requests (user_id, created_at desc);

create table if not exists public.privacy_request_audit (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.privacy_requests(id) on delete cascade,
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (action in ('submitted','member_cancelled','staff_started','staff_completed','staff_rejected','staff_reopened')),
  created_at timestamptz not null default now()
);

create index if not exists privacy_request_audit_request_idx
  on public.privacy_request_audit (request_id, created_at);

alter table public.privacy_requests enable row level security;
alter table public.privacy_request_audit enable row level security;

revoke all on table public.privacy_requests from anon, authenticated;
revoke all on table public.privacy_request_audit from anon, authenticated;
grant select on table public.privacy_requests to authenticated;

drop policy if exists "privacy_requests_select_own" on public.privacy_requests;
create policy "privacy_requests_select_own"
on public.privacy_requests for select
to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.set_privacy_request_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_privacy_request_updated_at() from public, anon, authenticated;

drop trigger if exists privacy_requests_updated_at on public.privacy_requests;
create trigger privacy_requests_updated_at
before update on public.privacy_requests
for each row execute function public.set_privacy_request_updated_at();

comment on table public.privacy_requests is
  'Private authenticated member privacy requests. This queue does not itself export, correct, or delete member data.';
comment on table public.privacy_request_audit is
  'Service-role-only audit trail for privacy request lifecycle actions.';

commit;

-- PRE-APPLY CHECKLIST
-- 1. Keep VITE_PRIVACY_REQUESTS_ENABLED=false and PRIVACY_REQUESTS_ENABLED=false.
-- 2. Verify anon has zero privileges on both tables.
-- 3. Verify members can SELECT only their own privacy_requests rows.
-- 4. Verify no browser direct INSERT/UPDATE/DELETE grants exist.
-- 5. Verify audit table is service-role only.
-- 6. Verify only one active request per member/request_type.
-- 7. Confirm no trigger/function in this migration deletes auth users or exports private data.
