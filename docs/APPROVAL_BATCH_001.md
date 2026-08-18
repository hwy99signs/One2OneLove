# One2OneLove Relaunch — Approval Batch 001

Status: **OWNER APPROVED — EXECUTION PARTIALLY BLOCKED BY SUPABASE CONNECTOR INSTABILITY**

Owner approval received **2026-08-18** with the recommended free-account / paid-membership structure and **no separate free trial**. Approval remains valid for the reviewed Batch 001 scope below. Routine work on `relaunch-homepage` continues. Production/default branch remains untouched until a separate release approval.

Execution rule: run in dependency order and stop on a failed prerequisite. Do not force writes through an unstable connector. Any item later superseded by a stricter privacy/security design is held rather than executed under an older approval.

## Batch 001 — approved production/backend actions

### A. Core Love Notes backend

1. Apply the approved reviewed version of `supabase/migrations/20260817_love_note_invitations.sql`.
   - Raw reveal tokens are never stored.
   - Browser roles have no direct access to the private delivery table.
   - Participant history is exposed only through a safe projection that omits recipient contact, token hashes, provider IDs, and failure internals.
2. Apply `supabase/migrations/20260817_love_note_saves.sql`.
   - Recipients can save only a Love Note already securely claimed by their account.
   - Saved-note content is exposed through an authenticated recipient-only projection.
3. Deploy the reviewed Love Notes Edge Functions:
   - `send-love-note-invitation`
   - `reveal-love-note`
   - `dispatch-scheduled-love-notes`
4. Configure the **email-only** Love Notes path with Resend. Keep paid SMS disabled.
5. Configure `LOVE_NOTE_ALLOWED_ORIGINS` for the production origin plus only the exact controlled preview origin(s) used during testing.
6. Configure conservative beta delivery controls before enabling real delivery:
   - `LOVE_NOTE_MAX_PER_HOUR=10`
   - `LOVE_NOTE_MAX_PER_DAY=30`
   - `LOVE_NOTE_MAX_SCHEDULE_DAYS=365`
   - `LOVE_NOTE_DISPATCH_BATCH_SIZE=25`
7. Keep `LOVE_NOTE_DELIVERY_ENABLED=false` until all Love Notes migrations/functions/secrets pass configuration checks. `LOVE_NOTE_SMS_ENABLED` remains false.

### B. Live Community backend and moderation

8. Apply `supabase/migrations/20260817_live_room_messaging.sql`.
9. Apply `supabase/migrations/20260817_live_room_identity_hardening.sql` immediately after the messaging migration.
   - Member `user_id` and public sender name are derived server-side from the authenticated account/profile.
   - Public room identity is never derived from account email.
10. Apply `supabase/migrations/20260817_live_room_moderation.sql`.
   - Members may submit pending reports about another member's message.
   - Browser roles cannot browse or manage the private report queue.
11. Apply `supabase/migrations/20260817_live_room_host_cache.sql` before enabling AI Host generation.
   - Server-only cache/cost guard permits one generation claim per room/language/context/time bucket.
12. Deploy the reviewed `live-room-host` Edge Function with `LIVE_ROOM_AI_ENABLED=false` first.
13. Configure `LIVE_ROOM_ALLOWED_ORIGINS` and recommended beta AI cost guard `LIVE_ROOM_HOST_MIN_INTERVAL_SECONDS=300`.
14. After the controlled room test succeeds, enable `LIVE_ROOM_AI_ENABLED=true`. The function must continue to fall back to the already-localized room topic if AI or the cache is unavailable.

### C. Account/member privacy and security migrations

15. **HELD / SUPERSEDED — DO NOT APPLY YET:** `supabase/migrations/20260817_member_directory_privacy.sql`.
   - A later privacy review determined that location and relationship status should not be discoverable by default.
   - The stricter `20260818_member_directory_minimization.sql` is collected in Approval Batch 002.
   - Do not expose the broader Batch 001 directory view during the interim.
16. **HELD WITH ITEM 15:** `supabase/migrations/20260817_presence_security_hardening.sql` until the minimized member directory prerequisite is approved/applied.
17. Apply `supabase/migrations/20260817_message_update_hardening.sql`.
   - Recipients can change receipt state only.
   - Senders can edit/delete their own content only.
   - Message identity/routing fields remain immutable after insert.
18. Apply `supabase/migrations/20260817_community_member_policy_hardening.sql`.
19. Apply `supabase/migrations/20260817_waitlist_privacy_hardening.sql`.
   - Current waitlist becomes browser write-only.
   - Legacy `waitlist_signups` becomes backend/service-role only.
