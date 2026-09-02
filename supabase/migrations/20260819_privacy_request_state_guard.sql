-- One2OneLove privacy-request state/content integrity guard.
-- DEVELOPMENT MIGRATION ONLY. Do not apply to live Supabase until explicitly approved.
-- Depends on 20260819_privacy_requests.sql.

begin;

create or replace function public.enforce_privacy_request_state_integrity()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'UPDATE' then
    if new.user_id is distinct from old.user_id
      or new.request_type is distinct from old.request_type
      or new.description is distinct from old.description then
      raise exception using
        errcode = 'P0001',
        message = 'PRIVACY_REQUEST_MEMBER_CONTENT_IMMUTABLE';
    end if;

    if new.status is distinct from old.status then
      if not (
        (old.status = 'submitted' and new.status in ('in_review','completed','cancelled','rejected'))
        or (old.status = 'in_review' and new.status in ('completed','rejected'))
        or (old.status in ('completed','rejected') and new.status = 'in_review')
      ) then
        raise exception using
          errcode = 'P0001',
          message = 'PRIVACY_REQUEST_INVALID_STATUS_TRANSITION';
      end if;
    end if;
  end if;

  if new.status = 'cancelled' and new.cancelled_at is null then
    raise exception using errcode = 'P0001', message = 'PRIVACY_REQUEST_CANCELLED_AT_REQUIRED';
  end if;
  if new.status <> 'cancelled' and new.cancelled_at is not null then
    raise exception using errcode = 'P0001', message = 'PRIVACY_REQUEST_CANCELLED_AT_NOT_ALLOWED';
  end if;

  if new.status = 'completed' and new.completed_at is null then
    raise exception using errcode = 'P0001', message = 'PRIVACY_REQUEST_COMPLETED_AT_REQUIRED';
  end if;
  if new.status <> 'completed' and new.completed_at is not null then
    raise exception using errcode = 'P0001', message = 'PRIVACY_REQUEST_COMPLETED_AT_NOT_ALLOWED';
  end if;

  if new.status in ('in_review','completed','rejected') and new.reviewed_at is null then
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

comment on function public.enforce_privacy_request_state_integrity() is
  'Locks member-authored privacy request content and enforces non-destructive request lifecycle consistency.';

commit;

-- PRE-APPLY CHECKLIST
-- 1. Apply after 20260819_privacy_requests.sql.
-- 2. Verify member-authored ownership/type/description cannot change after submission.
-- 3. Verify submitted requests can be cancelled only through the reviewed member action.
-- 4. Verify reviewed/completed/rejected transitions require reviewed_at.
-- 5. Verify completed_at exists only for completed status and cancelled_at only for cancelled.
-- 6. Verify no trigger/function deletes auth users or performs data export/correction.
