-- One2OneLove Love Notes SMS verified-consent reconciliation.
-- DEVELOPMENT MIGRATION ONLY. DO NOT APPLY TO PRODUCTION without a later explicit
-- SMS/legal/cost approval. This migration does not send SMS or call Twilio.
--
-- The earlier staged web-form model treated an ownership checkbox as active recipient
-- consent. That is insufficient proof of control of a phone number. This reconciliation
-- makes website capture non-authorizing until a separately reviewed verification flow
-- proves control of the destination. SMS sending continues to require status='active'.

begin;

alter table public.love_note_sms_consents
  add column if not exists verified_at timestamptz;

-- Normalize any staged web-form consent that became active before verification existed.
-- Inbound-keyword consent is provider-originated and may remain active only if a later
-- approved workflow sets verified_at; until then fail closed by demoting all unverified
-- active rows.
update public.love_note_sms_consents
set status = 'pending_verification',
    verified_at = null,
    revoked_at = null,
    updated_at = now()
where status = 'active'
  and verified_at is null;

alter table public.love_note_sms_consents
  alter column status set default 'pending_verification';

alter table public.love_note_sms_consents
  drop constraint if exists love_note_sms_consents_status_check;
alter table public.love_note_sms_consents
  drop constraint if exists love_note_sms_consent_state;

alter table public.love_note_sms_consents
  add constraint love_note_sms_consents_status_check
  check (status in ('pending_verification', 'active', 'revoked'));

alter table public.love_note_sms_consents
  add constraint love_note_sms_consent_state
  check (
    (status = 'pending_verification' and verified_at is null and revoked_at is null)
    or (status = 'active' and verified_at is not null and revoked_at is null)
    or (status = 'revoked' and revoked_at is not null)
  );

comment on column public.love_note_sms_consents.verified_at is
  'Timestamp when a reviewed server/provider workflow verified control of the destination. Website checkbox capture alone must leave this null.';

comment on table public.love_note_sms_consents is
  'Server-only Love Notes SMS consent evidence. Web-form capture is pending_verification until destination control is independently verified; only active verified consent authorizes sending.';

commit;

-- CONTROLLED TESTS BEFORE ANY SMS ACTIVATION
-- 1. Web-form consent capture creates pending_verification with verified_at NULL.
-- 2. requireVerifiedSmsConsent rejects pending_verification rows.
-- 3. No browser role can promote pending_verification to active.
-- 4. Only a separately approved trusted verification workflow may set status=active
--    together with verified_at.
-- 5. Revocation still blocks sending immediately.
