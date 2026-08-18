# One2OneLove Relaunch — Approval Batch 002

Status: **COLLECTING — DO NOT EXECUTE YET**

Purpose: collect production actions that were materially designed or revised **after** Approval Batch 001 was approved, so development can continue without interrupting the owner for one-off approvals.

Approval Batch 001 remains valid for the items/version scope already approved. This file does not authorize a production merge, public launch, live Stripe billing, paid SMS, or a recurring-cost increase.

## A. Private pairwise Chat attachments

1. Apply the reviewed `supabase/migrations/20260818_chat_attachment_privacy.sql` only after the conversation/message hardening prerequisites are active.
   - Convert `chat-files` to a private bucket with a 10 MiB object limit and conservative MIME allowlist.
   - New object path contract: `<conversation_uuid>/<sender_uuid>/<random_uuid>.<extension>`.
   - Use chat-files-only **RESTRICTIVE** Storage RLS boundaries so a broad legacy Storage policy cannot bypass conversation privacy.
   - Do not delete or rewrite unrelated generic Storage policies merely to secure Chat.
   - A newly uploaded object becomes signable/readable only after a visible message in that same conversation references its exact object key.
   - Soft-deleting the message prevents minting a fresh signed URL for that object.
   - Preserve participant-only legacy attachment readability through the original visible message record while permanent public access is disabled.
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
   - Logical send requests are idempotent so ambiguous network retries do not intentionally create another delivery.
5. Add/configure server `MEMBERSHIP_GATING_ENABLED=false` during controlled rollout.
   - It remains OFF during initial backend validation.
   - It may be turned ON only after the membership table, Stripe test sequence, and corresponding mixed-access UX are confirmed.

## C. Controlled tests for A–B

6. With three controlled authenticated accounts, verify Chat attachment privacy:
   - participant A uploads a supported file to A/B conversation;
   - before message insertion neither participant can sign the orphan object;
   - after message insertion participant B can obtain/use a signed URL;
   - participant C cannot read/sign the object;
   - B cannot update/delete A's object;
   - anonymous/public URL access fails;
   - signed URLs expire;
   - soft-deleting the message prevents minting a fresh signed URL;
   - oversized and unsupported files fail;
   - unrelated Storage buckets still function normally.
7. Verify one member cannot physically delete a shared conversation; the existing UI action results in member-local archive behavior.
8. Verify a private attachment object from one conversation cannot simply be reused/forwarded into another conversation without a secure copy into the new conversation path.
9. Verify with server membership gating ON in the controlled environment:
   - free member can send a Love Note immediately;
   - free member cannot schedule one;
   - active member can schedule one;
   - signed-out/unconfirmed accounts do not gain scheduling access;
   - disabling the server gate restores rollout/test behavior without changing schema.
10. Require `npm run relaunch:private-feature-check` to report zero blockers before these private-feature changes are considered production-ready.

## D. Premium AI Relationship Coach and content tools

11. Apply `supabase/migrations/20260818_premium_ai_tools.sql` only after `member_subscriptions` exists.
   - Raw Coach conversations/messages and premium AI usage remain server-only.
   - Request IDs provide duplicate-generation protection and a private replay/reconciliation ledger.
   - Browser clients receive deliberately shaped function responses rather than raw table access.
12. Deploy `relationship-coach` with both `PREMIUM_AI_ENABLED=false` and `MEMBERSHIP_GATING_ENABLED=false` initially.
   - Confirmed authentication and an active/trialing membership are enforced server-side before any OpenAI request when enabled.
   - The function supports own-conversation list/create/read/delete and membership-gated message generation.
   - It sends only the member's limited recent Coach conversation context, not their Love Notes, pairwise Chat, email, profile, or Live Community history.
   - OpenAI response storage remains disabled in the prepared request (`store:false`).
   - Lost-response retries use the same request ID to replay a completed result rather than create a second model generation.
13. Deploy the reviewed `generate-relationship-content` revision disabled first under the same premium-AI gates.
   - AI Content Creator accepts only the member-supplied generation fields plus server-owned entitlement state; it does not read Love Notes, pairwise Chat, account email, or other private relationship history for model context.
   - A successful generation is stored privately against its logical request ID so a lost-response retry can replay the same result without a second model call.
14. Configure premium AI controls/secrets without exposing secret values in source or chat:
   - existing server-side `OPENAI_API_KEY` must be verified before use, not blindly replaced;
   - `PREMIUM_AI_ALLOWED_ORIGINS` exact allowlist;
   - `PREMIUM_AI_ENABLED=false` during configuration/testing setup;
   - `MEMBERSHIP_GATING_ENABLED=false` until the controlled membership path is ready;
   - conservative per-hour/per-day limits for Coach and AI content generation;
   - reviewed `OPENAI_MODEL` value.
