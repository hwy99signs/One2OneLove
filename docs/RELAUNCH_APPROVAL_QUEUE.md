# One2OneLove Relaunch — Pending Production Approval Queue

This file tracks **only production-affecting work that is still pending explicit approval**.

Completed production approvals through **#8C-A** are recorded in `docs/PRODUCTION_APPROVAL_EXECUTION.md` and the retained detailed execution record `docs/APPROVAL_EXECUTION_20260820.md`.

Normal development may continue on `relaunch-homepage`. A development commit, feature flag, migration, Edge Function source file, or instruction to `continue uninterrupted` is **not** permission to mutate production.

## Completed work that must NOT return to this queue

- #8B Community membership security — complete.
- #8C Presence + member-directory privacy — complete live.
- #8C-A Member-directory source minimization — complete live.

`supabase/migrations/20260822004500_presence_directory_privacy_final.sql` is a development/recovery reference only. It must **not** be applied to the existing production project merely because it is newer. Any future production use requires a fresh read-only audit showing that the completed #8C/#8C-A state is missing or materially drifted, followed by a new explicit corrective approval.

## No production action is automatically next

There is currently no numbered production action that may be inferred from development progress. When production approvals resume, select **one** of the held workstreams below, explain exactly what would change and what would remain untouched, and wait for explicit approval before any mutation.

## Pending production holds

### Privacy-request backend activation

Development includes a reconciled, non-destructive account privacy-request queue and review flow:

- `supabase/migrations/20260818_privacy_requests.sql`
- `supabase/migrations/20260819_privacy_requests.sql` (historical staged shape)
- `supabase/migrations/20260819_privacy_request_state_guard.sql` (historical staged guard)
- `supabase/migrations/20260821211500_privacy_request_workflow_reconciliation.sql`
- `supabase/functions/privacy-request`
- `supabase/functions/manage-privacy-requests`

Production remains OFF. The queue records/reviews requests only; it does **not** automatically export data or delete accounts. Any destructive fulfillment path requires separate review and approval.

### SMS / external messaging activation

Do not activate paid SMS/Twilio/A2P delivery without separate approval.

The staged Love Notes SMS model requires **verified number control** before a consent record may become active. Website checkbox capture is only `pending_verification`; it cannot authorize sending by itself.

Before SMS activation, the approved sequence must include:

- `supabase/migrations/20260820154500_love_note_sms_compliance.sql`;
- `supabase/migrations/20260821235500_love_note_sms_verified_consent_guard.sql`;
- a reviewed verification path proving control of the destination before `status='active'`;
- signed provider STOP/START synchronization;
- final legal/provider/A2P review and controlled tests;
- explicit production approval for provider/cost activation.

Do not add email, SMS, mobile push, web push, or another paid/third-party reminder/support channel without approval covering provider, cost, consent/opt-out, privacy, retention, and operational ownership.

Existing `RESEND_API_KEY` remains preserved under completed approval #3; do not rotate it casually.

### Real Love Notes delivery activation

The three live Love Notes function names created under completed approval #2 remain intentionally DARK/fail-closed.

Do not replace the dark handlers with real delivery code, enable provider delivery, or create a Love Notes scheduler without a new explicit approval and controlled test plan.

### Production branch / Vercel cutover

- Development branch remains `relaunch-homepage`.
- Do not merge to `master` or alter the One2OneLove production deployment without explicit approval.
- Preview/build failures must be investigated independently; a failed preview is never a reason to bypass the production gate.

### Creator programming calendar + functions + frontend

Production activation remains pending for the creator/O2OL programming stack, including:

- `supabase/migrations/20260819_creator_programming_calendar.sql`;
- `book-creator-programming-slot`;
- `list-creator-programming`;
- `current-creator-programming`;
- `manage-o2ol-programming`;
- `/CreatorProgramming` and live/up-next UI activation.

Keep `CREATOR_PROGRAMMING_ENABLED=false` and `VITE_CREATOR_PROGRAMMING_ENABLED=false` until an approved controlled rollout.

The development contract remains: independent approved creator accounts can use up to two free slots per local day; O2OL-owned programming uses server-authorized staff; live/replay scheduling is supported; paid slot sales stay dormant.

### O2OL programming staff authority

- `/O2OLProgrammingAdmin` must remain absent from general member navigation.
- Staff authority must come only from server-side `O2OL_PROGRAMMING_ADMIN_USER_IDS`.
- Do not populate/activate production staff authority until exact accounts are explicitly approved.

### Paid creator programming slots

Do not activate paid slot sales in the initial free-calendar rollout. A paid rollout needs a separate approval covering pricing, checkout/provider behavior, creator terms, cancellation/refund policy, disputes/chargebacks, tax/accounting treatment, moderation obligations, and any revenue-share policy.

