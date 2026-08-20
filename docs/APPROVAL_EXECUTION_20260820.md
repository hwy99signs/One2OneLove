# One2OneLove Production Approval Execution — 2026-08-20

## Completed approvals

### Approval #1 — Love Notes invitation database foundation
- Applied the Love Notes invitation migration to live Supabase.
- Verified `public.love_note_invitations` exists with RLS enabled.
- Verified browser roles do not have unrestricted direct-table access.
- Verified participant-only history access exists.
- No Love Notes were sent.

### Approval #1A — Love Notes history-view hardening
- Converted `public.love_note_invitation_history` to `security_invoker=true` while retaining `security_barrier=true`.
- Granted authenticated users access only to the safe history columns needed by the view.
- Sensitive fields remain unavailable through the member history interface.
- Supabase security advisor no longer reports the prior Security Definer view error.

### Approval #2 — Deploy Love Notes Edge Functions dark
Deployed these live Supabase functions:
- `send-love-note-invitation`
- `reveal-love-note`
- `dispatch-scheduled-love-notes`

All three currently use `production-dark.ts` as the deployed entrypoint and all three require JWT at the Supabase gateway. The dark entrypoint always returns `PRODUCTION_DARK` / HTTP 503. The real implementations remain staged in GitHub and require a separate explicit production approval before activation.

No scheduler was created. No Resend configuration was changed. No SMS provider was activated. The Love Notes invitation table remained at 0 rows after deployment.

### Approval #3 — Preserve existing Resend production secret
- Preserved the existing `RESEND_API_KEY` exactly as-is.
- Did not view, copy, rotate, replace, or expose the secret.
- Confirmed the existing live `send-waitlist-notifications` Edge Function depends on `RESEND_API_KEY`, so future email activation must first verify compatibility rather than blindly replacing the key.
- No email delivery behavior was changed.

### Approval #4 — Saved Love Notes database storage
- Applied the `love_note_saves` migration to live Supabase.
- Created `public.love_note_saves` with RLS enabled and three authenticated ownership/reveal policies.
- Created `public.saved_love_notes` with `security_invoker=true` and `security_barrier=true`.
- Anonymous roles have no SELECT access to the table or view.
- Authenticated users have only the required SELECT/INSERT/DELETE privileges on save-link rows; UPDATE is not granted.
- Verified the table/view exist, the security-invoker setting is active, and the table currently contains 0 saved rows.
- Supabase Security Advisor reports no Security Definer warning for `saved_love_notes`. Its signed-in GraphQL discoverability warning is expected because the authenticated app intentionally reads the feature, with RLS limiting row access.

## Resend production dependency note
The existing live `send-waitlist-notifications` Edge Function reads `Deno.env.get('RESEND_API_KEY')` and sends through the Resend API. Therefore the existing `RESEND_API_KEY` must continue to be treated as production-relevant and must not be overwritten blindly. The connector does not expose secret values, so any key verification/rotation must preserve waitlist compatibility and be handled without pasting secret material into chat or source control.
