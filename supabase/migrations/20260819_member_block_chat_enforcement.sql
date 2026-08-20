-- One2OneLove pairwise chat enforcement for member blocks.
-- DEVELOPMENT MIGRATION ONLY. Do not apply to live Supabase until explicitly approved.
-- Depends on:
--   1. 20260819_member_blocks.sql
--   2. 20260819_member_block_pairwise_visibility.sql
--   3. existing conversations/messages tables and their normal ownership policies
--
-- These are RESTRICTIVE policies. They add an AND-style safety condition without
-- replacing the existing permissive participant/ownership rules.

begin;

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Conversation reads/creates/updates are forbidden while either participant has blocked
-- the other. Existing policies still decide whether the caller is a participant.
drop policy if exists "conversations_hide_blocked_pairs" on public.conversations;
create policy "conversations_hide_blocked_pairs"
on public.conversations
as restrictive
for select
to authenticated
using (
  not private.is_member_pair_blocked(
    case
      when user1_id = (select auth.uid()) then user2_id
      else user1_id
    end
  )
);

drop policy if exists "conversations_prevent_blocked_pair_insert" on public.conversations;
create policy "conversations_prevent_blocked_pair_insert"
on public.conversations
as restrictive
for insert
to authenticated
with check (
  not private.is_member_pair_blocked(
    case
      when user1_id = (select auth.uid()) then user2_id
      else user1_id
    end
  )
);

drop policy if exists "conversations_prevent_blocked_pair_update" on public.conversations;
create policy "conversations_prevent_blocked_pair_update"
on public.conversations
as restrictive
for update
to authenticated
using (
  not private.is_member_pair_blocked(
    case
      when user1_id = (select auth.uid()) then user2_id
      else user1_id
    end
  )
)
with check (
  not private.is_member_pair_blocked(
    case
      when user1_id = (select auth.uid()) then user2_id
      else user1_id
    end
  )
);

-- The current chat model is conversation-scoped. Refuse migration silently changing
-- behavior if that expected foreign-key column is missing in a future schema revision.
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'messages'
      and column_name = 'conversation_id'
  ) then
    raise exception 'EXPECTED_MESSAGES_CONVERSATION_ID_MISSING';
  end if;
end $$;

-- Message policies consult the conversation pair rather than trusting any caller-supplied
-- sender/recipient field. Existing message policies still enforce sender ownership and
-- recipient receipt rules; these restrictive policies add only the block boundary.
drop policy if exists "messages_hide_blocked_pairs" on public.messages;
create policy "messages_hide_blocked_pairs"
on public.messages
as restrictive
for select
to authenticated
using (
  exists (
    select 1
    from public.conversations conversation_row
    where conversation_row.id = messages.conversation_id
      and not private.is_member_pair_blocked(
        case
          when conversation_row.user1_id = (select auth.uid()) then conversation_row.user2_id
          else conversation_row.user1_id
        end
      )
  )
);

drop policy if exists "messages_prevent_blocked_pair_insert" on public.messages;
create policy "messages_prevent_blocked_pair_insert"
on public.messages
as restrictive
for insert
to authenticated
with check (
  exists (
    select 1
    from public.conversations conversation_row
    where conversation_row.id = messages.conversation_id
      and not private.is_member_pair_blocked(
        case
          when conversation_row.user1_id = (select auth.uid()) then conversation_row.user2_id
          else conversation_row.user1_id
        end
      )
  )
);

drop policy if exists "messages_prevent_blocked_pair_update" on public.messages;
create policy "messages_prevent_blocked_pair_update"
on public.messages
as restrictive
for update
to authenticated
using (
  exists (
    select 1
    from public.conversations conversation_row
    where conversation_row.id = messages.conversation_id
      and not private.is_member_pair_blocked(
        case
          when conversation_row.user1_id = (select auth.uid()) then conversation_row.user2_id
          else conversation_row.user1_id
        end
      )
  )
)
with check (
  exists (
    select 1
    from public.conversations conversation_row
    where conversation_row.id = messages.conversation_id
      and not private.is_member_pair_blocked(
        case
          when conversation_row.user1_id = (select auth.uid()) then conversation_row.user2_id
          else conversation_row.user1_id
        end
      )
  )
);

comment on policy "conversations_hide_blocked_pairs" on public.conversations is
  'Restrictive member-safety policy: pairwise conversations are invisible while either participant blocks the other.';
comment on policy "messages_prevent_blocked_pair_insert" on public.messages is
  'Restrictive member-safety policy: no new pairwise chat message may be inserted across a blocked member pair.';

commit;

-- PRE-APPLY CHECKLIST
-- 1. Verify private.is_member_pair_blocked exists and private schema is not PostgREST-exposed.
-- 2. Verify normal unblocked chat still reads/sends/marks receipts.
-- 3. Verify A blocks B: both A and B lose conversation/message visibility.
-- 4. Verify neither A nor B can create a new conversation or message across the block.
-- 5. Verify unblock restores normal access subject to existing participant policies.
-- 6. Verify third-party member C conversations are unaffected.
-- 7. Verify message receipt updates cannot bypass the block boundary.
