-- One2OneLove relaunch: user presence security hardening
-- DEVELOPMENT MIGRATION ONLY. Do not apply to production without explicit approval.
--
-- Legacy SECURITY DEFINER presence RPCs accept a caller-supplied user UUID. Without
-- an auth.uid() check an authenticated caller can spoof another member's presence.
-- The legacy helper view also exposes profile email even though the client needs
-- only presence state. This migration constrains writes to the caller and removes
-- email from the presence view.

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

-- SECURITY DEFINER functions are executable by PUBLIC unless explicitly revoked.
revoke all on function public.update_user_presence(uuid, text) from public;
revoke all on function public.heartbeat_user_presence(uuid) from public;
grant execute on function public.update_user_presence(uuid, text) to authenticated;
grant execute on function public.heartbeat_user_presence(uuid) to authenticated;

revoke all on function public.get_user_presence(uuid) from public;
revoke all on function public.get_online_users_count() from public;
revoke all on function public.get_online_users() from public;
grant execute on function public.get_user_presence(uuid) to authenticated;
grant execute on function public.get_online_users_count() to authenticated;
grant execute on function public.get_online_users() to authenticated;

-- Cleanup is an internal maintenance function, not a member-facing RPC.
revoke all on function public.cleanup_stale_presence() from public;
grant execute on function public.cleanup_stale_presence() to service_role;

-- The relaunch client requests only user_id/status/timestamps/is_online/last_seen_text.
-- Keep name/avatar available for any existing UI consumers but do not expose email.
drop view if exists public.user_presence_view;
create view public.user_presence_view as
select
  up.user_id,
  up.status,
  up.last_seen,
  up.last_active,
  up.updated_at,
  u.name,
  u.avatar_url,
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
left join public.users u on u.id = up.user_id;

revoke all on public.user_presence_view from public;
grant select on public.user_presence_view to authenticated;

comment on view public.user_presence_view is
  'Authenticated presence projection; intentionally excludes member email and other private profile fields.';
