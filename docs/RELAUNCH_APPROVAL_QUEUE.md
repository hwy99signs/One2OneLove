# One2OneLove Relaunch — Pending Production Approval Queue

This file tracks **only production-affecting work that is still pending explicit approval**.

Completed approvals #1–#7 and the retired legacy-message subcheck are recorded in `docs/PRODUCTION_APPROVAL_EXECUTION.md` and must not be repeated simply because their migration/function source still exists.

Normal development may continue on `relaunch-homepage`. A development commit, feature flag, migration, Edge Function source file, or instruction to `continue uninterrupted` is **not** permission to mutate production.

## Next approval in sequence

### #8B — Community membership security — PENDING

Current staged migration:

- `supabase/migrations/20260817_community_member_policy_hardening.sql`

What it is designed to fix:

- normal members cannot choose `admin`/`moderator` on join;
- approval-required communities cannot be joined by forcing `active` status;
- recursive `community_members` authorization is replaced with bounded helpers;
- the database creates/protects the community creator's active-admin membership;
- moderators cannot promote themselves or another member to admin;
- membership identity/routing fields cannot be rewritten through browser updates;
- nonmembers cannot enumerate another community's raw membership roster;
- database exceptions use stable `O2OL_*` codes for multilingual UI handling;
- privileged authorization helpers live in `o2ol_private`, not as public API RPCs.

Live audit at the time this approval was prepared found no existing community/member rows to rewrite, but **live counts/state must be rechecked immediately before any approved application**.

**Do not apply #8B until the user explicitly says `Approve #8B.`**

## Approval after #8B

### #8C — Presence + member-directory privacy — PENDING

Current staged reconciliation includes:

- `supabase/migrations/20260820100500_presence_directory_privacy_reconciliation.sql`
- `supabase/migrations/20260820151000_member_directory_source_minimization.sql`
- related client/privacy checks

The live privacy issue identified during read-only audit is that the legacy presence/directory surface still needs correction. The staged relaunch design:

- removes account email from member-facing presence/directory output;
- avoids SQL-generated English `last seen` prose so the client translation layer owns member-facing language;
- uses a minimized directory projection rather than bypassing private `public.users` RLS;
- binds presence writes to the authenticated caller rather than trusting a browser-supplied user identity;
- keeps sensitive account, partner, billing/subscription, verification, relationship-status, and location data out of the default member-discovery projection.

**#8C is a separate approval. Do not treat approval of #8B as approval of #8C.**

## Additional production approvals still on hold

### Privacy-request backend activation

Development work now includes a reconciled, non-destructive account privacy-request queue and review flow, including:

- `supabase/migrations/20260818_privacy_requests.sql`
- `supabase/migrations/20260819_privacy_requests.sql` (older staged shape retained in history)
- `supabase/migrations/20260819_privacy_request_state_guard.sql` (older staged guard retained in history)
- `supabase/migrations/20260821211500_privacy_request_workflow_reconciliation.sql` (final-state reconciliation)
- `supabase/functions/privacy-request`
- `supabase/functions/manage-privacy-requests`

Production remains OFF. Before any live activation, verify migration order/final schema in an isolated environment, then approve the database and Edge Function deployment as a dedicated production batch. Keep both client/server feature switches disabled during controlled deployment/testing.

The queue records/reviews requests only. It does **not** automatically export data or delete accounts. Any future destructive fulfillment path needs a separate approval and separate safety review.

### SMS / external messaging activation

- Do not activate paid SMS/Twilio/A2P delivery without separate approval.
- Do not add email, SMS, mobile push, web push, or another paid/third-party reminder/support channel without approval covering provider, cost, consent/opt-out, privacy, retention and operational ownership.
- Existing `RESEND_API_KEY` remains preserved under completed approval #3; do not rotate it casually.

### Real Love Notes delivery activation

The three live Love Notes function names exist under completed approval #2, but they are intentionally DARK/fail-closed.

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

The approved development contract remains: independent creator accounts can use up to two free slots per local day; O2OL-owned programming uses server-authorized staff; live/replay scheduling is supported; paid slot sales stay dormant.

### O2OL programming staff authority

- `/O2OLProgrammingAdmin` must remain absent from general member navigation.
- Staff authority must come only from the server-side `O2OL_PROGRAMMING_ADMIN_USER_IDS` allowlist.
- Do not populate/activate production staff authority until exact accounts are explicitly approved.

### Paid creator programming slots

