-- One2OneLove relaunch: user presence security hardening
-- DEVELOPMENT MIGRATION ONLY. Apply to production only through an approved batch.
--
-- Hardening goals:
--   * Callers can update/heartbeat only their own presence.
--   * Browser roles cannot directly INSERT/UPDATE/DELETE presence rows.
--   * Privileged writes live in non-exposed o2ol_private with a fixed empty search_path.
--   * Browser-readable presence helpers/views run as SECURITY INVOKER and respect RLS.
--   * Presence projections never expose member email/private profile data.
--   * The database stores/returns neutral timestamps/status only; human-readable
--     relative-time copy is localized in the client EN/ES/FR/IT/DE layer.
--   * Maintenance cleanup is service-role only.

begin;

create schema if not exists o2ol_private;
revoke all on schema o2ol_private from public, anon;
grant usage on schema o2ol_private to authenticated;

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
drop policy if exists "Anyone can view user presence" on public.user_presence;
drop policy if exists "Authenticated members can view presence" on public.user_presence;
create policy "Authenticated members can view presence"
on public.user_presence
for select
to authenticated
using (true);

-- The privileged mutation helper is intentionally outside the exposed public schema.
-- It still verifies auth.uid(), so even a direct database role invocation cannot write
-- another account's presence.
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

-- Public compatibility wrappers retain the established client RPC names but execute as
-- the authenticated caller. The private helper remains the only privileged write path.
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

-- Browser-readable helpers are SECURITY INVOKER so later block-aware RLS policies are
-- automatically respected. They return neutral presence facts only.
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

-- Maintenance remains privileged and unavailable to browser roles.
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

-- Neutral projection only. Never generate English relative-time prose in SQL. The
-- selected One2OneLove language formats last_seen in the client.
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

comment on table public.user_presence is
  'Neutral presence state readable by authenticated members; browser writes are mediated by caller-bound RPCs.';
comment on view public.user_presence_view is
  'Authenticated neutral presence projection joined only to privacy-safe member_directory fields. No email and no localized display prose.';

commit;

-- PRE-APPLY ORDER / CONTROLLED TESTS
-- 1. Apply 20260817_member_directory_privacy.sql first.
-- 2. Test login/logout, heartbeat, visibility changes, online counts and realtime updates.
-- 3. Confirm authenticated browser roles cannot directly INSERT/UPDATE/DELETE user_presence.
-- 4. Confirm update/heartbeat reject attempts to write another member's presence.
-- 5. Confirm user_presence_view contains neither email nor last_seen_text.
-- 6. Confirm browser-readable presence RPCs are SECURITY INVOKER and therefore respect
--    any later block-aware user_presence RLS policy.
-- 7. Confirm cleanup_stale_presence remains service-role only.
