# One2OneLove Relaunch — Approval Queue

Development branch: `relaunch-homepage`

Production remains untouched. This file tracks anything that must wait for explicit approval, a controlled test, or restored upstream service availability.

## Already approved, waiting on upstream access / safe execution

- Love Notes secure invitation database migration: `supabase/migrations/20260817_love_note_invitations.sql`.
- Love Notes email/reveal backend setup using Resend, with SMS kept disabled.
- Live Room messaging database migration: `supabase/migrations/20260817_live_room_messaging.sql`.

## Hold for verification before changing

- Existing Supabase `RESEND_API_KEY`: a secret already exists. Do not replace it until the existing waitlist/email usage is verified. A newly created Resend key is being held separately by the account owner.
- `RESEND_FROM_EMAIL`, `SITE_URL`, scheduler secret, and `LOVE_NOTE_DELIVERY_ENABLED`: configure only as part of the controlled Love Notes deployment sequence. Keep real delivery disabled until the backend and test path are ready.

## Needs explicit approval before execution

- Love Notes SMS provider / paid SMS activation, including Twilio or any A2P-related costs.
- Live Room moderation migration: `supabase/migrations/20260817_live_room_moderation.sql`.
- Production security migrations or RLS/policy changes affecting live data.
- Any merge from `relaunch-homepage` into production/default branch.
- Any live production deployment or production data mutation not already specifically approved.

## Launch blockers to review in one batch

- Verify and remove any remaining unconfirmed-email authentication bypass. The Sign In page now performs an additional confirmed-email check on the development branch, but the underlying AuthContext still needs final hardening/retest.
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

Last updated during the August 17, 2026 relaunch build session.
