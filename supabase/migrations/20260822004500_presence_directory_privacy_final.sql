-- One2OneLove Approval #8C — canonical final presence + member-directory privacy state.
-- DEVELOPMENT MIGRATION ONLY. DO NOT APPLY TO PRODUCTION without explicit Approval #8C.
--
-- This file supersedes the historical multi-step #8C development reconciliation as the
-- preferred production apply candidate. It is intentionally idempotent against the
-- audited legacy objects while converging directly to the final privacy contract:
--   * only active regular accounts are discoverable;
--   * directory source/view expose exactly id/name/avatar_url/bio/created_at;
--   * presence never exposes email or SQL-generated localized prose;
--   * other members can read presence only for accounts visible through the directory;
--   * own presence remains readable/writable even if the account is not discoverable;
--   * presence writes are caller-bound and browser direct DML stays blocked;
--   * public RPCs are SECURITY INVOKER; privileged helpers remain in o2ol_private;
--   * existing restrictive member-blocking policies, when present, continue to compose.

begin;

-- Fail before mutation if the audited production prerequisites drifted materially.
do $$
begin
  if to_regclass('public.users') is null then
    raise exception 'O2OL_8C_USERS_TABLE_MISSING';
  end if;
  if to_regclass('public.user_presence') is null then
    raise exception 'O2OL_8C_PRESENCE_TABLE_MISSING';
  end if;
end $$;

create schema if not exists o2ol_private;
revoke all on schema o2ol_private from public, anon;
grant usage on schema o2ol_private to authenticated;

-- Drop only the projections that depend on the synchronized source. They are recreated
-- in this same transaction, so a failure rolls the whole migration back.
drop view if exists public.user_presence_view;
drop view if exists public.member_directory;

-- ---------------------------------------------------------------------------
-- Canonical minimal directory source
-- ---------------------------------------------------------------------------

create table if not exists public.user_directory_profiles (
  id uuid primary key references public.users(id) on delete cascade,
  name text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now()
);

alter table public.user_directory_profiles add column if not exists name text;
alter table public.user_directory_profiles add column if not exists avatar_url text;
alter table public.user_directory_profiles add column if not exists bio text;
alter table public.user_directory_profiles add column if not exists created_at timestamptz not null default now();

-- Remove historical fields that are not part of ordinary member discovery. The private
-- users table remains the account/profile source of truth for those values.
drop index if exists public.user_directory_profiles_user_type_idx;
alter table public.user_directory_profiles
  drop column if exists relationship_status,
  drop column if exists user_type,
  drop column if exists location,
  drop column if exists interests,
  drop column if exists updated_at,
  drop column if exists email,
  drop column if exists partner_email,
  drop column if exists verification_status,
  drop column if exists subscription_status;

create index if not exists user_directory_profiles_name_idx
  on public.user_directory_profiles(lower(name));

alter table public.user_directory_profiles enable row level security;
revoke all on table public.user_directory_profiles from public, anon, authenticated;
grant select on table public.user_directory_profiles to authenticated;

drop policy if exists "authenticated users can read directory profiles" on public.user_directory_profiles;
create policy "authenticated users can read directory profiles"
  on public.user_directory_profiles
  for select
  to authenticated
  using (true);

create or replace function o2ol_private.sync_user_directory_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(new.user_type, 'regular') <> 'regular'
     or coalesce(new.is_active, true) <> true then
    delete from public.user_directory_profiles where id = new.id;
    return new;
  end if;

  insert into public.user_directory_profiles(id, name, avatar_url, bio, created_at)
  values (new.id, new.name, new.avatar_url, new.bio, coalesce(new.created_at, now()))
  on conflict (id) do update set
    name = excluded.name,
    avatar_url = excluded.avatar_url,
    bio = excluded.bio;
  return new;
end;
$$;

revoke all on function o2ol_private.sync_user_directory_profile() from public, anon, authenticated;
drop function if exists public.sync_user_directory_profile() cascade;

drop trigger if exists sync_user_directory_profile on public.users;
create trigger sync_user_directory_profile
after insert or update of name, avatar_url, bio, user_type, is_active
on public.users
for each row execute function o2ol_private.sync_user_directory_profile();

