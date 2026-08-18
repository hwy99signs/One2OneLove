-- One2OneLove relaunch: member-directory minimization
-- DEVELOPMENT MIGRATION ONLY. Add to Approval Batch 002 before production use.
--
-- This supersedes the broader initial directory projection after the relaunch privacy
-- review. Ordinary social discovery does not need a member's location or relationship
-- status by default. Those fields remain private unless a future explicit opt-in
-- visibility model is designed and approved.

begin;

drop view if exists public.member_directory;
create view public.member_directory
with (security_barrier = true)
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
  'Authenticated regular-member discovery projection. Relaunch default exposes only id, display name, optional avatar, short bio and member-since date. Email, location, relationship status, partner data, interests, roles, verification and billing remain private.';

commit;
