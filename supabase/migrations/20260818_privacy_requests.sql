-- One2OneLove relaunch: private account privacy-request queue
-- DEVELOPMENT MIGRATION ONLY. Do not apply to production without explicit approval.
--
-- This table records a member's request for a copy of their account data or for account
-- deletion. It does NOT perform export or deletion by itself. Fulfillment/retention rules
-- remain separate reviewed operational work.

create extension if not exists pgcrypto;

create table if not exists public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  request_type text not null check (request_type in ('data_export', 'account_deletion')),
  status text not null default 'submitted' check (status in ('submitted', 'in_review', 'completed', 'declined', 'canceled')),
  member_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.privacy_requests enable row level security;

-- Browser clients do not read or mutate the queue directly. The authenticated Edge
-- Function validates the member and uses service-role access to return only shaped rows.
revoke all on table public.privacy_requests from public;
revoke all on table public.privacy_requests from anon;
revoke all on table public.privacy_requests from authenticated;
grant all on table public.privacy_requests to service_role;

create unique index if not exists privacy_requests_one_active_type_per_user
  on public.privacy_requests (user_id, request_type)
  where status in ('submitted', 'in_review');

create index if not exists privacy_requests_user_created_idx
  on public.privacy_requests (user_id, created_at desc);

alter table public.privacy_requests
  drop constraint if exists privacy_requests_member_note_length;
alter table public.privacy_requests
  add constraint privacy_requests_member_note_length
  check (member_note is null or char_length(member_note) <= 500) not valid;

comment on table public.privacy_requests is
  'Private server-managed queue for member data-export and account-deletion requests. A row is a request only; it does not itself delete or export account data.';
comment on column public.privacy_requests.user_id is
  'Authenticated member UUID. Intentionally not a foreign key so a minimal request audit can survive account deletion pending final retention policy.';
