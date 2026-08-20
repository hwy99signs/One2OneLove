-- One2OneLove support-request state/content integrity guard.
-- DEVELOPMENT MIGRATION ONLY. Do not apply to live Supabase until explicitly approved.
-- Depends on 20260819_support_requests.sql.
--
-- The original member-authored issue is immutable after creation. Staff/member actions
-- may change workflow status, staff_response and workflow timestamps only through the
-- backend paths, and the database rejects invalid lifecycle transitions.

begin;

create or replace function public.enforce_support_request_state_integrity()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'UPDATE' then
    if new.user_id is distinct from old.user_id
      or new.category is distinct from old.category
      or new.subject is distinct from old.subject
      or new.message is distinct from old.message then
      raise exception using
        errcode = 'P0001',
        message = 'SUPPORT_REQUEST_MEMBER_CONTENT_IMMUTABLE';
    end if;

    if new.status is distinct from old.status then
      if not (
        (old.status = 'open' and new.status in ('in_progress','resolved','closed'))
        or (old.status = 'in_progress' and new.status in ('resolved','closed'))
        or (old.status = 'resolved' and new.status in ('in_progress','closed'))
        or (old.status = 'closed' and new.status = 'in_progress')
      ) then
        raise exception using
          errcode = 'P0001',
          message = 'SUPPORT_REQUEST_INVALID_STATUS_TRANSITION';
      end if;
    end if;
  end if;

  if new.status = 'closed' and new.closed_at is null then
    raise exception using
      errcode = 'P0001',
      message = 'SUPPORT_REQUEST_CLOSED_AT_REQUIRED';
  end if;

  if new.status <> 'closed' and new.closed_at is not null then
    raise exception using
      errcode = 'P0001',
      message = 'SUPPORT_REQUEST_CLOSED_AT_NOT_ALLOWED';
  end if;

  if new.staff_response is not null and new.responded_at is null then
    raise exception using
      errcode = 'P0001',
      message = 'SUPPORT_REQUEST_RESPONDED_AT_REQUIRED';
  end if;

  if new.responded_at is not null and new.staff_response is null then
    raise exception using
      errcode = 'P0001',
      message = 'SUPPORT_REQUEST_RESPONSE_REQUIRED';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_support_request_state_integrity() from public, anon, authenticated;

drop trigger if exists support_requests_state_integrity on public.support_requests;
create trigger support_requests_state_integrity
before insert or update on public.support_requests
for each row
execute function public.enforce_support_request_state_integrity();

comment on function public.enforce_support_request_state_integrity() is
  'Locks original member support content and validates support workflow status/timestamp consistency.';

commit;

-- PRE-APPLY CHECKLIST
-- 1. Apply after 20260819_support_requests.sql.
-- 2. Verify member-authored user/category/subject/message fields cannot change after creation.
-- 3. Verify reviewed status transitions succeed and invalid jumps fail.
-- 4. Verify closed rows require closed_at and non-closed rows reject closed_at.
-- 5. Verify staff_response/responded_at must appear together.
-- 6. Verify support Edge Functions still satisfy every database invariant.
