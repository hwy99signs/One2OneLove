# One2OneLove Relaunch — Approval Queue

This file tracks only actions that should NOT be performed automatically while development continues.

## Production / live-data approvals to hold

1. Apply `supabase/migrations/20260817_love_note_invitations.sql` to the live Supabase project.
   - Previously approved in conversation, but not applied because of Supabase outage/connector failures.
   - Reconfirm immediately before live application if service stability is uncertain.

2. Deploy Love Notes Edge Functions to the live Supabase project:
   - `send-love-note-invitation`
   - `reveal-love-note`
   - `dispatch-scheduled-love-notes`
   - Keep `LOVE_NOTE_DELIVERY_ENABLED` off until controlled testing is ready.

3. Resolve the existing `RESEND_API_KEY` secret.
   - A secret with that exact name already exists in Supabase.
   - Do not replace it until existing usage is verified.
   - New Resend key is held by the account owner and must never be pasted into chat or source code.

4. Apply `supabase/migrations/20260817_love_note_saves.sql` to activate persistent Saved Love Notes.
   - Development migration and client service are staged only.

5. Apply `supabase/migrations/20260817_live_room_messaging.sql` to the live database.
   - Previously approved, but not applied because of connector failures.

6. Apply `supabase/migrations/20260817_live_room_moderation.sql`.
   - Not yet approved for live database.

7. Apply `supabase/migrations/20260817_live_room_identity_hardening.sql`.
   - Review and approve before live database changes.

8. Security hardening of legacy tables/views.
   - `supabase/migrations/20260817_message_update_hardening.sql` is staged to stop message recipients from changing message content while still allowing read/delivery receipts.
   - `supabase/migrations/20260817_community_member_policy_hardening.sql` is staged to remove the recursive `community_members` moderator/admin RLS lookup.
   - `supabase/migrations/20260817_presence_security_hardening.sql` is staged to prevent caller-supplied presence spoofing and remove email from the presence projection.
   - `supabase/migrations/20260817_member_directory_privacy.sql` is staged to create a privacy-safe member-discovery projection without email, partner email, subscription/billing, or verification fields.
   - `supabase/migrations/20260817_users_privacy_lockdown.sql` is staged to make `public.users` an own-row private table and remove any legacy always-true SELECT policy.
   - Buddy Finder and pairwise chat identity lookups have now been moved to `public.member_directory` in development; chat no longer requests another member's account email.
   - **Do not apply the users-table lockdown yet.** Remaining public/community/member-card consumers must be audited and the exact live policies must be inspected first.
   - The historical audit also identified a `waitlist_signups` RLS concern. The current relaunch form uses `public.waitlist`, so the actual live tables/policies must be re-verified before changing either one.
   - None of these security migrations has been applied to the live database.
   - No live security-policy changes without an explicit go-ahead at the production checkpoint and a rollback plan.

9. SMS provider activation.
   - Do not activate paid SMS/Twilio or incur A2P-related cost without separate approval.

10. Production branch / production Vercel deployment.
    - Development remains on `relaunch-homepage`.
    - Do not merge to `master` or alter One2OneLove.com production without explicit approval.

11. Programming calendar database activation.
    - `supabase/migrations/20260819_creator_programming_calendar.sql` is DEVELOPMENT ONLY and has not been applied to live Supabase.
    - The migration creates the shared 24-hour Global Relationship Room timeline for both independent creator programming (`program_source='creator'`) and One2OneLove-owned programming (`program_source='o2ol'`).
    - It enforces a maximum of two free booked slots per independent creator/local day, prevents overlapping creator/O2OL room programming, prevents browser access to O2OL-owned rows, and adds the Global Relationship Room to both the `room_messages` table constraint and member INSERT policy.
    - Apply only after the earlier Live Room messaging, moderation, and identity-hardening migrations have been reviewed in sequence in a development environment.

