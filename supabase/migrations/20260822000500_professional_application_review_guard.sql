-- One2OneLove professional application review integrity.
-- DEVELOPMENT MIGRATION ONLY. Do not apply to production without explicit approval.
-- This migration adds a review/audit lifecycle only. It does NOT create auth users,
-- change public.users.user_type, grant staff authority, send communications, or approve
-- professional access automatically.

begin;

create table if not exists public.professional_application_audit (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.professional_applications(id) on delete cascade,
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  action text not null check (action in ('review_started','approved','rejected','reopened')),
  created_at timestamptz not null default now()
);

create index if not exists professional_application_audit_application_idx
  on public.professional_application_audit(application_id, created_at);

alter table public.professional_application_audit enable row level security;
revoke all on table public.professional_application_audit from public, anon, authenticated;
grant all on table public.professional_application_audit to service_role;

create or replace function o2ol_private.enforce_professional_application_review_state()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.status <> 'submitted'
      or new.reviewer_user_id is not null
      or new.reviewed_at is not null
      or new.review_notes is not null then
      raise exception using errcode = 'P0001', message = 'O2OL_PRO_APPLICATION_INVALID_INITIAL_STATE';
    end if;
    return new;
  end if;

  if new.application_type is distinct from old.application_type
    or new.first_name is distinct from old.first_name
    or new.last_name is distinct from old.last_name
    or new.email is distinct from old.email
    or new.phone is distinct from old.phone
    or new.details is distinct from old.details
    or new.created_at is distinct from old.created_at then
    raise exception using errcode = 'P0001', message = 'O2OL_PRO_APPLICATION_CONTENT_IMMUTABLE';
  end if;

  if new.status is distinct from old.status then
    if not (
      (old.status = 'submitted' and new.status in ('under_review','rejected'))
      or (old.status = 'under_review' and new.status in ('approved','rejected'))
      or (old.status in ('approved','rejected') and new.status = 'under_review')
      or (old.status in ('submitted','under_review') and new.status = 'withdrawn')
    ) then
      raise exception using errcode = 'P0001', message = 'O2OL_PRO_APPLICATION_INVALID_STATUS_TRANSITION';
    end if;
  end if;

  if new.status in ('under_review','approved','rejected') then
    if new.reviewer_user_id is null or new.reviewed_at is null then
      raise exception using errcode = 'P0001', message = 'O2OL_PRO_APPLICATION_REVIEW_METADATA_REQUIRED';
    end if;
  end if;

  if new.status = 'approved' and (new.email_verified is not true or new.phone_verified is not true) then
    raise exception using errcode = 'P0001', message = 'O2OL_PRO_APPLICATION_VERIFICATION_REQUIRED';
  end if;

  if new.review_notes is not null and char_length(new.review_notes) > 4000 then
    raise exception using errcode = 'P0001', message = 'O2OL_PRO_APPLICATION_REVIEW_NOTES_TOO_LONG';
  end if;

  return new;
end;
$$;

revoke all on function o2ol_private.enforce_professional_application_review_state() from public, anon, authenticated;

drop trigger if exists professional_application_review_state on public.professional_applications;
create trigger professional_application_review_state
before insert or update on public.professional_applications
for each row execute function o2ol_private.enforce_professional_application_review_state();

-- Audit the review transition in the same database statement/transaction that changes
-- application status. reviewer_user_id is required by the BEFORE trigger above, so the
-- audit actor is never inferred from service_role/current_user.
create or replace function o2ol_private.audit_professional_application_review_state()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  audit_action text;
begin
  if new.status is not distinct from old.status then return new; end if;
  if new.status = 'under_review' and old.status = 'submitted' then audit_action := 'review_started';
  elsif new.status = 'approved' then audit_action := 'approved';
  elsif new.status = 'rejected' then audit_action := 'rejected';
  elsif new.status = 'under_review' and old.status in ('approved','rejected') then audit_action := 'reopened';
  else return new;
  end if;

  insert into public.professional_application_audit(application_id, actor_user_id, action)
  values (new.id, new.reviewer_user_id, audit_action);
  return new;
end;
$$;

revoke all on function o2ol_private.audit_professional_application_review_state() from public, anon, authenticated;

drop trigger if exists professional_application_review_audit on public.professional_applications;
create trigger professional_application_review_audit
after update on public.professional_applications
for each row execute function o2ol_private.audit_professional_application_review_state();

comment on table public.professional_application_audit is
  'Service-only audit trail for professional/therapist/influencer application review lifecycle.';
comment on function o2ol_private.enforce_professional_application_review_state() is
  'Keeps applicant content immutable, constrains review transitions, and prevents approved status until verification flags are true. Does not grant account roles.';
comment on function o2ol_private.audit_professional_application_review_state() is
  'Atomically records review lifecycle transitions using the required reviewer_user_id from the application update.';

commit;

-- CONTROLLED TESTS BEFORE ANY PRODUCTION APPROVAL
-- 1. Browser roles have zero access to application/audit tables.
-- 2. Applicant identity/details cannot be rewritten during review.
-- 3. approved requires both email_verified and phone_verified.
-- 4. Review status changes require reviewer_user_id/reviewed_at.
-- 5. Every start/approve/reject/reopen transition creates exactly one audit row atomically.
-- 6. Approval changes only the application record; users.user_type remains untouched.