### Programming reminders + dispatcher

Production activation remains pending for programming-reminder migrations/functions, any scheduler/cron, `PROGRAMMING_REMINDER_DISPATCH_SECRET`, and the client/server switches.

Keep `VITE_PROGRAMMING_REMINDERS_ENABLED=false` and `PROGRAMMING_REMINDERS_ENABLED=false` during any future dark deployment/testing. The staged dispatcher is in-app only; external delivery channels are a separate approval.

### Member-blocking safety stack

Production activation remains pending for the full member-blocking stack, including `20260819_member_blocks.sql`, chat/connection/Live Room/pairwise visibility enforcement, pending-request cleanup, and the block/list/discovery functions.

Keep `VITE_MEMBER_BLOCKING_ENABLED=false` and `MEMBER_BLOCKING_ENABLED=false` until the entire batch is verified together. Before approval, verify both directions of interaction/visibility and that unblock does not recreate prior relationships/requests.

### Programming moderation

Production activation remains pending for:

- `supabase/migrations/20260819_programming_moderation.sql`;
- `report-programming`;
- `moderate-programming`;
- moderation feature switches.

Reporter identity must remain private from ordinary moderator payload/UI. Moderator authority must remain server-allowlisted, not profile-role based. `/ProgrammingModerationAdmin` must stay out of general navigation.

### Private member support

Production activation remains pending for support table/guard/read-state migrations, `support-request`, `manage-support-requests`, and feature switches.

Keep `VITE_SUPPORT_REQUESTS_ENABLED=false` and `SUPPORT_REQUESTS_ENABLED=false` until approved testing. Staff authority must come only from `O2OL_SUPPORT_ADMIN_USER_IDS`. Support is not an emergency/crisis service and must not be presented as continuously monitored. Outbound email/SMS/push/ticketing remains separately approval-gated.

### Professional application review

The public application intake and private review workflow remain production-gated separately. Development review work includes:

- `supabase/migrations/20260822000500_professional_application_review_guard.sql`;
- `supabase/functions/manage-professional-applications`;
- `/ProfessionalApplicationsAdmin`;
- `VITE_PROFESSIONAL_APPLICATION_REVIEW_ENABLED` / `PROFESSIONAL_APPLICATION_REVIEW_ENABLED`;
- server-side `O2OL_PROFESSIONAL_APPLICATION_ADMIN_USER_IDS` authority.

Do not apply/deploy/enable the review workflow or populate production reviewer authority without separate explicit approval. Application approval is deliberately **not** account activation: the review path does not create Auth users, modify `public.users.user_type`, grant staff/member authority, or send communications. `approved` status requires email and phone verification flags to already be true.

`/ProfessionalApplicationsAdmin` must remain absent from general member navigation.

### Relaunch membership billing / Stripe cutover

Do not alter the existing live legacy Stripe contract during normal relaunch development.

The relaunch uses a different single-membership contract. Keep `VITE_PAYMENTS_ENABLED=false` and server `PAYMENTS_ENABLED=false` until an explicitly approved cutover.

Before approval, inventory Stripe customers/subscriptions/webhooks and Price IDs without exposing secrets, preserve existing paid state, reconcile legacy fields to the new membership model, validate webhook idempotency and checkout/portal failure paths, and preserve rollback capability.

See `docs/MEMBERSHIP_BILLING_RECONCILIATION.md` and the latest live-drift documentation before any cutover.

### Secrets / destructive live-data changes

Always require explicit approval before rotating/replacing production secrets, destructively migrating/deleting live user content, deleting auth users, enabling a cost-bearing provider, changing a live webhook target, creating production cron/scheduler jobs, or granting new production staff/admin authority.

## Safe development work that may continue uninterrupted

Without separate production approval, continue frontend UX/accessibility/responsive refinements; multilingual integration through the existing translation framework; development-only migrations and Edge Function preparation; privacy/security hardening; route cleanup and truthfulness checks; private support/member-block/programming/reminder/professional-review UX while switches remain off; billing source hardening/reconciliation checks while payments remain off; read-only production audits when access permits; automated preflight/regression checks; and documentation/rollback/test planning.

## Current operating rule

Handle production approvals **one at a time**.

For each production action:

1. explain exactly what would change, the risk, and what would remain untouched;
2. wait for explicit approval of that specific action;
3. re-fetch the freshest branch source and live state;
4. execute only that approved action;
5. verify it immediately;
6. record it in `PRODUCTION_APPROVAL_EXECUTION.md`;
7. only then explain another production approval.