12. Programming Edge Functions.
    - Do not deploy `book-creator-programming-slot`, `list-creator-programming`, `current-creator-programming`, or `manage-o2ol-programming` to live Supabase until the calendar migration and authentication/RLS behavior are verified together.
    - Keep `CREATOR_PROGRAMMING_ENABLED=false` during deployment and controlled testing.
    - The status/list endpoints intentionally expose only public scheduling metadata, including the non-identifying `program_source`; they exclude creator account IDs, replay URLs, payment fields, and policy-acknowledgement records.

13. Creator programming frontend activation.
    - Keep `VITE_CREATOR_PROGRAMMING_ENABLED=false` until the database migration and programming Edge Functions are deployed and tested.
    - The `/CreatorProgramming` route is staged behind this switch; the Global Relationship Room's Live-now/Up-next strip is also dark while the switch is off.
    - Creator self-booking eligibility uses the existing trusted `users.user_type='influencer'` creator role rather than introducing another identity system.

14. O2OL-owned programming staff activation.
    - `/O2OLProgrammingAdmin` is staged behind the same programming feature switch but **does not** trust any `users.user_type` value for staff authority.
    - `manage-o2ol-programming` requires the authenticated account UUID to appear in the server-side `O2OL_PROGRAMMING_ADMIN_USER_IDS` allowlist.
    - Do not create/populate `O2OL_PROGRAMMING_ADMIN_USER_IDS`, expose the internal route through general navigation, or grant O2OL scheduling authority to any account until the exact staff accounts are explicitly approved.
    - O2OL-owned bookings use `program_source='o2ol'`, have no creator owner, use the non-billable `internal` booking tier, and cannot be cancelled through the creator self-service path.

15. Paid creator programming slots.
    - **Do not activate paid slot sales as part of the initial free-calendar rollout.**
    - The schema is future-ready for a `paid` tier, but the creator booking endpoint currently rejects all non-free creator bookings and the frontend always requests a free booking.
    - Paid slots require a separate approval batch covering pricing, checkout/payment provider behavior, creator terms, cancellations/refunds, disputes/chargebacks, tax/accounting treatment, moderation obligations, and any revenue-share policy before implementation is enabled.

16. Programming reminder database + member API activation.
    - `supabase/migrations/20260819_programming_reminders.sql` is DEVELOPMENT ONLY and depends on the programming calendar migration.
    - Do not apply it or deploy `programming-reminder` until the programming calendar is live and reviewed.
    - Keep both `VITE_PROGRAMMING_REMINDERS_ENABLED=false` and `PROGRAMMING_REMINDERS_ENABLED=false` during deployment and controlled testing.
    - Reminder writes are backend-mediated; members can read only their own reminder state. In-app notification records are private and store structured program facts rather than English prose so the current client language controls member-facing copy.

17. Programming reminder dispatcher activation.
    - `dispatch-programming-reminders` is staged for **in-app notification creation only**. It contains no email, SMS, push, or other external-provider call.
    - Do not deploy/schedule it or create `PROGRAMMING_REMINDER_DISPATCH_SECRET` until the reminder database/API batch is explicitly approved.
    - The dispatch secret must be generated/stored as a production secret and must never be pasted into chat, committed to source, or exposed to the browser.
    - No production scheduler/cron has been configured. Scheduler cadence and secret injection must be reviewed at activation time.

18. External programming-reminder delivery channels.
    - Email, SMS, mobile push, web push, or any paid/third-party delivery channel is **not part of the staged reminder system**.
    - Do not add a provider, incur messaging cost, request push permission, or reuse unrelated messaging credentials without a separate explicit approval covering provider, cost, consent, unsubscribe/opt-out, deliverability, privacy, and regional requirements.

19. Member-blocking safety activation.
    - The member-blocking stack is DEVELOPMENT ONLY. Keep both `VITE_MEMBER_BLOCKING_ENABLED=false` and `MEMBER_BLOCKING_ENABLED=false` until the full safety batch is reviewed.
    - Do not apply `20260819_member_blocks.sql` or its chat, connection, Live Room, pairwise-visibility, and pending-request cleanup enforcement migrations to live Supabase without explicit approval and an ordered rollback plan.
    - Do not deploy `member-block` or `list-blocked-members` until those migrations are verified together in development.
    - Blocking is a private, one-way member safety choice; the browser cannot directly insert/delete block rows and the blocked-member list must never expose email, partner, subscription, billing, or verification fields.
    - Before activation, verify both directions of visibility/enforcement across member discovery, connection requests, pairwise chat, and Live Rooms; verify blocking clears or suppresses pending connection requests as designed; verify unblock restores only future eligible interaction and does not recreate prior relationships or requests.
    - The `/BlockedMembers` route and Privacy Center management control are already staged, but the Privacy Center control remains hidden while the client feature switch is off.

