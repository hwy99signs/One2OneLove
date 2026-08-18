-- One2OneLove relaunch: pairwise message update hardening
-- DEVELOPMENT MIGRATION ONLY. Do not apply to production without explicit approval.
--
-- The legacy read-receipt policy lets a receiver UPDATE the whole messages row
-- so they can set is_read/read_at/delivered_at. RLS controls which rows may be
-- updated, not which columns may change. This trigger keeps receiver updates
-- limited to delivery/read state while preserving sender editing behavior.

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

  -- A receiver who is not also the sender may change only receipt-state fields.
  if auth.uid() = old.receiver_id and auth.uid() <> old.sender_id then
    if (
      to_jsonb(new) - array['is_read', 'read_at', 'delivered_at', 'updated_at']
    ) is distinct from (
      to_jsonb(old) - array['is_read', 'read_at', 'delivered_at', 'updated_at']
    ) then
      raise exception 'Recipients may update only message delivery/read status';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_message_update_boundaries_trigger on public.messages;
create trigger enforce_message_update_boundaries_trigger
before update on public.messages
for each row
execute function public.enforce_message_update_boundaries();

-- Normalize the UPDATE policy so senders may edit and receivers may write the
-- receipt fields that the trigger permits.
drop policy if exists "Users can update their messages" on public.messages;
drop policy if exists "Users can update messages they sent or received" on public.messages;

create policy "Users can update messages they sent or received"
on public.messages
for update
to authenticated
using (auth.uid() = sender_id or auth.uid() = receiver_id)
with check (auth.uid() = sender_id or auth.uid() = receiver_id);

comment on function public.enforce_message_update_boundaries() is
  'Prevents message recipients from modifying message content/identity while still allowing read and delivery receipts.';
