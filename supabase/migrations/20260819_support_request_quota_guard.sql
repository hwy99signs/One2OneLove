-- One2OneLove support-request concurrency guard.
-- DEVELOPMENT MIGRATION ONLY. Do not apply to live Supabase until explicitly approved.
-- Depends on 20260819_support_requests.sql.
--
-- The member endpoint already checks a five-open-request ceiling. This trigger is the
-- database backstop so simultaneous requests cannot race through the application check.

begin;

create or replace function public.enforce_member_support_open_request_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  open_count integer;
  lock_key bigint;
begin
  if new.status not in ('open','in_progress') then
    return new;
  end if;

  -- Serialize quota-relevant changes for one member within the current transaction.
  lock_key := hashtextextended('o2ol-support-open:' || new.user_id::text, 0);
  perform pg_advisory_xact_lock(lock_key);

  select count(*)
    into open_count
  from public.support_requests
  where user_id = new.user_id
    and status in ('open','in_progress')
    and id <> new.id;

  if open_count >= 5 then
    raise exception using
      errcode = 'P0001',
      message = 'SUPPORT_OPEN_REQUEST_LIMIT_REACHED';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_member_support_open_request_limit() from public, anon, authenticated;

drop trigger if exists support_requests_open_quota_guard on public.support_requests;
create trigger support_requests_open_quota_guard
before insert or update of user_id, status
on public.support_requests
for each row
execute function public.enforce_member_support_open_request_limit();

comment on function public.enforce_member_support_open_request_limit() is
  'Database concurrency backstop: a member may have at most five support requests in open/in_progress state.';

commit;

-- PRE-APPLY CHECKLIST
-- 1. Apply only after 20260819_support_requests.sql.
-- 2. Verify five open/in_progress requests succeed and a sixth fails.
-- 3. Verify two concurrent attempts at the ceiling cannot both succeed.
-- 4. Verify resolved/closed requests do not count against the ceiling.
-- 5. Verify resolving/closing one request frees one open slot.
-- 6. Verify staff reopen to in_progress also respects the same five-open ceiling.
