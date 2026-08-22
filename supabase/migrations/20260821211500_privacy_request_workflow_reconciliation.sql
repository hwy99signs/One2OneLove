-- One2OneLove relaunch: reconcile staged privacy-request schemas into one safe workflow.
-- DEVELOPMENT MIGRATION ONLY. Do not apply to production without explicit approval.
--
-- This migration is intentionally non-destructive with respect to member accounts:
-- it records/reviews requests only. It does NOT export data, modify account data,
-- cancel billing, send email/SMS, or delete an auth user.

begin;

create extension if not exists pgcrypto;

create table if not exists public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  request_type text not null,
  status text not null default 'submitted',
  member_note text,
  staff_response text,
  reviewed_at timestamptz,
  completed_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Remove an older staged integrity trigger before normalizing legacy development rows.
drop trigger if exists privacy_requests_state_integrity on public.privacy_requests;

alter table public.privacy_requests add column if not exists member_note text;
alter table public.privacy_requests add column if not exists staff_response text;
alter table public.privacy_requests add column if not exists reviewed_at timestamptz;
alter table public.privacy_requests add column if not exists completed_at timestamptz;
alter table public.privacy_requests add column if not exists canceled_at timestamptz;
alter table public.privacy_requests add column if not exists created_at timestamptz not null default now();
alter table public.privacy_requests add column if not exists updated_at timestamptz not null default now();

-- An older staged workflow called the member-authored note `description` and allowed
-- 2,000 characters. Preserve at most the reviewed 500-character member note.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'privacy_requests'
      and column_name = 'description'
  ) then
    execute $sql$
      update public.privacy_requests
      set member_note = left(coalesce(nullif(member_note, ''), description), 500)
      where description is not null and description <> ''
    $sql$;
  end if;
end;
$$;

-- The older staged workflow used British spelling and `rejected`. Normalize to the
-- member-facing contract already used by the active Privacy Center.
alter table public.privacy_requests drop constraint if exists privacy_requests_status_check;
update public.privacy_requests set status = 'canceled' where status = 'cancelled';
update public.privacy_requests set status = 'declined' where status = 'rejected';

-- Preserve any staged cancellation timestamp before removing the duplicate spelling.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'privacy_requests'
      and column_name = 'cancelled_at'
  ) then
    execute $sql$
      update public.privacy_requests
      set canceled_at = coalesce(canceled_at, cancelled_at)
      where cancelled_at is not null
    $sql$;
  end if;
end;
$$;

alter table public.privacy_requests drop column if exists description;
alter table public.privacy_requests drop column if exists cancelled_at;

alter table public.privacy_requests drop constraint if exists privacy_requests_request_type_check;
alter table public.privacy_requests
  add constraint privacy_requests_request_type_check
  check (request_type in ('data_export', 'account_deletion', 'data_correction')) not valid;
alter table public.privacy_requests validate constraint privacy_requests_request_type_check;

alter table public.privacy_requests
  add constraint privacy_requests_status_check
  check (status in ('submitted', 'in_review', 'completed', 'declined', 'canceled')) not valid;
alter table public.privacy_requests validate constraint privacy_requests_status_check;

alter table public.privacy_requests drop constraint if exists privacy_requests_member_note_length;
alter table public.privacy_requests
  add constraint privacy_requests_member_note_length
  check (member_note is null or char_length(member_note) <= 500) not valid;
alter table public.privacy_requests validate constraint privacy_requests_member_note_length;

alter table public.privacy_requests drop constraint if exists privacy_requests_staff_response_length;
alter table public.privacy_requests
  add constraint privacy_requests_staff_response_length
  check (staff_response is null or char_length(staff_response) <= 4000) not valid;
alter table public.privacy_requests validate constraint privacy_requests_staff_response_length;

-- One active request of a given type per member prevents accidental duplicate intake.
drop index if exists public.privacy_requests_one_active_type_per_member;
create unique index if not exists privacy_requests_one_active_type_per_user
  on public.privacy_requests (user_id, request_type)
  where status in ('submitted', 'in_review');

create index if not exists privacy_requests_user_created_idx
  on public.privacy_requests (user_id, created_at desc);
create index if not exists privacy_requests_queue_idx
  on public.privacy_requests (status, created_at)
  where status in ('submitted', 'in_review');

create table if not exists public.privacy_request_audit (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.privacy_requests(id) on delete cascade,
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (action in ('submitted', 'member_cancelled', 'staff_started', 'staff_completed', 'staff_rejected', 'staff_reopened')),
  created_at timestamptz not null default now()
);

