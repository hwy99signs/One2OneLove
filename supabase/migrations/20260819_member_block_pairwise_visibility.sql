-- One2OneLove pairwise block visibility hardening.
-- DEVELOPMENT MIGRATION ONLY. Do not apply to live Supabase until explicitly approved.
-- Depends on 20260819_member_blocks.sql and Live Room messaging RLS.
--
-- The block table itself remains private to the blocker. RLS consumers need to know
-- whether EITHER side blocked the other without exposing a public 'who blocked me' RPC.
-- Keep this helper in a non-exposed `private` schema and verify that schema is not in
-- Supabase/PostgREST exposed schemas before production activation.

begin;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.is_member_pair_blocked(other_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
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

revoke all on function private.is_member_pair_blocked(uuid) from public, anon;
grant execute on function private.is_member_pair_blocked(uuid) to authenticated;

-- Replace the earlier one-way restriction with mutual visibility suppression.
drop policy if exists "room_messages_hide_personally_blocked_members" on public.room_messages;
drop policy if exists "room_messages_hide_blocked_pairs" on public.room_messages;

create policy "room_messages_hide_blocked_pairs"
on public.room_messages
as restrictive
for select
to authenticated
using (not private.is_member_pair_blocked(user_id));

comment on function private.is_member_pair_blocked(uuid) is
  'Private RLS helper: returns true when either current member or the other member blocked the pair. Must remain outside PostgREST exposed schemas.';
comment on policy "room_messages_hide_blocked_pairs" on public.room_messages is
  'Restrictive Live Room safety policy: messages are mutually invisible across a blocked member pair.';

commit;

-- PRE-APPLY CHECKLIST
-- 1. Confirm `private` is NOT in the Supabase/PostgREST exposed-schemas configuration.
-- 2. Verify member A blocking B hides B's messages from A.
-- 3. Verify the same block also hides A's messages from B.
-- 4. Verify neither member can enumerate the other's block rows through public tables/RPC.
-- 5. Verify unblocking restores visibility subject to normal room policies.
-- 6. Keep MEMBER_BLOCKING_ENABLED=false until pairwise chat/connection enforcement is also implemented and tested.
