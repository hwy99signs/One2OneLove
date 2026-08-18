# One2OneLove Relaunch — Approval Batch 001

Status: **COLLECTING — DO NOT EXECUTE YET**

This file is the single batch for actions that cross the development boundary. Routine work on `relaunch-homepage` continues without interruption. Production/default branch remains untouched until a later explicit release approval.

## Batch 001 — production/backend actions to approve together

### A. Approved previously, still waiting for safe execution

1. Apply `supabase/migrations/20260817_love_note_invitations.sql`.
2. Apply `supabase/migrations/20260817_live_room_messaging.sql`.
3. Deploy Love Notes Edge Functions after configuration review:
   - `send-love-note-invitation`
   - `reveal-love-note`
   - `dispatch-scheduled-love-notes`
4. Configure the **email-only** Love Notes path with Resend. Keep paid SMS disabled.

### B. Security migrations being prepared for this batch

5. Apply `supabase/migrations/20260817_member_directory_privacy.sql`.
6. Apply `supabase/migrations/20260817_users_privacy_lockdown.sql` after all member-facing consumers are migrated away from broad `public.users` reads.
7. Apply `supabase/migrations/20260817_message_update_hardening.sql`.
8. Apply `supabase/migrations/20260817_community_member_policy_hardening.sql`.
9. Apply `supabase/migrations/20260817_presence_security_hardening.sql`.
10. Apply a waitlist RLS/grant hardening migration once its final migration file is staged and reviewed.

### C. Edge Functions / secrets / external systems

11. Read-only verify how the existing Supabase `RESEND_API_KEY` is used before changing it. **Do not replace the existing secret blindly.**
12. If verification shows the existing key is appropriate, reuse it for Love Notes instead of replacing it.
13. Configure `RESEND_FROM_EMAIL`, `SITE_URL`, scheduler secret and Love Notes delivery flags as part of the controlled deployment. Keep `LOVE_NOTE_DELIVERY_ENABLED` off until the controlled test is ready.
14. Deploy `live-room-host` only after its production environment requirements and OpenAI secret usage are verified. No secret is to be placed in source code or chat.

### D. Controlled live tests covered by this batch after A–C succeed

15. Send one Love Note email to an owner-controlled test address.
16. Test secure reveal, sign-in/create-account return path, sender identity, reply, and save behavior.
17. Test password-recovery redirect and new-password completion with an owner-controlled account.
18. Test Live Room persistence/presence with controlled test accounts only.

## Explicitly NOT included in Batch 001

- Paid SMS/Twilio/A2P activation or SMS spend.
- A production/default-branch merge.
- Public launch of One2OneLove.com.
- Any replacement of an existing production secret without first verifying its current usage.
- Any irreversible deletion of live user data.

## How to approve

When this file is marked **READY FOR APPROVAL**, the owner can approve it in one instruction such as:

> Approve One2OneLove Approval Batch 001.

Execution should then follow the numbered order, stopping automatically if a prerequisite fails rather than partially forcing the batch through.
