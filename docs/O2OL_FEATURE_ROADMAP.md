# One2OneLove (O2OL) Feature Roadmap

Updated: 2026-08-18
Branch: O2OL BUILD BRANCH

## Product rule: multilingual by default

One2OneLove already operates with a professionally translated five-language system. Every new or modified user-facing feature must integrate with that same translation framework. No new production-facing English copy may be hard-coded in a way that bypasses localization.

## Build-now priorities

### O2OL Global Relationship Room
Tagline: **One Room. Many Voices. Stronger Relationships.**

Purpose: a 24-hour relationship-focused programming room that combines One2OneLove-hosted programming, approved creator programming, replays, and future paid programming slots.

Initial creator model:
- Creators can create a free creator account.
- Creators can self-book open programming slots.
- Initial free allowance: up to 2 creator slots per day.
- Multiple creator slots and replays are allowed when schedule capacity is available.
- Paid slot sales are intentionally deferred until a later monetization phase.

Required protections:
- Permanent prominent disclaimer that programming, statements, opinions, advice, and creator views are not necessarily those of One2OneLove or ERANT.
- A shorter room-level disclaimer remains visible during programming.
- Programming workflow must support moderation, removal, scheduling controls, and creator accountability before public scale.

### O2OL official studio
The official O2OL studio is a permanent branded set. The following are locked unless the owner explicitly changes them:
- Neon O2OL heart-tree logo and tagline remain visible.
- Set design, major furniture arrangement, lighting direction, and visual identity remain consistent.
- Seasonal decor may be removable, but the core set identity does not change.
- Only on-screen talent/guests normally change.

Hosts:
- **O2OL** — written O2OL; pronounced “Ohtool.” Character: thoughtful, calm, wise, reflective, supportive.
- **AMORA** — warm, empathetic, intelligent, insightful.

### Multilingual feature plumbing
Before new public-facing modules are considered complete:
- Register all user-facing strings in the existing localization system.
- Preserve the existing five professionally translated languages.
- Ensure language switching does not break routes, dates, labels, forms, validation, or room scheduling.
- Never treat English-only completion as production completion.

## Existing O2OL platform capabilities to preserve

The current repository already contains or references relationship support features including account/authentication, community, chat, couples profiles and dashboards, Love Notes, Memory Lane, quizzes, relationship milestones, goals, meditation, communication practice, shared journals, couples calendar, activities, professional/therapist/influencer support, subscription flows, and AI-related relationship support foundations. New work must avoid regressions to those existing capabilities.

## Future roadmap — approved conceptually, not necessarily immediate build

The owner wants the full long-term feature vision preserved rather than discarded when a feature is deferred. Future items should remain documented and staged by technical, legal, privacy, operational, and monetization readiness.

### Monetization phase
- Paid Global Relationship Room creator/programming slots.
- Expanded creator account tiers and scheduling allowances.
- Featured/priority programming opportunities subject to disclosure and platform rules.
- Sponsorship and brand-safe programming inventory where appropriate.

### Advanced creator ecosystem
- Creator dashboards and schedule analytics.
- Program submission history and approval status.
- Replay library management.
- Audience engagement metrics.
- Creator reputation/quality controls.
- Moderation and appeals workflow.

### Advanced relationship ecosystem
- Deeper relationship education, guided activities, AI-assisted reflection, couples tools, community experiences, and professional-support discovery may continue to expand as previously approved.
- Features involving sensitive personal data, inference, surveillance-like behavior, or heightened privacy-law exposure must be placed far later in the roadmap and require explicit legal/privacy review before implementation.

## Architectural guardrails

1. Privacy-first defaults.
2. Consent before sensitive sharing or interaction.
3. Least-privilege access to personal data.
4. Localization as a completion requirement.
5. Clear distinction between O2OL editorial programming and third-party creator views.
6. Moderation capability precedes scale.
7. Monetization must not silently override safety or trust controls.
8. Deferred features remain in the roadmap unless explicitly rejected by the owner.

## Build workflow

Development should continue in batches without routine approval interruptions when the owner has provided standing build permission. Any decisions requiring owner approval should be accumulated in `docs/O2OL_APPROVAL_BATCH.md` for later review.
