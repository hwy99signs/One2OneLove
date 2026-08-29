# O2OL Build Status — 2026-08-19

Branch: `o2ol-build-branch-2026-08-18`
Draft PR: #17

## Product experience implemented on the branch

### Global Relationship Room
- Five-language public room (EN / ES / FR / IT / DE).
- Live Now / Up Next / seven-day programming schedule.
- One2OneLove, creator, replay, partner, and special program types.
- Permanent third-party programming disclaimer and program-level disclaimer treatment.
- Creator applications and approved-creator self-booking.
- Free creator limit of two slots per creator-local day enforced in PostgreSQL.
- Database overlap prevention for active programming.
- Trusted moderator registry with no automatic moderator promotion.
- Creator moderation, program moderation, official scheduling, replay management, report queue, cancellation queue, audit history, and operations dashboard.
- Viewer reports and creator cancellation requests.

### Relationship engagement
- Daily Relationship Question.
- Marriage Matters.
- Relationship Library.
- Couples Challenges with local-only weekly completion.
- Date Night planner.
- O2OL Show hub with O2OL and AMORA.
- Weekly Relationship Reset with local-only completion and explicit privacy disclosure.
- Home-page promotion for Global Room, Daily Question, Marriage Matters, and Relationship Reset.

### Public-site cleanup
- Removed fabricated expert/podcast promotion.
- Removed unverified testimonial claims.
- Removed dead Base44 zero-stat polling.
- Removed unverified generic social-media links.
- Modernized relationship-feature discovery.
- Five-language home hero, feature, trust, and engagement surfaces.

## Account and partner work

- Real Supabase password signup/sign-in and password recovery.
- Influencer and professional applications now use real chosen passwords.
- Removed development-only `123456` verification-code flows.
- Removed temporary partner passwords.
- Added Terms of Service and Privacy Policy consent to partner applications.
- Localized partner forms and photo upload across all five active languages.
- Partner application status defaults to pending.
- Partner profile RLS prevents browser self-approval or changes to moderation/verification fields.

## Billing hardening

Deployed Supabase Edge Functions:
- `create-checkout-session` — authenticated.
- `create-billing-portal` — authenticated.
- `stripe-webhook` — signed Stripe webhook endpoint.

Billing architecture:
- Client submits plan name only.
- Server allowlists paid plans.
- Stripe Price IDs remain server-side.
- Paid access is activated by verified Stripe webhook state, not by browser updates.
- Browser updates to subscription/Stripe fields are blocked by database trigger.
- Billing mutation RPCs are service-role only.
- Stripe invoice history has an idempotency constraint.
- Subscription page and tier actions are multilingual and use Stripe-hosted checkout/billing management.

External Stripe credentials/Price IDs/webhook dashboard configuration remain activation items rather than hard-coded secrets.

## Privacy and security hardening

### Private account boundary
- `public.users` anonymous access removed.
- Client-side attempts to modify billing/trust fields are normalized/rejected by database trigger.
- A dedicated `public.user_directory_profiles` table contains only safe social-discovery fields.
- Directory is readable by authenticated members only and contains no account email, partner email, Stripe, subscription, or payment columns.
- Directory rows are synchronized from safe profile fields.
- `public.users` SELECT is now self-only under RLS.

### Social connections and chat
- Buddy discovery reads safe directory profiles rather than private account rows.
- Friend-request enrichment uses safe directory data.
- Find Buddies and Friend Requests are multilingual and do not display account email.
- Chat identity lookups use safe directory profiles.
- Messaging/presence SECURITY DEFINER RPCs validate the signed-in actor.
- Anonymous access removed from private messaging/presence tables.
- Chat attachment bucket is forced private and storage policy is participant-aware.

### Global Room
- Exposed room tables use RLS.
- Moderator registry/audit direct API access is locked.
- Creator quota, overlap, approval, disclaimer, and moderation boundaries are database-enforced.
- Moderator functions use trusted-moderator checks.

## Verification baseline

The last fully observed clean checkpoint before the newest social-directory/storage hardening passed:
- O2OL Security Verification.
- O2OL Source Verification.
- O2OL Build Verification.
- O2OL Launch Readiness.

Additional account-privacy and social-privacy workflows have been added so the newest hardening receives dedicated automated coverage.

## Current owner/external activation items

- Assign the first trusted Global Relationship Room moderator when ready.
- Resolve the O2OL Vercel project/team build-rate-limit before production deployment.
- Configure Stripe production/test secrets, Price IDs, webhook endpoint, and Customer Portal before paid membership activation.
- No paid Vercel plan or other new cost should be activated automatically.

## Deferred by product decision

- paid creator programming slots
- sponsorship/ad inventory
- final creator verification thresholds
- moderation appeal policy
- privacy-law-heavy sensitive/inference features
