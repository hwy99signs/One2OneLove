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
