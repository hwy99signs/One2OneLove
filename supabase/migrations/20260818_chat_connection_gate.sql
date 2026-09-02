-- One2OneLove relaunch: accepted-connection gate for pairwise private Chat
-- DEVELOPMENT MIGRATION ONLY. Batch 002 production action; do not apply without approval.
--
-- The relaunch connection model is intentionally:
--   discover member -> send request -> recipient accepts -> private Chat.
-- A guessed /Chat?userId=... URL or direct RPC call must not create/send an unsolicited
-- private conversation before the two accounts have an accepted connection.

begin;

-- This compatibility RPC is intentionally callable by authenticated clients because older
-- relaunch code may use it, but it must never become a relationship-graph oracle. The
-- authenticated caller must be one of the two IDs being checked; unrelated pair queries
-- return false rather than revealing whether two third parties are connected.
create or replace function public.are_accepted_buddies(p_user_a uuid, p_user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
    and (auth.uid() = p_user_a or auth.uid() = p_user_b)
    and p_user_a is not null
    and p_user_b is not null
    and p_user_a <> p_user_b
    and exists (
      select 1
      from public.buddy_requests br
      where br.status = 'accepted'
        and (
          (br.from_user_id = p_user_a and br.to_user_id = p_user_b)
          or (br.from_user_id = p_user_b and br.to_user_id = p_user_a)
        )
    );
$$;

revoke all on function public.are_accepted_buddies(uuid, uuid) from public;
revoke all on function public.are_accepted_buddies(uuid, uuid) from anon;
grant execute on function public.are_accepted_buddies(uuid, uuid) to authenticated;

-- Replace the caller-bound conversation helper from the Batch 001 conversation
-- hardening migration with the same boundary plus an accepted-connection requirement.
create or replace function public.get_or_create_conversation(
  p_user1_id uuid,
  p_user2_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_self uuid := auth.uid();
  v_other uuid;
  v_user1 uuid;
  v_user2 uuid;
  v_conversation_id uuid;
begin
  if v_self is null then
    raise exception 'O2OL_AUTH_REQUIRED';
  end if;

  if p_user1_id = v_self and p_user2_id is not null and p_user2_id <> v_self then
    v_other := p_user2_id;
  elsif p_user2_id = v_self and p_user1_id is not null and p_user1_id <> v_self then
    v_other := p_user1_id;
  else
    raise exception 'O2OL_CHAT_PARTICIPANT_BOUNDARY';
  end if;

  if not public.are_accepted_buddies(v_self, v_other) then
    raise exception 'O2OL_CHAT_ACCEPTED_CONNECTION_REQUIRED';
  end if;

  if not exists (
    select 1 from public.users u
    where u.id = v_other and coalesce(u.is_active, true) = true
  ) then
    raise exception 'O2OL_CHAT_PARTICIPANT_UNAVAILABLE';
  end if;

  v_user1 := least(v_self, v_other);
  v_user2 := greatest(v_self, v_other);

  select c.id into v_conversation_id
  from public.conversations c
  where c.user1_id = v_user1 and c.user2_id = v_user2
  limit 1;

  if v_conversation_id is null then
    insert into public.conversations (user1_id, user2_id)
    values (v_user1, v_user2)
    on conflict (user1_id, user2_id) do nothing
    returning id into v_conversation_id;

    if v_conversation_id is null then
      select c.id into v_conversation_id
      from public.conversations c
      where c.user1_id = v_user1 and c.user2_id = v_user2
      limit 1;
    end if;
  end if;

  return v_conversation_id;
end;
$$;

revoke all on function public.get_or_create_conversation(uuid, uuid) from public;
revoke all on function public.get_or_create_conversation(uuid, uuid) from anon;
grant execute on function public.get_or_create_conversation(uuid, uuid) to authenticated;

-- Defense in depth: even if a legacy conversation row already exists, a browser INSERT
-- into messages must still be between accepted connections. This trigger intentionally
-- runs after `aaa_enforce_message_insert_boundaries`, which derives sender/receiver from
-- the authenticated conversation participants.
create or replace function public.enforce_message_connection_gate()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.role() is null or auth.role() = 'service_role' then
    return new;
  end if;

  if auth.uid() is null then
    raise exception 'O2OL_AUTH_REQUIRED';
  end if;

  if not public.are_accepted_buddies(new.sender_id, new.receiver_id) then
    raise exception 'O2OL_CHAT_ACCEPTED_CONNECTION_REQUIRED';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_message_connection_gate() from public;
revoke all on function public.enforce_message_connection_gate() from anon;
revoke all on function public.enforce_message_connection_gate() from authenticated;

drop trigger if exists aab_enforce_message_connection_gate on public.messages;
create trigger aab_enforce_message_connection_gate
before insert on public.messages
for each row execute function public.enforce_message_connection_gate();

comment on function public.are_accepted_buddies(uuid, uuid) is
  'Caller-private accepted-connection check: returns relationship state only when auth.uid() is one of the two members; unrelated pair queries return false.';
comment on function public.get_or_create_conversation(uuid, uuid) is
  'Creates/returns a pairwise conversation only for the authenticated member and an accepted connection.';
comment on function public.enforce_message_connection_gate() is
  'Prevents browser pairwise-message insertion before an accepted member connection exists.';

commit;

-- CONTROLLED TESTS
-- 1. Member A cannot create/open a private conversation with B before a request exists.
-- 2. A pending request does not permit Chat.
-- 3. A rejected request does not permit Chat.
-- 4. After B accepts A's request, either side can create/open the canonical conversation.
-- 5. A guessed userId/deep link cannot bypass the RPC boundary.
-- 6. Direct message INSERT into an old/preexisting conversation is rejected unless the
--    sender and receiver are accepted connections.
-- 7. Member A can check A<->B acceptance, but A querying B<->C returns false even when
--    B and C are connected.
-- 8. Existing accepted-connection text chat/receipts continue working normally.
