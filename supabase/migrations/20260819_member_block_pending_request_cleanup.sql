-- One2OneLove pending connection-request cleanup on member block.
-- DEVELOPMENT MIGRATION ONLY. Do not apply to live Supabase until explicitly approved.
-- Depends on 20260819_member_blocks.sql.
--
-- A new block should immediately neutralize pending contact attempts between the pair.
-- This migration detects reviewed request-table shapes and removes only pending requests.
-- It does NOT delete accepted connections; that remains the explicit Option A vs B product
-- decision documented in MEMBER_BLOCKING_CONNECTION_DECISION.md.

begin;

create or replace function public.cleanup_pending_member_requests_on_block()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  candidate record;
  has_status boolean;
  matched_count integer := 0;
begin
  for candidate in
    select * from (values
      ('friend_requests',     'sender_id',    'receiver_id'),
      ('connection_requests', 'requester_id', 'recipient_id')
    ) as candidates(table_name, left_column, right_column)
  loop
    if exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = candidate.table_name
    ) and exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = candidate.table_name and column_name = candidate.left_column
    ) and exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = candidate.table_name and column_name = candidate.right_column
    ) then
      matched_count := matched_count + 1;

      select exists (
        select 1 from information_schema.columns
        where table_schema = 'public'
          and table_name = candidate.table_name
          and column_name = 'status'
      ) into has_status;

      if has_status then
        execute format(
          'delete from public.%I where ((%I = $1 and %I = $2) or (%I = $2 and %I = $1)) and lower(coalesce(status::text, '''')) in (''pending'',''requested'',''open'')',
          candidate.table_name,
          candidate.left_column,
          candidate.right_column,
          candidate.left_column,
          candidate.right_column
        ) using new.blocker_id, new.blocked_id;
      else
        -- A table explicitly named *_requests with only pair columns represents pending
        -- requests by definition in the reviewed legacy models. Delete the pair row.
        execute format(
          'delete from public.%I where ((%I = $1 and %I = $2) or (%I = $2 and %I = $1))',
          candidate.table_name,
          candidate.left_column,
          candidate.right_column,
          candidate.left_column,
          candidate.right_column
        ) using new.blocker_id, new.blocked_id;
      end if;
    end if;
  end loop;

  -- Do not fail block creation merely because the target deployment has no legacy
  -- request table. The separate connection-enforcement migration performs the stricter
  -- activation-time schema review and fails closed if no reviewed pair table exists.
  return new;
end;
$$;

revoke all on function public.cleanup_pending_member_requests_on_block() from public, anon, authenticated;

drop trigger if exists member_blocks_cleanup_pending_requests on public.member_blocks;
create trigger member_blocks_cleanup_pending_requests
after insert on public.member_blocks
for each row execute function public.cleanup_pending_member_requests_on_block();

comment on function public.cleanup_pending_member_requests_on_block() is
  'Removes pending friend/connection request rows between a newly blocked pair without deleting accepted connection records.';

commit;

-- PRE-APPLY CHECKLIST
-- 1. Review detected request-table shapes in the target database.
-- 2. Verify A -> B pending request is removed when A blocks B.
-- 3. Verify B -> A pending request is removed when A blocks B.
-- 4. Verify accepted connection rows are NOT deleted by this migration.
-- 5. Verify unrelated requests are unaffected.
-- 6. Verify blocking still succeeds if no legacy request table exists.
