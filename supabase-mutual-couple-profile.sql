-- One2OneLove mutual couple-profile lookup
-- Keeps public.users private while allowing a signed-in member to resolve only
-- the safe directory profile of a mutually linked partner.

begin;

create or replace function public.get_mutual_partner_directory_profile()
returns table (
  id uuid,
  name text,
  avatar_url text,
  bio text,
  relationship_status text,
  location text,
  interests jsonb,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  with actor as (
    select u.id, u.email, u.partner_email
    from public.users u
    where u.id = (select auth.uid())
      and u.email is not null
      and u.partner_email is not null
      and btrim(u.partner_email) <> ''
    limit 1
  ),
  mutual_partner as (
    select partner.id
    from actor
    join public.users partner
      on lower(partner.email) = lower(actor.partner_email)
     and partner.partner_email is not null
     and lower(partner.partner_email) = lower(actor.email)
    limit 1
  )
  select
    directory.id,
    directory.name,
    directory.avatar_url,
    directory.bio,
    directory.relationship_status,
    directory.location,
    directory.interests,
    directory.created_at
  from mutual_partner
  join public.user_directory_profiles directory
    on directory.id = mutual_partner.id;
$$;

revoke execute on function public.get_mutual_partner_directory_profile() from public, anon;
grant execute on function public.get_mutual_partner_directory_profile() to authenticated;

comment on function public.get_mutual_partner_directory_profile() is
  'Returns only safe directory fields for the caller''s reciprocally linked partner. No arbitrary user id or email input is accepted.';

commit;
