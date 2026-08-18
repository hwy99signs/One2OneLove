-- One2OneLove relaunch: community membership RLS hardening
-- DEVELOPMENT MIGRATION ONLY. Apply to production only through an approved batch.
--
-- Legacy risks addressed here:
--   * community_members admin policy recursively queried community_members;
--   * any authenticated member could INSERT their own row with role='admin';
--   * a joining member could choose an approval-bypassing status;
--   * community creators depended on a browser-supplied `asAdmin` insert;
--   * a moderator/admin could mutate the creator's protected admin membership.

begin;

alter table public.community_members enable row level security;

create or replace function public.is_community_active_member(p_community_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and exists (
    select 1
    from public.community_members cm
    where cm.community_id = p_community_id
      and cm.user_id = auth.uid()
      and cm.status = 'active'
  );
$$;

create or replace function public.is_community_moderator_or_admin(p_community_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and exists (
    select 1
    from public.community_members cm
    where cm.community_id = p_community_id
      and cm.user_id = auth.uid()
      and cm.role in ('admin', 'moderator')
      and cm.status = 'active'
  );
$$;

revoke all on function public.is_community_active_member(uuid) from public;
revoke all on function public.is_community_moderator_or_admin(uuid) from public;
grant execute on function public.is_community_active_member(uuid) to authenticated;
grant execute on function public.is_community_moderator_or_admin(uuid) to authenticated;

-- The database, not the browser, grants the creator's initial admin role.
create or replace function public.ensure_community_creator_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.community_members (community_id, user_id, role, status)
  values (new.id, new.creator_id, 'admin', 'active')
  on conflict (community_id, user_id)
  do update set role = 'admin', status = 'active';
  return new;
end;
$$;

revoke all on function public.ensure_community_creator_membership() from public;

drop trigger if exists ensure_community_creator_membership on public.communities;
create trigger ensure_community_creator_membership
after insert on public.communities
for each row execute function public.ensure_community_creator_membership();

-- Protect the creator's admin row from browser demotion/removal. Deleting the community
-- itself still cascades the membership through trusted database execution.
create or replace function public.protect_community_creator_membership()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  creator_id uuid;
begin
  if auth.role() is null or auth.role() = 'service_role' then
    return coalesce(new, old);
  end if;

  select c.creator_id into creator_id
  from public.communities c
  where c.id = old.community_id;

  if old.user_id = creator_id then
    raise exception 'The community creator admin membership cannot be changed directly';
  end if;

  return coalesce(new, old);
end;
$$;

revoke all on function public.protect_community_creator_membership() from public;

drop trigger if exists protect_community_creator_membership on public.community_members;
create trigger protect_community_creator_membership
before update or delete on public.community_members
for each row execute function public.protect_community_creator_membership();

-- Member-list visibility: a member can always see their own row; otherwise the viewer
-- must already be an active member. Public community discovery does not expose the raw
-- membership roster/user UUIDs to nonmembers.
drop policy if exists "Users can view community members" on public.community_members;
create policy "Members can view community members"
on public.community_members
for select
to authenticated
using (
  auth.uid() = user_id
  or public.is_community_active_member(community_id)
);

-- Self-service join is member-role only, only for a public community, and status must
-- match the community's approval setting. This closes browser role/status escalation.
drop policy if exists "Users can join communities" on public.community_members;
create policy "Users can safely join public communities"
on public.community_members
for insert
to authenticated
with check (
  auth.uid() = user_id
  and role = 'member'
  and exists (
    select 1
    from public.communities c
    where c.id = community_id
      and c.is_public = true
      and status = case when c.requires_approval then 'pending' else 'active' end
  )
);

-- Members may leave only their own non-creator row; the trigger protects creators.
drop policy if exists "Users can leave communities" on public.community_members;
create policy "Users can leave communities"
on public.community_members
for delete
to authenticated
using (auth.uid() = user_id);

-- RLS-safe moderator/admin management replaces the recursive legacy policy.
drop policy if exists "Admins can manage members" on public.community_members;
create policy "Admins can manage members"
on public.community_members
for all
to authenticated
using (public.is_community_moderator_or_admin(community_id))
with check (public.is_community_moderator_or_admin(community_id));

comment on function public.is_community_active_member(uuid) is
  'RLS-safe active-membership check for private community membership visibility.';
comment on function public.is_community_moderator_or_admin(uuid) is
  'RLS-safe moderator/admin role check used to avoid recursive community_members policies.';
comment on function public.ensure_community_creator_membership() is
  'Database-created active admin membership for each new community creator; browser cannot self-assign this role.';

commit;

-- CONTROLLED TESTS
-- 1. Creating a community automatically creates one active admin row for the creator.
-- 2. A normal member can join a public no-approval community only as active/member.
-- 3. A normal member joins an approval-required public community only as pending/member.
-- 4. Browser attempts to join as moderator/admin or force active status are rejected.
-- 5. A nonmember cannot enumerate another public community's membership rows.
-- 6. Creator admin membership cannot be demoted/deleted directly.
-- 7. Existing admin/moderator management still works without RLS recursion.
