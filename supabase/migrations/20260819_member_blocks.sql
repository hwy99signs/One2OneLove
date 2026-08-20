-- One2OneLove private member blocking foundation.
-- DEVELOPMENT MIGRATION ONLY. Do not apply to live Supabase until explicitly approved.
--
-- This table records a one-way personal safety decision. It is intentionally not a
-- public/member-directory attribute. Only the blocker may read their own block list;
-- writes are backend mediated so callers cannot forge blocker ownership.

begin;

create table if not exists public.member_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index if not exists member_blocks_blocked_idx
  on public.member_blocks (blocked_id, blocker_id);

alter table public.member_blocks enable row level security;

revoke all on table public.member_blocks from anon, authenticated;
grant select on table public.member_blocks to authenticated;

drop policy if exists "member_blocks_select_own" on public.member_blocks;
create policy "member_blocks_select_own"
on public.member_blocks for select
to authenticated
using ((select auth.uid()) = blocker_id);

comment on table public.member_blocks is
  'Private one-way member safety blocks. Only the blocker can read their list; block/unblock writes are backend mediated.';

commit;

-- PRE-APPLY CHECKLIST
-- 1. Keep VITE_MEMBER_BLOCKING_ENABLED=false and MEMBER_BLOCKING_ENABLED=false.
-- 2. Verify anon has zero privileges.
-- 3. Verify authenticated members can SELECT only rows where they are blocker_id.
-- 4. Verify authenticated browser roles cannot INSERT/UPDATE/DELETE blocks directly.
-- 5. Verify blocker_id <> blocked_id is enforced.
-- 6. Apply chat/community policy hardening only after this table exists and is tested.
