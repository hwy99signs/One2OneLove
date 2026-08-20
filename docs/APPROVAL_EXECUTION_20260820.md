# One2OneLove Production Approval Execution — 2026-08-20

## Completed approvals

### Approval #1 — Love Notes invitation database foundation
- Applied the Love Notes invitation migration to live Supabase.
- Verified `public.love_note_invitations` exists with RLS enabled.
- Verified browser roles do not have unrestricted direct-table access.
- Verified participant-only history access exists.
- No Love Notes were sent.

### Approval #1A — Love Notes history-view hardening
- Converted `public.love_note_invitation_history` to `security_invoker=true` while retaining `security_barrier=true`.
- Granted authenticated users access only to the safe history columns needed by the view.
- Sensitive fields remain unavailable through the member history interface.
- Supabase security advisor no longer reports the prior Security Definer view error.

### Approval #2 — Deploy Love Notes Edge Functions dark
Deployed these live Supabase functions:
- `send-love-note-invitation`
- `reveal-love-note`
- `dispatch-scheduled-love-notes`

All three currently use `production-dark.ts` as the deployed entrypoint and all three require JWT at the Supabase gateway. The dark entrypoint always returns `PRODUCTION_DARK` / HTTP 503. The real implementations remain staged in GitHub and require a separate explicit production approval before activation.

No scheduler was created. No Resend configuration was changed. No SMS provider was activated. The Love Notes invitation table remained at 0 rows after deployment.

### Approval #3 — Preserve existing Resend production secret
- Preserved the existing `RESEND_API_KEY` exactly as-is.
- Did not view, copy, rotate, replace, or expose the secret.
- Confirmed the existing live `send-waitlist-notifications` Edge Function depends on `RESEND_API_KEY`, so future email activation must first verify compatibility rather than blindly replacing the key.
- No email delivery behavior was changed.

### Approval #4 — Saved Love Notes database storage
- Applied the `love_note_saves` migration to live Supabase.
- Created `public.love_note_saves` with RLS enabled and three authenticated ownership/reveal policies.
- Created `public.saved_love_notes` with `security_invoker=true` and `security_barrier=true`.
- Anonymous roles have no SELECT access to the table or view.
- Authenticated users have only the required SELECT/INSERT/DELETE privileges on save-link rows; UPDATE is not granted.
- Verified the table/view exist, the security-invoker setting is active, and the table currently contains 0 saved rows.
- Supabase Security Advisor reports no Security Definer warning for `saved_love_notes`. Its signed-in GraphQL discoverability warning is expected because the authenticated app intentionally reads the feature, with RLS limiting row access.

### Approval #5 — Live Room messaging foundation
- Applied the corrected `live_room_messaging` migration to live Supabase.
- Created `public.room_messages` and `public.room_message_reactions` with RLS enabled.
- Anonymous roles have no SELECT or INSERT access to either messaging surface.
- Authenticated members have the required SELECT/INSERT/DELETE privileges; UPDATE is intentionally not granted.
- The allowed room constraint includes exactly the six relaunch rooms, including `global-relationship-room`.
- Member message identity is derived by the active `set_room_member_identity` trigger using a `SECURITY INVOKER` function; browser-supplied user IDs/display names are not trusted.
- No email address is used as the public-name fallback; an account without a profile name receives a language-neutral stable pseudonym.
- Both `room_messages` and `room_message_reactions` are registered with the `supabase_realtime` publication.
- Verified the live tables currently contain 0 messages and 0 reactions.
- Supabase Security Advisor shows only expected signed-in GraphQL discoverability warnings for the two messaging tables; it reports no Security Definer warning for the identity function.

### Approval #6 — Live Room private report intake
- Applied the hardened `live_room_moderation` migration to live Supabase.
- Created `public.room_message_reports` with RLS enabled and one authenticated INSERT policy.
- Anonymous users have no SELECT or INSERT access.
- Authenticated browser users have no SELECT, UPDATE, or DELETE access to the private report queue.
- Authenticated INSERT privilege is limited to exactly `message_id`, `reporter_id`, `reason`, and `details`.
- Browser users cannot supply `id`, `status`, `created_at`, or `reviewed_at`; those remain database/server-controlled.
- RLS requires the reporter to be the signed-in account, the target message to be an active member-authored message, and the reporter to be someone other than the message author.
- The table currently contains 0 reports.
- Supabase Security Advisor reports no new warning specific to `room_message_reports`.

### Approval #7 — Live Room identity hardening
- No separate production mutation is required.
- The full #7 hardening was intentionally folded into Approval #5 before messaging was activated, avoiding a temporary insecure state.
- Read-only verification confirms the live six-room constraint includes `global-relationship-room`, `vent-room`, `modern-dating-unfiltered`, `love-talk`, `marriage-matters`, and `starting-over`.
- Read-only verification confirms `public.set_room_member_identity()` is SECURITY INVOKER, uses `search_path=public`, derives `user_id` from `auth.uid()`, derives the public name from the signed-in user's own profile, uses a language-neutral stable pseudonym when no profile name exists, and does not derive a public identity from email.
- The identity trigger exists exactly once on `public.room_messages`.
- Applying the staged #7 migration now would only drop/recreate protections that are already live, so the redundant production write is retired.

