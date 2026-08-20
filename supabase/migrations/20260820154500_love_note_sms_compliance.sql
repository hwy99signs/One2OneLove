-- One2OneLove Love Notes SMS compliance foundation.
-- DEVELOPMENT MIGRATION ONLY. DO NOT APPLY TO PRODUCTION under Approval #9A.
-- Production application requires a later cost/legal activation approval after Twilio
-- A2P registration, public consent flow, Terms/Privacy updates, and controlled testing.
--
-- Privacy model:
--   * no raw phone number is duplicated into the consent table;
--   * a server-peppered SHA-256 hash is used for consent lookup;
--   * browser roles receive no grants/policies on consent evidence;
--   * SMS language is limited to the five active O2OL languages;
--   * SMS must fail closed when no active prior recipient consent exists.

begin;

alter table public.love_note_invitations
  add column if not exists delivery_language text not null default 'en'
  check (delivery_language in ('en', 'es', 'fr', 'it', 'de'));

-- This language is safe participant history metadata and is needed by the scheduled
-- dispatcher to reproduce the recipient-facing invitation in the intended language.
grant select (delivery_language)
  on table public.love_note_invitations to authenticated;

-- Recreate the safe participant history projection so it includes only the already-safe
-- history fields plus the non-sensitive delivery language.
drop view if exists public.love_note_invitation_history;
create view public.love_note_invitation_history
with (security_barrier = true, security_invoker = true)
as
select
  id,
  sender_user_id,
  recipient_user_id,
  sender_name,
  recipient_name,
  delivery_method,
  delivery_language,
  note_content,
  scheduled_for,
  schedule_timezone,
  status,
  sent_at,
  delivered_at,
  revealed_at,
  created_at,
  updated_at
from public.love_note_invitations
where sender_user_id = auth.uid() or recipient_user_id = auth.uid();

revoke all on public.love_note_invitation_history from public, anon, authenticated;
grant select on public.love_note_invitation_history to authenticated;

create table if not exists public.love_note_sms_consents (
  id uuid primary key default gen_random_uuid(),
  -- Server computes SHA-256(LOVE_NOTE_SMS_CONSENT_PEPPER || ':' || E164).
  -- The raw phone remains only where operationally required for the invitation itself.
  phone_hash text not null unique check (phone_hash ~ '^[0-9a-f]{64}$'),
  phone_last4 text not null check (phone_last4 ~ '^[0-9]{4}$'),
  status text not null default 'active' check (status in ('active', 'revoked')),
  consent_method text not null check (consent_method in ('web_form', 'inbound_keyword')),
  language text not null default 'en' check (language in ('en', 'es', 'fr', 'it', 'de')),
  -- evidence_ref is an opaque server-generated reference to the consent event/audit
  -- record; never place free-form user content, URLs with tokens, or a phone number here.
  evidence_ref text not null check (char_length(evidence_ref) between 16 and 160),
  consented_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint love_note_sms_consent_state check (
    (status = 'active' and revoked_at is null)
    or (status = 'revoked' and revoked_at is not null)
  )
);

create index if not exists love_note_sms_consents_status_idx
  on public.love_note_sms_consents(status, consented_at desc);

alter table public.love_note_sms_consents enable row level security;
revoke all on table public.love_note_sms_consents from public, anon, authenticated;

-- Intentionally no browser RLS policies. Only trusted server/service-role workflows may
-- create, read, or revoke consent evidence. A future recipient opt-in endpoint must be
-- caller-bound and separately reviewed before this migration is approved for production.

comment on table public.love_note_sms_consents is
  'Server-only Love Notes SMS consent evidence keyed by a server-peppered phone hash. No browser grants or policies. Production use requires explicit legal/cost activation approval.';
comment on column public.love_note_invitations.delivery_language is
  'Recipient-facing Love Note invitation language. Limited to the five active One2OneLove languages: en/es/fr/it/de.';

commit;
