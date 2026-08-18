# One2OneLove Relaunch — Approval Batch 002

Status: **COLLECTING — DO NOT EXECUTE YET**

Purpose: collect production actions that were materially designed or revised **after** Approval Batch 001 was approved, so development can continue without interrupting the owner for one-off approvals.

Approval Batch 001 remains valid for its approved scope except where this file explicitly supersedes a broader/older privacy design. This file does not authorize a production merge, public launch, live Stripe billing, paid SMS, or a recurring-cost increase.

## A. Private pairwise Chat attachments

1. Apply the reviewed `supabase/migrations/20260818_chat_attachment_privacy.sql` only after the conversation/message hardening prerequisites are active.
   - Convert `chat-files` to a private bucket with a 10 MiB object limit and conservative MIME allowlist.
   - New object path contract: `<conversation_uuid>/<sender_uuid>/<random_uuid>.<extension>`.
   - Use chat-files-only **RESTRICTIVE** Storage RLS boundaries so a broad legacy Storage policy cannot bypass conversation privacy.
   - A newly uploaded object becomes signable/readable only after a visible message in that same conversation references its exact object key.
   - Soft-deleting the message prevents minting a fresh signed URL for that object.
2. Apply the latest reviewed revision of `supabase/migrations/20260817_message_insert_hardening.sql` if the earlier version has not yet been applied.
   - Persist private object paths rather than public URLs.
   - Reject HTTP/public attachment URLs.
   - Bind attachment paths to the authenticated conversation + sender.
3. Activate the updated `src/lib/chatService.js` attachment flow only after item 1 succeeds.
   - Generate participant-only signed URLs with a 15-minute lifetime.
   - Keep text Chat as the safe fallback if attachment activation fails.

## B. Love Note mixed-access membership enforcement

4. Deploy the latest reviewed `send-love-note-invitation` revision when the Batch 001 Love Notes backend is deployed.
   - Instant Love Note send/reveal/reply remains free-account functionality.
   - Future-date scheduling checks `member_subscriptions` server-side when `MEMBERSHIP_GATING_ENABLED=true`.
   - Logical send requests are idempotent so ambiguous network retries do not intentionally create another delivery.
5. Add/configure server `MEMBERSHIP_GATING_ENABLED=false` during controlled rollout and turn it on only after membership/Stripe tests are ready.

## C. Controlled tests for A–B

6. With three controlled authenticated accounts, verify Chat attachment privacy, signed-URL expiry, soft-delete behavior, unsupported/oversized rejection and nonparticipant denial.
7. Verify one member cannot physically delete a shared conversation; archive remains member-local.
8. Verify an attachment object cannot be reused into another conversation without a secure copy into the new conversation path.
9. Verify with membership gating ON that free members can send Love Notes immediately but cannot schedule them, while active members can schedule them.
10. Require `npm run relaunch:private-feature-check` to report zero blockers before activation.

## D. Premium AI Relationship Coach and content tools

11. Apply `supabase/migrations/20260818_premium_ai_tools.sql` only after `member_subscriptions` exists.
   - Raw Coach conversations/messages and premium AI usage remain server-only.
   - Request IDs provide duplicate-generation protection and a private replay/reconciliation ledger.
12. Deploy `relationship-coach` with `PREMIUM_AI_ENABLED=false` and `MEMBERSHIP_GATING_ENABLED=false` initially.
   - Confirmed authentication and active/trialing membership are enforced server-side when enabled.
   - Only limited recent Coach conversation context is sent to OpenAI; Love Notes, pairwise Chat, email and unrelated profile data are not used as hidden context.
   - OpenAI response storage remains disabled (`store:false`).
13. Deploy the reviewed `generate-relationship-content` revision disabled first under the same premium-AI gates.
14. Configure exact premium-AI origins, conservative generation limits and the reviewed model; verify the existing server-side OpenAI secret instead of replacing it blindly.
15. Controlled tests must cover auth, membership, cross-user isolation, request-id replay, rate-limit failure behavior, disabled-spend behavior and private-context boundaries.
16. Keep Relationship Coach and AI Content Creator public activation OFF until safety copy, membership gating and AI-cost tests pass.

## E. Free Date Ideas account persistence

