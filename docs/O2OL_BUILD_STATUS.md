# O2OL Build Status

Updated: 2026-08-19
Branch: `o2ol-build-branch-2026-08-18`
Draft PR: #17 — active build branch; intentionally remains draft

## Launch product status

The official feature roadmap now uses three explicit categories:

1. **Available at launch** — working features intended for launch after runtime/deployment validation and owner-controlled activation items.
2. **Post launch** — approved future features ranked in implementation priority.
3. **Retired / no longer used as previously designed** — legacy concepts, fake/mock behavior, or replaced architecture that must not quietly return.

See `docs/O2OL_FEATURE_ROADMAP.md` for the canonical inventory.

## Global Relationship Room

Implemented on the branch and live Supabase backend:

- Five-language public Global Relationship Room experience.
- Approved tagline: **One Room. Many Voices. Stronger Relationships.**
- Public Live Now / Up Next / Next 7 Days schedule.
- O2OL, Creator, Replay, Partner, and Special program types.
- Permanent third-party-programming disclaimer plus short program disclaimer.
- Signed-in multilingual program reporting.
- Creator application/access, approval status, self-booking, history, cancellations, timezone handling, and localized errors.
- Database overlap protection and free-account two-slot creator-local daily limit.
- Trusted moderator registry, moderation queue, report queue, cancellation queue, replay manager, official scheduling, operations dashboard/summary, program control, and moderation audit history.
- Normal browser users cannot self-approve, self-moderate, remove required disclaimers, or elevate themselves to moderator.

## Relationship engagement and couple tools

Five-language launch-intended experiences now include:

- Daily Relationship Question
- Marriage Matters
- Relationship Library
- Couples Challenges
- Date Night
- Date Ideas
- Relationship Reset
- O2OL Show
- Conversation Cards
- Weekly Relationship Check-In
- Relationship Rituals
- Couple Activities
- Couples Dashboard
- Communication Practice
- Guided Couples Meditation
- Relationship Support
- Relationship Goals
- Relationship Milestones
- Anniversary Tracker
- Couples Calendar
- Couple Profile
- Shared Journals
- Memory Lane
- Relationship Quizzes / Love Language Reflection
- Love Notes

Privacy-first behavior includes:

- Conversation Cards do not save or transmit answers.
- Weekly Relationship Check-In keeps answers only in page memory.
- Communication Practice stores or transmits no practice response and is explicitly educational, not therapy.
- Daily Relationship Question creates no answer record.
- Relationship Reset discloses its browser-local completion state.
- Date Night personalization remains local to the browser.
- Love Language Reflection keeps answers in memory and saves only the final preference when a signed-in member explicitly chooses Save to Profile.
- Date Ideas saves only supported private owner-scoped fields and does not claim community/partner sharing that the schema does not support.

## Real couple-data features

### Love Notes

- Delivery is limited to a mutually linked partner.
- Recipient identity is resolved server-side rather than entered as arbitrary email.
- Sent, received, unread, read-state, and deletion behavior are database-backed.
- Browser clients cannot directly insert/update Love Note rows.
- Legacy sender-only rows are not treated as verified partner delivery unless reciprocal relationship evidence exists.
- Dedicated Love Notes privacy/security CI is active.

### Shared Journals

- Existing entries remain private.
- New entries are private by default.
- Sharing is explicit per-entry opt-in through `shared_with_partner`.
- Only a reciprocally linked partner can read a shared entry.
- Partner-owned entries are read-only in the UI.
- UI distinguishes Private, Shared with partner, and Shared by your partner.
- Dedicated Journal Privacy CI protects these guarantees.

### Couple Profile / Anniversary / Memory Lane / Profile

- Couple Profile resolves a partner through a mutual-link safe RPC rather than directly reading another account row.
- Anniversary Tracker updates only the signed-in member’s anniversary profile field and does not fabricate relationship statistics.
- Memory Lane uses the real live schema, explicit columns, owner-scoped writes, localized dates/actions, and no unsupported fake sharing/upload controls.
- Profile was rebuilt against verified live account columns and no longer displays fabricated activity, quiz, memory, or streak counters.

## AI surfaces

- AI Relationship Coach is a five-language zero-data preview. It does not collect relationship text, diagnose users, or imply a live AI service.
- AI Content Creator is a five-language zero-data preview. It does not collect partner names/context or imply generation is active.
- Both previews route to real working O2OL alternatives.
- Live AI services are post-launch roadmap items and require a deliberate privacy-reviewed backend.

## Trust and legacy-surface cleanup

Launch-facing or routed legacy pages have been converted away from fake/mock behavior:

- Fabricated homepage experts/testimonials removed.
- Professional and therapist application routes explicitly state those verified ecosystems are post launch and collect no credential/profile data today.
- Old influencer signup now routes creators to the real Global Relationship Room creator program; separate brand/influencer partnerships remain post launch.
- LGBTQ+ support removed unverified therapist referrals, hard-coded crisis contacts, and legal-rights guidance; the dedicated verified resource hub is post launch.
- Articles and Blog routes no longer publish invented experts, authors, dates, audience claims, or article catalogs.
- Influencer/Expert directory no longer displays invented identities, followers, credentials, or endorsements.
- Reviews no longer displays fabricated couples, ratings, or testimonials.
- Suggestions no longer pretends a feedback submission was saved; it routes to a functioning contact path until a real feedback backend exists.
- Leaderboard no longer ranks users against fabricated couples and is retired for launch.
- Achievements no longer awards pretend badges, points, streaks, or rewards at launch.
- Premium Features no longer uses pretend unlocks or points to sell unavailable benefits.
- Subscription route explicitly states paid membership checkout is not opening at launch and old plan/pricing promises are not launch offers.
- Win-a-Cruise route explicitly states no active prize competition exists.
- Podcast support routes to real O2OL programming rather than fake third-party statistics/listen buttons.

