-- One2OneLove relaunch: professional application intake
-- DEVELOPMENT MIGRATION ONLY. Apply to live Supabase only through an approved batch.
--
-- Professional/therapist/influencer applicants are not made members automatically.
-- Applications are stored separately and reviewed before account/profile activation.
-- Browser roles have no direct table access; the public intake Edge Function writes
-- through service_role after validation and while a server-side kill switch is enabled.

begin;

create table if not exists public.professional_applications (
  id uuid primary key default gen_random_uuid(),
  application_type text not null check (application_type in ('therapist', 'influencer', 'professional')),
  first_name text not null check (char_length(first_name) between 1 and 80),
  last_name text not null check (char_length(last_name) between 1 and 80),
  email text not null check (char_length(email) between 3 and 320),
  phone text not null check (char_length(phone) between 7 and 40),
  details jsonb not null default '{}'::jsonb,
  status text not null default 'submitted'
    check (status in ('submitted', 'under_review', 'approved', 'rejected', 'withdrawn')),
  email_verified boolean not null default false,
  phone_verified boolean not null default false,
  reviewer_user_id uuid null references auth.users(id) on delete set null,
  reviewed_at timestamptz null,
  review_notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists professional_applications_status_created_idx
  on public.professional_applications (status, created_at desc);

create index if not exists professional_applications_email_idx
  on public.professional_applications (lower(email));

-- Prevent repeated active applications for the same role/email while still allowing a
-- future resubmission after rejection/withdrawal if the business chooses to permit it.
create unique index if not exists professional_applications_active_email_type_uidx
  on public.professional_applications (application_type, lower(email))
  where status in ('submitted', 'under_review', 'approved');

alter table public.professional_applications enable row level security;

-- Sensitive application data is backend/admin only. service_role bypasses RLS.
revoke all on table public.professional_applications from anon, authenticated;

-- Do not create browser INSERT/SELECT policies. Public submission is mediated by the
-- `submit-professional-application` Edge Function, which validates and inserts with
-- the service role only when PROFESSIONAL_APPLICATIONS_ENABLED=true.

create or replace function public.set_professional_application_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists professional_applications_updated_at on public.professional_applications;
create trigger professional_applications_updated_at
before update on public.professional_applications
for each row execute function public.set_professional_application_updated_at();

comment on table public.professional_applications is
  'Private pre-membership applications for therapist, influencer and professional partner roles. Browser roles have no direct access.';

commit;

-- PRE-APPLY CHECKLIST
-- 1. Deploy submit-professional-application with verify_jwt=false and its kill switch OFF.
-- 2. Confirm public browser roles cannot SELECT/INSERT/UPDATE/DELETE this table directly.
-- 3. Enable intake only for a controlled test after rate-limit/anti-abuse review.
-- 4. Confirm review workflow before approving any application or creating a member account.
