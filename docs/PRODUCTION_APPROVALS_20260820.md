# One2OneLove Production Approvals — 2026-08-20

This file records production approvals explicitly granted in conversation and the resulting action/state.

## Approval #1 — Love Notes invitation database
Approved and applied to live Supabase.
- Applied `20260817_love_note_invitations.sql`.
- Verified table/RLS/history view.

## Approval #1A — Love Notes history view hardening
Approved and applied to live Supabase.
- Converted `love_note_invitation_history` to `security_invoker`.
- Preserved participant-only RLS behavior and safe-column projection.
- Security Definer advisor error cleared.

## Approval #2 — Love Notes Edge Functions, production-dark
Approved and deployed to live Supabase.
- `send-love-note-invitation`
- `reveal-love-note`
- `dispatch-scheduled-love-notes`
- Each deployed with `production-dark.ts` as entrypoint.
- Each requires JWT.
- No scheduler created.
- No email/SMS delivery activated.

## Approval #3 — Preserve existing Resend secret
Approved.
- Keep the existing live `RESEND_API_KEY` unchanged.
- Do not rotate or replace it before controlled email testing.
- Existing `send-waitlist-notifications` currently references this secret, so blind replacement could break existing email behavior.
- Never place the secret value in chat, GitHub, or browser code.

## Approval #8B — Community-membership security hardening
Approved and applied to live Supabase.
- Removed the recursive community-members moderator/admin RLS lookup.
- Preserved ordinary membership access without permitting self-assigned moderator/admin authority.
- Privileged community-membership helpers use the non-exposed `o2ol_private` schema.
- Signed-in-role verification no longer triggers recursive RLS.
- No existing community/community-membership data was rewritten because both live tables were empty at verification time.

## Approval #8C — Presence and member-directory privacy reconciliation
Approved and applied to live Supabase.
- Applied production migration `presence_directory_privacy_reconciliation` from the staged `20260820100500_presence_directory_privacy_reconciliation.sql` design.
- `user_presence_view` now excludes account email and database-generated `last_seen_text`; it exposes neutral presence timestamps/status plus safe display identity only.
- `member_directory` now exposes only `id`, `name`, `avatar_url`, `bio`, and `created_at` and uses `security_invoker=true`.
- `user_presence` remains RLS-enabled; authenticated browsers have SELECT only and no direct INSERT/UPDATE/DELETE privilege.
- Public presence RPCs are SECURITY INVOKER wrappers; the caller-bound privileged write helper is in `o2ol_private`.
- Controlled signed-in test: own presence update succeeds; another-member update is rejected with `O2OL_PRESENCE_OWN_ONLY`. Test transaction was rolled back.
- Existing counts remained stable after migration: 11 users, 11 synchronized directory rows, 28 presence rows.
- The client-side presence service is staged to format relative-time text in the selected O2OL language (EN/ES/FR/IT/DE), keeping the database language-neutral.

### Post-deployment #8C advisor finding — corrective approval required
The Supabase security advisor correctly flagged `public.user_directory_profiles` as discoverable to signed-in users because authenticated SELECT is required by the security-invoker directory view. The synchronized source table still contains `relationship_status`, `user_type`, `location`, and `interests`, even though `member_directory` itself does not expose them.

No unapproved production correction was made after this finding.

A development-only corrective migration is staged as:
- `supabase/migrations/20260820151000_member_directory_source_minimization.sql`
- Approval label: **#8C-A**

The correction removes those unnecessary fields from the synchronized source itself so both the source table and public view contain only the five approved discovery fields. Current production audit shows all 11 existing accounts are `regular`, so the staged correction is expected to preserve all current directory rows.