20. Programming moderation activation.
    - `supabase/migrations/20260819_programming_moderation.sql` and the `report-programming` / `moderate-programming` Edge Functions are DEVELOPMENT ONLY.
    - Keep both `VITE_PROGRAMMING_MODERATION_ENABLED=false` and `PROGRAMMING_MODERATION_ENABLED=false` until programming itself is active and the moderation workflow has been reviewed end-to-end.
    - Moderator authority reuses the server-side `O2OL_PROGRAMMING_ADMIN_USER_IDS` allowlist; no public profile/user type may grant moderation authority.
    - Member reports are private, duplicate-safe records. The moderator payload/UI must continue omitting reporter identity and must not expose a reporter UUID merely for convenience.
    - Removing reported programming changes the program to cancelled and must continue cancelling active member reminders for that program.
    - `/ProgrammingModerationAdmin` is staged as a private route; do not expose it through general member navigation. Access must remain denied unless both moderation is enabled and the authenticated account is allowlisted.

21. Private member support activation.
    - `supabase/migrations/20260819_support_requests.sql`, `20260819_support_request_quota_guard.sql`, `20260819_support_request_state_guard.sql`, and `20260819_support_response_read_state.sql` are DEVELOPMENT ONLY and must be applied/reviewed together in a development environment before live activation.
    - Do not deploy `support-request` or `manage-support-requests` to live Supabase until the table/RLS, five-open-request quota, immutable member-authored content, lifecycle transitions, and response read-state have been verified end-to-end.
    - Keep both `VITE_SUPPORT_REQUESTS_ENABLED=false` and `SUPPORT_REQUESTS_ENABLED=false` during deployment and controlled testing.
    - O2OL staff support authority must come only from the server-side `O2OL_SUPPORT_ADMIN_USER_IDS` allowlist. Do not infer staff authority from `regular`, `professional`, `therapist`, `influencer`, or any other public profile role.
    - `/SupportAdmin` is a private route and must not be exposed through general member navigation. `/SupportRequests` is the authenticated member path and the header response center remains hidden while support is disabled.
    - Support responses and notifications are staged as **in-app only**. Do not add email, SMS, push, outbound ticketing, or another external provider without a separate approval covering cost, consent/opt-out, privacy, retention, and operational ownership.
    - The support channel is not an emergency or crisis-response service and must not be presented as continuously monitored. The member UI must continue showing this boundary, especially for the `safety` category.

## Safe development work that may continue without separate approval

- Frontend UX and visual refinements on `relaunch-homepage`.
- Development-only migrations and Edge Function code preparation.
- Preview-only flows that do not send messages or modify live data.
- Bug fixes, validation, accessibility, responsive layout, translations, and route cleanup.
- Read-only audits of repository code and Supabase configuration when connectors are available.
- Refactoring member-facing reads away from private tables into purpose-built privacy-safe projections.
- Expanding automated relaunch safety checks so production blockers are visible before launch.
- Creator/O2OL programming calendar UX, privacy-safe scheduling/status contracts, staff-allowlist plumbing, programming moderation/reporting UX, programming reminder UX/in-app notification plumbing, and automated checks while all related production switches/secrets/schedulers remain off.
- Member-blocking safety UX, route integration, privacy-safe blocked-list management, and automated checks while the blocking database/function/client switches remain off.
- Private member-support UX, in-app response notification/read-state plumbing, allowlisted support-console UX, and automated checks while support database/functions/client switches remain off.

## Current operating rule

Build as far as possible in development. Stop only where an action would affect production, live user data, billing/costs, secrets, or irreversible external systems. Collect those actions here for one bulk approval review.
