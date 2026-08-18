-- One2OneLove relaunch: user presence security hardening
-- DEVELOPMENT MIGRATION ONLY. Apply to production only through an approved batch.
--
-- Hardening goals:
--   * Callers can update/heartbeat only their own presence.
--   * Browser roles cannot directly INSERT/UPDATE/DELETE presence rows.
--   * SECURITY DEFINER functions use a fixed search_path.
--   * Presence projections never expose member email/private profile data.
--   * Maintenance cleanup is service-role only.

begin;

alter table public.user_presence enable row level security;

-- Legacy setup granted ALL on this table. Realtime/browser clients only need SELECT;
-- state changes go through the authenticated RPCs below.
revoke all on table public.user_presence from anon, authenticated;
grant select on table public.user_presence to authenticated;

-- Keep only the read policy at the table layer. Removing direct write policies prevents
-- accidental permission broadening if table grants are changed later.
drop policy if exists "Users can insert own presence" on public.user_presence;
drop policy if exists "Users can update own presence" on public.user_presence;
drop policy if exists "Users can delete own presence" on public.user_presence;

-- Preserve/normalize the authenticated read policy used by realtime presence UI.
drop policy if exists "Anyone can view user presence" on public.user_presence;
create policy "Authenticated members can view presence"
on public.user_presence
for select
to authenticated
using (true);

create or replace function public.update_user_presence(
  p_user_id uuid,
  p_status text default 'online'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'You may update only your own presence';
  end if;

  if p_status not in ('online', 'offline', 'away', 'busy') then
    raise exception 'Invalid presence status';
  end if;

  insert into public.user_presence (user_id, status, last_seen, last_active, updated_at)
  values (p_user_id, p_status, now(), now(), now())
  on conflict (user_id)
  do update set
    status = excluded.status,
    last_seen = now(),
    last_active = now(),
    updated_at = now();
end;
$$;

create or replace function public.heartbeat_user_presence(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'You may heartbeat only your own presence';
  end if;

  insert into public.user_presence (user_id, status, last_active, updated_at)
  values (p_user_id, 'online', now(), now())
  on conflict (user_id)
  do update set
    status = 'online',
    last_active = now(),
    updated_at = now();
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
security definer
set search_path = public
stable
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
security definer
set search_path = public
stable
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
security definer
set search_path = public
stable
as $$
  select up.user_id, up.status, up.last_seen
  from public.user_presence up
  where up.status = 'online'
    and up.last_active > now() - interval '5 minutes'
  order by up.last_active desc;
$$;

create or replace function public.cleanup_stale_presence()
returns void
language sql
security definer
set search_path = public
as $$
  update public.user_presence
  set status = 'offline', updated_at = now()
  where status = 'online'
    and last_active < now() - interval '5 minutes';
$$;

-- SECURITY DEFINER functions are executable by PUBLIC unless explicitly revoked.
revoke all on function public.update_user_presence(uuid, text) from public;
revoke all on function public.heartbeat_user_presence(uuid) from public;
revoke all on function public.get_user_presence(uuid) from public;
revoke all on function public.get_online_users_count() from public;
revoke all on function public.get_online_users() from public;
revoke all on function public.cleanup_stale_presence() from public;

grant execute on function public.update_user_presence(uuid, text) to authenticated;
grant execute on function public.heartbeat_user_presence(uuid) to authenticated;
grant execute on function public.get_user_presence(uuid) to authenticated;
grant execute on function public.get_online_users_count() to authenticated;
grant execute on function public.get_online_users() to authenticated;
grant execute on function public.cleanup_stale_presence() to service_role;

-- Use the already-sanitized member directory rather than joining public.users directly.
-- The client currently requests only the presence fields, but name/avatar remain here for
-- compatibility with any reviewed authenticated UI that needs them.
drop view if exists public.user_presence_view;
create view public.user_presence_view
with (security_barrier = true)
as
select
  up.user_id,
  up.status,
  up.last_seen,
  up.last_active,
  up.updated_at,
  md.name,
  md.avatar_url,
  (up.last_active > now() - interval '5 minutes' and up.status = 'online') as is_online,
  case
    when up.last_active > now() - interval '5 minutes' and up.status = 'online' then 'Online'
    when up.last_seen > now() - interval '1 minute' then 'Just now'
    when up.last_seen > now() - interval '1 hour' then extract(minute from (now() - up.last_seen))::text || ' mins ago'
    when up.last_seen > now() - interval '1 day' then extract(hour from (now() - up.last_seen))::text || ' hours ago'
    when up.last_seen > now() - interval '7 days' then extract(day from (now() - up.last_seen))::text || ' days ago'
    else 'Long time ago'
  end as last_seen_text
from public.user_presence up
left join public.member_directory md on md.id = up.user_id;

revoke all on public.user_presence_view from public;
revoke all on public.user_presence_view from anon;
grant select on public.user_presence_view to authenticated;

comment on table public.user_presence is
  'Presence state readable by authenticated members; browser writes are mediated by caller-bound RPCs.';
comment on view public.user_presence_view is
  'Authenticated presence projection joined only to privacy-safe member_directory fields; no member email/private profile data.';

commit;

-- PRE-APPLY ORDER
-- 1. Apply 20260817_member_directory_privacy.sql first.
-- 2. Apply this migration before the users-table privacy lockdown.
-- 3. Test login/logout, heartbeat, visibility changes, online counts and realtime updates.
