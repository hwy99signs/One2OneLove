-- One2OneLove relaunch: users-table privacy lockdown
-- DEVELOPMENT MIGRATION ONLY. Do not apply to production until every member-facing
-- consumer has been moved to public.member_directory (or another purpose-built view).
--
-- Goal:
--   * public.users remains the private account/profile record.
--   * authenticated members may read only their own full users row.
--   * member discovery uses public.member_directory, which intentionally excludes
--     email, partner_email, interests, role/account type, verification,
--     subscription/billing and other private data.
--   * service_role remains unaffected because it bypasses RLS.
--
-- Live-drift note (2026-08-20): the connected live users table already has RLS and
-- authenticated own-row SELECT/INSERT/UPDATE policies. public.member_directory is
-- absent live. Do not apply this migration blindly; reconcile the equivalent live
-- own-row policies and preserve the stricter directory projection below.

begin;

alter table public.users enable row level security;

-- Anonymous clients must never read the private users table.
revoke select on table public.users from anon;

-- Authenticated clients still need table SELECT privilege for their own-row RLS
-- policy. RLS below determines which rows they can actually read.
grant select on table public.users to authenticated;

-- Remove any legacy SELECT policy whose predicate is literally TRUE. Those policies
-- are what turn the private profile table into a member-wide directory. This block is
-- deliberately narrow: it does not delete conditional/admin policies.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'users'
      and cmd = 'SELECT'
      and lower(regexp_replace(coalesce(qual, ''), '[()[:space:]]', '', 'g')) = 'true'
  loop
    execute format('drop policy if exists %I on public.users', policy_record.policyname);
  end loop;
end
$$;

-- Normalize the known historical/current own-row policy names to one canonical
-- relaunch policy. Both predicates are equivalent; dropping/recreating inside this
-- transaction prevents duplicate same-purpose policies after an approved cutover.
drop policy if exists "Users can view own profile" on public.users;
drop policy if exists "users can read own account row" on public.users;
create policy "users can read own account row"
on public.users
for select
to authenticated
using ((select auth.uid()) = id);

-- Defense-in-depth: public.member_directory must stay IDENTICAL in sensitivity to the
-- stricter member-directory migration. This file intentionally does NOT expose
-- interests or user_type and limits ordinary discovery to regular active members.
-- Keeping both migration definitions aligned prevents migration-order widening.
create or replace view public.member_directory
with (security_barrier = true)
as
select
  id,
  name,
  avatar_url,
  bio,
  relationship_status,
  location,
  created_at
from public.users
where coalesce(is_active, true) = true
  and coalesce(user_type, 'regular') = 'regular';

revoke all on public.member_directory from public;
revoke all on public.member_directory from anon;
grant select on public.member_directory to authenticated;

comment on table public.users is
  'Private authenticated account/profile data. Full rows are readable only by the owning user (service_role bypasses RLS).';
comment on view public.member_directory is
  'Authenticated regular-member discovery projection. Intentionally excludes email, partner data, interests, role/account type, billing and other account-private fields.';

commit;

-- PRE-APPLY CHECKLIST:
-- 1. Buddy Finder uses public.member_directory. (completed in development)
-- 2. Pairwise chat identity lookups use public.member_directory and no longer request member email. (completed in development)
-- 3. Audit any remaining public/community/member-card consumers for broad public.users reads. (still required)
-- 4. Confirm the live users SELECT policy is still an own-row predicate before any apply.
-- 5. Confirm public.member_directory is absent or has the exact approved seven-column regular-member projection before any apply.
-- 6. Test own profile load/update, Buddy Finder, chat, community and admin workflows against the tightened policy.
-- 7. Keep a rollback script ready before applying to live data.