# One2OneLove Relaunch — Approval Queue

This file tracks only actions that should NOT be performed automatically while development continues.

## Production / live-data approvals to hold

1. Apply `supabase/migrations/20260817_love_note_invitations.sql` to the live Supabase project.
   - Previously approved in conversation, but not applied because of Supabase outage/connector failures.
   - Reconfirm immediately before live application if service stability is uncertain.

2. Deploy Love Notes Edge Functions to the live Supabase project:
   - `send-love-note-invitation`
   - `reveal-love-note`
   - `dispatch-scheduled-love-notes`
   - Keep `LOVE_NOTE_DELIVERY_ENABLED` off until controlled testing is ready.

3. Resolve the existing `RESEND_API_KEY` secret.
   - A secret with that exact name already exists in Supabase.
   - Do not replace it until existing usage is verified.
   - New Resend key is held by the account owner and must never be pasted into chat or source code.

4. Apply `supabase/migrations/20260817_love_note_saves.sql` to activate persistent Saved Love Notes.
   - Development migration and client service are staged only.

5. Apply `supabase/migrations/20260817_live_room_messaging.sql` to the live database.
   - Previously approved, but not applied because of connector failures.

6. Apply `supabase/migrations/20260817_live_room_moderation.sql`.
   - Not yet approved for live database.

7. Apply `supabase/migrations/20260817_live_room_identity_hardening.sql`.
   - Review and approve before live database changes.

8. Security hardening of legacy tables/views.
   - `users` public SELECT exposure.
   - `waitlist_signups` RLS.
   - legacy views/grants and `security_invoker` review.
   - `supabase/migrations/20260817_message_update_hardening.sql` is now staged to stop message recipients from changing message content while still allowing read/delivery receipts.
   - `supabase/migrations/20260817_community_member_policy_hardening.sql` is now staged to remove the recursive `community_members` moderator/admin RLS lookup.
   - Neither staged migration has been applied to the live database.
   - No live security-policy changes without explicit approval and a rollback plan.

9. SMS provider activation.
   - Do not activate paid SMS/Twilio or incur A2P-related cost without separate approval.

10. Production branch / production Vercel deployment.
    - Development remains on `relaunch-homepage`.
    - Do not merge to `master` or alter One2OneLove.com production without explicit approval.

## Safe development work that may continue without separate approval

- Frontend UX and visual refinements on `relaunch-homepage`.
- Development-only migrations and Edge Function code preparation.
- Preview-only flows that do not send messages or modify live data.
- Bug fixes, validation, accessibility, responsive layout, translations, and route cleanup.
- Read-only audits of repository code and Supabase configuration when connectors are available.

## Current operating rule

Build as far as possible in development. Stop only where an action would affect production, live user data, billing/costs, secrets, or irreversible external systems. Collect those actions here for one bulk approval review.