15. Controlled premium-AI tests must verify:
   - signed-out and unconfirmed accounts are rejected;
   - free members are rejected when membership gating is active;
   - active controlled member can create/read/delete only their own Coach conversations;
   - a different member cannot access another Coach conversation by UUID;
   - identical logical request ID does not generate twice after a lost/ambiguous response;
   - AI Content Creator retry with the same completed request ID returns its stored draft;
   - rate limits fail closed when the usage ledger is unavailable;
   - disabling `PREMIUM_AI_ENABLED` prevents model spend even if the UI is accessible;
   - no private Love Note, pairwise Chat, account email, or unrelated profile text is added to premium-AI model context.
16. Keep Relationship Coach and AI Content Creator public activation OFF until the product safety copy, premium membership gate, and controlled AI-cost test all pass.

## E. Free Date Ideas account persistence

17. Apply `supabase/migrations/20260818_date_ideas_hardening.sql` before enabling custom/saved Date Idea persistence in production.
   - Built-in Date Ideas remain public/free frontend content and require no database read.
   - `custom_date_ideas` remains private to its owning authenticated member.
   - Browser-supplied `user_id` is replaced with `auth.uid()` and cannot be reassigned on update.
   - RESTRICTIVE owner boundaries cap any unknown permissive legacy RLS policy.
   - New/updated rows enforce the actual table contract: title/description lengths and supported category/budget/location/occasion/stage values.
   - Constraints are initially `NOT VALID` so historical dirty Base44-era rows do not make the migration fail; existing rows must be reviewed before later validation.
18. Activate the relaunch Date Ideas service/UI only after item 17 passes controlled ownership tests.
   - Visitors can browse the multilingual built-in catalog without signing in.
   - Confirmed free accounts can create private custom ideas, save a built-in idea as a private member copy, favorite/unfavorite, mark done/not done, edit, and delete their own rows.
   - The legacy fake `created_by`, `completed`, `difficulty`, `duration_hours`, `is_public`, and `partner_email` persistence assumptions are not used.
   - No “shared with partner” success claim is shown until real partner-sharing semantics are separately designed and tested.
19. Controlled Date Ideas tests must verify:
   - anonymous visitor can browse built-ins but cannot read `custom_date_ideas`;
   - member A can CRUD only A-owned rows;
   - member B cannot read/update/delete A's row even by direct UUID;
   - save/favorite/completion use the real `is_favorite` and `is_completed` fields;
   - repeated save of the same built-in idea does not intentionally create duplicate favorite rows;
   - account-data failure leaves built-in browsing available with a truthful private-tools-unavailable state.

## F. Paid Relationship Goals persistence

20. Keep the relaunch Relationship Goals UI limited to functionality that actually exists:
   - private member goals;
   - title/description/category/target date;
   - up to 20 action steps;
   - progress/completion;
   - edit/delete.
   - Do not present SMS reminders as active; there is no reviewed reminder dispatcher/provider flow.
   - Do not claim goals are shared with a partner; `partner_email`/`shared_with_partner` legacy columns do not by themselves create a permission or notification model.
21. Apply `supabase/migrations/20260818_relationship_goals_membership_hardening.sql` **only when paid membership gating is being activated**, not during the intentionally open/free beta.
   - Requires `member_subscriptions`.
   - Adds a server/database active/trialing membership predicate.
   - Browser goal and action-step access is capped by both owner identity and paid membership through RESTRICTIVE RLS boundaries.
   - Browser-supplied goal ownership is derived from `auth.uid()` and cannot be reassigned.
   - New/updated relaunch rows get title/description/step limits without forcing an immediate scan of dirty legacy rows.
22. Controlled Relationship Goals tests when membership gating is ready must verify:
   - signed-out/unconfirmed/free users cannot read or mutate paid goal data;
   - active/trialing member A can CRUD only A's goals/steps;
   - member B cannot access A's goal/step by UUID;
   - a member cannot change `user_id` to transfer a goal;
   - progress 100% results in completed status;
   - SMS/partner-sharing claims remain absent from the relaunch UI until separately implemented and approved.

## Explicitly NOT included

- Production/default-branch merge.
- Public launch.
- Live Stripe billing activation.
- Paid SMS/Twilio/A2P activation.
- Any Vercel plan upgrade or new recurring platform expense.
- Destructive deletion of legacy attachment data.
- A promise to retain chat attachments, AI Coach history, custom Date Ideas, or Relationship Goals indefinitely; retention/deletion policy remains part of legal/product launch review.
- Any replacement of an existing OpenAI/Resend/Stripe secret without first verifying its current usage.

## Future owner approval

When this batch is complete and marked READY FOR APPROVAL, the owner can approve it in one instruction:

> Approve One2OneLove Approval Batch 002.

Execution will follow dependency order and stop on any failed prerequisite.
