-- One2OneLove relaunch: make privacy-request submission auditing database-owned.
-- DEVELOPMENT MIGRATION ONLY. Do not apply to production without explicit approval.
--
-- This records the creation of a privacy request. It does not export data, delete users,
-- modify billing, send communications, or perform any privacy-request fulfillment action.

begin;

create or replace function public.audit_privacy_request_submission()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.privacy_request_audit (
    request_id,
    actor_user_id,
    action
  ) values (
    new.id,
    new.user_id,
    'submitted'
  );

  return new;
end;
$$;

revoke all on function public.audit_privacy_request_submission() from public, anon, authenticated;

drop trigger if exists privacy_requests_audit_submission on public.privacy_requests;
create trigger privacy_requests_audit_submission
after insert on public.privacy_requests
for each row execute function public.audit_privacy_request_submission();

comment on function public.audit_privacy_request_submission() is
  'Writes the service-only submitted audit event for each newly recorded privacy request.';

commit;

-- CONTROLLED-TEST CHECKLIST BEFORE ANY PRODUCTION APPROVAL
-- 1. Insert one controlled request through the member Edge Function.
-- 2. Verify exactly one matching audit row exists with action=submitted.
-- 3. Verify anon/authenticated still cannot read privacy_request_audit directly.
-- 4. Verify duplicate active request handling does not manufacture a second submitted audit event.
-- 5. Verify no destructive fulfillment action occurs.
