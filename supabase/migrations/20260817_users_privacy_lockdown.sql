-- One2OneLove relaunch: users-table privacy lockdown
-- DEVELOPMENT MIGRATION ONLY. Do not apply to production until every member-facing
-- consumer has been moved to public.member_directory (or another purpose-built view).
--
-- Goal:
--   * public.users remains the private account/profile record.
--   * authenticated members may read only their own full users row.
--   * member discovery uses public.member_directory, which intentionally excludes
--     email, partner_email, verification, subscription/billing and other private data.
--   * service_role remains unaffected because it bypasses RLS.

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

-- Canonical own-profile read policy for the relaunch.
drop policy if exists "Users can view own profile" on public.users;
create policy "Users can view own profile"
on public.users
for select
to authenticated
using (auth.uid() = id);

-- Defense-in-depth: ensure the public member projection still exposes only the
-- intentionally public profile fields. The view is owner-executed by design so it
-- can provide a safe directory even though public.users is own-row only under RLS.
create or replace view public.member_directory
with (security_barrier = true)
as
select
  id,
  name,
  avatar_url,
  bio,
  relationship_status,
  user_type,
  location,
  interests,
  created_at
from public.users
where coalesce(is_active, true) = true;

revoke all on public.member_directory from public;
revoke all on public.member_directory from anon;
grant select on public.member_directory to authenticated;

comment on table public.users is
  'Private authenticated account/profile data. Full rows are readable only by the owning user (service_role bypasses RLS).';
comment on view public.member_directory is
  'Authenticated member-discovery projection. Intentionally excludes email and other account-private fields.';

commit;

-- PRE-APPLY CHECKLIST:
-- 1. Buddy finder uses public.member_directory. (staged)
-- 2. Pairwise chat/profile lookups no longer depend on broad public.users reads.
-- 3. Any community/member-card lookup uses a purpose-built projection.
-- 4. Test own profile load/update, buddy finder, chat, community and admin workflows.
-- 5. Keep a rollback script ready before applying to live data.