create index if not exists privacy_request_audit_request_idx
  on public.privacy_request_audit (request_id, created_at);

-- Browser clients never access either queue directly. The authenticated Edge Functions
-- validate the caller and use service-role access to return deliberately shaped records.
alter table public.privacy_requests enable row level security;
alter table public.privacy_request_audit enable row level security;
revoke all on table public.privacy_requests from public, anon, authenticated;
revoke all on table public.privacy_request_audit from public, anon, authenticated;
grant all on table public.privacy_requests to service_role;
grant all on table public.privacy_request_audit to service_role;

drop policy if exists "privacy_requests_select_own" on public.privacy_requests;

create or replace function public.set_privacy_request_updated_at()
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

revoke all on function public.set_privacy_request_updated_at() from public, anon, authenticated;

drop trigger if exists privacy_requests_updated_at on public.privacy_requests;
create trigger privacy_requests_updated_at
before update on public.privacy_requests
for each row execute function public.set_privacy_request_updated_at();

-- Enforce lifecycle invariants in the database even if a future server handler regresses.
create or replace function public.enforce_privacy_request_state_integrity()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.status <> 'submitted'
      or new.staff_response is not null
      or new.reviewed_at is not null
      or new.completed_at is not null
      or new.canceled_at is not null then
      raise exception using errcode = 'P0001', message = 'PRIVACY_REQUEST_INVALID_INITIAL_STATE';
    end if;
    return new;
  end if;

  if new.user_id is distinct from old.user_id
    or new.request_type is distinct from old.request_type
    or new.member_note is distinct from old.member_note
    or new.created_at is distinct from old.created_at then
    raise exception using errcode = 'P0001', message = 'PRIVACY_REQUEST_MEMBER_CONTENT_IMMUTABLE';
  end if;

  if new.status is distinct from old.status then
    if not (
      (old.status = 'submitted' and new.status in ('in_review', 'completed', 'declined', 'canceled'))
      or (old.status = 'in_review' and new.status in ('completed', 'declined'))
      or (old.status in ('completed', 'declined') and new.status = 'in_review')
    ) then
      raise exception using errcode = 'P0001', message = 'PRIVACY_REQUEST_INVALID_STATUS_TRANSITION';
    end if;
  end if;

  if new.status = 'canceled' and new.canceled_at is null then
    raise exception using errcode = 'P0001', message = 'PRIVACY_REQUEST_CANCELED_AT_REQUIRED';
  end if;
  if new.status <> 'canceled' and new.canceled_at is not null then
    raise exception using errcode = 'P0001', message = 'PRIVACY_REQUEST_CANCELED_AT_NOT_ALLOWED';
  end if;

  if new.status = 'completed' and new.completed_at is null then
    raise exception using errcode = 'P0001', message = 'PRIVACY_REQUEST_COMPLETED_AT_REQUIRED';
  end if;
  if new.status <> 'completed' and new.completed_at is not null then
    raise exception using errcode = 'P0001', message = 'PRIVACY_REQUEST_COMPLETED_AT_NOT_ALLOWED';
  end if;

  if new.status in ('in_review', 'completed', 'declined') and new.reviewed_at is null then
    raise exception using errcode = 'P0001', message = 'PRIVACY_REQUEST_REVIEWED_AT_REQUIRED';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_privacy_request_state_integrity() from public, anon, authenticated;

drop trigger if exists privacy_requests_state_integrity on public.privacy_requests;
create trigger privacy_requests_state_integrity
before insert or update on public.privacy_requests
for each row execute function public.enforce_privacy_request_state_integrity();

comment on table public.privacy_requests is
  'Private service-managed queue for member privacy requests. Rows record/review requests only and never execute deletion/export themselves.';
comment on table public.privacy_request_audit is
  'Service-role-only audit trail for privacy-request review lifecycle actions.';

commit;

-- CONTROLLED-TEST CHECKLIST BEFORE ANY PRODUCTION APPROVAL
-- 1. anon/authenticated have zero direct table privileges on queue and audit.
-- 2. privacy-request Edge Function is the only member intake/history path.
-- 3. active request types exposed to members remain data_export/account_deletion only.
-- 4. duplicate active requests fail closed.
-- 5. member-authored user_id/type/note/created_at cannot change after insert.
-- 6. invalid status/timestamp combinations are rejected by the trigger.
-- 7. manage-privacy-requests uses a server-side UUID allowlist and never returns user_id.
-- 8. no function/migration here uses privileged auth-administration APIs, deletes auth users, exports data, sends communications or changes billing.
