-- One2OneLove relaunch: finalize privacy-request audit ownership.
-- DEVELOPMENT MIGRATION ONLY. Do not apply to production without explicit approval.
--
-- The final workflow reconciliation owns ALL lifecycle audit events through the single
-- `privacy_requests_audit_state` trigger. This later migration removes the historical
-- submission-only trigger/function so fresh migration order cannot create duplicate
-- `submitted` audit rows. It performs no fulfillment action.

begin;

-- Retire the older standalone submission audit path if it exists in a staged environment.
drop trigger if exists privacy_requests_audit_submission on public.privacy_requests;
drop function if exists public.audit_privacy_request_submission();

-- Fail closed if the final atomic lifecycle audit trigger from the reconciliation
-- migration is missing. Do not silently recreate a partial audit model here.
do $$
begin
  if not exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid=t.tgrelid
    join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public'
      and c.relname='privacy_requests'
      and t.tgname='privacy_requests_audit_state'
      and not t.tgisinternal
  ) then
    raise exception 'O2OL_PRIVACY_ATOMIC_AUDIT_TRIGGER_MISSING';
  end if;

  if to_regprocedure('o2ol_private.audit_privacy_request_state()') is null then
    raise exception 'O2OL_PRIVACY_ATOMIC_AUDIT_FUNCTION_MISSING';
  end if;
end;
$$;

comment on trigger privacy_requests_audit_state on public.privacy_requests is
  'Single database-atomic audit trigger for privacy request submission and staff/member state transitions.';

commit;

-- CONTROLLED-TEST CHECKLIST BEFORE ANY PRODUCTION APPROVAL
-- 1. Exactly one non-internal privacy audit trigger exists: privacy_requests_audit_state.
-- 2. Inserting one controlled request produces exactly one action=submitted audit row.
-- 3. Staff start/accept/decline/reopen each produce exactly one audit row atomically.
-- 4. anon/authenticated cannot read privacy_request_audit directly.
-- 5. No public audit trigger helper remains callable.
-- 6. No destructive fulfillment action occurs.
