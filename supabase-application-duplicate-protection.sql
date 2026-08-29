-- O2OL application duplicate protection
-- Prevents repeated pending applications for the same normalized email address while still
-- allowing a future re-application after an earlier application leaves the pending state.

create unique index if not exists idx_influencers_one_pending_per_email
  on public.influencers (lower(email))
  where status = 'pending';

create unique index if not exists idx_professionals_one_pending_per_email
  on public.professionals (lower(email))
  where status = 'pending';

create unique index if not exists idx_therapists_one_pending_per_email
  on public.therapists (lower(email))
  where verification_status = 'pending';

comment on index public.idx_influencers_one_pending_per_email is
'Allows only one pending influencer application per normalized email address.';

comment on index public.idx_professionals_one_pending_per_email is
'Allows only one pending professional application per normalized email address.';

comment on index public.idx_therapists_one_pending_per_email is
'Allows only one pending therapist verification application per normalized email address.';
