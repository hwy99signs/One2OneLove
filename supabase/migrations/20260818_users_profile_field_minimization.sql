-- One2OneLove relaunch: minimize browser-editable public.users profile fields
-- DEVELOPMENT MIGRATION ONLY. Add to Approval Batch 002 before production use.
--
-- This intentionally narrows the broader Batch 001 self-service allowlist. The relaunch
-- Profile directly edits only seven ordinary fields. Avatar assignment, partner email,
-- interests and legacy preference fields are not generic browser mutations.
--
-- Existing stored values are preserved. This migration changes only what a browser can
-- mutate going forward; trusted service/admin maintenance remains possible.

begin;

create or replace function public.enforce_users_self_service_update()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_role text := auth.role();
  v_safe_fields text[] := array[
    'name',
    'relationship_status',
    'anniversary_date',
    'bio',
    'location',
    'love_language',
    'partner_name',
    'updated_at'
  ];
begin
  if v_role is null or v_role = 'service_role' then
    return new;
  end if;

  if v_role <> 'authenticated' or auth.uid() is null then
    raise exception 'Authenticated member access required';
  end if;

  if auth.uid() <> old.id or new.id is distinct from old.id then
    raise exception 'Members may update only their own profile';
  end if;

  if (to_jsonb(new) - v_safe_fields) is distinct from (to_jsonb(old) - v_safe_fields) then
    raise exception 'One or more protected account fields cannot be changed from the browser';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_users_self_service_update() from public;

-- Recreate only if a project drift removed the expected trigger.
drop trigger if exists aaa_enforce_users_self_service_update on public.users;
create trigger aaa_enforce_users_self_service_update
before update on public.users
for each row execute function public.enforce_users_self_service_update();

comment on function public.enforce_users_self_service_update() is
  'Relaunch-minimized default-deny browser boundary for public.users. Generic self-service changes are limited to the seven reviewed Profile fields plus updated_at; avatar URL and legacy profile fields require dedicated reviewed flows.';

commit;

-- CONTROLLED TESTS
-- 1. Member can edit own name/bio/location/relationship status/anniversary/love language/partner name.
-- 2. Member cannot change id/email/user_type/is_active/verification/subscription/billing fields.
-- 3. Member cannot directly set avatar_url to an arbitrary external URL.
-- 4. Member cannot directly modify partner_email/interests/date_frequency/communication_style/conflict_resolution.
-- 5. Trusted service_role maintenance remains possible.
-- 6. Existing profile completion/database triggers continue to function as expected.
