# Love Notes — Controlled Rollout Plan

This document is for the One2OneLove relaunch development branch. It intentionally separates code preparation from production activation.

## Product contract

- The individual member is the sender. One2OneLove is the private delivery platform.
- The SMS/email invitation identifies the sender but never contains the Love Note body.
- The recipient follows a secure link, signs in or creates a free account, verifies the account, and reveals the note inside One2OneLove.
- Raw reveal tokens are never stored. The database stores only a SHA-256 token hash.
- Email and SMS are separate channels. Email may be activated without activating SMS.

## Server-side secrets / configuration

Never place these values in browser code or commit their values to GitHub.

- `RESEND_API_KEY` — existing Supabase secret must be verified before replacement.
- `RESEND_FROM_EMAIL` — recommended display format: `One2OneLove Love Notes <lovenotes@one2onelove.com>`.
- `SITE_URL` — the canonical site base URL used to build secure reveal links.
- `LOVE_NOTE_DELIVERY_ENABLED` — master delivery kill switch. Keep unset/false until controlled testing.
- `LOVE_NOTE_SMS_ENABLED` — independent SMS kill switch. Keep unset/false until SMS provider/costs are separately approved.
- `LOVE_NOTE_SMS_ENDPOINT` — only if an SMS provider is later approved.
- `LOVE_NOTE_SMS_PROVIDER_KEY` — only if an SMS provider is later approved.
- `LOVE_NOTE_SCHEDULER_SECRET` — private secret used only by the scheduled-dispatch caller.

## Prepared database changes

Already approved but not yet applied because production access has been unstable:

- `supabase/migrations/20260817_love_note_invitations.sql`

Prepared but requires separate approval before applying:

- `supabase/migrations/20260817_love_note_saves.sql`

## Prepared Edge Functions

- `send-love-note-invitation`
  - requires an authenticated, email-confirmed member;
  - derives sender identity server-side;
  - keeps note content out of provider copy;
  - uses `LOVE_NOTE_DELIVERY_ENABLED` as a master kill switch;
  - uses `LOVE_NOTE_SMS_ENABLED` as a second, independent SMS kill switch.

- `reveal-love-note`
  - requires a signed-in, email-confirmed account;
  - validates the high-entropy token hash;
  - binds email invitations to the verified email that received the invitation;
  - atomically claims an unclaimed invitation before returning note content.

- `dispatch-scheduled-love-notes`
  - requires `LOVE_NOTE_SCHEDULER_SECRET`;
  - creates reveal tokens only when a scheduled note is due;
  - leaves scheduled SMS records untouched while SMS is disabled.

## Activation sequence

1. Confirm upstream Supabase/GitHub/Vercel service stability.
2. Verify what currently uses the existing `RESEND_API_KEY`. Do not overwrite it blindly.
3. Apply the already-approved Love Note invitation migration.
4. Configure `RESEND_FROM_EMAIL` and `SITE_URL`.
5. Deploy `send-love-note-invitation` and `reveal-love-note` with JWT verification enabled.
6. Leave `LOVE_NOTE_DELIVERY_ENABLED` false/unset and `LOVE_NOTE_SMS_ENABLED` false/unset.
7. Confirm the frontend return-to flow: invitation link → sign in/sign up → exact token URL → reveal.
8. Enable the master delivery flag only for a controlled email test.
9. Send one Love Note to an owner-controlled email address.
10. Verify the provider email contains the sender name and reveal link but not the private note body.
11. Verify the recipient must use the verified invited email address, the reveal works once claimed, and reply handoff preserves the original sender’s name.
12. Verify failure states and logs without exposing secrets or note bodies.
13. Decide whether to apply the Saved Love Notes migration.
14. Decide numerical sending/rate limits before broader access.
15. Keep SMS disabled until a provider, pricing, and any registration/compliance requirements are separately approved.

## Production guardrails

- Do not merge `relaunch-homepage` to the production branch as part of backend activation.
- Do not enable real delivery merely because functions deploy successfully.
- Do not expose Supabase service-role keys, Resend keys, scheduler secrets, or SMS provider keys to the browser.
- Do not log Love Note bodies in Edge Function error messages.
- Do not report a successful delivery to the sender until the provider request has succeeded and the invitation row is updated to `sent`.

## Current frontend behavior

The relaunch frontend is still a development preview: members can select or write a note, choose recipient/delivery/scheduling, review the invitation, and preview the recipient reveal. It does not yet call the real send function. This is intentional until the database and provider path complete the controlled rollout above.
