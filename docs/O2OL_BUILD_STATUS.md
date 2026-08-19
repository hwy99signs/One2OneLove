# O2OL Build Status

Updated: 2026-08-19
Branch: `o2ol-build-branch-2026-08-18`
Draft PR: #17 — active build branch; intentionally remains draft

## Global Relationship Room

Implemented on the branch and live Supabase backend:

- Five-language public Global Relationship Room experience.
- Approved tagline: **One Room. Many Voices. Stronger Relationships.**
- Public **Live Now / Up Next / Next 7 Days** schedule with automatic live/up-next refresh.
- Program types for One2OneLove, Creator, Replay, Partner, and Special programming.
- Permanent third-party-programming disclaimer plus per-program short disclaimer.
- Signed-in multilingual program reporting.
- Creator application, approval status, self-booking, history, cancellations, timezone handling, and localized errors.
- Database overlap protection and free-account two-slot daily limit.
- Trusted moderator registry, moderation queue, report queue, cancellation queue, replay manager, official scheduling, operations summary/dashboard, program control, and moderation audit history.
- Browser users cannot self-approve, self-moderate, remove required disclaimers, or elevate themselves to moderator.

## Relationship engagement and discovery

Routed five-language experiences now include:

- Daily Relationship Question
- Marriage Matters
- Relationship Library
- Couples Challenges
- Date Night
- Relationship Reset
- O2OL Show
- Conversation Cards
- Weekly Relationship Check-In
- Relationship Rituals
- Couple Activities
- Couples Dashboard
- Communication Practice
- Relationship Support
- Relationship Goals
- Relationship Milestones
- Anniversary Tracker
- Shared Journals
- Memory Lane
- Relationship Quizzes / Love Language Reflection
- Love Notes

### Privacy-first lightweight tools

- Conversation Cards do not save or transmit answers.
- Weekly Relationship Check-In keeps answers only in page memory.
- Communication Practice stores or transmits no practice response and is explicitly educational, not therapy.
- Daily Relationship Question is deterministic content and creates no answer record.
- Relationship Reset discloses its limited browser-local completion state.
- Date Night personalization remains local to the browser.
- Love Language Reflection keeps answers in memory; only the final preference is saved when the signed-in member explicitly chooses **Save to Profile**.

## Real couple-data features

### Love Notes

Love Notes is now a real private delivery feature rather than an SMS/email mockup:

- Delivery is limited to a mutually linked partner.
- Recipient identity is resolved server-side rather than entered as arbitrary email.
- Sent, received, unread, read-state, and deletion behavior are backed by the database.
- Browser clients cannot directly insert/update Love Note rows.
- Legacy sender-only records are not treated as verified partner delivery unless they match a reciprocal partner relationship.
- Dedicated Love Notes privacy/security CI is active.

### Shared Journals

Shared Journals now matches its product name without exposing old private data:

- Existing entries remain private.
- New entries are private by default.
- Sharing is explicit per-entry opt-in through `shared_with_partner`.
- Only a reciprocally linked partner can read a shared entry.
- Partner-owned entries are read-only in the UI; partners cannot edit/delete them.
- The UI clearly distinguishes **Private**, **Shared with partner**, and **Shared by your partner**.
- Dedicated Journal Privacy CI enforces those guarantees.

### Couple Profile / Anniversary / Memory Lane

- Couple Profile resolves a partner through a mutual-link safe RPC and no longer reads another member’s private account row directly.
- Anniversary Tracker stores and updates only the signed-in member’s anniversary profile field and does not fabricate relationship statistics.
- Memory Lane persistence is aligned to the live schema, uses explicit columns, owner-scoped writes, localized dates/actions, and no fake sharing/upload controls.

## Trust and multilingual cleanup

- Homepage feature discovery links to real features rather than vague/fabricated claims.
- Fabricated featured-expert and testimonial content was removed/replaced with truthful O2OL/AMORA positioning and relationship-value content.
- Cooperative Games opens the real Conversation Cards activity; unfinished games are visibly **Coming Soon** instead of dead Play buttons.
- Relationship Quizzes now exposes the working Love Language Reflection and marks unfinished reflections **Coming Soon**.
- Unverified “expert-designed assessment” language was removed; the quiz is framed as educational reflection, not diagnosis or validated psychological assessment.
- Relationship Support routes only to real O2OL self-help resources and explicitly does not claim therapy, diagnosis, crisis care, or verified licensed-professional referral.
- Legacy calendar, journals, goals, milestones, Memory Lane, Couple Profile, Couple Activities, Couples Dashboard, and related child components have been audited/modernized for EN/ES/FR/IT/DE.

## Auth, chat, privacy, accessibility, and platform hardening

