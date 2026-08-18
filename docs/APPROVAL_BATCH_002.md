# One2OneLove Relaunch — Approval Batch 002

Status: **COLLECTING — DO NOT EXECUTE YET**

Purpose: collect production actions that were materially designed or revised **after** Approval Batch 001 was approved, so development can continue without interrupting the owner for one-off approvals.

Approval Batch 001 remains valid for the items/version scope already approved. This file does not authorize a production merge, public launch, live Stripe billing, paid SMS, or a recurring-cost increase.

## A. Private pairwise Chat attachments

1. Apply the reviewed `supabase/migrations/20260818_chat_attachment_privacy.sql` only after the conversation/message hardening prerequisites are active.
   - Convert `chat-files` to a private bucket with a 10 MiB object limit.
   - New object path contract: `<conversation_uuid>/<sender_uuid>/<random_uuid>.<extension>`.
   - Use chat-files-only **RESTRICTIVE** Storage RLS boundaries so a broad legacy Storage policy cannot bypass conversation privacy.
   - Do not delete or rewrite unrelated generic Storage policies merely to secure Chat.
   - Preserve participant-only legacy attachment readability through the original message record while permanent public access is disabled.
2. Apply the latest reviewed revision of `supabase/migrations/20260817_message_insert_hardening.sql` if the earlier Batch 001 version has not yet been applied.
   - Persist private object paths rather than public URLs.
   - Reject HTTP/public attachment URLs.
   - Bind attachment paths to the authenticated conversation + sender.
   - Enforce supported message types and 10 MiB message metadata limit.
3. Activate the updated `src/lib/chatService.js` attachment flow only after item 1 succeeds.
   - Generate participant-only signed URLs with a 15-minute lifetime.
   - Enforce a conservative attachment MIME allowlist client-side in addition to Storage/database enforcement.
   - Clean up an uploaded object when the message insert fails.
   - Preserve text Chat as the safe fallback if attachment activation fails.

## B. Love Note mixed-access membership enforcement

4. Deploy the latest reviewed `send-love-note-invitation` revision when the Batch 001 Love Notes backend is deployed.
   - Instant Love Note send/reveal/reply remains free-account functionality.
   - Future-date scheduling checks `member_subscriptions` server-side when `MEMBERSHIP_GATING_ENABLED=true`.
   - A free account receives `MEMBERSHIP_REQUIRED` for `love_note_scheduling`; a membership-backend failure returns a controlled unavailable state rather than granting access.
5. Add/configure server `MEMBERSHIP_GATING_ENABLED=false` during controlled rollout.
   - It remains OFF during initial backend validation.
   - It may be turned ON only after the membership table, Stripe test sequence, and the corresponding client mixed-access UX are confirmed.

## C. Controlled tests covered by this batch

6. With three controlled authenticated accounts, verify Chat attachment privacy:
   - participant A uploads a supported file to A/B conversation;
   - participant B can obtain/use a signed URL;
   - participant C cannot read/sign the object;
   - B cannot update/delete A's object;
   - anonymous/public URL access fails;
   - signed URLs expire;
   - oversized and unsupported files fail;
   - unrelated Storage buckets still function normally.
7. Verify one member cannot physically delete a shared conversation; the existing UI action results in member-local archive behavior.
8. Verify a private attachment object from one conversation cannot simply be reused/forwarded into another conversation without a secure copy into the new conversation path.
9. Verify with server membership gating ON in the controlled environment:
   - free member can send a Love Note immediately;
   - free member cannot schedule one;
   - active member can schedule one;
   - signed-out/unconfirmed accounts do not gain scheduling access;
   - disabling the server gate restores the rollout/test behavior without changing schema.
10. Require `npm run relaunch:private-feature-check` to report zero blockers before these private-feature changes are considered production-ready.

## Explicitly NOT included

- Production/default-branch merge.
- Public launch.
- Live Stripe billing activation.
- Paid SMS/Twilio/A2P activation.
- Any Vercel plan upgrade or new recurring platform expense.
- Destructive deletion of legacy attachment data.
- A promise to retain chat attachments indefinitely; retention/deletion policy remains part of legal/product launch review.

## Future owner approval

When this batch is complete and marked READY FOR APPROVAL, the owner can approve it in one instruction:

> Approve One2OneLove Approval Batch 002.

Execution will follow dependency order and stop on any failed prerequisite.
