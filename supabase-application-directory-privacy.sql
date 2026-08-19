-- O2OL application-directory privacy hardening
-- Public directory clients may read only reviewed/approved records. Pending/rejected
-- applications contain applicant contact and credential information and must not be exposed
-- through broad Data API SELECT policies.

alter table public.influencers enable row level security;
alter table public.professionals enable row level security;
alter table public.therapists enable row level security;

-- Replace only SELECT policies on these application/directory tables. Trusted server-side
-- service-role workflows continue to bypass RLS for application review.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('influencers', 'professionals', 'therapists')
      and cmd = 'SELECT'
  loop
    execute format('drop policy if exists %I on %I.%I', policy_record.policyname, policy_record.schemaname, policy_record.tablename);
  end loop;
end $$;

-- Preserve public/authenticated directory reads, but RLS now exposes approved records only.
grant select on table public.influencers to anon, authenticated;
grant select on table public.professionals to anon, authenticated;
grant select on table public.therapists to anon, authenticated;

create policy "public can view approved influencers"
on public.influencers
for select
to anon, authenticated
using (status = 'approved');

create policy "public can view approved professionals"
on public.professionals
for select
to anon, authenticated
using (status = 'approved');

create policy "public can view verified therapists"
on public.therapists
for select
to anon, authenticated
using (
  verified = true
  and verification_status = 'approved'
);

comment on policy "public can view approved influencers" on public.influencers is
'Public directory access is limited to approved influencer records; pending/rejected applications remain private.';

comment on policy "public can view approved professionals" on public.professionals is
'Public directory access is limited to approved professional records; pending/rejected applications remain private.';

comment on policy "public can view verified therapists" on public.therapists is
'Public directory access is limited to verified, approved therapist records; pending/rejected applications remain private.';
