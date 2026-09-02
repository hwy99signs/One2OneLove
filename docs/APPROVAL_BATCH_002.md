# One2OneLove Relaunch — Approval Batch 002

Status: **SUPERSEDED — DO NOT EXECUTE AS A BULK BATCH**

This file is retained only as a historical map of development work that was once collected as “Approval Batch 002.” It is **not an executable production approval mechanism anymore**.

The current production workflow requires approvals **one at a time**. The authoritative pending list is `docs/RELAUNCH_APPROVAL_QUEUE.md`; completed live actions are recorded in `docs/PRODUCTION_APPROVAL_EXECUTION.md`.

A statement such as “Approve Batch 002” must not be interpreted as authorization to execute the items below.

## Historical workstreams and their current disposition

### A. Private pairwise Chat attachments

Development artifacts include:

- `supabase/migrations/20260818_chat_attachment_privacy.sql`
- `supabase/migrations/20260817_message_insert_hardening.sql`
- `src/lib/chatService.js`

The reviewed design uses private attachment storage, conversation/sender-bound object paths, participant-only signed access and message-linked visibility.

**Production activation remains separately approval-gated.** Recheck the current live message/conversation/storage state before any migration because some legacy message hardening was later found to already exist live in a newer form.

### B. Love Note mixed-access membership enforcement

Development source supports the intended boundary that instant Love Notes remain free while future-date scheduling can be membership-gated when the server feature gate is enabled.

The live Love Notes function names were later deployed DARK under completed approval #2. That action must not be repeated, and DARK handlers must not be replaced with real delivery code without a new explicit approval.

### C. Premium AI Relationship Coach and content tools

Development artifacts include premium-AI migrations/functions and membership/cost gates.

Production activation remains pending. Keep premium AI and membership gating disabled until separately approved controlled testing covers authentication, membership, cross-user isolation, request-id replay, rate limits, spend behavior and private-context boundaries.

### D. Free Date Ideas account persistence

Development persistence/hardening may continue.

Production database activation remains a separate approval. Built-in Date Ideas should remain available without manufacturing persistence/sharing claims when persistence is disabled.

### E. Paid Relationship Goals persistence

Development persistence/hardening may continue.

Production activation remains tied to a separately approved membership rollout. Do not claim SMS reminders or partner sharing unless those capabilities are actually implemented and approved.

### F. Member-directory privacy minimization

This workstream evolved into the current pending **#8C — Presence + member-directory privacy** approval.

Current staged reconciliation includes:

- `supabase/migrations/20260820100500_presence_directory_privacy_reconciliation.sql`
- `supabase/migrations/20260820151000_member_directory_source_minimization.sql`
- minimized member-discovery client reads
- presence/privacy regression checks

Do not apply through this old batch. Explain and obtain explicit #8C approval separately after #8B is resolved.

### G. Privacy / account-data request intake

This workstream evolved after the original Batch 002 draft because two staged privacy-request schema generations diverged.

Current development final-state reconciliation includes:

- `supabase/migrations/20260818_privacy_requests.sql`
- historical `20260819` privacy-request migrations
- `supabase/migrations/20260821211500_privacy_request_workflow_reconciliation.sql`
- `supabase/functions/privacy-request`
- `supabase/functions/manage-privacy-requests`
- the canonical `/PrivacyCenter` route

The obsolete `src/pages/PrivacyRequests.jsx` workflow has been retired to a compatibility alias of `PrivacyCenter` so it cannot revive direct-table/data-correction behavior.

Production activation remains separate and OFF. Request intake/review is deliberately non-destructive: submission does not automatically export data or delete an account.

## Boundaries that remain unchanged

This historical document never authorizes:

- merge to `master` or production Vercel cutover;
- public launch;
- live Stripe/membership cutover;
- paid SMS/Twilio/A2P or another external messaging channel;
- provider/scheduler activation;
- production secret rotation/replacement;
- destructive deletion of user data or auth users;
- staff/admin authority grants;
- automatic account-data export fulfillment;
- automatic account-deletion fulfillment.

## Current approval rule

For every production-affecting action:

1. use `docs/RELAUNCH_APPROVAL_QUEUE.md` to identify the next pending item;
2. explain that single action, its risk and its boundaries;
3. receive explicit approval for that action only;
4. re-fetch the current branch source and live state;
5. execute only the approved change;
6. verify it immediately;
7. record it in `docs/PRODUCTION_APPROVAL_EXECUTION.md`.

**There is no valid bulk “Approval Batch 002” execution instruction anymore.**
