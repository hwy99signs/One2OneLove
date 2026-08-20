# One2OneLove Production Approvals — 2026-08-20

This file records production approvals explicitly granted in conversation and the resulting action/state.

## Approval #1 — Love Notes invitation database
Approved and applied to live Supabase.
- Applied `20260817_love_note_invitations.sql`.
- Verified table/RLS/history view.

## Approval #1A — Love Notes history view hardening
Approved and applied to live Supabase.
- Converted `love_note_invitation_history` to `security_invoker`.
- Preserved participant-only RLS behavior and safe-column projection.
- Security Definer advisor error cleared.

## Approval #2 — Love Notes Edge Functions, production-dark
Approved and deployed to live Supabase.
- `send-love-note-invitation`
- `reveal-love-note`
- `dispatch-scheduled-love-notes`
- Each deployed with `production-dark.ts` as entrypoint.
- Each requires JWT.
- No scheduler created.
- No email/SMS delivery activated.

## Approval #3 — Preserve existing Resend secret
Approved.
- Keep the existing live `RESEND_API_KEY` unchanged.
- Do not rotate or replace it before controlled email testing.
- Existing `send-waitlist-notifications` currently references this secret, so blind replacement could break existing email behavior.
- Never place the secret value in chat, GitHub, or browser code.

## Approval #8B — Community-membership security hardening
Approved and applied to live Supabase.
- Removed the recursive community-members moderator/admin RLS lookup.
- Preserved ordinary membership access without permitting self-assigned moderator/admin authority.
- Privileged community-membership helpers use the non-exposed `o2ol_private` schema.
- Signed-in-role verification no longer triggers recursive RLS.
- No existing community/community-membership data was rewritten because both live tables were empty at verification time.

## Approval #8C — Presence and member-directory privacy reconciliation
Approved and applied to live Supabase.
- Applied production migration `presence_directory_privacy_reconciliation` from the staged `20260820100500_presence_directory_privacy_reconciliation.sql` design.
- `user_presence_view` now excludes account email and database-generated `last_seen_text`; it exposes neutral presence timestamps/status plus safe display identity only.
- `member_directory` now exposes only `id`, `name`, `avatar_url`, `bio`, and `created_at` and uses `security_invoker=true`.
- `user_presence` remains RLS-enabled; authenticated browsers have SELECT only and no direct INSERT/UPDATE/DELETE privilege.
- Public presence RPCs are SECURITY INVOKER wrappers; the caller-bound privileged write helper is in `o2ol_private`.
- Controlled signed-in test: own presence update succeeds; another-member update is rejected with `O2OL_PRESENCE_OWN_ONLY`. Test transaction was rolled back.
- Existing counts remained stable after migration: 11 users, 11 synchronized directory rows, 28 presence rows.
- The client-side presence service is staged to format relative-time text in the selected O2OL language (EN/ES/FR/IT/DE), keeping the database language-neutral.

### Post-deployment #8C advisor finding
The Supabase security advisor flagged `public.user_directory_profiles` as discoverable to signed-in users because authenticated SELECT is required by the security-invoker directory view. At that point the synchronized source still contained `relationship_status`, `user_type`, `location`, and `interests`, even though `member_directory` itself did not expose them.

No unapproved production correction was made. A separate Approval #8C-A was requested and granted.

## Approval #8C-A — Member-directory source minimization
Approved and applied to live Supabase.
- Applied production migration `member_directory_source_minimization` from `supabase/migrations/20260820151000_member_directory_source_minimization.sql`.
- The first application attempt was rejected transactionally because `user_presence_view` depended on `member_directory`; no production state changed during that failed attempt.
- The migration was corrected in development to drop/recreate the privacy-safe presence view in the same transaction, then successfully applied.
- `public.user_directory_profiles` now contains exactly five columns: `id`, `name`, `avatar_url`, `bio`, and `created_at`.
- All 11 current regular-member directory rows were preserved.
- `public.member_directory` exposes the same five fields only and remains `security_barrier=true`, `security_invoker=true`.
- `public.user_presence_view` was restored unchanged from #8C with no `email` and no `last_seen_text`, and remains `security_barrier=true`, `security_invoker=true`.
- Anonymous SELECT remains revoked from the source table and both views.
- The directory sync trigger remains on `public.users` and invokes the non-browser-executable `o2ol_private.sync_user_directory_profile()` helper.
- The security advisor still reports authenticated GraphQL discoverability for the source/view because signed-in member discovery intentionally requires SELECT; this is now acceptable because only the five approved discovery fields exist in that source.

## Approval #9 — SMS provider direction
Approved in conversation.
- The user approved proceeding with SMS provider activation work.
- Read-only verification showed that no SMS vendor/account/credential was currently configured and the live Love Notes functions remained production-dark.
- Because selecting/connecting a paid provider introduces cost and compliance obligations, no vendor was silently invented or activated under #9 alone.

