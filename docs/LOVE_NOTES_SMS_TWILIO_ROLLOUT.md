# One2OneLove Love Notes — Twilio SMS Rollout

Status: **Approvals #9A/#9B — DESIGN/STAGING APPROVED; PRODUCTION SMS REMAINS OFF**

This document defines the approved technical/compliance design for future Love Notes SMS delivery. It does **not** authorize creating a paid Twilio account, purchasing a number, paying A2P registration fees, configuring production credentials, publishing final legal terms, applying the SMS schema to production, deploying the real SMS endpoints, or sending any SMS.

## Locked architecture

- Provider design: **Twilio Programmable Messaging**.
- Sender management: **Twilio Messaging Service**, not a browser-selected or hard-coded `From` number.
- US application-to-person traffic: register the Messaging Service/sender for the applicable **A2P 10DLC** campaign before activation.
- Browser never receives Twilio account credentials, API keys, Auth Token, Messaging Service credentials, service-role credentials, or consent pepper.
- Outbound API authentication uses a restricted Twilio API Key SID/secret; the Twilio Account SID is the REST resource owner.
- Incoming Twilio webhook signature validation uses the separate Twilio Account **Auth Token**, as required by Twilio's webhook validation model.
- Recipient phone numbers must be normalized to **E.164** before they can enter the SMS delivery or consent path.
- `LOVE_NOTE_SMS_ENABLED`, `LOVE_NOTE_SMS_COMPLIANCE_READY`, `LOVE_NOTE_SMS_CONSENT_CAPTURE_ENABLED`, and `LOVE_NOTE_SMS_WEBHOOK_ENABLED` remain independent fail-closed production gates.
- The currently deployed Love Notes functions remain `production-dark.ts` until later production activation approvals.

## Consent rule

A Love Note sender **cannot opt another person into One2OneLove SMS**.

Before the first application-to-person Love Notes SMS, One2OneLove must have verifiable evidence that the recipient independently opted in to this messaging program. The system must not send a first Love Note SMS asking the recipient to consent by text.

Approved development consent source:

1. **Web opt-in** — the recipient enters a mobile number and affirmatively selects separate, unchecked controls confirming number control and voluntary SMS consent. SMS consent is optional and separate from required Terms/Privacy acceptance.

Candidate future source requiring later approval:

2. **Inbound keyword re-subscription** — after a known participant has opted out, Twilio START/Advanced Opt-Out may reactivate that existing consent state. The staged webhook intentionally does not treat an unknown inbound START as sufficient standalone consent.

### Recipient-control verification remains a production blocker

The public form's self-attestation alone must not be treated as the final anti-forgery control for production activation. Before production consent capture is enabled, O2OL must approve and implement a defensible way to bind the consent action to the recipient/number. Candidate approaches may include a provider verification flow or an authenticated/server-bound recipient flow. A paid verification product is **not** silently selected by #9A/#9B.

The development schema stages server-only consent evidence using a server-peppered SHA-256 phone hash. It does not duplicate the raw or partial phone number into the consent-evidence table.

## Recipient consent UX staged under #9B

The development `SmsConsent` page:

- is optional and not part of mandatory account acceptance;
- starts with all consent controls unchecked;
- states that email Love Notes remain available without SMS consent;
- states message frequency varies and message/data rates may apply;
- includes STOP and HELP instructions before opt-in;
- explicitly excludes marketing/promotional SMS from this consent;
- links to Terms and Privacy next to the consent flow;
- clearly states that production SMS/consent capture is not active yet;
- supports English, Spanish, French, Italian, and German.

The public Terms/Privacy pages continue to say final legal review is pending. The SMS legal draft is an implementation source only and must not be represented as final legal advice or final launch policy.

## Consent evidence

Development table: `public.love_note_sms_consents`

The staged table stores only server-side state/evidence needed to administer the feature:

