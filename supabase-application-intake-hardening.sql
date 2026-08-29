-- O2OL public application intake hardening
-- Keeps existing read/update policies intact while constraining anonymous/authenticated
-- INSERT operations to the exact application fields and pending review states.

alter table public.influencers enable row level security;
alter table public.professionals enable row level security;
alter table public.therapists enable row level security;

-- Replace only INSERT policies. Existing SELECT/UPDATE/DELETE behavior is intentionally
-- left untouched so current public directories/admin workflows are not changed by this pass.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('influencers', 'professionals', 'therapists')
      and cmd = 'INSERT'
  loop
    execute format('drop policy if exists %I on %I.%I', policy_record.policyname, policy_record.schemaname, policy_record.tablename);
  end loop;
end $$;

revoke insert on table public.influencers from anon, authenticated;
grant insert (
  name, email, phone, social_platform, follower_count, profile_link,
  account_name, content_type, bio, why_interested, status, created_date
) on table public.influencers to anon, authenticated;

create policy "public can submit pending influencer applications"
on public.influencers
for insert
to anon, authenticated
with check (
  status = 'pending'
  and nullif(btrim(name), '') is not null
  and nullif(btrim(email), '') is not null
  and nullif(btrim(profile_link), '') is not null
  and nullif(btrim(account_name), '') is not null
);

revoke insert on table public.professionals from anon, authenticated;
grant insert (
  name, email, phone, category, specialization, years_experience,
  certifications, website, location, bio, services_provided,
  hourly_rate, availability, status, created_date
) on table public.professionals to anon, authenticated;

create policy "public can submit pending professional applications"
on public.professionals
for insert
to anon, authenticated
with check (
  status = 'pending'
  and nullif(btrim(name), '') is not null
  and nullif(btrim(email), '') is not null
  and nullif(btrim(category), '') is not null
  and nullif(btrim(specialization), '') is not null
  and nullif(btrim(location), '') is not null
);

revoke insert on table public.therapists from anon, authenticated;
grant insert (
  name, email, phone, license_number, license_state, specialties,
  years_experience, bio, location, telehealth_available, website,
  verified, verification_status, created_date
) on table public.therapists to anon, authenticated;

create policy "public can submit unverified therapist applications"
on public.therapists
for insert
to anon, authenticated
with check (
  verified = false
  and verification_status = 'pending'
  and nullif(btrim(name), '') is not null
  and nullif(btrim(email), '') is not null
  and nullif(btrim(license_number), '') is not null
  and nullif(btrim(license_state), '') is not null
  and nullif(btrim(location), '') is not null
  and coalesce(array_length(specialties, 1), 0) > 0
);

comment on policy "public can submit pending influencer applications" on public.influencers is
'Public application intake may create only pending influencer applications. Column grants and RLS prevent self-approval through the Data API.';

comment on policy "public can submit pending professional applications" on public.professionals is
'Public application intake may create only pending professional applications. Column grants and RLS prevent self-approval through the Data API.';

comment on policy "public can submit unverified therapist applications" on public.therapists is
'Public therapist intake may create only unverified pending applications. License verification remains a trusted review action.';