- Password recovery and guarded auth-callback routing are present.
- Application error boundary, skip-to-content support, footer, and unknown-route page are present.
- AuthContext no longer emits emails, IDs, profiles, sessions, or auth diagnostics to the browser console.
- AuthContext keeps the existing login/logout/register/specialist-registration public API and uses statically analyzable specialist-service imports.
- Auth privacy is now protected by a read-only CI gate; self-modifying AuthContext sanitizer automation was removed.
- Social discovery uses the safe directory surface rather than exposing account rows.
- Chat attachment storage is private and authorized reads use short-lived signed URLs.
- Chat realtime subscriptions remain participant-scoped.
- Partner application completion verifies persisted pending-profile state before success is shown.
- Node.js 24 is used in O2OL CI.

## Live Supabase hardening

In addition to the Global Room migrations, the live O2OL Supabase project now includes:

- Waitlist RLS enabled.
- Anonymous access removed entirely from clearly private relationship/account tables including memories, relationship goals, milestones, shared journals, Love Notes, calendar events, friend/buddy private data, and subscription changes.
- Public-readable catalog/community surfaces reduced to anonymous **SELECT only** where public reading is intentional.
- Waitlist reduced to anonymous **INSERT only** and authenticated **INSERT only**; members cannot browse signup records.
- Three legacy views (`goals_with_steps`, `milestones_with_next_date`, `user_presence_view`) changed to `security_invoker=true` so they cannot bypass caller permissions/RLS.
- Twenty-one legacy functions now have fixed `search_path=public, pg_temp`, removing mutable-search-path advisor warnings without changing callers or function bodies.
- Shared Journals mutual-partner read policy applied live.
- Love Notes mutual-partner delivery/read-state hardening applied live.

The remaining Supabase advisor notices are primarily:

- intentionally authenticated `SECURITY DEFINER` RPCs whose function bodies perform caller/participant authorization;
- GraphQL schema discoverability notices for RLS-protected or intentionally public-readable objects;
- private Global Room tables with RLS and no direct policies because access is RPC-controlled;
- leaked-password protection disabled (platform setting);
- a Supabase Postgres patch upgrade available (platform maintenance item).

High-risk ID-taking authenticated RPCs reviewed so far verify caller identity or conversation/message participation; they were not weakened simply to silence generic advisor warnings.

## Dependency security

- Dependency auditing is structured and PR-visible.
- Production-only and full-tree `npm audit --json` reports are captured and uploaded as CI artifacts.
- The last completed production audit reported 8 findings: 7 high and 1 moderate; the full tree reported 19 findings including dev/build tooling.
- Direct affected packages identified include `postcss` and `react-router-dom`; `vite` is a direct dev/build dependency.
- No `npm audit fix --force` is permitted automatically.
- Dependency ancestry mapping is now being captured so transitive findings can be remediated through the correct parent package rather than patched blindly.
- Production build still passes while the remediation plan is being narrowed.

## Verification status

The fully validated checkpoint at commit `d6f66a1bfa56c951a37a546e92ddc1bd08c9451f` passed all 16 PR-visible suites:

- O2OL Build Verification
- O2OL Source Verification
- O2OL Security Verification
- O2OL Account Privacy Audit
- O2OL Social Privacy
- O2OL Chat Security
- O2OL Partner Integrity
- O2OL Integrated Hardening
- O2OL Launch Readiness
- O2OL Engagement Verification
- O2OL Localization Verification
- O2OL Love Notes Verification
- O2OL Couple Tools Verification
- O2OL Journal Privacy
- O2OL Quiz Privacy
- O2OL Dependency Audit

A read-only O2OL Auth Privacy gate also protects AuthContext invariants.

The branch may have newer dependency-audit instrumentation commits after this fully green checkpoint; read the latest commit’s CI before declaring a later checkpoint fully green.

## Current infrastructure constraint

- The external Vercel status has reported a plan build-rate-limit condition (`upgradeToPro=build-rate-limit`).
- This is separate from GitHub code compilation/verification.
- No Vercel upgrade or paid plan change has been performed automatically.

## Next active implementation areas

- Complete dependency ancestry review and apply only verified non-breaking security updates, with production build and privacy gates required afterward.
- Continue focused review of authenticated privileged RPCs where caller checks could materially matter; do not chase generic linter warnings blindly.
- Continue responsive/mobile/accessibility polish on legacy public surfaces that still need it.
- Browser/runtime verification when a deployable Vercel preview is available again.
- Prepare merge readiness after deployment/runtime validation and owner-controlled launch items are resolved.

## Owner-controlled / platform activation items

- Assign the first trusted Global Relationship Room moderator/admin account when desired. No normal account is auto-elevated.
- Decide later whether the Vercel build-rate-limit warrants a plan change; no cost should be incurred automatically.
- Enable Supabase leaked-password protection when the platform setting is intentionally activated.
- Schedule the available Supabase Postgres security-patch upgrade as a maintenance action rather than changing database infrastructure blindly during active development.

## Deferred by product decision

- Paid creator-slot pricing and checkout.
- Sponsorship/ad inventory.
- Sensitive-data/privacy-law-heavy concepts.
- Final creator verification thresholds and moderation appeal policy.

Deferred product decisions remain in `docs/O2OL_FEATURE_ROADMAP.md`; owner decisions remain consolidated in `docs/O2OL_APPROVAL_BATCH.md`.
