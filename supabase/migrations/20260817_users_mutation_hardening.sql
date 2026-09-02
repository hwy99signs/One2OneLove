-- One2OneLove relaunch: users-table self-service mutation hardening
-- DEVELOPMENT MIGRATION ONLY. Apply to production only through an approved batch.
--
-- Goals:
--   * A browser cannot self-create a privileged therapist/influencer/professional row.
--   * Regular profile creation derives account identity/email from Supabase Auth.
--   * Authenticated members may edit only ordinary profile fields on their own row.
--   * Account role, verification, activation, subscription/billing and unknown future
--     columns are protected from browser-supplied updates by default.

begin;

alter table public.users enable row level security;

-- ---------------------------------------------------------------------------
-- Safe regular-member profile bootstrap
-- ---------------------------------------------------------------------------

create or replace function public.ensure_own_regular_profile(
  p_name text default null,
  p_relationship_status text default null,
  p_anniversary_date date default null,
  p_partner_email text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user auth.users%rowtype;
  v_name text;
  v_relationship_status text;
  v_partner_email text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into v_user
  from auth.users
  where id = auth.uid();

  if v_user.id is null then
    raise exception 'Authenticated account not found';
  end if;

  if v_user.email_confirmed_at is null then
    raise exception 'Confirm your email before creating a member profile';
  end if;

  v_name := left(coalesce(nullif(btrim(p_name), ''), nullif(btrim(v_user.raw_user_meta_data ->> 'name'), ''), 'Member'), 120);

  v_relationship_status := case
    when p_relationship_status in ('single', 'dating', 'engaged', 'married', 'complicated')
      then p_relationship_status
    else null
  end;

  v_partner_email := nullif(left(btrim(coalesce(p_partner_email, '')), 320), '');

  insert into public.users (
    id,
    email,
    name,
    user_type,
    relationship_status,
    anniversary_date,
    partner_email,
    created_at,
    updated_at
  )
  values (
    v_user.id,
    v_user.email,
    v_name,
    'regular',
    v_relationship_status,
    p_anniversary_date,
    v_partner_email,
    now(),
    now()
  )
  on conflict (id) do nothing;

  return v_user.id;
end;
$$;

revoke all on function public.ensure_own_regular_profile(text, text, date, text) from public;
revoke all on function public.ensure_own_regular_profile(text, text, date, text) from anon;
grant execute on function public.ensure_own_regular_profile(text, text, date, text) to authenticated;

-- Direct browser INSERT is no longer needed. Trusted service/admin paths can still
-- create reviewed professional accounts with service_role.
revoke insert on table public.users from anon, authenticated;
drop policy if exists "Users can insert own profile" on public.users;

-- Profile deletion requires a deliberate account-deletion workflow rather than a raw
-- browser table DELETE.
revoke delete on table public.users from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Default-deny field boundary for browser UPDATEs
-- ---------------------------------------------------------------------------

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
    'partner_email',
    'avatar_url',
    'bio',
    'location',
    'love_language',
    'date_frequency',
    'communication_style',
    'conflict_resolution',
    'partner_name',
    'interests',
    'updated_at'
  ];
begin
  -- SQL-editor/internal maintenance and service_role writes are trusted. Browser
  -- authenticated/anonymous requests are subject to the strict boundary below.
  if v_role is null or v_role = 'service_role' then
    return new;
  end if;

  if v_role <> 'authenticated' or auth.uid() is null then
    raise exception 'Authenticated member access required';
  end if;

  if auth.uid() <> old.id or new.id is distinct from old.id then
    raise exception 'Members may update only their own profile';
  end if;

  -- Compare every column except the explicit self-service allowlist. This protects
  -- known privileged fields and future columns by default without assuming the exact
  -- production schema. This trigger name sorts before legacy profile-completion
  -- BEFORE triggers, so computed fields may still be updated by trusted database code
  -- later in the same row operation.
  if (to_jsonb(new) - v_safe_fields) is distinct from (to_jsonb(old) - v_safe_fields) then
    raise exception 'One or more protected account fields cannot be changed from the browser';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_users_self_service_update() from public;

drop trigger if exists aaa_enforce_users_self_service_update on public.users;
create trigger aaa_enforce_users_self_service_update
before update on public.users
for each row execute function public.enforce_users_self_service_update();

-- Normalize the own-row UPDATE policy. The trigger above supplies field-level control.
drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
on public.users
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

grant update on table public.users to authenticated;

comment on function public.ensure_own_regular_profile(text, text, date, text) is
  'Creates only the authenticated confirmed user own regular profile; identity/email/role are server-derived.';
comment on function public.enforce_users_self_service_update() is
  'Default-deny browser field boundary for public.users. Only ordinary self-service profile fields may change.';

commit;

-- PRE-APPLY ORDER / TESTS
-- 1. Deploy frontend/AuthContext code that uses ensure_own_regular_profile before this migration.
-- 2. Confirm a confirmed new regular member can create/load exactly one own profile.
-- 3. Confirm direct browser INSERT into public.users fails.
-- 4. Confirm ordinary profile fields still update and profile-completion triggers run.
-- 5. Confirm browser attempts to change user_type, email, verification, activation,
--    subscription/billing, created_at, completion counters or unknown columns fail.
-- 6. Confirm service_role can still create/update reviewed professional/member records.
