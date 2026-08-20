# One2OneLove Love Notes — Twilio SMS Rollout

Status: **Approval #9A — DESIGN/STAGING APPROVED; PRODUCTION SMS REMAINS OFF**

This document defines the approved technical/compliance design for future Love Notes SMS delivery. It does **not** authorize creating a paid Twilio account, purchasing a number, paying A2P registration fees, configuring production credentials, deploying the real Love Notes delivery entrypoints, or sending any SMS.

## Locked architecture

- Provider: **Twilio Programmable Messaging**.
- Sender management: **Twilio Messaging Service**, not a browser-selected or hard-coded `From` number.
- US application-to-person traffic: register the Messaging Service/sender for the applicable **A2P 10DLC** campaign before activation.
- Browser never receives Twilio account credentials, API keys, auth tokens, Messaging Service credentials, or consent pepper.
- Server authentication uses a restricted Twilio API Key SID/secret; the Twilio Account SID is used only as the REST resource owner.
- Recipient phone numbers must be normalized to **E.164** before they can enter the SMS delivery path.
- `LOVE_NOTE_SMS_ENABLED` and `LOVE_NOTE_SMS_COMPLIANCE_READY` are independent fail-closed production gates.
- The currently deployed Love Notes functions remain `production-dark.ts` until a later production activation approval.

## Consent rule

A Love Note sender **cannot opt another person into One2OneLove SMS**.

Before the first application-to-person SMS, One2OneLove must have verifiable evidence that the recipient independently opted in to this messaging program. The system must not send a first SMS asking the recipient to consent by text.

Approved future consent sources:

1. **Web opt-in** — the recipient enters their own mobile number and affirmatively selects a separate, unchecked SMS consent control. SMS consent must be optional and separate from required Terms/Privacy acceptance.
2. **Inbound keyword opt-in** — the recipient initiates the interaction by texting the approved opt-in keyword to the One2OneLove Twilio number/Messaging Service.

The development schema stages server-only consent evidence using a server-peppered SHA-256 phone hash. It does not duplicate the raw phone number into the consent-evidence table.

A later legal/cost approval is required before either consent-capture workflow is placed into production.

## Opt-out / HELP behavior

Use Twilio Messaging Service **Advanced Opt-Out** when production is configured. Twilio handles standard STOP/START/HELP behavior and can report the matched action to an inbound webhook using `OptOutType`.

Application behavior must also remain fail-closed:

- A missing consent record blocks the SMS.
- A revoked consent record blocks the SMS.
- A Twilio opt-out error (including provider error 21610) is treated as an opt-out, not a retryable delivery failure.
- Scheduled Love Notes re-check consent immediately before provider submission. A later STOP/revocation overrides the earlier schedule.
- No automated retry may bypass an opt-out.

## Five-language SMS invitation copy

The server helper contains recipient-facing SMS invitation copy for the five active One2OneLove languages: English, Spanish, French, Italian, and German. The selected `delivery_language` is stored with a scheduled invitation so the future dispatcher sends the same intended language.

Each SMS identifies One2OneLove, provides the secure reveal URL, and carries STOP/HELP plus message/data-rate disclosure language.

Dutch remains inactive and is not part of this activation.

## Candidate Advanced Opt-Out responses

These are **staged copy**, not live Twilio Console settings. Final carrier/A2P review may require wording adjustments without changing the underlying product rule.

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

Do not create or populate these under #9A:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_API_KEY_SID`
- `TWILIO_API_KEY_SECRET`
- `TWILIO_MESSAGING_SERVICE_SID`
- `TWILIO_SMS_STATUS_CALLBACK_URL` (optional until status callback exists)
- `LOVE_NOTE_SMS_CONSENT_PEPPER`
- `LOVE_NOTE_SMS_COMPLIANCE_READY`
- `LOVE_NOTE_SMS_ENABLED`

The legacy arbitrary adapter settings `LOVE_NOTE_SMS_ENDPOINT` and `LOVE_NOTE_SMS_PROVIDER_KEY` are retired from the staged real implementations.

## Development files staged under #9A

- `supabase/functions/_shared/loveNoteSms.ts`
- `supabase/functions/send-love-note-invitation/index.ts`
- `supabase/functions/dispatch-scheduled-love-notes/index.ts`
- `supabase/migrations/20260820154500_love_note_sms_compliance.sql`
- `src/lib/loveNoteInvitationService.js`
- `src/lib/loveNoteSmsCopy.js`
- `scripts/relaunch-love-note-sms-check.mjs`

The migration is explicitly development-only and has **not** been applied to production.

## Required production activation checkpoint

Before SMS can be enabled, a later approval must cover all of the following together:

1. Twilio account/entity ownership and billing.
2. Number/sender choice and Messaging Service creation.
3. A2P 10DLC Brand/Campaign registration and associated fees.
4. Public Terms of Service and Privacy Policy SMS disclosures, including mobile-number non-sharing language where required by campaign review.
5. Publicly verifiable recipient opt-in workflow.
6. Inbound STOP/START/HELP handling and signature-validated webhook/audit behavior.
7. Secure production secrets and key-rotation ownership.
8. Controlled tests using an explicitly opted-in test number.
9. Confirmation that all five language paths render correctly.
10. Only after the above: deploy the real Love Notes entrypoints, keep switches OFF for validation, then deliberately turn the approved gates ON.

## Current production truth

- No Twilio account/provider connection was created by #9A.
- No A2P registration was submitted.
- No Twilio or SMS secret was created or changed.
- No Love Notes production Edge Function was switched away from `production-dark.ts`.
- No SMS was sent.
- No SMS/provider charge was incurred by this implementation work.