Do not activate paid slot sales in the initial free-calendar rollout.

A paid rollout needs a separate approval covering pricing, checkout/provider behavior, creator terms, cancellation/refund policy, disputes/chargebacks, tax/accounting treatment, moderation obligations and any revenue-share policy.

### Programming reminders + dispatcher

Production activation remains pending for:

- `supabase/migrations/20260819_programming_reminders.sql` and related guards/cancellation migrations;
- `programming-reminder`;
- `dispatch-programming-reminders`;
- any production scheduler/cron;
- `PROGRAMMING_REMINDER_DISPATCH_SECRET` creation;
- the client/server reminder switches.

Keep `VITE_PROGRAMMING_REMINDERS_ENABLED=false` and `PROGRAMMING_REMINDERS_ENABLED=false` during any future dark deployment/testing.

The staged dispatcher is in-app only; external delivery channels are a separate approval.

### Member-blocking safety stack

Production activation remains pending for the full member-blocking stack, including `20260819_member_blocks.sql`, chat/connection/Live Room/pairwise visibility enforcement, pending-request cleanup, and the member-block/list functions.

Keep `VITE_MEMBER_BLOCKING_ENABLED=false` and `MEMBER_BLOCKING_ENABLED=false` until the entire batch is verified together. Before approval, verify both directions of interaction/visibility and that unblock does not recreate prior relationships/requests.

### Programming moderation

Production activation remains pending for:

- `supabase/migrations/20260819_programming_moderation.sql`;
- `report-programming`;
- `moderate-programming`;
- moderation feature switches.

Reporter identity must remain private from ordinary moderator payload/UI. Moderator authority must remain server-allowlisted, not profile-role based. `/ProgrammingModerationAdmin` must stay out of general navigation.

### Private member support

Production activation remains pending for:

- `20260819_support_requests.sql`;
- quota/state/read-state migrations;
- `support-request`;
- `manage-support-requests`;
- support feature switches.

Keep `VITE_SUPPORT_REQUESTS_ENABLED=false` and `SUPPORT_REQUESTS_ENABLED=false` until approved testing. Staff authority must come only from `O2OL_SUPPORT_ADMIN_USER_IDS`.

Support is not an emergency/crisis service and must not be presented as continuously monitored. Outbound email/SMS/push/ticketing remains separately approval-gated.

### Relaunch membership billing / Stripe cutover

Do not alter the existing live legacy Stripe contract during normal relaunch development.

Read-only inspection previously found live legacy functions named:

- `create-checkout-session`
- `stripe-webhook`
- `create-billing-portal`

They implement the legacy Basic/Premiere/Exclusive contract and must be treated as production-relevant until Stripe-side usage is fully reconciled.

The relaunch uses a different single-membership contract. Keep `VITE_PAYMENTS_ENABLED=false` and server `PAYMENTS_ENABLED=false` until an explicitly approved cutover.

Before approval, inventory Stripe customers/subscriptions/webhooks and Price IDs without exposing secrets, preserve existing paid state, reconcile legacy fields to the new membership model, validate webhook idempotency and checkout/portal failure paths, and preserve rollback capability.

See `docs/MEMBERSHIP_BILLING_RECONCILIATION.md` and the latest live-drift documentation before any cutover.

### Secrets / destructive live-data changes

Always require explicit approval before:

- rotating/replacing production secrets;
- deleting/migrating live user content in a destructive way;
- deleting auth users;
- enabling a provider that creates cost;
- changing a live webhook target;
- creating production cron/scheduler jobs;
- granting new production staff/admin authority.

## Safe development work that may continue uninterrupted

Without separate production approval, continue:

- frontend UX/accessibility/responsive refinements;
- multilingual copy integration through the existing translation framework;
- development-only migrations and Edge Function preparation;
- privacy/security hardening in source;
- route cleanup and truthfulness checks;
- private support/member-block/programming/reminder UX while switches remain off;
- billing source hardening/reconciliation checks while payments remain off;
- read-only production audits when needed to prepare a future approval;
- automated preflight/regression checks;
- documentation and rollback/test planning.

## Current operating rule

Handle production approvals **one at a time**.

For each production action:

1. explain exactly what would change, the risk, and what would remain untouched;
2. wait for explicit approval of that specific action;
3. re-fetch the freshest branch source and live state;
4. execute only that approved action;
5. verify it immediately;
6. record it in `PRODUCTION_APPROVAL_EXECUTION.md`;
7. only then explain the next approval.
