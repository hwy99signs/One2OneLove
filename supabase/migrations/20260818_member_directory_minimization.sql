-- One2OneLove relaunch: member-directory minimization
-- DEVELOPMENT MIGRATION ONLY. Add to Approval Batch 002 before production use.
--
-- This migration preserves the strict five-field default directory and ensures the
-- projection runs with the caller's permissions rather than the view owner's. A later
-- reconciliation migration moves the directory onto a synchronized privacy-safe source
-- so final discovery remains functional without broad access to public.users.

begin;

drop view if exists public.member_directory;
create view public.member_directory
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
  'Authenticated regular-member discovery projection. Relaunch default exposes only id, display name, optional avatar, short bio and member-since date. View execution respects caller privileges until the later synchronized privacy-safe source replaces it.';

commit;
