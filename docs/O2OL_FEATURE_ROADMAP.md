# One2OneLove (O2OL) Feature Roadmap

Updated: 2026-08-19
Branch: `o2ol-build-branch-2026-08-18`

## Product rules

- O2OL is written **O2OL** and pronounced “Ohtool.”
- The five active production languages are English, Spanish, French, Italian, and German.
- Every new or modified public feature must participate in the same five-language framework.
- Privacy-first defaults, explicit consent for sharing, least-privilege data access, truthful product claims, and moderation-before-scale remain launch requirements.
- Deferred features stay documented unless the owner explicitly rejects them.

# 1. Available at launch

These features are intended to be part of the launch product once runtime/deployment validation and owner-controlled activation items are complete.

## Core platform

- Account registration, sign-in/sign-out, forgot-password and reset-password flows.
- Five-language global navigation and responsive desktop/mobile shell.
- User Profile using real supported account fields.
- About, Help Center, Contact, Privacy Policy, Terms, Not Found, application error handling, and accessibility support.
- Privacy-first Invite flow using copy/native share/email-app/SMS-app without pretending O2OL sent a message or collecting recipient contact data.

## Relationship engagement

- Daily Relationship Question.
- Marriage Matters.
- Relationship Library.
- Couples Challenges.
- Date Night planner.
- Date Ideas with private owner-scoped saved/custom ideas.
- Relationship Reset.
- Conversation Cards.
- Weekly Relationship Check-In.
- Relationship Rituals.
- Communication Practice.
- Guided Couples Meditation.
- Couple Activities hub.

## Couple workspace

- Couples Dashboard.
- Couple Profile with reciprocal-partner-safe profile lookup.
- Anniversary Tracker.
- Couples Calendar.
- Relationship Goals.
- Relationship Milestones.
- Memory Lane.
- Shared Journals with private-by-default entries and explicit reciprocal-partner sharing.
- Love Notes with real mutually linked partner delivery, sent/received/unread/read-state behavior, and server-resolved recipient identity.

## Relationship reflections

- Relationship Quizzes hub.
- Love Language Reflection, framed as educational reflection rather than diagnosis or validated psychological assessment.
- Unfinished quiz concepts remain visibly Coming Soon rather than exposing dead controls.

## Relationship support and content discovery

- Relationship Support hub using real O2OL educational tools.
- Professional Support information page that clearly states O2OL does not yet operate a verified therapist directory or counseling-booking service.
- Relationship Audio & Programming gateway routing to real O2OL Show, Global Relationship Room, and Relationship Library content.
- O2OL Show destination featuring O2OL and AMORA.

## Community and social connection

- Community shell with real member-submitted relationship stories and existing supported social surfaces.
- Privacy-safe Find Friends/member discovery.
- Friend Requests and accepted buddy connections.
- Private Chat with participant-scoped realtime behavior.
- Private chat attachments using authorized short-lived signed URLs.
- Unread conversation indicators.

The old discussion-forum shell is not considered a complete launch feature because its prior backend was removed; real forums are post launch.

## O2OL Global Relationship Room

Tagline: **One Room. Many Voices. Stronger Relationships.**

Launch capabilities:

- 24-hour programming framework.
- Five-language public Room experience.
- Live Now, Up Next, and Next 7 Days schedule views.
- O2OL, Creator, Replay, Partner, and Special program types.
- Permanent third-party-programming disclaimer and short per-program disclaimer.
- Signed-in multilingual program reporting.
- Creator application/access, approval status, self-booking, booking history, cancellation, timezone handling, and localized errors.
- Free creator allowance of up to 2 slots per creator-local day.
- Database overlap protection.
- Replay support.

Internal launch operations:

- Trusted moderator registry.
- Moderation queue.
- Report queue.
- Cancellation queue.
- Replay manager.
- Official O2OL scheduler.
- Program manager.
- Operations dashboard/summary.
- Moderation audit history.
- Privilege controls preventing normal members from self-elevating or self-approving.

# 2. Post-launch features — priority order

## Priority 1 — Paid Global Room creator slots and creator tiers

Add paid programming slots, expanded scheduling allowances, premium creator tiers, and clearly disclosed priority/featured opportunities. This is the closest revenue extension of an already-built launch feature.

## Priority 2 — Advanced Global Room creator ecosystem

Add creator analytics, audience engagement metrics, deeper program history, replay-library tools, reputation/quality controls, and a formal moderation-appeals process.

## Priority 3 — Paid O2OL memberships

Activate paid membership only after launch entitlements and prices are explicitly finalized and every advertised paid benefit is real. The old Basic/Premiere/Exclusive prices and benefit promises are not launch offers.

## Priority 4 — Live AI Relationship Coach

Replace the current zero-data preview with a real, privacy-reviewed AI service for guided educational reflection, communication suggestions, and action planning. It must not diagnose users or present itself as therapy or crisis care.

## Priority 5 — AI Content Creator

Activate real AI-assisted generation for love notes, appreciation, anniversary messages, conversation starters, date ideas, and carefully worded reconciliation/apology content after a reviewed AI backend is in place.