- server-peppered phone hash;
- active/revoked state;
- consent method;
- language;
- program version;
- disclosure version;
- Terms version;
- Privacy version;
- opaque evidence reference;
- consent/revocation and record timestamps.

It intentionally stores no second raw/partial phone number or IP address, and browser roles receive no grants or RLS policies on the table.

## Opt-out / HELP behavior

Use Twilio Messaging Service **Advanced Opt-Out** when production is configured. Twilio handles configured STOP/START/HELP behavior and can POST an `OptOutType` value to the inbound webhook.

Application behavior remains fail-closed:

- A missing consent record blocks the SMS.
- A revoked consent record blocks the SMS.
- A Twilio opt-out error (including provider error 21610) is treated as an opt-out, not a retryable delivery failure.
- Scheduled Love Notes re-check consent immediately before provider submission. A later STOP/revocation overrides the earlier schedule.
- No automated retry may bypass an opt-out.
- The staged O2OL webhook accepts only signed Twilio form posts and ignores ordinary inbound message content rather than storing it.
- STOP revokes known O2OL consent state.
- HELP does not change consent state.
- START only reactivates an existing known O2OL consent record; an unknown START is ignored by O2OL state even if Twilio handles its own sender-level behavior.

## Twilio webhook authenticity

The staged `twilio-love-note-sms-webhook` is designed for a future unauthenticated-at-Supabase-gateway webhook because Twilio does not send an O2OL JWT. Its actual security boundary is `X-Twilio-Signature` validation using:

- the exact HTTPS public webhook URL configured in Twilio;
- the form parameters Twilio POSTs;
- the server-only `TWILIO_AUTH_TOKEN`.

No state-changing webhook request may be processed when the signature is missing/invalid, the public signature URL is not configured, the content type is wrong, or the dedicated webhook gate is OFF.

## Five-language SMS invitation copy

The server helper contains recipient-facing SMS invitation copy for the five active One2OneLove languages: English, Spanish, French, Italian, and German. The selected `delivery_language` is stored with a scheduled invitation so the future dispatcher sends the same intended language.

Each SMS identifies One2OneLove, provides the secure reveal URL, and carries STOP/HELP plus message/data-rate disclosure language.

Dutch remains inactive and is not part of this activation.

## Candidate Advanced Opt-Out responses

These are **staged copy**, not live Twilio Console settings. Final carrier/A2P/legal review may require wording adjustments without changing the underlying product rule.

### English
- START: `One2OneLove: SMS is enabled for this number. Reply STOP to opt out; HELP for help. Msg & data rates may apply.`
- STOP: `One2OneLove: You are unsubscribed from SMS. No more texts will be sent unless you opt in again.`
- HELP: `One2OneLove SMS help: visit one2onelove.com/help. Reply STOP to opt out. Msg & data rates may apply.`

### Spanish
- START: `One2OneLove: Los SMS están activados para este número. Responde STOP para cancelar; HELP para ayuda. Pueden aplicarse tarifas.`
- STOP: `One2OneLove: Has cancelado los SMS. No se enviarán más mensajes hasta que vuelvas a aceptar.`
- HELP: `Ayuda SMS de One2OneLove: visita one2onelove.com/help. Responde STOP para cancelar. Pueden aplicarse tarifas.`

### French
- START: `One2OneLove : les SMS sont activés pour ce numéro. Répondez STOP pour vous désabonner ; HELP pour l’aide. Des frais peuvent s’appliquer.`
- STOP: `One2OneLove : vous êtes désabonné des SMS. Aucun autre SMS ne sera envoyé sans nouvelle inscription.`
- HELP: `Aide SMS One2OneLove : one2onelove.com/help. Répondez STOP pour vous désabonner. Des frais peuvent s’appliquer.`

### Italian
- START: `One2OneLove: gli SMS sono attivi per questo numero. Rispondi STOP per annullare; HELP per assistenza. Potrebbero applicarsi costi.`
- STOP: `One2OneLove: hai annullato gli SMS. Non saranno inviati altri messaggi finché non accetterai di nuovo.`
- HELP: `Assistenza SMS One2OneLove: one2onelove.com/help. Rispondi STOP per annullare. Potrebbero applicarsi costi.`

