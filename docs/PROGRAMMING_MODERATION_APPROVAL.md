# One2OneLove Programming Moderation — Production Approval Hold

This document is a production activation boundary. The programming moderation code is staged on `relaunch-homepage` only.

## Do not activate automatically

The following actions require explicit production approval and review as one controlled moderation batch:

1. Apply `supabase/migrations/20260819_programming_moderation.sql`.
2. Deploy `supabase/functions/report-programming`.
3. Deploy `supabase/functions/moderate-programming`.
4. Set `PROGRAMMING_MODERATION_ENABLED=true` in the backend environment.
5. Set `VITE_PROGRAMMING_MODERATION_ENABLED=true` in the frontend environment.
6. Expose or route the internal `ProgrammingModerationAdmin` console to production staff.

## Authority model

- Member reports are tied to the authenticated reporter server-side.
- Members cannot directly insert/update/delete `programming_reports` through the browser.
- Members can read only their own report state.
- O2OL moderation authority is controlled only by the server-side `O2OL_PROGRAMMING_ADMIN_USER_IDS` allowlist.
- `users.user_type` must never grant moderation authority.
- The moderation queue intentionally excludes `reporter_id` from its response and UI.

## Removal behavior

When an allowlisted moderator removes a reported program:

1. The shared programming slot is changed from `booked` to `cancelled`.
2. All pending reports for that slot are marked `actioned`.
3. The staged programming-reminder cancellation trigger cancels reminders still in `active` state.
4. A reminder already claimed as `processing` remains dispatcher-controlled; the dispatcher re-checks the slot and suppresses delivery for a cancelled program.

## Member reporting window

- One report per member per program.
- Reports may be submitted while the program exists within the configured reporting window (currently through 24 hours after scheduled end).
- Report reasons are constrained to the reviewed taxonomy in both database and backend code.

## Required pre-production verification

Before activation:

- Verify RLS with two distinct member accounts.
- Verify one member cannot read another member's report.
- Verify duplicate reports return the existing private report rather than creating duplicates.
- Verify an unallowlisted account cannot list or resolve reports.
- Verify allowlisted moderation responses do not include reporter identity.
- Verify removing a creator program and an O2OL-owned program both cancel the shared slot correctly.
- Verify active reminders are cancelled and processing reminders are suppressed by dispatcher re-check.
- Verify moderation UI translations and accessibility in EN/ES/FR/IT/DE.
- Verify the programming feature itself remains disabled until the complete programming activation batch is approved.

## Current status

Development code only. No live migration, Edge Function deployment, frontend switch, backend switch, staff-route exposure, or production moderation action has been performed.
