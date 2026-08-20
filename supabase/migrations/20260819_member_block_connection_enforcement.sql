-- One2OneLove connection/request enforcement for member blocks.
-- DEVELOPMENT MIGRATION ONLY. Do not apply to live Supabase until explicitly approved.
-- Depends on private.is_member_pair_blocked(uuid).
--
-- This migration detects reviewed pair-table shapes used by common/legacy relaunch
-- connection models and adds RESTRICTIVE SELECT/INSERT/UPDATE policies. It intentionally
-- leaves DELETE unrestricted by the block boundary so either side can still remove an
-- old request/connection through whatever normal ownership policy already exists.

begin;

do $$
declare
  candidate record;
  matched_count integer := 0;
  select_policy text;
  insert_policy text;
  update_policy text;
  other_member_expression text;
begin
  for candidate in
    select * from (values
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
        'create policy %I on public.%I as restrictive for select to authenticated using (not private.is_member_pair_blocked(%s))',
        select_policy,
        candidate.table_name,
        other_member_expression
      );

      execute format('drop policy if exists %I on public.%I', insert_policy, candidate.table_name);
      execute format(
        'create policy %I on public.%I as restrictive for insert to authenticated with check (not private.is_member_pair_blocked(%s))',
        insert_policy,
        candidate.table_name,
        other_member_expression
      );

      execute format('drop policy if exists %I on public.%I', update_policy, candidate.table_name);
      execute format(
        'create policy %I on public.%I as restrictive for update to authenticated using (not private.is_member_pair_blocked(%s)) with check (not private.is_member_pair_blocked(%s))',
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
end $$;

commit;

-- PRE-APPLY CHECKLIST
-- 1. Review the target database schema and confirm every detected pair table is expected.
-- 2. If a new/renamed connection table exists, add its reviewed pair columns before applying.
-- 3. Verify blocked pairs cannot SELECT/INSERT/UPDATE requests or accepted connections.
-- 4. Verify DELETE behavior remains governed only by normal ownership policies so cleanup is possible.
-- 5. Verify unrelated member pairs are unaffected.
-- 6. Discovery/Buddy Finder exclusion remains a separate required activation dependency.
