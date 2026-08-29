-- One2OneLove chat table security hardening
-- Enforces participant ownership below the React client.

begin;

alter table public.messages enable row level security;
alter table public.conversations enable row level security;

-- Rebuild message policies around the signed-in participant.
do $$
declare r record;
begin
  for r in select policyname from pg_policies where schemaname='public' and tablename='messages'
  loop execute format('drop policy if exists %I on public.messages', r.policyname); end loop;
end $$;

create policy "message participants can read messages"
on public.messages
for select
to authenticated
using ((select auth.uid()) in (sender_id, receiver_id));

create policy "senders can create conversation messages"
on public.messages
for insert
to authenticated
with check (
  (select auth.uid()) = sender_id
  and sender_id <> receiver_id
  and exists (
    select 1
    from public.conversations c
    where c.id = conversation_id
      and sender_id in (c.user1_id, c.user2_id)
      and receiver_id in (c.user1_id, c.user2_id)
      and sender_id <> receiver_id
  )
);

create policy "message participants can update messages"
on public.messages
for update
to authenticated
using ((select auth.uid()) in (sender_id, receiver_id))
with check ((select auth.uid()) in (sender_id, receiver_id));

create or replace function public.protect_message_participant_fields()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
declare
  v_actor uuid := auth.uid();
  v_other uuid;
begin
  if v_actor is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.sender_id := v_actor;
    if new.receiver_id is null or new.receiver_id = v_actor then
      raise exception 'invalid message recipient' using errcode='42501';
    end if;

    select case when c.user1_id = v_actor then c.user2_id else c.user1_id end
      into v_other
    from public.conversations c
    where c.id = new.conversation_id
      and v_actor in (c.user1_id, c.user2_id);

    if v_other is null or new.receiver_id <> v_other then
      raise exception 'conversation recipient mismatch' using errcode='42501';
    end if;

    if new.reply_to_id is not null and not exists (
      select 1 from public.messages r
      where r.id = new.reply_to_id
        and r.conversation_id = new.conversation_id
        and not coalesce(r.is_deleted, false)
    ) then
      raise exception 'invalid reply target' using errcode='22023';
    end if;

    new.is_read := false;
    new.read_at := null;
    new.delivered_at := null;
    new.is_deleted := false;
    new.is_edited := false;
    new.created_at := coalesce(new.created_at, now());
    new.updated_at := coalesce(new.updated_at, new.created_at, now());
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if v_actor not in (old.sender_id, old.receiver_id) then
      raise exception 'not authorized' using errcode='42501';
    end if;

    -- Identity and routing are immutable for every browser participant.
    new.id := old.id;
    new.conversation_id := old.conversation_id;
    new.sender_id := old.sender_id;
    new.receiver_id := old.receiver_id;
    new.created_at := old.created_at;

    if v_actor = old.sender_id then
      -- Sender may edit text/soft-delete, but cannot forge receiver delivery/read state
      -- or replace attachment/location routing after send.
      new.message_type := old.message_type;
      new.file_url := old.file_url;
      new.file_name := old.file_name;
      new.file_size := old.file_size;
      new.file_type := old.file_type;
      new.location_lat := old.location_lat;
      new.location_lng := old.location_lng;
      new.location_address := old.location_address;
      new.reply_to_id := old.reply_to_id;
      new.delivered_at := old.delivered_at;
      new.read_at := old.read_at;
      new.is_read := old.is_read;
      if new.content is distinct from old.content then
        new.is_edited := true;
      end if;
    else
      -- Receiver may acknowledge delivery/read state only.
      new.content := old.content;
      new.message_type := old.message_type;
      new.file_url := old.file_url;
      new.file_name := old.file_name;
      new.file_size := old.file_size;
      new.file_type := old.file_type;
      new.location_lat := old.location_lat;
      new.location_lng := old.location_lng;
      new.location_address := old.location_address;
      new.reply_to_id := old.reply_to_id;
      new.is_deleted := old.is_deleted;
      new.is_edited := old.is_edited;
    end if;

    new.updated_at := now();
    return new;
  end if;

  return new;
end;
$$;

revoke execute on function public.protect_message_participant_fields() from public, anon, authenticated;
drop trigger if exists protect_message_participant_fields on public.messages;
create trigger protect_message_participant_fields
before insert or update on public.messages
for each row execute function public.protect_message_participant_fields();

-- Browser clients use soft deletion only.
revoke delete on table public.messages from authenticated;

-- Conversations are created only by the trusted get_or_create_conversation RPC.
do $$
declare r record;
begin
  for r in select policyname from pg_policies where schemaname='public' and tablename='conversations'
  loop execute format('drop policy if exists %I on public.conversations', r.policyname); end loop;
end $$;

create policy "conversation participants can read conversations"
on public.conversations
for select
to authenticated
using ((select auth.uid()) in (user1_id, user2_id));

create policy "conversation participants can update own settings"
on public.conversations
for update
to authenticated
using ((select auth.uid()) in (user1_id, user2_id))
with check ((select auth.uid()) in (user1_id, user2_id));

create or replace function public.protect_conversation_participant_fields()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null or pg_trigger_depth() > 1 then
    return new;
  end if;

  if v_actor not in (old.user1_id, old.user2_id) then
    raise exception 'not authorized' using errcode='42501';
  end if;

  new.id := old.id;
  new.user1_id := old.user1_id;
  new.user2_id := old.user2_id;
  new.last_message_id := old.last_message_id;
  new.last_message_at := old.last_message_at;
  new.created_at := old.created_at;

  if v_actor = old.user1_id then
    new.user2_muted := old.user2_muted;
    new.user2_pinned := old.user2_pinned;
    new.user2_archived := old.user2_archived;
    new.user2_unread_count := old.user2_unread_count;
  else
    new.user1_muted := old.user1_muted;
    new.user1_pinned := old.user1_pinned;
    new.user1_archived := old.user1_archived;
    new.user1_unread_count := old.user1_unread_count;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

revoke execute on function public.protect_conversation_participant_fields() from public, anon, authenticated;
drop trigger if exists protect_conversation_participant_fields on public.conversations;
create trigger protect_conversation_participant_fields
before update on public.conversations
for each row execute function public.protect_conversation_participant_fields();

revoke insert, delete on table public.conversations from authenticated;

commit;
