# One2OneLove — Production Approval Execution Ledger

This is the **do-not-repeat ledger** for production-affecting actions that were explicitly approved and executed during the relaunch work.

It is intentionally separate from `RELAUNCH_APPROVAL_QUEUE.md`, which tracks actions that are still pending approval. Before any future production mutation, compare both documents with the current live state.

## Completed production approvals

### #1 — Love Notes invitation database foundation — COMPLETE

- Explicit approval received before the live change.
- Applied the Love Notes invitation foundation to the live Supabase project.
- Created the invitation table/history surface and RLS foundation.
- Post-deployment review identified a history-view security-definer issue; that was handled separately under #1A rather than silently expanding scope.

### #1A — Love Notes history view hardening — COMPLETE

- Explicit approval received before the live hardening.
- Changed the Love Notes invitation history view to caller-invoker behavior.
- Removed broad access to sensitive invitation fields while preserving the reviewed authenticated history projection.
- Supabase security review no longer reported the history view as a security-definer problem after the change.

### #2 — Love Notes server functions deployed DARK — COMPLETE

The following live Edge Function names were created/deployed:

- `send-love-note-invitation`
- `reveal-love-note`
- `dispatch-scheduled-love-notes`

Production posture after deployment:

- all three use the fail-closed `_shared/production-dark.ts` entrypoint;
- all require JWT;
- dark handler returns `503` / `PRODUCTION_DARK`;
- no email/SMS provider send path was activated;
- no scheduler/cron was created;
- no Love Notes delivery was enabled.

**Do not redeploy the real handlers merely because these function names already exist. Real delivery remains a separate approval.**

### #3 — Preserve existing Resend secret — COMPLETE POLICY DECISION

- Existing live `RESEND_API_KEY` was preserved.
- No key value was read into chat/source.
- No rotation/replacement occurred.
- Do not rotate blindly: the live waitlist flow may depend on the existing key.

### #4 — Saved Love Notes database storage — COMPLETE

- Explicit approval received before the live migration.
- Applied Saved Love Notes storage with RLS and a `security_invoker` member-facing view.
- Anonymous access remains blocked.
- Authenticated access is intentionally limited; no browser UPDATE path was granted.

### #5 — Live Room messaging foundation + identity safeguards — COMPLETE

- Explicit approval received before the live migration.
- Applied Live Room messaging/reactions foundation.
- Live room constraint includes the six reviewed room names, including `Global Relationship Room`.
- Anonymous access remains blocked.
- Authenticated direct UPDATE remains blocked.
- Sender identity is database-derived rather than browser-trusted.
- Identity trigger uses invoker rights and a neutral UUID-based fallback pseudonym.
- Realtime publication is enabled for the messaging tables.

### #6 — Live Room report intake — COMPLETE

- Explicit approval received before the live migration.
- Applied private report-intake storage for member-authored Live Room messages.
- Anonymous access remains blocked.
- Normal members have no report-queue SELECT/UPDATE/DELETE authority.
- Member INSERT is restricted to the reviewed report-form fields and caller identity rules.
- No moderation/admin console was activated under this approval.

### #7 — Live Room identity hardening — SATISFIED / NO-OP

- Re-audit showed #7 protections were already present live because they had been folded into #5.
- No redundant production mutation was performed.

## Retired legacy-security subcheck

The earlier pairwise-message portion of approval #8 was retired without a production mutation after live inspection showed a newer participant-field protection trigger already enforced the intended boundary. Do not blindly layer the older staged message-update migration over that protection.

## Pending production approvals

### #8B — Community membership security — PENDING

**Not approved and not applied.**

Current staged migration: `supabase/migrations/20260817_community_member_policy_hardening.sql`.

The staged change addresses:

- self-assignment of `admin`/`moderator` through membership INSERT;
- approval-bypassing join status;
- recursive `community_members` admin policy behavior;
- creator membership creation/protection;
- moderator-to-admin privilege escalation;
- membership identity-field rewriting;
- nonmember enumeration of membership rosters.

The current design uses stable `O2OL_*` database error codes for multilingual UI handling and places authorization helpers in the non-public `o2ol_private` schema.

**Do not apply until the user explicitly approves #8B.**

### #8C — Presence + member-directory privacy — PENDING

**Not approved and not applied.**

Current staged reconciliation: `supabase/migrations/20260820100500_presence_directory_privacy_reconciliation.sql` plus later directory-minimization work.

The production issue identified during read-only audit is that the legacy presence/directory surface still requires privacy correction, including removal of account email from member-facing presence output and removal of SQL-generated English status prose.

**Do not apply until #8C is separately explained and explicitly approved.**

## Other production holds still in force

The following remain approval-gated regardless of development progress:

- SMS/Twilio/A2P activation or any paid external messaging channel;
- real Love Notes delivery activation;
- production scheduler/cron creation;
- production Vercel deployment or merge to `master`;
- creator programming database/functions/frontend activation;
- programming reminders and dispatcher activation;
- programming moderation activation;
- member-blocking production activation;
- private support production activation;
- privacy-request production activation;
- relaunch Stripe/membership cutover or changes to legacy live Stripe functions/webhooks;
- any secret rotation/replacement;
- any destructive user-data operation.

## Operating rule

A development commit, feature flag, migration file, Edge Function source file, or `continue uninterrupted` instruction is **not** production approval.

For production work:

1. explain one production action at a time;
2. receive explicit approval for that action;
3. re-read the freshest branch source and live state;
4. perform only the approved mutation;
5. verify live behavior/security after the mutation;
6. record the result here;
7. move to the next approval only afterward.