## Priority 6 — Verified LGBTQ+ Relationship Resource Center

Build a current, sourced, multilingual LGBTQ+ relationship resource experience. Location-sensitive legal, professional, and crisis information must be verified and clearly sourced rather than hard-coded.

## Priority 7 — Verified professional / therapist ecosystem

Add real professional applications, credential review, verification, public profile rules, discovery, and later referral/booking only after privacy, licensing, geographic-scope, and operational standards are defined.

## Priority 8 — Full Community Discussion Forums

Rebuild the removed forum backend with real topics, posts, replies, moderation, reporting, blocking/muting, and community-guideline enforcement.

## Priority 9 — Advanced relationship reflections

Add communication-style, conflict-habit, appreciation-preference, values, connection-habit, and relationship-strength reflections. Do not call them validated assessments unless they actually are.

## Priority 10 — Additional cooperative games

Expand beyond Conversation Cards with appreciation, memory, relationship trivia, teamwork, and “how well do you know me?” activities.

## Priority 11 — Real editorial publishing system

Add accountable O2OL articles/guides with real authorship, publication dates, review standards, and multilingual publishing. This replaces old invented article/blog content permanently.

## Priority 12 — Verified podcast / creator / expert discovery

Only add external discovery when identities, links, credentials where claimed, disclosures, and engagement statistics can be verified.

## Priority 13 — Private achievements and gamification

If added, favor private couple progress, habits, and challenge completion over public competition. Use real activity data and explicit rules.

## Priority 14 — Premium feature/reward system

After membership tiers exist, add truthful premium content, personalization, themes, creator experiences, and early-access benefits. Do not restore pretend point-based unlocks.

## Priority 15 — Optional leaderboard/community recognition

Only if retained: make it opt-in, consent-based, privacy-conscious, and focused on healthy participation rather than ranking relationship quality.

## Priority 16 — Real user reviews/testimonials

Publish only real reviews or testimonials with permission and moderation. Never seed the product with invented couples, ratings, or locations.

## Priority 17 — Real feedback / feature-request system

Add persistent suggestions, bug reports, feature requests, optional contact information, admin triage, and status tracking.

## Priority 18 — Sponsorship and advertising inventory

Add clearly labeled sponsored Room programming, brand-safe events, and paid placements only after audience scale, disclosure rules, and creator standards are established.

## Priority 19 — Promotions / contests

Only activate giveaways, date-night prizes, trips, or other promotions after official eligibility, dates, rules, sponsor terms, and required legal review are published.

## Priority 20 — Highly sensitive advanced personalization

Deep longitudinal analytics, inferred relationship patterns, sensitive AI personalization, or surveillance-like behavior remain far-later concepts requiring explicit legal/privacy review before implementation.

# 3. Retired / no longer used as previously designed

- Base44 backend dependency: replaced by Supabase-backed architecture where functionality remains supported.
- Fabricated homepage experts and testimonials: removed.
- Fabricated Reviews page ratings/couples: retired; current route is a truthful compatibility page.
- Invented influencer/expert directory and follower counts: retired.
- Invented expert article/blog catalogs and newsletter audience claims: retired.
- Fake third-party podcast statistics and dead Listen controls: retired.
- Fake therapist directory/booking claims: retired.
- Hard-coded therapist verification code behavior and generated temporary-password onboarding: retired.
- Fake AI Relationship Coach chat: retired; current route is a zero-data preview until a real AI backend exists.
- Fake AI Content Creator generation controls: retired; current route is a zero-data preview until a real AI backend exists.
- Fake email invitation delivery and nonexistent referral rewards: retired.
- Active “Win a Cruise” claim: retired; no prize promotion is active.
- Mock leaderboard couples/rankings: retired for launch.
- Pretend badges, points, streaks, rewards, and premium unlocks: retired for launch.
- Fabricated relationship activity statistics: removed from modernized profile/dashboard surfaces.
- Fake Memory Lane partner-sharing/upload controls unsupported by the backend: removed.
- Arbitrary-email Love Note delivery: replaced by reciprocal-partner delivery.
- Public chat attachment URLs: replaced by private storage and short-lived authorized URLs.
- Separate legacy Dashboard destination: compatibility route redirects to Profile; Couples Dashboard is the real couple hub.
- Public Developer shortcut: removed from normal user navigation.
- Dutch and Portuguese production language options: disabled; current active languages are EN/ES/FR/IT/DE.

## Architectural guardrails

1. Privacy-first defaults.
2. Consent before sensitive sharing or interaction.
3. Least-privilege access to personal data.
4. Localization is a completion requirement.
5. O2OL editorial programming must remain distinguishable from third-party creator views.
6. Moderation capability precedes scale.
7. Monetization must not silently override safety or trust controls.
8. No fabricated users, experts, metrics, reviews, rewards, or success states.
9. A route existing in code does not make it a launch feature; functionality and trust requirements determine launch status.

## Build workflow

Development continues in batches under standing owner authorization. Genuine owner-only decisions are consolidated in `docs/O2OL_APPROVAL_BATCH.md` rather than interrupting implementation work.
