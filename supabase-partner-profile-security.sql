-- One2OneLove partner profile security hardening
-- Keeps influencer/professional moderation fields server-controlled.

begin;

alter table public.influencer_profiles enable row level security;
alter table public.professional_profiles enable row level security;

-- Remove broad legacy grants. Service role retains administrative access.
revoke all on table public.influencer_profiles from anon, authenticated;
revoke all on table public.professional_profiles from anon, authenticated;

grant select, insert on table public.influencer_profiles to authenticated;
grant update (
  first_name,
  last_name,
  phone,
  profile_photo_url,
  total_follower_count,
  platform_links,
  content_categories,
  collaboration_types,
  bio,
  media_kit_url,
  updated_at
) on table public.influencer_profiles to authenticated;

grant select, insert on table public.professional_profiles to authenticated;
grant update (
  first_name,
  last_name,
  phone,
  profile_photo_url,
  organization_name,
  practice_type,
  service_description,
  professional_bio,
  website_url,
  updated_at
) on table public.professional_profiles to authenticated;

-- Rebuild creator policies around pending-only self service.
drop policy if exists "Influencers can insert own profile" on public.influencer_profiles;
drop policy if exists "Influencers can update own profile" on public.influencer_profiles;
drop policy if exists "Influencers can view own profile" on public.influencer_profiles;

create policy "influencers can view own profile"
on public.influencer_profiles
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "influencers can create pending own profile"
on public.influencer_profiles
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and status = 'pending'
  and coalesce(email_verified, false) = false
  and coalesce(phone_verified, false) = false
  and rejection_reason is null
  and reviewed_at is null
  and reviewed_by is null
);

create policy "influencers can update own pending profile"
on public.influencer_profiles
for update
to authenticated
using (
  (select auth.uid()) = user_id
  and status = 'pending'
)
with check (
  (select auth.uid()) = user_id
  and status = 'pending'
  and coalesce(email_verified, false) = false
  and coalesce(phone_verified, false) = false
  and rejection_reason is null
  and reviewed_at is null
  and reviewed_by is null
);

drop policy if exists "Professionals can insert own profile" on public.professional_profiles;
drop policy if exists "Professionals can update own profile" on public.professional_profiles;
drop policy if exists "Professionals can view own profile" on public.professional_profiles;

create policy "professionals can view own profile"
on public.professional_profiles
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "professionals can create pending own profile"
on public.professional_profiles
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and status = 'pending'
  and coalesce(email_verified, false) = false
  and coalesce(phone_verified, false) = false
  and rejection_reason is null
  and reviewed_at is null
  and reviewed_by is null
);

create policy "professionals can update own pending profile"
on public.professional_profiles
for update
to authenticated
using (
  (select auth.uid()) = user_id
  and status = 'pending'
)
with check (
  (select auth.uid()) = user_id
  and status = 'pending'
  and coalesce(email_verified, false) = false
  and coalesce(phone_verified, false) = false
  and rejection_reason is null
  and reviewed_at is null
  and reviewed_by is null
);

commit;
