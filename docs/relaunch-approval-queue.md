# One2OneLove Relaunch — Approval Queue

Development branch: `relaunch-homepage`

Production remains untouched. This file tracks anything that must wait for explicit approval, a visual checkpoint, a controlled test, or restored upstream service availability.

## Already approved, waiting on upstream access / safe execution

- Love Notes secure invitation database migration: `supabase/migrations/20260817_love_note_invitations.sql`.
- Love Notes email/reveal backend setup using Resend, with SMS kept disabled.
- Live Room messaging database migration: `supabase/migrations/20260817_live_room_messaging.sql`.

## Hold for verification before changing

- Existing Supabase `RESEND_API_KEY`: a secret already exists. Do not replace it until the existing waitlist/email usage is verified. A newly created Resend key is being held separately by the account owner.
- `RESEND_FROM_EMAIL`, `SITE_URL`, scheduler secret, and `LOVE_NOTE_DELIVERY_ENABLED`: configure only as part of the controlled Love Notes deployment sequence. Keep real delivery disabled until the backend and test path are ready.
- GitHub, Vercel, and Supabase have been intermittently affected by upstream service issues during this build session. Do not interpret missing/pending deployment status as an application failure without a successful retry after service recovery.

## Visual checkpoint for owner review

- The homepage Live Community demonstration currently contains static avatar initials, named sample participants, and language such as “ROOM OPEN” / “People are talking now.” That presentation can read like live human activity even though it is only a homepage demo. This conflicts with the approved rule that One2OneLove must never imply human participation when there is none. Recommended change: preserve the approved homepage hierarchy and card design, but clearly label the panel as an example conversation or convert it to an AI Host quiet-room topic with no fake live-human status. Hold the visible change for the owner’s next review checkpoint.

## Needs explicit approval before execution

- Love Notes SMS provider / paid SMS activation, including Twilio or any A2P-related costs. The prepared backend now has an independent `LOVE_NOTE_SMS_ENABLED` kill switch so email activation cannot accidentally activate SMS.
- Saved Love Notes migration: `supabase/migrations/20260817_love_note_saves.sql`. The migration and client service are staged only; do not apply or wire the live Save button until approved.
- Live Room sender-identity hardening migration: `supabase/migrations/20260817_live_room_identity_hardening.sql`. This would make the database derive member identity instead of trusting a browser-supplied display name.
- Final numerical sending/rate-limit policy for Love Notes and Live Rooms. Technical rate limiting is a launch requirement, but the actual per-hour/per-day member limits should be approved as a product decision before enforcement.
- Live Room moderation migration: `supabase/migrations/20260817_live_room_moderation.sql`.
- Production security migrations or RLS/policy changes affecting live data.
- Any merge from `relaunch-homepage` into production/default branch.
- Any live production deployment or production data mutation not already specifically approved.

## Launch blockers to review in one batch

- Retest the newly hardened AuthContext across regular sign-in, sign-up confirmation callback, password reset, and professional application flows before production. Unconfirmed-email sessions are now rejected in development rather than intentionally allowed.
- Remove/replace legacy mock verification in `TherapistSignup.jsx`, `InfluencerSignup.jsx`, and `ProfessionalSignup.jsx`. Those pages currently display and accept the hard-coded code `123456` for email and phone verification. They must not launch that way. Decide whether to connect real verification now or keep those application routes out of the initial public launch.
- Harden `users` RLS so sensitive profile fields are not publicly selectable.
- Enable RLS on `waitlist_signups` and review grants.
- Review pairwise `messages` update permissions so receivers cannot alter message content.
- Review `community_members` admin policy for recursion risk.
- Review public views (including `user_presence_view`) for email/sensitive-data exposure and security-invoker/grant behavior.
- Add server-side rate limits / abuse controls for Live Rooms and Love Notes before public launch.

## Controlled test sequence after upstream services stabilize

1. Verify the existing Resend secret usage without exposing the key.
2. Apply the already-approved Love Notes invitation migration.
3. Deploy `send-love-note-invitation` and `reveal-love-note` with JWT verification.
4. Configure the approved email-only Resend path; leave SMS disabled.
5. Keep `LOVE_NOTE_DELIVERY_ENABLED` off until configuration is verified.
6. Run one controlled Love Note email test to an owner-controlled address.
7. Verify sign-in/free-account return-to, secure reveal, sender identity, reply, and save behavior.
8. Only then consider enabling broader Love Notes email delivery.

## Development work completed while approvals are held

- Replaced the legacy Love Notes collection with a relaunch collection that does not expose the note body through browser-local `sms:` / `mailto:` handoffs.
- Added a visible send button for user-written Love Notes and exact-note handoff into the sender flow.
- Added `/LoveNotes/Send` as the launch-ready sender route while retaining the old demo route as a compatibility alias.
- Added recipient-name handoff for Love Note replies.
- Added multilingual sender and reveal experiences for English, Spanish, French, Italian, German, and Dutch.
- Added progressive loading to the 365-note collection so the page does not render the entire library at once.
- Added multilingual Live Community room names, topics, activity labels, and landing-page copy.
- Minimized Realtime Presence data: room clients now receive an aggregate presence record with a one-way pseudonymous key rather than member names/account UUIDs.
- Hardened Love Note send/reveal Edge Function code so both require verified accounts; SMS now has a second independent kill switch.
- Rebuilt AuthContext on the development branch so unconfirmed-email sessions are rejected instead of intentionally allowed.
- Staged the secure Saved Love Notes schema and client service without applying it to production.
- Staged Live Room sender-identity hardening without applying it to production.
- Added a relaunch safety-check script (`npm run relaunch:check`) to flag known security/consistency blockers in the codebase.

Last updated during the August 17, 2026 relaunch build session.
