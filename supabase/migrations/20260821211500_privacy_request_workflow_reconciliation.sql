-- One2OneLove relaunch: reconcile staged privacy-request schemas into one safe workflow.
-- DEVELOPMENT MIGRATION ONLY. Do not apply to production without explicit approval.
--
-- This migration is intentionally non-destructive with respect to member accounts:
-- it records and reviews requests only. It does NOT export data, modify account data,
-- cancel billing, send email/SMS, delete an auth user, or claim fulfillment occurred.
-- A reviewed/accepted request moves only to `awaiting_fulfillment`; actual fulfillment
-- requires a separately reviewed implementation and separate production approval.

begin;

create extension if not exists pgcrypto;
create schema if not exists o2ol_private;
revoke all on schema o2ol_private from public, anon, authenticated;

create table if not exists public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  request_type text not null,
  status text not null default 'submitted',
  member_note text,
  staff_response text,
  reviewer_user_id uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  decision_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Remove older staged integrity/audit triggers before normalizing legacy development rows.
drop trigger if exists privacy_requests_state_integrity on public.privacy_requests;
drop trigger if exists privacy_requests_audit_state on public.privacy_requests;
drop trigger if exists privacy_requests_updated_at on public.privacy_requests;

alter table public.privacy_requests add column if not exists member_note text;
alter table public.privacy_requests add column if not exists staff_response text;
alter table public.privacy_requests add column if not exists reviewer_user_id uuid;
alter table public.privacy_requests add column if not exists reviewed_at timestamptz;
alter table public.privacy_requests add column if not exists decision_at timestamptz;
alter table public.privacy_requests add column if not exists canceled_at timestamptz;
alter table public.privacy_requests add column if not exists created_at timestamptz not null default now();
alter table public.privacy_requests add column if not exists updated_at timestamptz not null default now();

-- Reconcile reviewer foreign-key behavior so deleting a staff Auth account never deletes
-- the privacy request itself.
alter table public.privacy_requests drop constraint if exists privacy_requests_reviewer_user_id_fkey;
alter table public.privacy_requests
  add constraint privacy_requests_reviewer_user_id_fkey
  foreign key (reviewer_user_id) references auth.users(id) on delete set null;

-- An older staged workflow called the member-authored note `description`. Preserve only
-- the reviewed 500-character member note.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='privacy_requests' and column_name='description'
  ) then
    execute $sql$
      update public.privacy_requests
      set member_note = left(coalesce(nullif(member_note, ''), description), 500)
      where description is not null and description <> ''
    $sql$;
  end if;
end;
$$;

-- Normalize older spelling/statuses. Historical `completed` in this staged queue meant
-- staff review was finished, not that an export/deletion actually occurred. Reclassify it
-- as awaiting fulfillment rather than carrying a false fulfillment claim forward.
alter table public.privacy_requests drop constraint if exists privacy_requests_status_check;
update public.privacy_requests set status='canceled' where status='cancelled';
update public.privacy_requests set status='declined' where status='rejected';
update public.privacy_requests set status='awaiting_fulfillment' where status='completed';

-- Preserve legacy decision timing, then retire the misleading `completed_at` field.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='privacy_requests' and column_name='completed_at'
  ) then
    execute $sql$
      update public.privacy_requests
      set decision_at = coalesce(decision_at, completed_at)
      where completed_at is not null
    $sql$;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='privacy_requests' and column_name='cancelled_at'
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
alter table public.privacy_requests drop column if exists completed_at;
alter table public.privacy_requests drop column if exists cancelled_at;

alter table public.privacy_requests drop constraint if exists privacy_requests_request_type_check;
alter table public.privacy_requests
  add constraint privacy_requests_request_type_check
  check (request_type in ('data_export','account_deletion','data_correction')) not valid;
alter table public.privacy_requests validate constraint privacy_requests_request_type_check;

alter table public.privacy_requests
  add constraint privacy_requests_status_check
  check (status in ('submitted','in_review','awaiting_fulfillment','declined','canceled')) not valid;
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

