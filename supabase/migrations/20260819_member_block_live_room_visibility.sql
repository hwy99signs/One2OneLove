-- One2OneLove Live Room visibility restriction for member blocks.
-- DEVELOPMENT MIGRATION ONLY. Do not apply to live Supabase until explicitly approved.
-- Depends on:
--   1. 20260819_member_blocks.sql
--   2. Live Room messaging table/RLS migrations
--
-- A RESTRICTIVE policy composes with existing permissive SELECT policies. It means a
-- signed-in member cannot read room messages from an account they personally blocked,
-- even if an older permissive room_messages policy would otherwise allow the row.

begin;

alter table public.room_messages enable row level security;

drop policy if exists "room_messages_hide_personally_blocked_members" on public.room_messages;
create policy "room_messages_hide_personally_blocked_members"
on public.room_messages
as restrictive
for select
to authenticated
using (
  user_id = (select auth.uid())
  or not exists (
    select 1
    from public.member_blocks block_row
    where block_row.blocker_id = (select auth.uid())
      and block_row.blocked_id = room_messages.user_id
  )
);

comment on policy "room_messages_hide_personally_blocked_members" on public.room_messages is
  'Restrictive personal-safety policy: a member cannot read Live Room messages authored by an account they blocked. Full pairwise chat/connection enforcement is a separate required activation dependency.';

commit;

-- PRE-APPLY CHECKLIST
-- 1. Keep member blocking disabled until chat + connection enforcement is also ready.
-- 2. Verify a member can read their own room messages.
-- 3. Verify blocking member B makes B's existing/new room_messages invisible to blocker A.
-- 4. Verify unblocking restores visibility subject to the normal room SELECT policies.
-- 5. Verify another member C is unaffected by A's private block list.
-- 6. Do not market/activate blocking as complete until pairwise chat/connection paths are hardened too.
