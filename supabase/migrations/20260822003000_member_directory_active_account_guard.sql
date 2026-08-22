-- One2OneLove #8C final directory active-account guard.
-- DEVELOPMENT MIGRATION ONLY. Apply to production only through explicit Approval #8C.
--
-- The earliest privacy-safe member-directory projection already excluded inactive
-- accounts, but the later synchronized-source reconciliation filtered only on user_type.
-- This final guard restores the intended contract for both fresh and drifted databases:
-- ordinary discovery contains only active regular accounts.

begin;

create or replace function o2ol_private.sync_user_directory_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(new.user_type, 'regular') <> 'regular'
     or coalesce(new.is_active, true) <> true then
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

drop trigger if exists sync_user_directory_profile on public.users;
create trigger sync_user_directory_profile
after insert or update of name, avatar_url, bio, user_type, is_active
on public.users
for each row execute function o2ol_private.sync_user_directory_profile();

-- Remove any stale row that is no longer an active ordinary member.
delete from public.user_directory_profiles d
where not exists (
  select 1
  from public.users u
  where u.id = d.id
    and coalesce(u.user_type, 'regular') = 'regular'
    and coalesce(u.is_active, true) = true
);

-- Reconcile every active regular account into the five-field synchronized source.
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
  and coalesce(u.is_active, true) = true
on conflict (id) do update set
  name = excluded.name,
  avatar_url = excluded.avatar_url,
  bio = excluded.bio;

comment on function o2ol_private.sync_user_directory_profile() is
  'Synchronizes only active regular accounts into the minimal five-field member directory; inactive or non-regular accounts are removed.';

commit;

-- CONTROLLED TESTS BEFORE PRODUCTION APPROVAL
-- 1. Deactivating a regular account removes it from user_directory_profiles/member_directory.
-- 2. Reactivating a regular account restores its current five safe discovery fields.
-- 3. Changing user_type away from regular removes the account from ordinary discovery.
-- 4. Anonymous roles remain unable to read source/view.
-- 5. Active regular account count equals the synchronized directory count, subject only
--    to any separately approved visibility/block restrictions.