-- A request accepted for future fulfillment remains active: the member must not be able to
-- create duplicates merely because review has finished while fulfillment is still pending.
drop index if exists public.privacy_requests_one_active_type_per_member;
drop index if exists public.privacy_requests_one_active_type_per_user;
create unique index privacy_requests_one_active_type_per_user
  on public.privacy_requests(user_id, request_type)
  where status in ('submitted','in_review','awaiting_fulfillment');

create index if not exists privacy_requests_user_created_idx
  on public.privacy_requests(user_id, created_at desc);
drop index if exists public.privacy_requests_queue_idx;
create index privacy_requests_queue_idx
  on public.privacy_requests(status, created_at)
  where status in ('submitted','in_review','awaiting_fulfillment');

create table if not exists public.privacy_request_audit (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.privacy_requests(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  created_at timestamptz not null default now()
);

-- Preserve audit rows if an actor account is later deleted.
alter table public.privacy_request_audit drop constraint if exists privacy_request_audit_actor_user_id_fkey;
alter table public.privacy_request_audit alter column actor_user_id drop not null;
alter table public.privacy_request_audit
  add constraint privacy_request_audit_actor_user_id_fkey
  foreign key (actor_user_id) references auth.users(id) on delete set null;

alter table public.privacy_request_audit drop constraint if exists privacy_request_audit_action_check;
update public.privacy_request_audit
set action='staff_accepted_for_fulfillment'
where action='staff_completed';
alter table public.privacy_request_audit
  add constraint privacy_request_audit_action_check
  check (action in ('submitted','member_cancelled','staff_started','staff_accepted_for_fulfillment','staff_rejected','staff_reopened')) not valid;
alter table public.privacy_request_audit validate constraint privacy_request_audit_action_check;

create index if not exists privacy_request_audit_request_idx
  on public.privacy_request_audit(request_id, created_at);

-- Browser clients never access either queue directly. Authenticated Edge Functions validate
-- the caller and use service-role access to return deliberately shaped records.
alter table public.privacy_requests enable row level security;
alter table public.privacy_request_audit enable row level security;
revoke all on table public.privacy_requests from public, anon, authenticated;
revoke all on table public.privacy_request_audit from public, anon, authenticated;
grant all on table public.privacy_requests to service_role;
grant all on table public.privacy_request_audit to service_role;
drop policy if exists "privacy_requests_select_own" on public.privacy_requests;

create or replace function o2ol_private.set_privacy_request_updated_at()
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
revoke all on function o2ol_private.set_privacy_request_updated_at() from public, anon, authenticated;

drop function if exists public.set_privacy_request_updated_at() cascade;
create trigger privacy_requests_updated_at
before update on public.privacy_requests
for each row execute function o2ol_private.set_privacy_request_updated_at();

-- Enforce lifecycle invariants in the database even if a future server handler regresses.
create or replace function o2ol_private.enforce_privacy_request_state_integrity()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op='INSERT' then
    if new.status <> 'submitted'
      or new.staff_response is not null
      or new.reviewer_user_id is not null
      or new.reviewed_at is not null
      or new.decision_at is not null
      or new.canceled_at is not null then
      raise exception using errcode='P0001', message='PRIVACY_REQUEST_INVALID_INITIAL_STATE';
    end if;
    return new;
  end if;

  if new.user_id is distinct from old.user_id
    or new.request_type is distinct from old.request_type
    or new.member_note is distinct from old.member_note
    or new.created_at is distinct from old.created_at then
    raise exception using errcode='P0001', message='PRIVACY_REQUEST_MEMBER_CONTENT_IMMUTABLE';
  end if;

  if new.status is distinct from old.status then
    if not (
      (old.status='submitted' and new.status in ('in_review','declined','canceled'))
      or (old.status='in_review' and new.status in ('awaiting_fulfillment','declined'))
      or (old.status in ('awaiting_fulfillment','declined') and new.status='in_review')
    ) then
      raise exception using errcode='P0001', message='PRIVACY_REQUEST_INVALID_STATUS_TRANSITION';
    end if;
  end if;

  if new.status='canceled' and new.canceled_at is null then
    raise exception using errcode='P0001', message='PRIVACY_REQUEST_CANCELED_AT_REQUIRED';
  end if;
  if new.status<>'canceled' and new.canceled_at is not null then
    raise exception using errcode='P0001', message='PRIVACY_REQUEST_CANCELED_AT_NOT_ALLOWED';
  end if;

  if new.status in ('in_review','awaiting_fulfillment','declined') then
    if new.reviewer_user_id is null or new.reviewed_at is null then
      raise exception using errcode='P0001', message='PRIVACY_REQUEST_REVIEW_METADATA_REQUIRED';
    end if;
  end if;

  if new.status in ('awaiting_fulfillment','declined') then
    if new.decision_at is null or char_length(coalesce(new.staff_response,'')) < 3 then
      raise exception using errcode='P0001', message='PRIVACY_REQUEST_DECISION_METADATA_REQUIRED';
    end if;
  elsif new.decision_at is not null then
    raise exception using errcode='P0001', message='PRIVACY_REQUEST_DECISION_AT_NOT_ALLOWED';
  end if;

  return new;
end;
$$;
revoke all on function o2ol_private.enforce_privacy_request_state_integrity() from public, anon, authenticated;

drop function if exists public.enforce_privacy_request_state_integrity() cascade;
create trigger privacy_requests_state_integrity
before insert or update on public.privacy_requests
for each row execute function o2ol_private.enforce_privacy_request_state_integrity();

-- Audit is database-atomic with the queue mutation. Edge Functions must never perform a
-- second best-effort audit insert after changing status.
create or replace function o2ol_private.audit_privacy_request_state()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  audit_action text;
  audit_actor uuid;
begin
  if tg_op='INSERT' then
    insert into public.privacy_request_audit(request_id, actor_user_id, action)
    values (new.id, new.user_id, 'submitted');
    return new;
  end if;

  if new.status is not distinct from old.status then return new; end if;

  if new.status='in_review' then
    audit_action := case when old.status='submitted' then 'staff_started' else 'staff_reopened' end;
    audit_actor := new.reviewer_user_id;
  elsif new.status='awaiting_fulfillment' then
    audit_action := 'staff_accepted_for_fulfillment';
    audit_actor := new.reviewer_user_id;
  elsif new.status='declined' then
    audit_action := 'staff_rejected';
    audit_actor := new.reviewer_user_id;
  elsif new.status='canceled' then
    audit_action := 'member_cancelled';
    audit_actor := new.user_id;
  else
    return new;
  end if;

  insert into public.privacy_request_audit(request_id, actor_user_id, action)
  values (new.id, audit_actor, audit_action);
  return new;
end;
$$;
revoke all on function o2ol_private.audit_privacy_request_state() from public, anon, authenticated;

create trigger privacy_requests_audit_state
after insert or update of status on public.privacy_requests
for each row execute function o2ol_private.audit_privacy_request_state();

comment on table public.privacy_requests is
  'Private service-managed queue for member privacy requests. Review may accept a request for future fulfillment but never performs or claims export/deletion itself.';
comment on table public.privacy_request_audit is
  'Service-only, database-atomic audit trail for privacy-request intake/review lifecycle actions.';

commit;

-- CONTROLLED-TEST CHECKLIST BEFORE ANY PRODUCTION APPROVAL
-- 1. anon/authenticated have zero direct table privileges on queue and audit.
-- 2. privacy-request Edge Function is the only member intake/history path.
-- 3. member intake exposes only data_export/account_deletion.
-- 4. duplicate submitted/in_review/awaiting_fulfillment requests fail closed.
-- 5. member-authored user_id/type/note/created_at cannot change after insert.
-- 6. invalid status/timestamp/reviewer combinations are rejected by the trigger.
-- 7. staff acceptance produces awaiting_fulfillment, never completed/fulfilled.
-- 8. every status transition and its audit event commit atomically in one database write.
-- 9. manage-privacy-requests uses a server-side UUID allowlist and never returns user_id/reviewer_user_id.
-- 10. no function/migration here uses auth-admin APIs, deletes auth users, exports data,
--     sends communications, changes billing, or claims that fulfillment occurred.