17. Apply `supabase/migrations/20260818_date_ideas_hardening.sql` before enabling custom/saved Date Idea persistence in production.
   - Built-in ideas remain public/free frontend content.
   - `custom_date_ideas` remains private to its owning authenticated member.
   - Browser-supplied ownership is replaced with `auth.uid()` and cannot be reassigned.
18. Activate the relaunch Date Ideas persistence only after controlled ownership tests pass.
19. Verify anonymous built-in browsing, member-only private CRUD, cross-user denial, real favorite/completion fields and no fake partner-sharing claim.

## F. Paid Relationship Goals persistence

20. Keep the relaunch Relationship Goals UI limited to real private goals, target dates, action steps, progress/completion and edit/delete. Do not claim active SMS reminders or partner-sharing.
21. Apply `supabase/migrations/20260818_relationship_goals_membership_hardening.sql` only when paid membership gating is intentionally activated.
22. Controlled tests must verify signed-out/free denial, active-member own-data CRUD, cross-user denial, immutable ownership and correct completion behavior.

## G. Member-directory privacy minimization — supersedes Batch 001 item 15

23. Apply `supabase/migrations/20260818_member_directory_minimization.sql` **instead of exposing the broader Batch 001 directory projection**.
   - Relaunch default discoverable fields are limited to: member ID, display name, optional avatar, short bio and member-since date.
   - Account email, general location, relationship status, partner information, interests, professional/account role, verification and billing fields remain private.
   - Location/relationship visibility may be reconsidered only through a future explicit opt-in visibility model; do not infer consent from a profile field merely existing.
24. After item 23 is active, apply the already-approved `20260817_presence_security_hardening.sql` dependency from Batch 001 if still unapplied.
25. Controlled directory tests must verify:
   - anonymous users cannot select the directory;
   - authenticated member A can see only the minimized projection for member B;
   - direct selection of `email`, `location`, `relationship_status`, `partner_email`, `user_type` or billing fields from the directory fails because those columns do not exist in the projection;
   - Find Members search uses only name/bio and does not display hidden fields.
26. Require the member-connection/privacy preflight to remain zero-blocker before release.

## H. Privacy / account-data request intake

27. Apply `supabase/migrations/20260818_privacy_requests.sql`.
   - The request queue remains backend-only; browser roles cannot directly read/write it.
   - Allowed request types are account-data export and account-deletion request.
   - Duplicate active requests of the same type are prevented.
   - Submission itself does **not** immediately delete an account or manufacture/export data.
28. Deploy `privacy-request` with `PRIVACY_REQUESTS_ENABLED=false` first.
   - Function validates the authenticated, confirmed member server-side.
   - Member may list only their own deliberately shaped request history.
   - No `auth.admin` deletion operation is part of request intake.
29. Configure frontend `VITE_PRIVACY_REQUESTS_ENABLED=false` during setup; enable both frontend/server controls only after one controlled test succeeds.
30. Controlled tests must verify:
   - signed-out/unconfirmed requests are rejected;
   - member A can submit/list only A's requests;
   - member B cannot access A's request by identifier;
   - account-deletion request requires the explicit UI confirmation phrase;
   - submitting a deletion request does not delete Auth, profile, Love Notes, messages or billing records;
   - export request does not falsely claim a completed export before a reviewed fulfillment process exists.

## Explicitly NOT included

- Production/default-branch merge.
- Public launch.
- Live Stripe billing activation.
- Paid SMS/Twilio/A2P activation.
- Any Vercel plan upgrade or new recurring platform expense.
- Destructive deletion of legacy attachment data.
- Immediate/destructive account deletion automation; this batch activates request intake only.
- Automatic generation/emailing of account-data export files before a separate reviewed fulfillment process exists.
- A promise to retain chat attachments, AI Coach history, custom Date Ideas or Relationship Goals indefinitely; retention/deletion policy remains part of legal/product launch review.
- Any replacement of an existing OpenAI/Resend/Stripe secret without first verifying current usage.

## Future owner approval

When this batch is complete and marked READY FOR APPROVAL, the owner can approve it in one instruction:

> Approve One2OneLove Approval Batch 002.

Execution will follow dependency order and stop on any failed prerequisite.