-- Purge stale/non-eligible rows, then synchronize the complete active regular population.
delete from public.user_directory_profiles d
where not exists (
  select 1
  from public.users u
  where u.id = d.id
    and coalesce(u.user_type, 'regular') = 'regular'
    and coalesce(u.is_active, true) = true
);

insert into public.user_directory_profiles(id, name, avatar_url, bio, created_at)
select u.id, u.name, u.avatar_url, u.bio, coalesce(u.created_at, now())
from public.users u
where coalesce(u.user_type, 'regular') = 'regular'
  and coalesce(u.is_active, true) = true
on conflict (id) do update set
  name = excluded.name,
  avatar_url = excluded.avatar_url,
  bio = excluded.bio;

create view public.member_directory
with (security_barrier = true, security_invoker = true)
as
select d.id, d.name, d.avatar_url, d.bio, d.created_at
from public.user_directory_profiles d;

revoke all on public.member_directory from public, anon, authenticated;
grant select on public.member_directory to authenticated;

-- ---------------------------------------------------------------------------
-- Presence: discoverable-peer reads + caller-bound writes
-- ---------------------------------------------------------------------------

alter table public.user_presence enable row level security;
revoke all on table public.user_presence from public, anon, authenticated;
grant select on table public.user_presence to authenticated;

-- Remove historical broad/own-write policies. Restrictive policies from member-blocking
-- use different names and intentionally remain in place if that development batch has
-- already been applied in a test environment.
drop policy if exists "Anyone can view user presence" on public.user_presence;
drop policy if exists "Authenticated members can view presence" on public.user_presence;
drop policy if exists "Authenticated members can view discoverable presence" on public.user_presence;
drop policy if exists "Users can insert own presence" on public.user_presence;
drop policy if exists "Users can update own presence" on public.user_presence;
drop policy if exists "Users can delete own presence" on public.user_presence;

create policy "Authenticated members can view discoverable presence"
  on public.user_presence
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1
      from public.user_directory_profiles directory_member
      where directory_member.id = user_presence.user_id
    )
  );

