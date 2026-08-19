# O2OL Approval Batch

Updated: 2026-08-18

This file collects owner decisions that should not interrupt active build work. Items are added only when a genuine product, legal, brand, monetization, infrastructure, or irreversible implementation decision is required.

## Pending owner approvals

_No approval is currently required to continue the present Global Relationship Room build._

### Global Relationship Room operational activation — batch for later owner review

The moderation system is now built and secured, but two activation decisions should remain owner-controlled rather than being guessed during development.

- **Initial moderator account:** choose which existing One2OneLove user account should receive the first trusted Global Relationship Room moderator/admin assignment. No account is auto-elevated. Until this is assigned, the moderation route remains securely inaccessible to ordinary users.
- **Vercel build-rate limit:** GitHub currently reports the connected One2OneLove Vercel deployment check as failed with a Vercel `upgradeToPro=build-rate-limit` target. Development can continue in GitHub and Supabase, but production/preview deployment availability may require either waiting for the plan limit to reset or approving a Vercel plan change. Do not upgrade or incur cost automatically.

### Legacy platform security / infrastructure review — batch for later owner review

A live Supabase security-advisor pass identified several pre-existing platform items that are outside the new Global Relationship Room work. They are intentionally not being changed blindly because some may affect existing production behavior.

- Decide when to schedule a controlled legacy database-security cleanup covering existing SECURITY DEFINER views/functions and mutable function search paths.
- Approve a controlled fix for the existing `waitlist_signups` table, which has policies defined but Row Level Security currently disabled.
- Decide whether to enable Supabase leaked-password protection for account security after confirming the desired sign-up/sign-in experience.
- Approve the Supabase/Postgres patch-level upgrade during a maintenance window after compatibility review.
- Review broad legacy GraphQL/Data API exposure as a separate hardening pass; the newly added Global Relationship Room tables are already protected by explicit grants plus RLS.

These items are **not blockers** for continuing the current feature branch and should be handled as a dedicated security-hardening batch with verification.

## Build assumptions currently authorized

- Continue O2OL development without routine check-in interruptions.
- Preserve all approved current and future O2OL feature concepts in the roadmap.
- Use the existing professionally translated five-language system for every new or modified user-facing feature.
- Build the Global Relationship Room around a 24-hour schedule.
- Allow free creator accounts to self-book open slots, initially capped at 2 slots/day.
- Allow replays/multiple programming blocks when capacity is open.
- Defer paid creator slot sales to a later phase.
- Keep a permanent prominent third-party-view disclaimer plus a shorter in-room disclaimer.
- Keep the official O2OL studio set visually permanent; change talent/guests, not the core set.
- Preserve privacy-law-sensitive concepts for a much later phase pending legal/privacy review.

## Future decisions to surface here when implementation reaches them

- Exact paid creator-slot pricing and revenue-share model.
- Creator eligibility/verification threshold for public broadcasting.
- Final moderation escalation and appeal policy.
- Exact programming slot lengths and prime-time rules if capacity becomes constrained.
- Sponsorship/ad inventory rules.
- Any feature requiring collection or inference of new sensitive personal information.
