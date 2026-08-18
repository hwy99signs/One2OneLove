-- One2OneLove relaunch: community membership RLS hardening
-- DEVELOPMENT MIGRATION ONLY. Apply to production only through an approved batch.
--
-- Legacy risks addressed here:
--   * community_members admin policy recursively queried community_members;
--   * any authenticated member could INSERT their own row with role='admin';
--   * a joining member could choose an approval-bypassing status;
--   * community creators depended on a browser-supplied `asAdmin` insert;
--   * moderators could promote themselves/others to admin through the broad policy;
--   * membership identity/routing fields could otherwise be rewritten.

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

-- Field/role boundary for UPDATE/DELETE on membership rows.
create or replace function public.enforce_community_membership_management()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  creator_id uuid;
  actor_role text;
begin
  if auth.role() is null or auth.role() = 'service_role' then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select c.creator_id into creator_id
  from public.communities c
  where c.id = old.community_id;

  -- Creator membership is structural. The current legacy client still attempts a
  -- duplicate creator-admin join immediately after creating a community. The database
  -- trigger above already created that row, so permit only a true no-op creator UPDATE
  -- for compatibility; demotion, rerouting and deletion remain blocked.
  if old.user_id = creator_id then
    if tg_op = 'DELETE' then
      raise exception 'The community creator admin membership cannot be deleted directly';
    end if;

    if new.id is distinct from old.id
       or new.community_id is distinct from old.community_id
       or new.user_id is distinct from old.user_id
       or new.joined_at is distinct from old.joined_at
       or new.role is distinct from old.role
       or new.status is distinct from old.status then
      raise exception 'The community creator admin membership cannot be changed directly';
    end if;

    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.id is distinct from old.id
       or new.community_id is distinct from old.community_id
       or new.user_id is distinct from old.user_id
       or new.joined_at is distinct from old.joined_at then
      raise exception 'Community membership identity fields are immutable';
    end if;
  end if;

  select cm.role into actor_role
  from public.community_members cm
  where cm.community_id = old.community_id
    and cm.user_id = auth.uid()
    and cm.status = 'active'
  limit 1;

  if actor_role = 'moderator' then
    -- Moderators may manage the status of ordinary members only. They cannot alter
    -- roles, manage another moderator/admin, or promote themselves.
    if old.role <> 'member' then
      raise exception 'Moderators cannot manage moderator/admin memberships';
    end if;
    if tg_op = 'UPDATE' and new.role is distinct from old.role then
      raise exception 'Moderators cannot change member roles';
    end if;
  elsif actor_role = 'admin' then
    -- Admin management is allowed; the creator and immutable fields remain protected.
    null;
  elsif tg_op = 'DELETE' and auth.uid() = old.user_id and old.role = 'member' then
    -- Ordinary members may leave their own membership.
    null;
  else
    raise exception 'You are not allowed to manage this community membership';
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function public.enforce_community_membership_management() from public;

drop trigger if exists protect_community_creator_membership on public.community_members;
drop trigger if exists enforce_community_membership_management on public.community_members;
create trigger enforce_community_membership_management
before update or delete on public.community_members
for each row execute function public.enforce_community_membership_management();

-- Member-list visibility: a member can always see their own row; otherwise the viewer
-- must already be an active member. Public community discovery does not expose the raw
-- membership roster/user UUIDs to nonmembers.
drop policy if exists "Users can view community members" on public.community_members;
drop policy if exists "Members can view community members" on public.community_members;
create policy "Members can view community members"
on public.community_members
for select
to authenticated
using (
  auth.uid() = user_id
  or public.is_community_active_member(community_id)
);

-- Self-service join is member-role only for normal members. The creator-admin branch is
-- narrowly allowed only for the existing creator of that exact community so the legacy
-- duplicate `joinCommunity(..., true)` call can reach its unique-conflict/no-op path.
drop policy if exists "Users can join communities" on public.community_members;
drop policy if exists "Users can safely join public communities" on public.community_members;
create policy "Users can safely join public communities"
on public.community_members
for insert
to authenticated
with check (
  auth.uid() = user_id
  and (
    (
      role = 'member'
      and exists (
        select 1
        from public.communities c
        where c.id = community_id
          and c.is_public = true
          and status = case when c.requires_approval then 'pending' else 'active' end
      )
    )
    or
    (
      role = 'admin'
      and status = 'active'
      and exists (
        select 1
        from public.communities c
        where c.id = community_id
          and c.creator_id = auth.uid()
      )
    )
  )
);

-- Members may leave only their own non-creator row; the trigger supplies the role check.
drop policy if exists "Users can leave communities" on public.community_members;
create policy "Users can leave communities"
on public.community_members
for delete
to authenticated
using (auth.uid() = user_id);

-- RLS-safe moderator/admin management replaces the recursive legacy policy. The trigger
-- above further distinguishes moderator versus admin capabilities.
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
  'Database-created active admin membership for each new community creator; browser cannot self-assign this role to a noncreator.';
comment on function public.enforce_community_membership_management() is
  'Field/role boundary preventing membership rerouting, creator mutation, and moderator role escalation while permitting the legacy creator duplicate-join no-op.';

commit;

-- CONTROLLED TESTS
-- 1. Creating a community automatically creates one active admin row for the creator.
-- 2. The legacy follow-up creator admin join resolves as a safe duplicate/no-op rather than failing community creation.
-- 3. A normal member can join a public no-approval community only as active/member.
-- 4. A normal member joins an approval-required public community only as pending/member.
-- 5. A noncreator attempt to join as moderator/admin or force active status is rejected.
-- 6. A nonmember cannot enumerate another public community's membership rows.
-- 7. Creator admin membership cannot be demoted/deleted/rerouted directly.
-- 8. Moderator can manage ordinary-member status but cannot change roles or manage admin/moderator rows.
-- 9. Admin can manage non-creator roles/status while membership identity fields remain immutable.
-- 10. Existing admin/moderator management works without RLS recursion.