20. Apply `supabase/migrations/20260817_users_mutation_hardening.sql` after the matching AuthContext/profile-service frontend is ready.
   - Direct browser INSERT into `public.users` is revoked.
   - Missing regular profiles are created through `ensure_own_regular_profile`, which derives account ID/email/regular role from confirmed Supabase Auth.
   - Browser self-service UPDATE is default-deny for privileged/unknown fields; only ordinary profile fields are editable.
   - Legacy public professional-registration APIs now fail closed instead of self-creating privileged accounts.
21. Apply `supabase/migrations/20260817_users_privacy_lockdown.sql` **last among the profile/privacy migrations**, after the automated/direct-access audit confirms there is no required broad `public.users` read.

### D. Professional / therapist / influencer application intake

22. Apply `supabase/migrations/20260817_professional_applications.sql`.
   - Applications remain private pre-membership records.
   - Email/phone begin unverified.
   - Submission does not auto-create a member account or temporary password.
23. Deploy `submit-professional-application` with public invocation (`verify_jwt=false`) but `PROFESSIONAL_APPLICATIONS_ENABLED=false` initially.
24. Configure exact `PROFESSIONAL_APPLICATION_ALLOWED_ORIGINS`.
25. Configure Cloudflare Turnstile for the professional-application form before broad intake:
   - add the public `VITE_TURNSTILE_SITE_KEY` to the frontend/Vercel environment,
   - store `TURNSTILE_SECRET_KEY` only in Supabase Edge Function secrets,
   - set `PROFESSIONAL_APPLICATION_TURNSTILE_REQUIRED=true`,
   - allow only approved One2OneLove production/test hostnames in the Turnstile widget configuration.
26. After one controlled application test succeeds, set `PROFESSIONAL_APPLICATIONS_ENABLED=true`.

### E. Secrets / external systems

27. Read-only verify how the existing Supabase `RESEND_API_KEY` is used before changing it. **Do not replace the existing secret blindly.**
28. If verification shows the existing key is appropriate, reuse it for Love Notes instead of replacing it.
29. Configure `RESEND_FROM_EMAIL`, `SITE_URL`, `LOVE_NOTE_SCHEDULER_SECRET`, the Love Notes limits above, and delivery flags only through Supabase secret/config management. No secret value belongs in GitHub or chat.
30. Verify the existing server-side `OPENAI_API_KEY` availability before enabling the AI Host; never expose or replace it blindly.
31. Do **not** upgrade Vercel merely to bypass a preview build-rate limit unless a later approval explicitly authorizes a hosting-plan change.

### F. Controlled live tests covered by this batch after A–E succeed

32. Submit one waitlist entry and confirm browser roles cannot read waitlist records.
33. Create/confirm one controlled regular-member account and verify the trusted profile bootstrap creates only a `regular` own profile; confirm direct browser `public.users` INSERT and privileged-field UPDATE attempts fail.
34. Send one **email** Love Note to an owner-controlled test address.
35. Verify the invitation contains the sender identity and secure reveal link but **not the Love Note body**.
36. Verify sign-in/free-account return-to, confirmed-email requirement, secure reveal, sender identity, reply, save, Saved Love Notes, and remove-from-saved behavior.
37. Verify a token cannot be claimed by a different account and an email invitation can be claimed only by the confirmed email address that received it.
38. Verify scheduled email delivery with one short controlled schedule; confirm SMS remains untouched/disabled.
39. Verify password-recovery redirect and new-password completion with an owner-controlled account.
40. Test Live Room persistence, real presence count, sender identity, reactions, own-message deletion, report submission, and no fake-human activity with controlled test accounts.
41. Confirm simultaneous identical AI Host requests create at most one OpenAI generation per room/language/context/time bucket.
42. Submit one controlled professional application and confirm no Auth user/member account is created automatically and browser roles cannot read the application table.
43. Run the strict relaunch preflight and require zero blockers before a production-release batch is considered.

## Explicitly NOT included in Batch 001

- Paid SMS/Twilio/A2P activation or SMS spend.
- A production/default-branch merge.
- Public launch of One2OneLove.com.
- Live Stripe billing activation merely because this batch is approved.
- Any replacement of an existing production secret without first verifying its current usage.
- Any irreversible deletion of live user data.
- Any Vercel/hosting-plan upgrade or new recurring platform expense.
- Approval/rejection of any real therapist, influencer, or professional applicant.
- The broader member-directory exposure superseded by Batch 002 minimization.

## Current execution note

The owner approved Batch 001. Attempts to begin with a read-only Supabase migration-history prerequisite check encountered intermittent connector disablement/upstream failure, so execution stopped **before any Batch 001 production migration was applied**. Resume from the first unapplied prerequisite only when the connector is stable enough to verify state safely.