## Approval #9A — Twilio + compliant Love Notes SMS design
Approved and staged in development. **No production SMS activation occurred.**
- Provider design locked to Twilio Programmable Messaging through a Twilio Messaging Service.
- US application-to-person SMS is designed for A2P 10DLC registration before activation.
- A sender cannot consent on behalf of the recipient. The staged server path requires verifiable prior recipient SMS opt-in and fails closed when consent/compliance infrastructure is unavailable.
- Immediate and scheduled SMS use the same Twilio-specific server adapter.
- Scheduled SMS re-checks recipient consent immediately before provider submission so a later STOP/revocation overrides an earlier schedule.
- Twilio error 21610 is treated as recipient opt-out rather than a retryable delivery failure.
- SMS destinations require E.164 international format.
- Recipient-facing SMS invitation copy and SMS consent/opt-out UI copy are staged in English, Spanish, French, Italian, and German.
- A development-only migration stages `delivery_language` and a browser-inaccessible `love_note_sms_consents` evidence table keyed by a server-peppered phone hash; the raw phone number is not duplicated into that consent table.
- Server configuration is designed around restricted Twilio API credentials plus `TWILIO_MESSAGING_SERVICE_SID`, `LOVE_NOTE_SMS_CONSENT_PEPPER`, `LOVE_NOTE_SMS_COMPLIANCE_READY`, and `LOVE_NOTE_SMS_ENABLED`.
- The legacy arbitrary `LOVE_NOTE_SMS_ENDPOINT` / `LOVE_NOTE_SMS_PROVIDER_KEY` adapter is retired from the staged real implementations.
- A dedicated `relaunch-love-note-sms-check.mjs` safety check is now part of the relaunch build-check chain.
- Rollout/compliance design is documented in `docs/LOVE_NOTES_SMS_TWILIO_ROLLOUT.md`.
- The SMS migration was **not** applied to live Supabase.
- No Twilio account was created or connected, no A2P registration was submitted, no production secret was created/changed, no Love Notes function was switched away from `production-dark.ts`, no SMS was sent, and no SMS/provider cost was incurred.

## Approval #9B — Recipient-controlled SMS consent + legal foundation
Approved and staged in development. **No production consent capture or SMS activation occurred.**
- Added a five-language `SmsConsent` page and public staging routes at `/SmsConsent` and `/LoveNotes/SmsConsent`.
- All SMS consent controls start unchecked.
- The consent page states that SMS is optional, email Love Notes remain available, message frequency varies, message/data rates may apply, STOP cancels, HELP provides help, and this consent excludes marketing/promotional SMS.
- Terms of Service and Privacy Policy links remain adjacent to the opt-in disclosure.
- Existing public Terms/Privacy pages remain explicitly marked `final review pending`; SMS legal wording is not presented as final.
- Added `docs/SMS_MESSAGING_LEGAL_DRAFT_20260820.md` as a development/counsel-review source only, not final legal advice or final policy.
- Hardened the staged SMS consent table so it stores no second raw or partial phone number and no IP address. It stores a server-peppered phone hash plus the program/disclosure/Terms/Privacy versions accepted and consent state/timestamps.
- Added a development-only `manage-love-note-sms-consent` Edge Function source. It is fail-closed behind a separate consent-capture switch, validates E.164, requires explicit recipient self-attestation, uses service-role only on the server, and never echoes the phone/hash.
- Added a development-only `twilio-love-note-sms-webhook` source for future Advanced Opt-Out STOP/START/HELP synchronization. It is designed to reject unsigned Twilio requests using `X-Twilio-Signature` validation with the server-only Twilio Auth Token and exact public HTTPS webhook URL.
- STOP revokes known O2OL consent state; HELP does not change consent; START only reactivates an existing known consent record and does not create fresh O2OL consent for an unknown number.
- The SMS build guard was expanded to verify the consent page, legal-review gate, browser-private consent evidence and signed Twilio webhook protections.
- A production recipient/number-control verification mechanism remains a required design decision before consent capture is activated; the build did not silently choose a paid verification product.
- No SMS migration was applied live, no new SMS/consent/webhook function was deployed live, no Twilio secret was created/changed, no A2P/provider configuration was performed, and no SMS/provider cost was incurred.

## Development approval batching preference
The owner subsequently instructed the build to continue uninterrupted and requested a new approval batch for later review.
- Low-risk security hardening may continue under the owner's standing authorization when it only adds protection and does not materially change product behavior/cost/legal obligations/design.
- Medium/high security, cost, legal/compliance, meaningful design, production deployment/mutation, secret, billing, and irreversible actions remain held for later approval.
- The current future-approval batch is maintained at `docs/APPROVAL_BATCH_NEXT_20260820.md`.
