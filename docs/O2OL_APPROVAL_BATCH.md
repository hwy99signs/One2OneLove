# O2OL Approval Batch

Updated: 2026-08-19

This file collects owner decisions that should not interrupt active build work. Items are added only when a genuine product, legal, brand, monetization, infrastructure, or irreversible implementation decision is required.

## Pending owner approvals

_No approval is currently required to continue active O2OL development._

### Global Relationship Room operational activation — batch for later owner review

The moderation system is built and secured, but two activation decisions remain owner-controlled.

- **Initial moderator account:** choose which existing One2OneLove user account should receive the first trusted Global Relationship Room moderator/admin assignment. No account is auto-elevated. Until this is assigned, trusted operations remain inaccessible to ordinary users.
- **Vercel build-rate limit:** the connected One2OneLove Vercel deployment status has reported a `upgradeToPro=build-rate-limit` condition. GitHub/Supabase development can continue, but preview/production deployment capacity may require either waiting for the plan limit to reset or approving a Vercel plan change. Do not upgrade or incur cost automatically.

### Platform maintenance / account-security decisions — batch for later owner review

The earlier database-hardening backlog has been substantially completed: waitlist RLS is enabled, clearly private anonymous table privileges were removed, legacy security-invoker view hardening was applied, mutable function search paths were fixed, and targeted privileged RPCs were reviewed rather than weakened simply to silence generic advisor warnings.

The remaining platform-level items require owner-controlled timing or account-console changes:

- **Supabase leaked-password protection:** decide when to enable compromised-password checking after confirming the desired sign-up/sign-in experience. This is a platform Auth setting rather than a normal application-code change.
- **Supabase/Postgres patch upgrade:** schedule the available database security-patch upgrade during an intentional maintenance window after compatibility review. Do not perform infrastructure upgrades blindly during active development.

These items are not blockers for continued feature development.

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
