-- One2OneLove privacy-safe social directory
-- Separates social-discovery fields from private account/billing data.

begin;

create table if not exists public.user_directory_profiles (
  id uuid primary key references public.users(id) on delete cascade,
  name text,
  avatar_url text,
  bio text,
  relationship_status text,
  user_type text not null default 'regular',
  location text,
  interests jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_directory_profiles enable row level security;
revoke all on table public.user_directory_profiles from anon, authenticated;
grant select on table public.user_directory_profiles to authenticated;

drop policy if exists "authenticated users can read directory profiles" on public.user_directory_profiles;
create policy "authenticated users can read directory profiles"
on public.user_directory_profiles
for select
to authenticated
using (true);

create or replace function public.sync_user_directory_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_directory_profiles (
    id,
    name,
    avatar_url,
    bio,
    relationship_status,
    user_type,
    location,
    interests,
    created_at,
    updated_at
  ) values (
    new.id,
    new.name,
    new.avatar_url,
    new.bio,
    new.relationship_status,
    coalesce(new.user_type, 'regular'),
    new.location,
    new.interests,
    coalesce(new.created_at, now()),
    coalesce(new.updated_at, now())
  )
  on conflict (id) do update set
    name = excluded.name,
    avatar_url = excluded.avatar_url,
    bio = excluded.bio,
    relationship_status = excluded.relationship_status,
    user_type = excluded.user_type,
    location = excluded.location,
    interests = excluded.interests,
    updated_at = excluded.updated_at;

  return new;
end;
$$;

revoke execute on function public.sync_user_directory_profile() from public, anon, authenticated;

drop trigger if exists sync_user_directory_profile on public.users;
create trigger sync_user_directory_profile
after insert or update of name, avatar_url, bio, relationship_status, user_type, location, interests, updated_at
on public.users
for each row execute function public.sync_user_directory_profile();

insert into public.user_directory_profiles (
  id,
  name,
  avatar_url,
  bio,
  relationship_status,
  user_type,
  location,
  interests,
  created_at,
  updated_at
)
select
  id,
  name,
  avatar_url,
  bio,
  relationship_status,
  coalesce(user_type, 'regular'),
  location,
  interests,
  coalesce(created_at, now()),
  coalesce(updated_at, now())
from public.users
on conflict (id) do update set
  name = excluded.name,
  avatar_url = excluded.avatar_url,
  bio = excluded.bio,
  relationship_status = excluded.relationship_status,
  user_type = excluded.user_type,
  location = excluded.location,
  interests = excluded.interests,
  updated_at = excluded.updated_at;

create index if not exists user_directory_profiles_name_idx
on public.user_directory_profiles (lower(name));

create index if not exists user_directory_profiles_user_type_idx
on public.user_directory_profiles (user_type);

commit;
