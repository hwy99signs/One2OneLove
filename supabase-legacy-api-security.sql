-- One2OneLove legacy API security hardening
-- Restricts SECURITY DEFINER functions to the authenticated user they act for,
-- locks billing mutation RPCs to service_role, and enables RLS on waitlist_signups.

begin;

alter table public.waitlist_signups enable row level security;
revoke all on table public.waitlist_signups from anon, authenticated;
grant insert on table public.waitlist_signups to anon;

create or replace function public.get_or_create_conversation(p_user1_id uuid, p_user2_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_conversation_id uuid;
  v_min_user_id uuid;
  v_max_user_id uuid;
begin
  if v_actor is null or v_actor not in (p_user1_id, p_user2_id) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if p_user1_id = p_user2_id then
    raise exception 'conversation participants must be different' using errcode = '22023';
  end if;

  if p_user1_id < p_user2_id then
    v_min_user_id := p_user1_id;
    v_max_user_id := p_user2_id;
  else
    v_min_user_id := p_user2_id;
    v_max_user_id := p_user1_id;
  end if;

  select id into v_conversation_id
  from public.conversations
  where user1_id = v_min_user_id and user2_id = v_max_user_id;

  if v_conversation_id is null then
    insert into public.conversations (user1_id, user2_id)
    values (v_min_user_id, v_max_user_id)
    returning id into v_conversation_id;
  end if;

  return v_conversation_id;
end;
$$;

create or replace function public.mark_message_read(p_message_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  update public.messages
  set read_at = coalesce(read_at, now()), is_read = true
  where id = p_message_id
    and receiver_id = auth.uid()
    and read_at is null;
end;
$$;

create or replace function public.mark_message_delivered(p_message_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  update public.messages
  set delivered_at = coalesce(delivered_at, now())
  where id = p_message_id
    and receiver_id = auth.uid()
    and delivered_at is null;
end;
$$;

create or replace function public.get_message_reactions(p_message_id uuid)
returns table(emoji text, count bigint, user_reacted boolean)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not exists (
    select 1
    from public.messages m
    where m.id = p_message_id
      and auth.uid() in (m.sender_id, m.receiver_id)
  ) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  return query
  select mr.emoji, count(*)::bigint, bool_or(mr.user_id = auth.uid())
  from public.message_reactions mr
  where mr.message_id = p_message_id
  group by mr.emoji
  order by count(*) desc;
end;
$$;

create or replace function public.update_user_presence(p_user_id uuid, p_status text default 'online')
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if p_status not in ('online', 'away', 'offline') then
    raise exception 'invalid presence status' using errcode = '22023';
  end if;

  insert into public.user_presence (user_id, status, last_seen, last_active, updated_at)
  values (p_user_id, p_status, now(), now(), now())
  on conflict (user_id) do update
  set status = excluded.status,
      last_seen = now(),
      last_active = now(),
      updated_at = now();
end;
$$;

create or replace function public.heartbeat_user_presence(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  insert into public.user_presence (user_id, status, last_active, updated_at)
  values (p_user_id, 'online', now(), now())
  on conflict (user_id) do update
  set status = 'online', last_active = now(), updated_at = now();
end;
$$;

create or replace function public.get_user_presence(p_user_id uuid)
returns table(user_id uuid, status text, last_seen timestamptz, is_online boolean)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  return query
  select up.user_id,
         up.status,
         up.last_seen,
         (up.last_active > now() - interval '5 minutes' and up.status = 'online')
  from public.user_presence up
  where up.user_id = p_user_id;
end;
$$;

create or replace function public.get_online_users()
returns table(user_id uuid, status text, last_seen timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  return query
  select up.user_id, up.status, up.last_seen
  from public.user_presence up
  where up.status = 'online'
    and up.last_active > now() - interval '5 minutes'
  order by up.last_active desc;
end;
$$;

create or replace function public.get_online_users_count()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  return (
    select count(*)
    from public.user_presence
    where status = 'online'
      and last_active > now() - interval '5 minutes'
  );
end;
$$;

create or replace function public.get_subscription_details(p_user_id uuid)
returns table(
  subscription_plan text,
  subscription_status text,
  subscription_price numeric,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean,
  days_remaining integer
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  return query
  select u.subscription_plan,
         u.subscription_status,
         u.subscription_price,
         u.subscription_current_period_start,
         u.subscription_current_period_end,
         u.cancel_at_period_end,
         case when u.subscription_current_period_end is not null
           then extract(day from u.subscription_current_period_end - now())::integer
           else null
         end
  from public.users u
  where u.id = p_user_id;
end;
$$;

create or replace function public.is_subscription_active(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
  v_period_end timestamptz;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select subscription_status, subscription_current_period_end
  into v_status, v_period_end
  from public.users
  where id = p_user_id;

  return v_status = 'active' and (v_period_end is null or v_period_end > now());
end;
$$;

-- Billing mutation functions must only be callable from trusted server code.
alter function public.update_user_subscription(uuid, text, text, text, timestamptz, timestamptz) set search_path = '';
alter function public.record_subscription_change(uuid, text, text, text) set search_path = '';

revoke execute on function public.get_or_create_conversation(uuid, uuid) from public, anon;
revoke execute on function public.mark_message_read(uuid) from public, anon;
revoke execute on function public.mark_message_delivered(uuid) from public, anon;
revoke execute on function public.get_message_reactions(uuid) from public, anon;
revoke execute on function public.update_user_presence(uuid, text) from public, anon;
revoke execute on function public.heartbeat_user_presence(uuid) from public, anon;
revoke execute on function public.get_user_presence(uuid) from public, anon;
revoke execute on function public.get_online_users() from public, anon;
revoke execute on function public.get_online_users_count() from public, anon;
revoke execute on function public.get_subscription_details(uuid) from public, anon;
revoke execute on function public.is_subscription_active(uuid) from public, anon;

revoke execute on function public.update_user_subscription(uuid, text, text, text, timestamptz, timestamptz) from public, anon, authenticated;
revoke execute on function public.record_subscription_change(uuid, text, text, text) from public, anon, authenticated;

grant execute on function public.get_or_create_conversation(uuid, uuid) to authenticated;
grant execute on function public.mark_message_read(uuid) to authenticated;
grant execute on function public.mark_message_delivered(uuid) to authenticated;
grant execute on function public.get_message_reactions(uuid) to authenticated;
grant execute on function public.update_user_presence(uuid, text) to authenticated;
grant execute on function public.heartbeat_user_presence(uuid) to authenticated;
grant execute on function public.get_user_presence(uuid) to authenticated;
grant execute on function public.get_online_users() to authenticated;
grant execute on function public.get_online_users_count() to authenticated;
grant execute on function public.get_subscription_details(uuid) to authenticated;
grant execute on function public.is_subscription_active(uuid) to authenticated;
grant execute on function public.update_user_subscription(uuid, text, text, text, timestamptz, timestamptz) to service_role;
grant execute on function public.record_subscription_change(uuid, text, text, text) to service_role;

commit;
