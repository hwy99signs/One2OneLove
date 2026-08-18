-- One2OneLove relaunch: privacy-safe member directory
-- DEVELOPMENT MIGRATION ONLY. Do not apply to production without explicit approval.
--
-- The legacy buddy finder reads directly from public.users and historically exposed
-- account email and other private profile fields. This view is the only projection
-- the member-discovery UI should use. It intentionally contains no email,
-- partner_email, verification metadata, billing/subscription fields, or other
-- account-private values.

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

comment on view public.member_directory is
  'Authenticated member-discovery projection. Intentionally excludes email and other account-private fields.';
