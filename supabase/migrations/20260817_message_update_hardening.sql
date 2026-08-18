-- One2OneLove relaunch: pairwise message update hardening
-- DEVELOPMENT MIGRATION ONLY. Apply to production only through an approved batch.
--
-- RLS decides which rows a member may update, but not which columns may change.
-- This trigger enforces field-level boundaries:
--   * message identity/routing fields are immutable after INSERT;
--   * recipients may update delivery/read receipt state only;
--   * senders may edit/delete their own message content only;
--   * senders cannot manufacture read/delivery receipts.

begin;

create or replace function public.enforce_message_update_boundaries()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  -- Routing/identity is immutable for every browser update.
  if new.id is distinct from old.id
     or new.conversation_id is distinct from old.conversation_id
     or new.sender_id is distinct from old.sender_id
     or new.receiver_id is distinct from old.receiver_id
     or new.created_at is distinct from old.created_at then
    raise exception 'Message identity and routing fields are immutable';
  end if;

  if auth.uid() = old.receiver_id and auth.uid() <> old.sender_id then
    -- Recipients may acknowledge receipt/read state but cannot alter content,
    -- attachments, reply metadata, deletion state, sender identity, etc.
    if (
      to_jsonb(new) - array['is_read', 'read_at', 'delivered_at', 'updated_at']
    ) is distinct from (
      to_jsonb(old) - array['is_read', 'read_at', 'delivered_at', 'updated_at']
    ) then
      raise exception 'Recipients may update only message delivery/read status';
    end if;

    -- Receipt timestamps may only move from NULL to a timestamp; recipients cannot
    -- erase an acknowledgement that already exists.
    if old.delivered_at is not null and new.delivered_at is distinct from old.delivered_at then
      raise exception 'Delivered timestamp cannot be changed once set';
    end if;
    if old.read_at is not null and new.read_at is distinct from old.read_at then
      raise exception 'Read timestamp cannot be changed once set';
    end if;
    if old.is_read = true and new.is_read is distinct from true then
      raise exception 'Read status cannot be reversed';
    end if;

    return new;
  end if;

  if auth.uid() = old.sender_id then
    -- Senders may edit text/caption content or soft-delete their own messages. They
    -- cannot alter attachment URLs, receipt state, message type, reply target, etc.
    if (
      to_jsonb(new) - array['content', 'is_edited', 'is_deleted', 'updated_at']
    ) is distinct from (
      to_jsonb(old) - array['content', 'is_edited', 'is_deleted', 'updated_at']
    ) then
      raise exception 'Senders may update only message content/edit/delete state';
    end if;

    return new;
  end if;

  raise exception 'You may update only messages you sent or received';
end;
$$;

drop trigger if exists enforce_message_update_boundaries_trigger on public.messages;
create trigger enforce_message_update_boundaries_trigger
before update on public.messages
for each row
execute function public.enforce_message_update_boundaries();

-- Normalize the UPDATE policy so the trigger can enforce field-level boundaries.
drop policy if exists "Users can update their messages" on public.messages;
drop policy if exists "Users can update messages they sent or received" on public.messages;

create policy "Users can update messages they sent or received"
on public.messages
for update
to authenticated
using (auth.uid() = sender_id or auth.uid() = receiver_id)
with check (auth.uid() = sender_id or auth.uid() = receiver_id);

revoke all on function public.enforce_message_update_boundaries() from public;
-- Trigger invocation does not require client EXECUTE permission; keep the helper private.

comment on function public.enforce_message_update_boundaries() is
  'Field-level guard for pairwise messages: immutable routing, recipient receipt-only updates, sender content/edit/delete-only updates.';

commit;

-- CONTROLLED TESTS
-- 1. Sender can edit content and set is_edited=true.
-- 2. Sender can soft-delete with is_deleted=true.
-- 3. Sender cannot set read_at/delivered_at or change receiver/conversation.
-- 4. Recipient can set delivered_at/read_at/is_read but cannot edit/delete content.
-- 5. A third party cannot update the row.
