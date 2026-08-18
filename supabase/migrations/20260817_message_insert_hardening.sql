-- One2OneLove relaunch: pairwise message INSERT hardening
-- DEVELOPMENT MIGRATION ONLY. Apply to production only through an approved batch.
--
-- Browser code may propose message content, type and optional reply metadata, but the
-- database derives sender/receiver from the authenticated conversation participants.
-- This prevents a member from forging a sender, injecting a third-party receiver, or
-- attaching a reply from another conversation.

begin;

create or replace function public.enforce_message_insert_boundaries()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_role text := auth.role();
  v_user1 uuid;
  v_user2 uuid;
  v_reply_conversation uuid;
begin
  if v_role is null or v_role = 'service_role' then
    return new;
  end if;

  if v_role <> 'authenticated' or auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select c.user1_id, c.user2_id
    into v_user1, v_user2
  from public.conversations c
  where c.id = new.conversation_id;

  if v_user1 is null or v_user2 is null then
    raise exception 'Conversation not found';
  end if;

  if auth.uid() = v_user1 then
    new.sender_id := v_user1;
    new.receiver_id := v_user2;
  elsif auth.uid() = v_user2 then
    new.sender_id := v_user2;
    new.receiver_id := v_user1;
  else
    raise exception 'You are not a participant in this conversation';
  end if;

  -- Browser clients cannot pre-mark their own outgoing message as read/deleted/edited
  -- or backdate delivery state.
  new.is_read := false;
  new.is_edited := false;
  new.is_deleted := false;
  new.delivered_at := null;
  new.read_at := null;
  new.created_at := now();
  new.updated_at := now();

  if new.reply_to_id is not null then
    select m.conversation_id into v_reply_conversation
    from public.messages m
    where m.id = new.reply_to_id
      and coalesce(m.is_deleted, false) = false;

    if v_reply_conversation is null or v_reply_conversation <> new.conversation_id then
      raise exception 'Reply target must be a visible message in the same conversation';
    end if;
  end if;

  if new.content is not null and char_length(new.content) > 5000 then
    raise exception 'Message content is too long';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_message_insert_boundaries() from public;

drop trigger if exists aaa_enforce_message_insert_boundaries on public.messages;
create trigger aaa_enforce_message_insert_boundaries
before insert on public.messages
for each row execute function public.enforce_message_insert_boundaries();

-- Normalize INSERT policy around the trigger-derived sender/receiver identity.
drop policy if exists "Users can send messages" on public.messages;
drop policy if exists "Users can insert messages" on public.messages;
create policy "Conversation participants can send messages"
on public.messages
for insert
to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1
    from public.conversations c
    where c.id = conversation_id
      and (
        (c.user1_id = auth.uid() and receiver_id = c.user2_id)
        or (c.user2_id = auth.uid() and receiver_id = c.user1_id)
      )
  )
);

comment on function public.enforce_message_insert_boundaries() is
  'Derives sender/receiver from authenticated conversation participants and protects initial receipt/edit/delete/reply state for pairwise messages.';

commit;

-- CONTROLLED TESTS
-- 1. Browser-supplied sender_id/receiver_id are replaced with the actual participants.
-- 2. A nonparticipant cannot insert into the conversation.
-- 3. A reply_to_id from another conversation is rejected.
-- 4. Browser cannot insert already-read/deleted/edited/delivered messages.
-- 5. Normal text/file/location message inserts still work for the two participants.