### Approval #8B — Community membership security hardening
- Applied `community_member_policy_hardening` to live Supabase.
- Confirmed `public.community_members` remains RLS-enabled.
- Replaced the recursive legacy admin/moderator policy with caller-bound helper functions in the non-public `o2ol_private` schema.
- Anonymous users have no USAGE privilege on `o2ol_private`; authenticated users receive only the schema/function privileges needed for RLS evaluation.
- Normal self-service joins are constrained to `role='member'` with database-enforced `active` versus `pending` status based on community approval requirements.
- The only browser-compatible `admin` join path is restricted to the authenticated creator of that exact community, preserving the legacy creator duplicate-join flow without permitting role self-escalation.
- New communities automatically receive one active creator-admin membership through a database trigger.
- Membership update/delete management is guarded by an identity/role trigger that prevents creator-admin mutation, membership rerouting, and moderator role escalation.
- Database enforcement uses stable `O2OL_*` codes rather than member-facing English prose.
- A signed-in-role read test completed without RLS recursion.
- The project still contains 0 communities and 0 community memberships, so the migration rewrote no existing community data.
- Supabase Security Advisor added no new public SECURITY DEFINER warning for the `o2ol_private` helpers; unrelated pre-existing advisor warnings remain outside this approval.

### Approval #8C — Presence and member-directory privacy reconciliation
- Applied `presence_directory_privacy_reconciliation` to live Supabase.
- Removed email and database-generated English `last_seen_text` from `public.user_presence_view`.
- Preserved 28 existing presence rows and 11 synchronized member-directory rows.
- Browser presence writes are now mediated; authenticated users have no direct INSERT/UPDATE/DELETE grant on `public.user_presence`.
- Controlled verification confirmed own presence updates succeed and another-member updates are rejected with `O2OL_PRESENCE_OWN_ONLY`.
- Presence views remain `security_invoker=true` and `security_barrier=true`.
- Client-side presence copy is staged for EN/ES/FR/IT/DE using the selected language rather than database prose.

### Approval #8C-A — Member-directory source minimization
- Applied `member_directory_source_minimization` to live Supabase after explicit approval.
- The first application attempt was rejected transactionally because `public.user_presence_view` depended on `public.member_directory`; the database rolled that attempt back with no state change.
- Corrected the migration in development so `user_presence_view` is dropped/recreated within the same transaction while preserving its #8C privacy-safe definition.
- `public.user_directory_profiles` now contains exactly `id`, `name`, `avatar_url`, `bio`, and `created_at`—no email, relationship status, location, interests, account type, partner, verification, subscription, or billing fields.
- All 11 current regular-member directory records remain present.
- `public.member_directory` exposes the same five safe fields and remains `security_invoker=true` / `security_barrier=true`.
- `public.user_presence_view` remains `security_invoker=true` / `security_barrier=true`, with 28 presence rows preserved and no `email` or `last_seen_text` column.
- Anonymous SELECT is revoked from both source and view. Authenticated SELECT remains intentionally enabled for member discovery, so Supabase may continue to report GraphQL discoverability; the discoverable source now contains only approved public-member fields.
- The sync trigger on `public.users` continues to call `o2ol_private.sync_user_directory_profile()`. Browser roles cannot execute that trigger helper directly.

### Approval #9 — SMS provider direction
- User approved moving forward with SMS provider activation work.
- Audit confirmed there was no configured SMS provider/account/credential available to activate, so no provider was invented or silently connected.
- Live Love Notes Edge Functions remained production-dark.

### Approval #9A — Twilio + compliant Love Notes SMS design
- Staged only in the `relaunch-homepage` development branch; no production mutation was performed.
- Replaced the generic staged SMS adapter with a Twilio Messaging Service design using server-only API credentials.
- Added fail-closed gates for `LOVE_NOTE_SMS_ENABLED` and `LOVE_NOTE_SMS_COMPLIANCE_READY`.
- Added E.164 phone validation.
- Added verifiable prior-recipient-consent checks; the sender cannot opt in another person.
- Added a development-only `love_note_sms_consents` schema design using a server-peppered SHA-256 phone hash and no duplicate raw phone number.
- Added `delivery_language` staging for EN/ES/FR/IT/DE so scheduled SMS preserves intended recipient language.
- Added five-language SMS invitation copy plus five-language consent/opt-out UI copy.
- Scheduled SMS re-checks consent before provider submission; missing/revoked consent cancels rather than sends.
- Twilio provider error 21610 is interpreted as recipient opt-out.
- Added `scripts/relaunch-love-note-sms-check.mjs` to the main relaunch build-check chain so strict builds require the consent gate, Twilio Messaging Service configuration contract, five-language copy, browser-private consent evidence, E.164 validation, and production-dark entrypoints.
- Documented the activation plan in `docs/LOVE_NOTES_SMS_TWILIO_ROLLOUT.md`.
- Verified after staging that live `send-love-note-invitation` and `dispatch-scheduled-love-notes` still point to `production-dark.ts`.
- Verified the development-only SMS compliance migration is absent from live Supabase migration history.
- No Twilio account was created/connected, no A2P registration was submitted, no SMS secret was set, no SMS was sent, and no SMS/provider fee was incurred.
- Vercel status for the latest branch commit remains a build-rate-limit failure, so application compile success is not claimed from Vercel.

## Resend production dependency note
The existing live `send-waitlist-notifications` Edge Function reads `Deno.env.get('RESEND_API_KEY')` and sends through the Resend API. Therefore the existing `RESEND_API_KEY` must continue to be treated as production-relevant and must not be overwritten blindly. The connector does not expose secret values, so any key verification/rotation must preserve waitlist compatibility and be handled without pasting secret material into chat or source control.
