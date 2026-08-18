-- One2OneLove relaunch: community membership RLS hardening
-- DEVELOPMENT MIGRATION ONLY. Do not apply to production without explicit approval.
--
-- The legacy "Admins can manage members" policy queries community_members from
-- inside a community_members policy. On PostgreSQL/Supabase that can recurse
-- through RLS. This helper performs the role lookup as a narrowly scoped
-- SECURITY DEFINER function, then the policy calls the helper instead.

create or replace function public.is_community_moderator_or_admin(p_community_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.community_members cm
    where cm.community_id = p_community_id
      and cm.user_id = auth.uid()
      and cm.role in ('admin', 'moderator')
      and cm.status = 'active'
  );
$$;

revoke all on function public.is_community_moderator_or_admin(uuid) from public;
grant execute on function public.is_community_moderator_or_admin(uuid) to authenticated;

drop policy if exists "Admins can manage members" on public.community_members;

create policy "Admins can manage members"
on public.community_members
for all
to authenticated
using (public.is_community_moderator_or_admin(community_id))
with check (public.is_community_moderator_or_admin(community_id));

comment on function public.is_community_moderator_or_admin(uuid) is
  'RLS-safe membership role check used to avoid recursive community_members policies.';