### German
- START: `One2OneLove: SMS ist für diese Nummer aktiviert. Antworte STOP zum Abbestellen; HELP für Hilfe. Gebühren können anfallen.`
- STOP: `One2OneLove: SMS wurde abbestellt. Es werden keine weiteren SMS gesendet, bis du erneut zustimmst.`
- HELP: `One2OneLove SMS-Hilfe: one2onelove.com/help. Antworte STOP zum Abbestellen. Gebühren können anfallen.`

## Server-only production variables

Do not create/populate these under #9A/#9B:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_API_KEY_SID`
- `TWILIO_API_KEY_SECRET`
- `TWILIO_AUTH_TOKEN` (webhook signature validation only)
- `TWILIO_MESSAGING_SERVICE_SID`
- `TWILIO_SMS_STATUS_CALLBACK_URL` (future status callback)
- `TWILIO_SMS_WEBHOOK_PUBLIC_URL`
- `LOVE_NOTE_SMS_CONSENT_PEPPER`
- `LOVE_NOTE_SMS_COMPLIANCE_READY`
- `LOVE_NOTE_SMS_CONSENT_CAPTURE_ENABLED`
- `LOVE_NOTE_SMS_WEBHOOK_ENABLED`
- `LOVE_NOTE_SMS_ENABLED`

The legacy arbitrary adapter settings `LOVE_NOTE_SMS_ENDPOINT` and `LOVE_NOTE_SMS_PROVIDER_KEY` are retired from the staged real implementations.

## Development files staged

- `supabase/functions/_shared/loveNoteSms.ts`
- `supabase/functions/send-love-note-invitation/index.ts`
- `supabase/functions/dispatch-scheduled-love-notes/index.ts`
- `supabase/functions/manage-love-note-sms-consent/index.ts`
- `supabase/functions/twilio-love-note-sms-webhook/index.ts`
- `supabase/migrations/20260820154500_love_note_sms_compliance.sql`
- `src/lib/loveNoteInvitationService.js`
- `src/lib/smsConsentService.js`
- `src/pages/SmsConsent.jsx`
- `src/pages/LegalPolicyPending.jsx`
- `docs/SMS_MESSAGING_LEGAL_DRAFT_20260820.md`
- `scripts/relaunch-love-note-sms-check.mjs`

The SMS migration and new SMS endpoints remain development-only and have **not** been applied/deployed to production.

## Required production activation checkpoints

Before SMS can be enabled, later approvals must cover:

1. Final launch-market legal wording and final support method/contact.
2. Recipient/number-control verification method for public consent capture.
3. Twilio account/entity ownership and billing.
4. Number/sender choice and Messaging Service creation.
5. A2P 10DLC Brand/Campaign registration and associated fees where applicable.
6. Public final Terms/Privacy SMS disclosures.
7. Publicly verifiable recipient opt-in workflow.
8. Advanced Opt-Out configuration plus signed inbound STOP/START/HELP synchronization.
9. Secure production secrets and key/token rotation ownership.
10. Production consent schema/endpoint deployment with RLS/grant/advisor verification.
11. Controlled consent test using an explicitly participating test recipient.
12. Controlled SMS send test.
13. Confirmation that all five active language paths render correctly.
14. Only after the above: deliberately enable the approved live delivery gates.

## Current production truth

- No Twilio account/provider connection was created by #9A/#9B.
- No A2P registration was submitted.
- No Twilio or SMS secret was created or changed.
- The SMS compliance migration is not in live Supabase migration history.
- The consent/webhook functions are not deployed live.
- No Love Notes production Edge Function was switched away from `production-dark.ts`.
- No SMS was sent.
- No SMS/provider charge was incurred by this implementation work.
