-- One2OneLove support-request audit integrity reconciliation.
-- DEVELOPMENT MIGRATION ONLY. Do not apply to production without explicit approval.
--
-- Goals:
--   * support state change + audit event commit atomically in one database transaction;
--   * audit history survives later deletion of the actor Auth account;
--   * browser members never receive server-only actor metadata;
--   * the existing support lifecycle, quota, response-read and in-app-only design remains.

begin;

create schema if not exists o2ol_private;
revoke all on schema o2ol_private from public, anon, authenticated;

-- Server-only metadata used by the atomic audit trigger. It is intentionally omitted from
-- authenticated column grants and from every member/staff response projection.
alter table public.support_requests
  add column if not exists last_actor_user_id uuid null,
  add column if not exists last_actor_kind text null;

alter table public.support_requests drop constraint if exists support_requests_last_actor_user_id_fkey;
alter table public.support_requests
  add constraint support_requests_last_actor_user_id_fkey
  foreign key (last_actor_user_id) references auth.users(id) on delete set null;

alter table public.support_requests drop constraint if exists support_requests_last_actor_kind_check;
alter table public.support_requests
  add constraint support_requests_last_actor_kind_check
  check (last_actor_kind is null or last_actor_kind in ('member','staff'));

-- Preserve audit history even if a member/staff Auth account is later deleted.
alter table public.support_request_audit drop constraint if exists support_request_audit_actor_user_id_fkey;
alter table public.support_request_audit alter column actor_user_id drop not null;
alter table public.support_request_audit
  add constraint support_request_audit_actor_user_id_fkey
  foreign key (actor_user_id) references auth.users(id) on delete set null;

-- Member browser reads remain own-row RLS, but only reviewed member-safe columns are
-- selectable. Hidden last_actor_* metadata cannot be fetched directly via the Data API.
revoke select on table public.support_requests from authenticated;
grant select (
  id,
  user_id,
  category,
  subject,
  message,
  status,
  staff_response,
  responded_at,
  member_response_read_at,
  closed_at,
  created_at,
  updated_at
) on table public.support_requests to authenticated;

-- Move the historical updated_at helper out of the public schema.
create or replace function o2ol_private.set_support_request_updated_at()
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
revoke all on function o2ol_private.set_support_request_updated_at() from public, anon, authenticated;

drop trigger if exists support_requests_updated_at on public.support_requests;
create trigger support_requests_updated_at
before update on public.support_requests
for each row execute function o2ol_private.set_support_request_updated_at();
drop function if exists public.set_support_request_updated_at();

-- Validate that workflow mutations always identify the trusted actor in the same row
-- write. Member-originated workflow actions are additionally bound to that request owner.
create or replace function o2ol_private.enforce_support_request_audit_actor()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  workflow_changed boolean;
begin
  if tg_op='INSERT' then
    if new.last_actor_kind <> 'member'
      or new.last_actor_user_id is null
      or new.last_actor_user_id <> new.user_id then
      raise exception using errcode='P0001', message='SUPPORT_REQUEST_CREATE_ACTOR_INVALID';
    end if;
    return new;
  end if;

  workflow_changed :=
    new.status is distinct from old.status
    or new.staff_response is distinct from old.staff_response
    or new.responded_at is distinct from old.responded_at
    or new.closed_at is distinct from old.closed_at;

  if not workflow_changed then return new; end if;

  if new.last_actor_user_id is null or new.last_actor_kind is null then
    raise exception using errcode='P0001', message='SUPPORT_REQUEST_AUDIT_ACTOR_REQUIRED';
  end if;

  if new.last_actor_kind='member' then
    if new.last_actor_user_id <> new.user_id then
      raise exception using errcode='P0001', message='SUPPORT_REQUEST_MEMBER_ACTOR_MISMATCH';
    end if;
    if new.staff_response is distinct from old.staff_response
      or new.responded_at is distinct from old.responded_at
      or not (new.status='closed' and old.status in ('open','in_progress','resolved')) then
      raise exception using errcode='P0001', message='SUPPORT_REQUEST_MEMBER_WORKFLOW_FORBIDDEN';
    end if;
  end if;

  return new;
end;
$$;
revoke all on function o2ol_private.enforce_support_request_audit_actor() from public, anon, authenticated;

drop trigger if exists support_requests_audit_actor_guard on public.support_requests;
create trigger support_requests_audit_actor_guard
before insert or update of status, staff_response, responded_at, closed_at, last_actor_user_id, last_actor_kind
on public.support_requests
for each row execute function o2ol_private.enforce_support_request_audit_actor();

-- One database-owned lifecycle audit. Edge Functions must not perform follow-up audit
-- inserts. An exception here rolls back the support row mutation too.
create or replace function o2ol_private.audit_support_request_lifecycle()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  audit_action text;
begin
  if tg_op='INSERT' then
    insert into public.support_request_audit(request_id, actor_user_id, action)
    values (new.id, new.last_actor_user_id, 'created');
    return new;
  end if;

  if new.status is distinct from old.status then
    if new.status='in_progress' then
      audit_action := case
        when old.status in ('resolved','closed') then 'staff_reopened'
        else 'staff_started'
      end;
    elsif new.status='resolved' then
      audit_action := 'staff_resolved';
    elsif new.status='closed' then
      audit_action := case when new.last_actor_kind='member' then 'member_closed' else 'staff_closed' end;
    end if;
  elsif new.status='resolved'
    and (new.staff_response is distinct from old.staff_response
         or new.responded_at is distinct from old.responded_at) then
    audit_action := 'staff_resolved';
  end if;

  if audit_action is not null then
    insert into public.support_request_audit(request_id, actor_user_id, action)
    values (new.id, new.last_actor_user_id, audit_action);
  end if;

  return new;
end;
$$;
revoke all on function o2ol_private.audit_support_request_lifecycle() from public, anon, authenticated;

drop trigger if exists support_requests_audit_lifecycle on public.support_requests;
create trigger support_requests_audit_lifecycle
after insert or update of status, staff_response, responded_at, closed_at
on public.support_requests
for each row execute function o2ol_private.audit_support_request_lifecycle();

comment on column public.support_requests.last_actor_user_id is
  'Server-only actor metadata for atomic support audit events. Not granted to authenticated browser reads.';
comment on column public.support_requests.last_actor_kind is
  'Server-only member/staff actor classification for atomic support audit events. Not granted to authenticated browser reads.';
comment on function o2ol_private.audit_support_request_lifecycle() is
  'Database-atomic audit writer for support create/close/staff lifecycle actions. Edge Functions must not duplicate audit inserts.';

commit;

-- CONTROLLED-TEST CHECKLIST BEFORE ANY PRODUCTION APPROVAL
-- 1. Authenticated member can SELECT own safe support columns but cannot select last_actor_*.
-- 2. Browser roles still have no INSERT/UPDATE/DELETE on support_requests or any access to audit.
-- 3. One create produces exactly one `created` audit event atomically.
-- 4. Member close produces exactly one `member_closed`; member cannot mutate staff response.
-- 5. Staff start/respond/close/reopen each produce exactly one matching audit event.
-- 6. Updating a resolved staff response produces one new `staff_resolved` event.
-- 7. Failed audit insertion rolls back the request mutation.
-- 8. Deleting an actor Auth account sets audit actor_user_id null but preserves audit rows.
-- 9. Quota and response-read triggers continue to work unchanged.
-- 10. No email/SMS/push/provider delivery is introduced.
