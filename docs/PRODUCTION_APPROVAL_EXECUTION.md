# One2OneLove — Production Approval Execution Ledger

This is the **do-not-repeat ledger** for production-affecting actions that were explicitly approved and executed during the relaunch work.

It is intentionally separate from `RELAUNCH_APPROVAL_QUEUE.md`, which tracks production work that is still on hold. Before any future production mutation, compare both documents with the current live state and the retained execution record in `docs/APPROVAL_EXECUTION_20260820.md`.

A development commit, feature flag, migration file, Edge Function source file, or instruction to `continue uninterrupted` is **not** production approval.

## Completed production approvals

### #1 — Love Notes invitation database foundation — COMPLETE

- Applied the Love Notes invitation foundation to live Supabase after explicit approval.
- Created the invitation/history foundation with RLS.
- A history-view security issue found during verification was handled separately as #1A.

### #1A — Love Notes history view hardening — COMPLETE

- Converted the member-facing history view to caller-invoker behavior.
- Removed broad access to sensitive invitation fields while preserving the reviewed participant history projection.
- Post-change security review no longer reported the prior Security Definer view issue.

### #2 — Love Notes server functions deployed DARK — COMPLETE

Live function names exist for:

- `send-love-note-invitation`
- `reveal-love-note`
- `dispatch-scheduled-love-notes`

They were deployed fail-closed/dark. No real Love Notes email/SMS delivery or scheduler was activated.

**Do not redeploy real handlers merely because these function names exist.**

### #3 — Preserve existing Resend secret — COMPLETE POLICY DECISION

- Existing live `RESEND_API_KEY` was preserved.
- It was not exposed, rotated, or replaced.
- The existing waitlist flow may depend on it, so future email work must preserve compatibility.

### #4 — Saved Love Notes database storage — COMPLETE

- Applied Saved Love Notes storage with RLS and a `security_invoker` member-facing view.
- Anonymous access remains blocked.
- Authenticated access is limited to the reviewed ownership/reveal behavior.

### #5 — Live Room messaging foundation + identity safeguards — COMPLETE

- Applied Live Room messaging/reactions foundation.
- The six reviewed rooms are supported.
- Anonymous access and authenticated direct UPDATE remain blocked.
- Sender identity is database-derived rather than browser-trusted.
- Realtime publication is enabled for the messaging tables.

### #6 — Live Room report intake — COMPLETE

- Applied private Live Room report-intake storage.
- Normal members cannot browse or manage the private report queue.
- Report submission remains caller-bound and field-limited.
- No general moderation console was activated by this approval.

### #7 — Live Room identity hardening — SATISFIED / NO-OP

- Re-audit showed the intended protections were already present because they had been folded into #5.
- No redundant production mutation was performed.

### #8B — Community membership security — COMPLETE

- Applied the reviewed community-membership security hardening.
- Normal joins cannot self-assign moderator/admin authority or bypass approval-required status.
- Creator-admin membership is database-established/protected.
- Recursive membership authorization was replaced by bounded helpers in `o2ol_private`.
- Nonmembers cannot enumerate another community's raw membership roster.
- Stable `O2OL_*` database error codes are used instead of user-facing English prose.

**Do not repeat #8B merely because migration source remains in the repository.**

### #8C — Presence + member-directory privacy — COMPLETE

Retained execution evidence: `docs/APPROVAL_EXECUTION_20260820.md`.

- Applied `presence_directory_privacy_reconciliation` to live Supabase after explicit approval.
- Removed email and database-generated English `last_seen_text` from `public.user_presence_view`.
- Preserved the existing presence and synchronized-directory records observed during verification.
- Authenticated browsers no longer have direct INSERT/UPDATE/DELETE authority on `public.user_presence`.
- Controlled verification confirmed own presence updates succeed and another-member updates are rejected with `O2OL_PRESENCE_OWN_ONLY`.
- Presence projections remained `security_invoker=true` / `security_barrier=true`.

**#8C is already live. Do not reapply it.**

### #8C-A — Member-directory source minimization — COMPLETE

Retained execution evidence: `docs/APPROVAL_EXECUTION_20260820.md`.

- Applied `member_directory_source_minimization` after explicit approval.
- The first attempt failed transactionally because of a dependent view; that attempt rolled back with no state change.
- The corrected migration dropped/recreated the dependent presence projection within the same transaction and then applied successfully.
- `public.user_directory_profiles` was reduced to exactly the five reviewed discovery fields: `id`, `name`, `avatar_url`, `bio`, `created_at`.
- `public.member_directory` exposes the same five safe fields.
- Email, relationship status, location, interests, account type, partner, verification, subscription, and billing fields are not part of the synchronized member-discovery source.
- `public.user_presence_view` remained privacy-safe with no email or `last_seen_text` field.

**#8C-A is already live. Do not reapply it.**

### #9 — SMS provider direction — COMPLETE DECISION / NO PROVIDER ACTIVATION

- Direction to continue SMS provider preparation was approved.
- No provider/account/credential was available to activate, so none was invented or silently connected.
- Live Love Notes delivery remained dark.

### #9A — Twilio + compliant Love Notes SMS design — DEVELOPMENT COMPLETE / NO LIVE ACTIVATION

- Twilio-specific compliant SMS design was staged on `relaunch-homepage` only.
- No Twilio account was connected, no A2P registration was submitted, no SMS secret was set, no SMS was sent, and no provider fee was incurred.
- Real SMS activation remains separately approval-gated.

## Canonical #8C development migration note

`supabase/migrations/20260822004500_presence_directory_privacy_final.sql` is a **development/recovery reference for fresh or materially drifted environments**. It is not permission to replay #8C/#8C-A on the existing production project, where both approvals are already recorded as complete.

Any future use of that canonical migration against production requires a fresh read-only audit proving the completed live state is actually missing or materially drifted, followed by a new explicit corrective approval. Never use it simply because the file is newer.

## Retired legacy-security subcheck

The earlier pairwise-message portion of approval #8 was retired without a production mutation after live inspection showed a newer participant-field protection trigger already enforced the intended boundary. Do not blindly layer the older staged message-update migration over that protection.

## Production holds still in force

The following remain separately approval-gated regardless of development progress:

- SMS/Twilio/A2P activation or another paid external messaging channel;
- real Love Notes delivery activation;
- production scheduler/cron creation;
- production Vercel deployment or merge to `master`;
- creator/O2OL programming production activation;
- programming reminders and dispatcher activation;
- programming moderation activation;
- member-blocking production activation;
- private support production activation;
- privacy-request production activation;
- professional-application review production activation/reviewer authority;
- relaunch Stripe/membership cutover or changes to legacy live Stripe functions/webhooks;
- secret rotation/replacement;
- destructive live-data operations.

## Operating rule

For production work:

1. explain one production action at a time;
2. receive explicit approval for that exact action;
3. re-read the freshest branch source and live state;
4. perform only the approved mutation;
5. verify live behavior/security immediately;
6. record the result here;
7. only then move to another production approval.
