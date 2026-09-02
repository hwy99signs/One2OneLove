-- One2OneLove pairwise block visibility hardening.
-- DEVELOPMENT MIGRATION ONLY. Do not apply to live Supabase until explicitly approved.
-- Depends on 20260819_member_blocks.sql, the privacy-safe member directory/presence
-- foundation, and Live Room messaging RLS.
--
-- The block table itself remains private to the blocker. RLS consumers need to know
-- whether EITHER side blocked the other without exposing a public 'who blocked me' RPC.
-- Reuse the non-exposed `o2ol_private` schema already used by relaunch security helpers.
--
-- IMPORTANT: blocking must be enforced at the database source, not only in UI filters or
-- Edge Functions. Authenticated members can otherwise query the Data API directly.

begin;

create schema if not exists o2ol_private;
revoke all on schema o2ol_private from public, anon;
grant usage on schema o2ol_private to authenticated;

create or replace function o2ol_private.is_member_pair_blocked(other_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when (select auth.uid()) is null or other_user_id is null then false
    when (select auth.uid()) = other_user_id then false
    else exists (
      select 1
      from public.member_blocks block_row
      where
        (block_row.blocker_id = (select auth.uid()) and block_row.blocked_id = other_user_id)
        or
        (block_row.blocker_id = other_user_id and block_row.blocked_id = (select auth.uid()))
    )
  end;
$$;

revoke all on function o2ol_private.is_member_pair_blocked(uuid) from public, anon;
grant execute on function o2ol_private.is_member_pair_blocked(uuid) to authenticated;

-- Refuse to create a misleading partial block feature if the privacy-safe discovery or
-- presence source expected by the relaunch is missing. These are the source tables behind
-- security-invoker views, so their RLS is the direct-Data-API security boundary.
do $$
begin
  if to_regclass('public.user_directory_profiles') is null then
    raise exception 'O2OL_BLOCK_MEMBER_DIRECTORY_SOURCE_MISSING';
  end if;
  if to_regclass('public.user_presence') is null then
    raise exception 'O2OL_BLOCK_PRESENCE_SOURCE_MISSING';
  end if;
  if to_regclass('public.room_messages') is null then
    raise exception 'O2OL_BLOCK_ROOM_MESSAGES_MISSING';
  end if;
  if to_regclass('public.room_message_reactions') is null then
    raise exception 'O2OL_BLOCK_ROOM_REACTIONS_MISSING';
  end if;
end $$;

-- Member directory source: a security-invoker `member_directory` view inherits this
-- restriction, and direct authenticated table reads receive the same protection.
alter table public.user_directory_profiles enable row level security;
drop policy if exists "user_directory_profiles_hide_blocked_pairs" on public.user_directory_profiles;
create policy "user_directory_profiles_hide_blocked_pairs"
on public.user_directory_profiles
as restrictive
for select
to authenticated
using (not o2ol_private.is_member_pair_blocked(id));

-- Presence source: blocked pairs must not be able to query each other's online/last-seen
-- state through the base table, RPC/view, or a custom Data API request.
alter table public.user_presence enable row level security;
drop policy if exists "user_presence_hide_blocked_pairs" on public.user_presence;
create policy "user_presence_hide_blocked_pairs"
on public.user_presence
as restrictive
for select
to authenticated
using (not o2ol_private.is_member_pair_blocked(user_id));

-- Replace the earlier one-way room-message restriction with mutual visibility suppression.
drop policy if exists "room_messages_hide_personally_blocked_members" on public.room_messages;
drop policy if exists "room_messages_hide_blocked_pairs" on public.room_messages;
create policy "room_messages_hide_blocked_pairs"
on public.room_messages
as restrictive
for select
to authenticated
using (not o2ol_private.is_member_pair_blocked(user_id));

-- Reactions can otherwise leak a blocked member's user_id/message activity even after that
-- member's room messages are hidden. Hide reactions authored by either side of a block and
-- require the referenced room message to remain visible to the caller. The existing
-- permissive ownership policies continue to govern ordinary reaction writes/deletes.
drop policy if exists "room_reactions_hide_blocked_pairs" on public.room_message_reactions;
create policy "room_reactions_hide_blocked_pairs"
on public.room_message_reactions
as restrictive
for select
to authenticated
using (
  not o2ol_private.is_member_pair_blocked(user_id)
  and exists (
    select 1
    from public.room_messages visible_message
    where visible_message.id = room_message_reactions.message_id
      and visible_message.deleted_at is null
  )
);

drop policy if exists "room_reactions_prevent_blocked_pair_insert" on public.room_message_reactions;
create policy "room_reactions_prevent_blocked_pair_insert"
on public.room_message_reactions
as restrictive
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.room_messages visible_message
    where visible_message.id = room_message_reactions.message_id
      and visible_message.deleted_at is null
  )
);

comment on function o2ol_private.is_member_pair_blocked(uuid) is
  'Non-public RLS helper: true when either current member or the other member blocked the pair. Uses a fixed empty search_path and must remain outside PostgREST exposed schemas.';
comment on policy "user_directory_profiles_hide_blocked_pairs" on public.user_directory_profiles is
  'Restrictive member-safety policy: blocked pairs cannot discover each other through the directory source or security-invoker directory view.';
comment on policy "user_presence_hide_blocked_pairs" on public.user_presence is
  'Restrictive member-safety policy: blocked pairs cannot query each other’s presence state.';
comment on policy "room_messages_hide_blocked_pairs" on public.room_messages is
  'Restrictive Live Room safety policy: messages are mutually invisible across a blocked member pair.';
comment on policy "room_reactions_hide_blocked_pairs" on public.room_message_reactions is
  'Restrictive Live Room safety policy: reaction activity cannot reveal blocked members or hidden messages.';

commit;

-- PRE-APPLY CHECKLIST
-- 1. Confirm `o2ol_private` is NOT in the Supabase/PostgREST exposed-schemas configuration.
-- 2. Verify anon has no schema USAGE or helper EXECUTE privilege.
-- 3. Verify A blocks B: A and B disappear from each other's member_directory results.
-- 4. Verify A blocks B: both directions lose user_presence/user_presence_view visibility.
-- 5. Verify A blocks B: Live Room messages and reactions are mutually hidden.
-- 6. Verify neither side can insert a reaction on a message hidden by the block.
-- 7. Verify own directory/presence rows remain readable because self is never considered a blocked pair.
-- 8. Verify unblocking restores visibility subject to normal directory/presence/room policies.
-- 9. Verify neither member can enumerate the other's block rows through public tables/RPC.
-- 10. Keep MEMBER_BLOCKING_ENABLED=false until chat/connection enforcement and the accepted-connection product decision are also completed and tested.
