-- Opt-in partner sharing for Shared Journals.
-- Existing entries remain private because the new flag defaults to false.

alter table public.shared_journals
  add column if not exists shared_with_partner boolean not null default false;

create or replace function private.is_mutual_partner_pair(
  p_owner_user_id uuid,
  p_viewer_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.users owner_profile
    join auth.users owner_auth on owner_auth.id = owner_profile.id
    join public.users viewer_profile on viewer_profile.id = p_viewer_user_id
    join auth.users viewer_auth on viewer_auth.id = viewer_profile.id
    where owner_profile.id = p_owner_user_id
      and p_owner_user_id <> p_viewer_user_id
      and nullif(btrim(owner_profile.partner_email), '') is not null
      and nullif(btrim(viewer_profile.partner_email), '') is not null
      and lower(btrim(owner_profile.partner_email)) = lower(viewer_auth.email)
      and lower(btrim(viewer_profile.partner_email)) = lower(owner_auth.email)
  );
$$;

revoke all on function private.is_mutual_partner_pair(uuid, uuid) from public;
grant usage on schema private to authenticated;
grant execute on function private.is_mutual_partner_pair(uuid, uuid) to authenticated;

drop policy if exists "Mutual partners can view shared journal entries" on public.shared_journals;
create policy "Mutual partners can view shared journal entries"
on public.shared_journals
for select
to authenticated
using (
  shared_with_partner = true
  and private.is_mutual_partner_pair(user_id, auth.uid())
);
