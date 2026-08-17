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

## Development work completed while approvals are held

- Replaced the legacy Love Notes collection with a relaunch collection that does not expose the note body through browser-local `sms:` / `mailto:` handoffs.
- Added a visible send button for user-written Love Notes and exact-note handoff into the sender flow.
- Added `/LoveNotes/Send` as the launch-ready sender route while retaining the old demo route as a compatibility alias.
- Added recipient-name handoff for Love Note replies.
- Added multilingual sender and reveal experiences for English, Spanish, French, Italian, German, and Dutch.
- Added a confirmed-email check at the Sign In boundary as defense in depth while final AuthContext hardening remains on the launch-blocker list.

Last updated during the August 17, 2026 relaunch build session.
