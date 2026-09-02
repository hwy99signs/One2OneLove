-- One2OneLove relaunch: finish the remaining advisor-reported auth.uid()
-- initplan optimizations without changing RLS authorization semantics.
--
-- STAGED ONLY: do not apply to the live project without a new explicit
-- production-change approval gate.
--
-- This migration is intentionally restricted to the One2OneLove tables that
-- still produced auth_rls_initplan warnings after the first approved pass.
-- It aborts and rolls back if the live policy set no longer matches the exact
-- 64-policy inventory verified on 2026-09-02.

begin;

do $$
declare
  policy_row record;
  optimized_using text;
  optimized_check text;
  ddl text;
  optimized_count integer := 0;
begin
  for policy_row in
    select tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and tablename = any (array[
        'gamification_points',
        'badges',
        'memories',
        'custom_date_ideas',
        'sent_love_notes',
        'scheduled_love_notes',
        'buddy_matches',
        'story_helpful',
        'therapist_profiles',
        'success_stories',
        'message_reactions',
        'starred_messages',
        'pinned_messages',
        'forwarded_messages',
        'relationship_milestones',
        'post_shares',
        'story_likes',
        'comment_likes',
        'contact_messages',
        'communities',
        'community_posts',
        'post_comments',
        'post_likes'
      ])
      and (
        (
          qual is not null
          and qual ~ 'auth\.uid\(\)'
          and qual !~* 'select[[:space:]]+auth\.uid\(\)'
        )
        or (
          with_check is not null
          and with_check ~ 'auth\.uid\(\)'
          and with_check !~* 'select[[:space:]]+auth\.uid\(\)'
        )
      )
    order by tablename, policyname
  loop
    optimized_using := policy_row.qual;
    optimized_check := policy_row.with_check;

    if optimized_using is not null
       and optimized_using ~ 'auth\.uid\(\)'
       and optimized_using !~* 'select[[:space:]]+auth\.uid\(\)' then
      optimized_using := replace(
        optimized_using,
        'auth.uid()',
        '(select auth.uid())'
      );
    end if;

    if optimized_check is not null
       and optimized_check ~ 'auth\.uid\(\)'
       and optimized_check !~* 'select[[:space:]]+auth\.uid\(\)' then
      optimized_check := replace(
        optimized_check,
        'auth.uid()',
        '(select auth.uid())'
      );
    end if;

    ddl := format(
      'alter policy %I on public.%I',
      policy_row.policyname,
      policy_row.tablename
    );

    if optimized_using is not null then
      ddl := ddl || format(' using (%s)', optimized_using);
    end if;

    if optimized_check is not null then
      ddl := ddl || format(' with check (%s)', optimized_check);
    end if;

    execute ddl;
    optimized_count := optimized_count + 1;
  end loop;

  if optimized_count <> 64 then
    raise exception
      'One2OneLove RLS initplan inventory changed: expected 64 policies, found %',
      optimized_count;
  end if;
end
$$;

commit;
