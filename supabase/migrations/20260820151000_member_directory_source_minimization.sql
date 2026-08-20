-- One2OneLove relaunch: minimize the synchronized member-directory source itself.
-- DEVELOPMENT MIGRATION ONLY. Apply to production only through explicit Approval #8C-A.
--
-- Why this follow-up exists:
-- Approval #8C correctly minimized public.member_directory, but its synchronized source
-- public.user_directory_profiles still retained relationship_status, user_type, location
-- and interests while authenticated members had SELECT access to support a
-- security_invoker view. That makes those source columns discoverable to signed-in users.
--
-- This migration removes the unnecessary private fields from the synchronized source so
-- both the source table and its public view contain only the five member-discovery fields
-- actually used by Buddy Finder and pairwise Chat.

begin;

-- Rebuild the sync helper first so future user writes never expect the fields we are
-- about to remove from the synchronized source table.
create or replace function o2ol_private.sync_user_directory_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(new.user_type, 'regular') <> 'regular' then
    delete from public.user_directory_profiles where id = new.id;
    return new;
  end if;

  insert into public.user_directory_profiles (
    id,
    name,
    avatar_url,
    bio,
    created_at
  ) values (
    new.id,
    new.name,
    new.avatar_url,
    new.bio,
    coalesce(new.created_at, now())
  )
  on conflict (id) do update set
    name = excluded.name,
    avatar_url = excluded.avatar_url,
    bio = excluded.bio;

  return new;
end;
$$;

revoke all on function o2ol_private.sync_user_directory_profile() from public, anon, authenticated;

-- The existing view depends on user_type, so remove it before minimizing the source.
drop view if exists public.member_directory;

drop index if exists public.user_directory_profiles_user_type_idx;

alter table public.user_directory_profiles
  drop column if exists relationship_status,
  drop column if exists user_type,
  drop column if exists location,
  drop column if exists interests,
  drop column if exists updated_at;

-- Remove any non-regular account that might already be present, then reconcile regular
-- accounts. Current production audit shows all 11 existing accounts are regular, so this
-- is expected to preserve all current directory rows.
delete from public.user_directory_profiles d
where not exists (
  select 1
  from public.users u
  where u.id = d.id
    and coalesce(u.user_type, 'regular') = 'regular'
);

insert into public.user_directory_profiles (
  id,
  name,
  avatar_url,
  bio,
  created_at
)
select
  u.id,
  u.name,
  u.avatar_url,
  u.bio,
  coalesce(u.created_at, now())
from public.users u
where coalesce(u.user_type, 'regular') = 'regular'
on conflict (id) do update set
  name = excluded.name,
  avatar_url = excluded.avatar_url,
  bio = excluded.bio;

alter table public.user_directory_profiles enable row level security;
revoke all on table public.user_directory_profiles from public, anon, authenticated;
grant select on table public.user_directory_profiles to authenticated;

drop policy if exists "authenticated users can read directory profiles" on public.user_directory_profiles;
create policy "authenticated users can read directory profiles"
  on public.user_directory_profiles
  for select
  to authenticated
  using (true);

create view public.member_directory
with (security_barrier = true, security_invoker = true)
as
select
  d.id,
  d.name,
  d.avatar_url,
  d.bio,
  d.created_at
from public.user_directory_profiles d;

revoke all on public.member_directory from public, anon, authenticated;
grant select on public.member_directory to authenticated;

comment on table public.user_directory_profiles is
  'Minimal synchronized member-discovery source containing only id, display name, optional avatar, short bio and member-since date. No email, location, relationship status, interests, account type, partner, verification, subscription or billing fields.';
comment on view public.member_directory is
  'Authenticated regular-member discovery projection: id, display name, optional avatar, short bio and member-since date only.';

commit;

-- CONTROLLED TESTS BEFORE PRODUCTION APPROVAL
-- 1. user_directory_profiles columns are exactly id/name/avatar_url/bio/created_at.
-- 2. Existing 11 regular accounts remain represented.
-- 3. member_directory columns remain exactly id/name/avatar_url/bio/created_at.
-- 4. Anonymous roles cannot SELECT source table or view.
-- 5. Authenticated users can SELECT only the five safe discovery fields because no
--    additional fields remain in the source table.
-- 6. Updating a regular user's safe profile fields keeps the source synchronized.
-- 7. Changing an account to a non-regular user_type removes it from discovery.
