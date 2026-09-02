-- One2OneLove relaunch: pairwise message INSERT hardening
-- DEVELOPMENT MIGRATION ONLY. Apply to production only through an approved batch.
--
-- Browser code may propose message content, type and optional reply metadata, but the
-- database derives sender/receiver from the authenticated conversation participants.
-- Attachment messages must point to a private chat-files object owned by this sender in
-- this exact conversation: <conversation_uuid>/<sender_uuid>/<random_uuid>.<extension>.

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
  v_expected_attachment_prefix text;
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

  new.message_type := lower(coalesce(nullif(btrim(new.message_type), ''), 'text'));
  if new.message_type not in ('text', 'image', 'video', 'audio', 'voice', 'file', 'location') then
    raise exception 'Unsupported message type';
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

  if new.message_type = 'text' then
    if new.content is null or char_length(btrim(new.content)) = 0 then
      raise exception 'Text message content is required';
    end if;
    new.file_url := null;
    new.file_name := null;
    new.file_size := null;
    new.file_type := null;
    new.location_lat := null;
    new.location_lng := null;
    new.location_address := null;
  elsif new.message_type in ('image', 'video', 'audio', 'voice', 'file') then
    v_expected_attachment_prefix := new.conversation_id::text || '/' || new.sender_id::text || '/';

    if new.file_url is null
       or position('://' in new.file_url) > 0
       or new.file_url not like v_expected_attachment_prefix || '%' then
      raise exception 'Attachment must use the private conversation storage path';
    end if;

    if new.file_size is null or new.file_size <= 0 or new.file_size > 10485760 then
      raise exception 'Attachment size must be between 1 byte and 10 MiB';
    end if;

    if new.file_name is null or char_length(btrim(new.file_name)) = 0 or char_length(new.file_name) > 255 then
      raise exception 'Attachment file name is invalid';
    end if;

    if new.file_type is not null and char_length(new.file_type) > 100 then
      raise exception 'Attachment MIME type is invalid';
    end if;

    new.location_lat := null;
    new.location_lng := null;
    new.location_address := null;
  elsif new.message_type = 'location' then
    new.file_url := null;
    new.file_name := null;
    new.file_size := null;
    new.file_type := null;

    if new.location_lat is null or new.location_lng is null
       or new.location_lat < -90 or new.location_lat > 90
       or new.location_lng < -180 or new.location_lng > 180 then
      raise exception 'Valid location coordinates are required';
    end if;

    if new.location_address is not null and char_length(new.location_address) > 500 then
      raise exception 'Location address is too long';
    end if;
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
drop policy if exists "Conversation participants can send messages" on public.messages;
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
  'Derives sender/receiver from authenticated conversation participants, protects initial receipt/edit/delete/reply state, and binds attachment messages to private conversation/sender object paths.';

commit;

-- CONTROLLED TESTS
-- 1. Browser-supplied sender_id/receiver_id are replaced with actual participants.
-- 2. A nonparticipant cannot insert into the conversation.
-- 3. A reply_to_id from another conversation is rejected.
-- 4. Browser cannot insert already-read/deleted/edited/delivered messages.
-- 5. HTTP/public attachment URLs are rejected.
-- 6. Attachment path must begin <conversation>/<authenticated sender>/ and be <=10 MiB.
-- 7. A file path from another conversation cannot be forwarded/reused without copying it
--    into an authorized object path for the target conversation.
-- 8. Normal text/location/private-file messages work for the two participants.
