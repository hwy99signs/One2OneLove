-- One2OneLove relaunch: privacy-safe member directory
-- DEVELOPMENT MIGRATION ONLY. Do not apply to production without explicit approval.
--
-- The legacy buddy finder read directly from public.users and historically exposed
-- account email and other private profile fields. This view is the only projection
-- the member-discovery UI should use.
--
-- Relaunch privacy contract:
--   discoverable to authenticated members: id, name, avatar, short bio, general
--   location, relationship status, member-since date.
--   not exposed: email, partner information, interests, role/account type,
--   verification metadata, billing/subscription fields, or other private values.
--
-- Professional roles have separate review/application flows and are not included in
-- the ordinary social member directory.

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

comment on view public.member_directory is
  'Authenticated regular-member discovery projection. Intentionally excludes email, partner data, interests, role/account type, billing and other account-private fields.';
