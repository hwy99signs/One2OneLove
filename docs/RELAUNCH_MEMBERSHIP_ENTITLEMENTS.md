# One2OneLove Relaunch — Membership Entitlements

Status: **OWNER APPROVED — DEVELOPMENT IMPLEMENTATION ACTIVE**

Owner approval: 2026-08-18, as part of One2OneLove Approval Batch 001.

## Product principle

One2OneLove uses a **free-account acquisition loop** and one simple paid membership.

The free account should let a person experience enough genuine value to enter, connect, respond, and build a habit. Paid membership should deepen the relationship experience with AI, couple planning, shared-history, accountability, and retention tools. The relaunch does not use the retired Basic / Premiere / Exclusive tier system.

## Pricing

- Free Account: $0.
- One2OneLove Membership: **$1.99/month for the first 6 months**.
- Thereafter: **$5.99/month ongoing unless canceled**.
- **No separate free trial.**
- No annual plan is assumed for the relaunch unless separately approved later.

## Free-account foundation

The following are approved as free-account experiences. Privacy-sensitive features may still require sign-in and confirmed email; “free” means they do not require a paid membership.

- 365 Love Notes hub.
- Browse Love Notes.
- Write and send a Love Note invitation.
- Secure Love Note reveal.
- Reply with a Love Note.
- Save a revealed Love Note and view Saved Love Notes.
- Core Live Community rooms and participation.
- Member profile.
- Find Friends / member discovery.
- Friend requests.
- Pairwise **text** chat after its security migrations are validated.
- Invite people.
- Love Language Quiz.
- Date Ideas.
- Couple Profile.
- General support/resource library surfaces.

## Paid membership — deeper relationship tools

The following are approved membership benefits once paid gating is activated:

- AI Relationship Coach.
- AI-assisted romantic content creation.
- Relationship Goals and progress/accountability tools.
- Couples Calendar.
- Shared Journals.
- Memory Lane.
- Relationship Milestones.
- Anniversary Tracker.
- Couples Dashboard and deeper relationship insights.
- Couple Activities.
- Cooperative Games.
- Communication Practice.
- Guided Meditation.
- Advanced relationship quizzes beyond the free Love Language Quiz.
- Love Note scheduling.
- Love Note AI personalization when that feature is implemented.

## Mixed-access rule

Some pages remain free while a control inside the page is premium. Love Notes is the main example: composing/sending/revealing/replying remains free, while future-date scheduling and AI personalization are membership benefits. Do not gate the entire Love Notes route merely because one control is premium.

## Activation rule

The entitlement map is implemented in `src/lib/membershipConfig.js` and enforced through `src/hooks/useFeatureAccess.js` / `FeatureGate`.

Paid gating stays independently OFF through `VITE_MEMBERSHIP_GATING_ENABLED` until the controlled backend and Stripe test sequence passes. Live checkout also stays independently OFF through `VITE_PAYMENTS_ENABLED` plus the server-side `PAYMENTS_ENABLED` kill switch.

This separation is intentional:

1. Code can be built and visually tested without charging anyone.
2. Membership entitlements can be prepared without locking free users out prematurely.
3. Live payment activation cannot happen merely because a page or route was deployed.

## Launch checks

Before enabling paid gating:

1. Confirm the membership database migration and safe `my_membership` projection are active.
2. Complete Stripe test-mode checkout, signed webhook activation, $1.99 intro pricing, six-month transition schedule, $5.99 standard pricing, billing portal, cancellation, and idempotency tests.
3. Confirm free routes remain accessible to free authenticated members.
4. Confirm each paid route redirects signed-out visitors through normal auth return-to and shows free members the membership prompt.
5. Confirm Love Notes mixed-access controls enforce the approved boundary without blocking the free acquisition loop.
6. Keep SMS activation separate from membership activation.

## Change control

Any future change that moves a feature between free and membership should update this document and `FEATURE_ENTITLEMENTS` together. Unknown feature keys fail closed to `membership` so a newly added premium feature cannot silently become free by typo or omission.
