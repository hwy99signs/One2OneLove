-- One2OneLove relaunch: privacy-safe member directory
-- DEVELOPMENT MIGRATION ONLY. Do not apply to production without explicit approval.
--
-- The legacy buddy finder read directly from public.users and historically exposed
-- account email and other private profile fields. This earliest projection must never
-- be broader than the final relaunch directory, even though a later migration replaces
-- the source with the synchronized privacy-safe user_directory_profiles table.
--
-- Relaunch default discovery contract:
--   discoverable to authenticated members: id, display name, optional avatar,
--   short bio, member-since date.
--   not exposed: email, location, relationship status, partner information, interests,
--   role/account type, verification metadata, billing/subscription fields, or other
--   account-private values.
--
-- Professional roles have separate review/application flows and are not included in
-- the ordinary social member directory.

create or replace view public.member_directory
with (security_barrier = true, security_invoker = true)
as
select
  id,
  name,
  avatar_url,
  bio,
  created_at
from public.users
where coalesce(is_active, true) = true
  and coalesce(user_type, 'regular') = 'regular';

revoke all on public.member_directory from public;
revoke all on public.member_directory from anon;
grant select on public.member_directory to authenticated;

comment on view public.member_directory is
  'Authenticated regular-member discovery projection. Default exposes only id, display name, optional avatar, short bio and member-since date. A later migration moves the projection to the synchronized privacy-safe source.';
