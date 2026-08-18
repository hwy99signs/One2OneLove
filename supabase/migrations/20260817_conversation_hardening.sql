-- One2OneLove relaunch: pairwise conversation hardening
-- DEVELOPMENT MIGRATION ONLY. Apply to production only through an approved batch.
--
-- Protects conversation identity/settings and the legacy SECURITY DEFINER helpers used
-- by pairwise Chat. Browser clients may read participating conversations and update only
-- their own local settings/unread counter. Conversation creation is mediated by an
-- authenticated caller-bound RPC; physical conversation deletion is not a browser action.

begin;

alter table public.conversations enable row level security;

-- ---------------------------------------------------------------------------
-- Auth-bound get/create helper
-- ---------------------------------------------------------------------------

create or replace function public.get_or_create_conversation(
  p_user1_id uuid,
  p_user2_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_self uuid := auth.uid();
  v_other uuid;
  v_user1 uuid;
  v_user2 uuid;
  v_conversation_id uuid;
begin
  if v_self is null then
    raise exception 'Authentication required';
  end if;

  if p_user1_id = v_self and p_user2_id is not null and p_user2_id <> v_self then
    v_other := p_user2_id;
  elsif p_user2_id = v_self and p_user1_id is not null and p_user1_id <> v_self then
    v_other := p_user1_id;
  else
    raise exception 'Conversation participants must include the authenticated member and one different member';
  end if;

  if not exists (select 1 from public.users u where u.id = v_other and coalesce(u.is_active, true) = true) then
    raise exception 'Conversation participant is not available';
  end if;

  -- Preserve one canonical row for a pair regardless of caller argument order.
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

-- ---------------------------------------------------------------------------
-- Auth-bound unread-count recalculation
-- ---------------------------------------------------------------------------

create or replace function public.recalculate_unread_count(
  p_conversation_id uuid,
  p_user_id uuid
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_is_user1 boolean;
  v_is_user2 boolean;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'You may recalculate only your own unread count';
  end if;

  select (c.user1_id = p_user_id), (c.user2_id = p_user_id)
    into v_is_user1, v_is_user2
  from public.conversations c
  where c.id = p_conversation_id;

  if not coalesce(v_is_user1, false) and not coalesce(v_is_user2, false) then
    raise exception 'You are not a participant in this conversation';
  end if;

  select count(*)::integer into v_count
  from public.messages m
  where m.conversation_id = p_conversation_id
    and m.receiver_id = p_user_id
    and coalesce(m.is_deleted, false) = false
    and (coalesce(m.is_read, false) = false or m.read_at is null);

  if v_is_user1 then
    update public.conversations
    set user1_unread_count = v_count, updated_at = now()
    where id = p_conversation_id;
  else
    update public.conversations
    set user2_unread_count = v_count, updated_at = now()
    where id = p_conversation_id;
  end if;

  return v_count;
end;
$$;

revoke all on function public.recalculate_unread_count(uuid, uuid) from public;
revoke all on function public.recalculate_unread_count(uuid, uuid) from anon;
grant execute on function public.recalculate_unread_count(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Direct browser field boundary
-- ---------------------------------------------------------------------------

create or replace function public.enforce_conversation_update_boundaries()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_role text := auth.role();
  v_safe_fields text[];
begin
  -- Trusted SQL/service work and nested message-trigger maintenance may update server
  -- fields such as last_message and the recipient unread count.
  if v_role is null or v_role = 'service_role' or pg_trigger_depth() > 1 then
    return new;
  end if;

  if v_role <> 'authenticated' or auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if new.id is distinct from old.id
     or new.user1_id is distinct from old.user1_id
     or new.user2_id is distinct from old.user2_id
     or new.created_at is distinct from old.created_at then
    raise exception 'Conversation identity fields are immutable';
  end if;

  if auth.uid() = old.user1_id then
    v_safe_fields := array['user1_muted','user1_pinned','user1_archived','user1_unread_count','updated_at'];
  elsif auth.uid() = old.user2_id then
    v_safe_fields := array['user2_muted','user2_pinned','user2_archived','user2_unread_count','updated_at'];
  else
    raise exception 'You are not a participant in this conversation';
  end if;

  if (to_jsonb(new) - v_safe_fields) is distinct from (to_jsonb(old) - v_safe_fields) then
    raise exception 'Members may update only their own conversation settings and unread count';
  end if;

  if auth.uid() = old.user1_id and new.user1_unread_count < 0 then
    raise exception 'Unread count cannot be negative';
  end if;
  if auth.uid() = old.user2_id and new.user2_unread_count < 0 then
    raise exception 'Unread count cannot be negative';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_conversation_update_boundaries() from public;

drop trigger if exists aaa_enforce_conversation_update_boundaries on public.conversations;
create trigger aaa_enforce_conversation_update_boundaries
before update on public.conversations
for each row execute function public.enforce_conversation_update_boundaries();

-- Conversation rows are created by the RPC above and never physically deleted from a
-- browser. Archiving is the member-local replacement for the legacy delete action.
revoke insert, delete on table public.conversations from anon, authenticated;

-- Normalize participant-only read/update policies.
drop policy if exists "Users can view their conversations" on public.conversations;
create policy "Users can view their conversations"
on public.conversations
for select
to authenticated
using (auth.uid() = user1_id or auth.uid() = user2_id);

drop policy if exists "Users can update their conversations" on public.conversations;
create policy "Users can update their conversations"
on public.conversations
for update
to authenticated
using (auth.uid() = user1_id or auth.uid() = user2_id)
with check (auth.uid() = user1_id or auth.uid() = user2_id);

grant select, update on table public.conversations to authenticated;

comment on function public.get_or_create_conversation(uuid, uuid) is
  'Creates/returns one canonical conversation containing the authenticated member and one valid other member; caller cannot create conversations for third parties.';
comment on function public.recalculate_unread_count(uuid, uuid) is
  'Recalculates only the authenticated member own unread count for a conversation they participate in.';
comment on function public.enforce_conversation_update_boundaries() is
  'Direct browser conversation updates are limited to the caller own local settings/unread count; server-maintained routing/message fields stay protected.';

commit;

-- CONTROLLED TESTS
-- 1. Caller cannot create a conversation between two third parties or with self.
-- 2. Reversed caller argument order resolves to the same canonical conversation.
-- 3. Browser direct INSERT/DELETE fails; archive setting remains available.
-- 4. User1 cannot alter user2 mute/pin/archive/unread fields and vice versa.
-- 5. Neither member can directly rewrite last_message/last_message_time or participants.
-- 6. Nested message triggers can still maintain last-message/unread state.
-- 7. recalculate_unread_count rejects another user's ID.