A permanent **O2OL Legacy Trust Verification** workflow now guards these routed compatibility/post-launch surfaces against restoration of known fabricated or inactive claims.

## Community and chat

Launch-intended supported social surfaces include:

- privacy-safe member discovery;
- friend requests and accepted buddy connections;
- real member-submitted relationship stories;
- private chat;
- participant-scoped realtime subscriptions;
- private chat attachment storage with short-lived signed URLs;
- unread conversation indicators.

The old Discussion Forums shell is not counted as a complete launch feature because its previous backend was removed. Full forums are a post-launch roadmap item.

## Auth, privacy, accessibility, and platform hardening

- Password recovery and guarded auth-callback routing are present.
- Application error boundary, skip-to-content support, footer, and unknown-route page are present.
- AuthContext no longer emits emails, IDs, profiles, sessions, or auth diagnostics to the browser console.
- Social discovery uses the safe directory surface rather than exposing account rows.
- Partner application completion verifies persisted pending-profile state before success is shown.
- Global Layout was rebuilt with five-language desktop/mobile discovery, Global Room/Relationship Library/Couples Dashboard access, localized AI labels, simplified chat badge refresh, no public developer shortcut, and no browser account diagnostics.
- Node.js 24 is used in O2OL CI.

## Live Supabase hardening

The live O2OL project includes:

- Waitlist RLS enabled.
- Anonymous access removed from clearly private relationship/account tables.
- Public catalog/community surfaces limited to intentional public-readable access.
- Waitlist reduced to insert-only behavior for public/authenticated signup paths.
- Legacy views `goals_with_steps`, `milestones_with_next_date`, and `user_presence_view` changed to `security_invoker=true`.
- Twenty-one legacy functions now have fixed `search_path=public, pg_temp`.
- Shared Journals mutual-partner read policy applied live.
- Love Notes mutual-partner delivery/read-state hardening applied live.

Remaining Supabase platform/advisor items are primarily owner-controlled or intentionally reviewed architecture:

- authenticated SECURITY DEFINER RPCs with caller/participant authorization;
- GraphQL schema discoverability notices on RLS-protected or intentionally readable objects;
- private Global Room tables controlled through RPC paths;
- leaked-password protection disabled (platform setting);
- available Supabase Postgres security-patch upgrade (maintenance item).

## Dependency security

The locked dependency tree is currently clean at the configured audit threshold:

- **Production dependencies:** 0 vulnerabilities at `npm audit --omit=dev --audit-level=low`.
- **Full dependency tree:** 0 vulnerabilities at `npm audit --audit-level=low`.
- The unused `@flydotio/dockerfile` development helper was removed after repository-use review; its transitive `diff` advisories disappeared with it.
- The cleanup guard required `npm ci`, production audit, full-tree audit, and production build before committing.
- `npm audit fix --force` remains prohibited for automatic remediation.

See `docs/O2OL_DEPENDENCY_REMEDIATION_STATUS.md` for the permanent dependency policy.

## Permanent verification coverage

The branch has permanent PR-visible gates covering core build/source/security/privacy, social/chat/partner integrity, engagement/localization, Love Notes, journals, quizzes, couple tools, route performance, Date Ideas, Profile, Layout navigation, AI previews, Invite trust, dependency auditing, and legacy-route trust.

Do not call a newer branch head fully green until the checks for that exact commit have completed.

## Current infrastructure constraint

- External Vercel deployment has reported `upgradeToPro=build-rate-limit`.
- This is separate from GitHub compilation/verification.
- No Vercel upgrade or paid plan change has been performed automatically.

## Next active implementation areas

- Continue mobile/accessibility/trust audit of remaining launch-visible public and community surfaces.
- Complete real Community feature boundary cleanup so empty legacy forums cannot be mistaken for a launch feature.
- Continue narrow review of privileged Supabase RPCs only where caller authorization materially matters.
- Browser/runtime validation when a deployable Vercel preview is available again.
- Prepare merge readiness only after deployment/runtime validation and owner-controlled launch items are resolved.

## Owner-controlled / platform activation items

- Assign the first trusted Global Relationship Room moderator/admin account when desired; no normal account is auto-elevated.
- Decide later whether Vercel build-rate-limit warrants a plan change; no cost should be incurred automatically.
- Enable Supabase leaked-password protection when intentionally approved.
- Schedule the available Supabase Postgres security-patch upgrade as a maintenance action.

## Deferred by product decision

Priority-ordered post-launch work now lives in `docs/O2OL_FEATURE_ROADMAP.md`, including paid creator slots, advanced creator ecosystem, paid membership, live AI services, verified LGBTQ+ resources, verified professional/therapist ecosystem, full forums, advanced reflections/games, editorial publishing, verified discovery, optional gamification, real reviews/feedback, sponsorships/promotions, and far-later sensitive personalization.
