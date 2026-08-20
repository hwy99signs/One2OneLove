-- One2OneLove relaunch: reconcile member-directory + presence privacy.
-- DEVELOPMENT MIGRATION ONLY. Apply to production only through explicit Approval #8C.
--
-- Goals:
--   * ordinary member discovery comes from a synchronized privacy-safe table, never a
--     broad/definer view over private public.users;
--   * the public member_directory exposes only the five fields currently used by
--     Buddy Finder and pairwise Chat;
--   * presence never exposes email/private profile data;
--   * presence stores neutral timestamps/status only; human-readable relative time is
--     localized in the client in EN/ES/FR/IT/DE;
--   * browser presence writes are mediated through caller-bound functions;
--   * privileged write/sync helpers live in the non-exposed o2ol_private schema.

begin;

create schema if not exists o2ol_private;
revoke all on schema o2ol_private from public, anon;
grant usage on schema o2ol_private to authenticated;

-- ---------------------------------------------------------------------------
-- Privacy-safe synchronized directory source
-- ---------------------------------------------------------------------------

create table if not exists public.user_directory_profiles (
  id uuid primary key references public.users(id) on delete cascade,
  name text,
  avatar_url text,
  bio text,
  relationship_status text,
  user_type text not null default 'regular',
  location text,
  interests jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_directory_profiles_user_type_idx
  on public.user_directory_profiles(user_type);
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
  insert into public.user_directory_profiles (
    id,
    name,
    avatar_url,
    bio,
    relationship_status,
    user_type,
    location,
    interests,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.name,
    new.avatar_url,
    new.bio,
    new.relationship_status,
    coalesce(new.user_type, 'regular'),
    new.location,
    new.interests,
    coalesce(new.created_at, now()),
    coalesce(new.updated_at, now())
  )
  on conflict (id) do update set
    name = excluded.name,
    avatar_url = excluded.avatar_url,
    bio = excluded.bio,
    relationship_status = excluded.relationship_status,
    user_type = excluded.user_type,
    location = excluded.location,
    interests = excluded.interests,
    updated_at = excluded.updated_at;

  return new;
end;
$$;

revoke all on function o2ol_private.sync_user_directory_profile() from public, anon, authenticated;

drop trigger if exists sync_user_directory_profile on public.users;
create trigger sync_user_directory_profile
after insert or update of name, avatar_url, bio, relationship_status, user_type, location, interests, updated_at
on public.users
for each row execute function o2ol_private.sync_user_directory_profile();

-- Retire any older exposed helper after its trigger has been moved.
drop function if exists public.sync_user_directory_profile();

-- Reconcile existing accounts without widening what the browser can read from users.
insert into public.user_directory_profiles (
  id,
  name,
  avatar_url,
  bio,
  relationship_status,
  user_type,
  location,
  interests,
  created_at,
  updated_at
)
select
  u.id,
  u.name,
  u.avatar_url,
  u.bio,
  u.relationship_status,
  coalesce(u.user_type, 'regular'),
  u.location,
  u.interests,
  coalesce(u.created_at, now()),
  coalesce(u.updated_at, now())
from public.users u
on conflict (id) do update set
  name = excluded.name,
  avatar_url = excluded.avatar_url,
  bio = excluded.bio,
  relationship_status = excluded.relationship_status,
  user_type = excluded.user_type,
  location = excluded.location,
  interests = excluded.interests,
  updated_at = excluded.updated_at;

-- The ordinary social directory is deliberately smaller than the synchronized source.
-- Relationship status, location, interests, role/account type and account-private fields
-- remain outside this default member-discovery projection.
drop view if exists public.member_directory;
create view public.member_directory
with (security_barrier = true, security_invoker = true)
as
select
  d.id,
  d.name,
  d.avatar_url,
  d.bio,
  d.created_at
from public.user_directory_profiles d
where coalesce(d.user_type, 'regular') = 'regular';

revoke all on public.member_directory from public, anon, authenticated;
grant select on public.member_directory to authenticated;

-- ---------------------------------------------------------------------------
-- Presence: neutral data + mediated writes
-- ---------------------------------------------------------------------------

alter table public.user_presence enable row level security;
revoke all on table public.user_presence from public, anon, authenticated;
grant select on table public.user_presence to authenticated;

drop policy if exists "Anyone can view user presence" on public.user_presence;
drop policy if exists "Authenticated members can view presence" on public.user_presence;
drop policy if exists "Users can insert own presence" on public.user_presence;
drop policy if exists "Users can update own presence" on public.user_presence;
drop policy if exists "Users can delete own presence" on public.user_presence;

create policy "Authenticated members can view presence"
  on public.user_presence
  for select
  to authenticated
  using (true);

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
    insert into public.user_presence (user_id, status, last_active, updated_at)
    values (p_user_id, 'online', now(), now())
    on conflict (user_id)
    do update set
      status = 'online',
      last_active = now(),
      updated_at = now();
  else
    insert into public.user_presence (user_id, status, last_seen, last_active, updated_at)
    values (p_user_id, p_status, now(), now(), now())
    on conflict (user_id)
    do update set
      status = excluded.status,
      last_seen = now(),
      last_active = now(),
      updated_at = now();
  end if;
end;
$$;

revoke all on function o2ol_private.write_user_presence(uuid, text, boolean) from public, anon;
grant execute on function o2ol_private.write_user_presence(uuid, text, boolean) to authenticated;

-- Keep the historical public RPC names for client compatibility, but make them
-- SECURITY INVOKER wrappers. The privileged write itself remains in o2ol_private.
create or replace function public.update_user_presence(
  p_user_id uuid,
  p_status text default 'online'
)
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

create or replace function public.get_user_presence(p_user_id uuid)
returns table(
  user_id uuid,
  status text,
  last_seen timestamptz,
  is_online boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    up.user_id,
    up.status,
    up.last_seen,
    (up.last_active > now() - interval '5 minutes' and up.status = 'online') as is_online
  from public.user_presence up
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
  from public.user_presence
  where status = 'online'
    and last_active > now() - interval '5 minutes';
$$;

create or replace function public.get_online_users()
returns table(
  user_id uuid,
  status text,
  last_seen timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select up.user_id, up.status, up.last_seen
  from public.user_presence up
  where up.status = 'online'
    and up.last_active > now() - interval '5 minutes'
  order by up.last_active desc;
$$;

-- Maintenance remains non-browser and service-role only.
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

-- Neutral presence projection. No email and no English relative-time prose are stored or
-- generated in SQL. The selected One2OneLove language formats last_seen in the client.
drop view if exists public.user_presence_view;
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
left join public.member_directory md on md.id = up.user_id;

revoke all on public.user_presence_view from public, anon, authenticated;
grant select on public.user_presence_view to authenticated;

comment on table public.user_directory_profiles is
  'Synchronized privacy-safe profile source for authenticated member discovery. It intentionally contains no email, partner, verification, subscription or billing fields.';
comment on view public.member_directory is
  'Authenticated regular-member discovery projection: id, display name, optional avatar, short bio and member-since date only.';
comment on table public.user_presence is
  'Neutral member presence timestamps/status. Browser writes are mediated through caller-bound RPCs; authenticated members may read presence state.';
comment on view public.user_presence_view is
  'Authenticated neutral presence projection. No email and no localized display prose; relative time is formatted by the client language layer.';

commit;

-- CONTROLLED TESTS BEFORE PRODUCTION APPROVAL
-- 1. Existing users and user_directory_profiles counts remain aligned after reconciliation.
-- 2. member_directory exposes exactly id/name/avatar_url/bio/created_at for regular members.
-- 3. Anonymous roles cannot read directory or presence objects.
-- 4. Authenticated browser roles cannot directly INSERT/UPDATE/DELETE user_presence.
-- 5. update/heartbeat RPCs reject attempts to write another user's presence.
-- 6. user_presence_view contains neither email nor last_seen_text.
-- 7. Public presence RPCs are SECURITY INVOKER; private write helper is not in an exposed schema.
-- 8. Client displays relative presence text in EN/ES/FR/IT/DE based on preferredLanguage.
