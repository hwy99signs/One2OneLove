-- One2OneLove connection/request enforcement for member blocks.
-- DEVELOPMENT MIGRATION ONLY. Do not apply to live Supabase until explicitly approved.
-- Depends on o2ol_private.is_member_pair_blocked(uuid).
--
-- This migration covers the current relaunch `buddy_requests` model first, then reviewed
-- legacy pair-table shapes. It adds RESTRICTIVE SELECT/INSERT/UPDATE policies and leaves
-- DELETE governed by existing ownership policies. Pending pair requests are removed by the
-- separate cleanup trigger. Accepted-connection deletion versus suppression remains an
-- explicit product decision and is not silently chosen here.

begin;

do $$
declare
  candidate record;
  matched_count integer := 0;
  current_buddy_model_found boolean := false;
  select_policy text;
  insert_policy text;
  update_policy text;
  other_member_expression text;
begin
  for candidate in
    select * from (values
      ('buddy_requests',       'from_user_id', 'to_user_id'),
      ('friend_requests',      'sender_id',    'receiver_id'),
      ('connection_requests',  'requester_id', 'recipient_id'),
      ('connections',          'user1_id',     'user2_id'),
      ('friendships',          'user_id',      'friend_id')
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
      if candidate.table_name = 'buddy_requests' then
        current_buddy_model_found := true;
      end if;
      select_policy := candidate.table_name || '_hide_blocked_pairs';
      insert_policy := candidate.table_name || '_prevent_blocked_pair_insert';
      update_policy := candidate.table_name || '_prevent_blocked_pair_update';
      other_member_expression := format(
        'case when %I = (select auth.uid()) then %I else %I end',
        candidate.left_column,
        candidate.right_column,
        candidate.left_column
      );

      execute format('alter table public.%I enable row level security', candidate.table_name);

      execute format('drop policy if exists %I on public.%I', select_policy, candidate.table_name);
      execute format(
        'create policy %I on public.%I as restrictive for select to authenticated using (not o2ol_private.is_member_pair_blocked(%s))',
        select_policy,
        candidate.table_name,
        other_member_expression
      );

      execute format('drop policy if exists %I on public.%I', insert_policy, candidate.table_name);
      execute format(
        'create policy %I on public.%I as restrictive for insert to authenticated with check (not o2ol_private.is_member_pair_blocked(%s))',
        insert_policy,
        candidate.table_name,
        other_member_expression
      );

      execute format('drop policy if exists %I on public.%I', update_policy, candidate.table_name);
      execute format(
        'create policy %I on public.%I as restrictive for update to authenticated using (not o2ol_private.is_member_pair_blocked(%s)) with check (not o2ol_private.is_member_pair_blocked(%s))',
        update_policy,
        candidate.table_name,
        other_member_expression,
        other_member_expression
      );
    end if;
  end loop;

  if matched_count = 0 then
    raise exception 'NO_REVIEWED_MEMBER_CONNECTION_PAIR_TABLE_FOUND';
  end if;

  -- The relaunch application currently uses buddy_requests. Refuse a future activation if
  -- that expected model disappears instead of quietly protecting only obsolete tables.
  if not current_buddy_model_found then
    raise exception 'O2OL_CURRENT_BUDDY_REQUEST_MODEL_MISSING';
  end if;
end $$;

commit;

-- PRE-APPLY CHECKLIST
-- 1. Verify `public.buddy_requests(from_user_id,to_user_id,status)` is still the active relaunch connection model.
-- 2. Review any additional detected legacy pair tables and confirm they are expected.
-- 3. Confirm o2ol_private is not an exposed PostgREST schema and anon has no USAGE.
-- 4. Verify blocked pairs cannot SELECT/INSERT/UPDATE pending, rejected, or accepted buddy-request rows.
-- 5. Verify the pending-request cleanup trigger removes pending rows in both directions.
-- 6. Verify DELETE behavior remains governed by normal ownership policies.
-- 7. Verify unrelated member pairs are unaffected.
-- 8. Do not activate until the owner chooses whether accepted connections are permanently severed or merely suppressed while blocked.