create or replace function o2ol_private.write_user_presence(
  p_user_id uuid,
  p_status text,
  p_heartbeat boolean default false
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'O2OL_PRESENCE_AUTH_REQUIRED' using errcode = '42501';
  end if;
  if (select auth.uid()) <> p_user_id then
    raise exception 'O2OL_PRESENCE_OWN_ONLY' using errcode = '42501';
  end if;
  if p_status not in ('online', 'offline', 'away', 'busy') then
    raise exception 'O2OL_PRESENCE_STATUS_INVALID' using errcode = '22023';
  end if;

  if p_heartbeat then
    insert into public.user_presence(user_id, status, last_active, updated_at)
    values (p_user_id, 'online', now(), now())
    on conflict (user_id) do update set
      status = 'online', last_active = now(), updated_at = now();
  else
    insert into public.user_presence(user_id, status, last_seen, last_active, updated_at)
    values (p_user_id, p_status, now(), now(), now())
    on conflict (user_id) do update set
      status = excluded.status, last_seen = now(), last_active = now(), updated_at = now();
  end if;
end;
$$;

revoke all on function o2ol_private.write_user_presence(uuid, text, boolean) from public, anon;
grant execute on function o2ol_private.write_user_presence(uuid, text, boolean) to authenticated;

create or replace function public.update_user_presence(p_user_id uuid, p_status text default 'online')
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform o2ol_private.write_user_presence(p_user_id, p_status, false);
end;
$$;

create or replace function public.heartbeat_user_presence(p_user_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform o2ol_private.write_user_presence(p_user_id, 'online', true);
end;
$$;

-- Read RPCs join the minimal directory source. This prevents a known UUID from becoming
-- a side channel for a deactivated/non-regular account's presence. The caller's own row
-- remains readable through the base-table policy and the main client uses the safe view.
create or replace function public.get_user_presence(p_user_id uuid)
returns table(user_id uuid, status text, last_seen timestamptz, is_online boolean)
language sql
stable
security invoker
set search_path = ''
as $$
  select up.user_id, up.status, up.last_seen,
    (up.last_active > now() - interval '5 minutes' and up.status = 'online') as is_online
  from public.user_presence up
  join public.user_directory_profiles d on d.id = up.user_id
  where up.user_id = p_user_id;
$$;

create or replace function public.get_online_users_count()
returns bigint
language sql
stable
security invoker
set search_path = ''
as $$
  select count(*)
  from public.user_presence up
  join public.user_directory_profiles d on d.id = up.user_id
  where up.status = 'online'
    and up.last_active > now() - interval '5 minutes';
$$;

create or replace function public.get_online_users()
returns table(user_id uuid, status text, last_seen timestamptz)
language sql
stable
security invoker
set search_path = ''
as $$
  select up.user_id, up.status, up.last_seen
  from public.user_presence up
  join public.user_directory_profiles d on d.id = up.user_id
  where up.status = 'online'
    and up.last_active > now() - interval '5 minutes'
  order by up.last_active desc;
$$;

create or replace function public.cleanup_stale_presence()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.user_presence
  set status = 'offline', updated_at = now()
  where status = 'online'
    and last_active < now() - interval '5 minutes';
$$;

revoke all on function public.update_user_presence(uuid, text) from public, anon;
revoke all on function public.heartbeat_user_presence(uuid) from public, anon;
revoke all on function public.get_user_presence(uuid) from public, anon;
revoke all on function public.get_online_users_count() from public, anon;
revoke all on function public.get_online_users() from public, anon;
revoke all on function public.cleanup_stale_presence() from public, anon, authenticated;

grant execute on function public.update_user_presence(uuid, text) to authenticated;
grant execute on function public.heartbeat_user_presence(uuid) to authenticated;
grant execute on function public.get_user_presence(uuid) to authenticated;
grant execute on function public.get_online_users_count() to authenticated;
grant execute on function public.get_online_users() to authenticated;
grant execute on function public.cleanup_stale_presence() to service_role;

-- INNER JOIN is deliberate: a presence row for an inactive/non-regular account does not
-- become member-visible merely because legacy presence data still exists.
create view public.user_presence_view
with (security_barrier = true, security_invoker = true)
as
select
  up.user_id,
  up.status,
  up.last_seen,
  up.last_active,
  up.updated_at,
  md.name,
  md.avatar_url,
  (up.last_active > now() - interval '5 minutes' and up.status = 'online') as is_online
from public.user_presence up
join public.member_directory md on md.id = up.user_id;

revoke all on public.user_presence_view from public, anon, authenticated;
grant select on public.user_presence_view to authenticated;

comment on table public.user_directory_profiles is
  'Minimal synchronized source for active regular members only: id, display name, optional avatar, short bio and member-since date.';
comment on view public.member_directory is
  'Authenticated active regular-member discovery projection with exactly five safe fields.';
comment on table public.user_presence is
  'Neutral presence timestamps/status. Browser direct writes are blocked; peer reads are limited to discoverable members and any restrictive safety policies.';
comment on view public.user_presence_view is
  'Neutral authenticated presence projection for discoverable members only. No email and no SQL-generated localized prose.';

commit;

-- CONTROLLED TESTS BEFORE PRODUCTION APPROVAL #8C
-- 1. Snapshot user_presence row count before/after; existing rows are preserved.
-- 2. Active regular users count equals user_directory_profiles count after reconciliation.
-- 3. Inactive and non-regular accounts are absent from source/member_directory.
-- 4. Source/view expose exactly id/name/avatar_url/bio/created_at; email/location/
--    relationship/partner/role/verification/billing fields are absent.
-- 5. Anonymous access to directory/presence objects is denied.
-- 6. Authenticated browser direct INSERT/UPDATE/DELETE on user_presence is denied.
-- 7. update/heartbeat RPCs reject another user's UUID and accept the caller's UUID.
-- 8. user_presence_view contains neither email nor last_seen_text and excludes an
--    inactive/non-regular account even when a legacy presence row exists.
-- 9. get_user_presence/get_online_users/count do not expose non-discoverable accounts.
-- 10. Public presence RPCs are SECURITY INVOKER; cleanup is service-role only.
-- 11. If member blocking is active in the test environment, restrictive source policies
--     still hide both directory and presence across the blocked pair.
-- 12. Relative presence text is localized by the client in EN/ES/FR/IT/DE.
