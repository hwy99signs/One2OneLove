# One2OneLove Relaunch — Legal / Policy Approval

Status: **PENDING — PRODUCTION RELEASE BLOCKER**

This file is intentionally a release gate. It is not legal advice and does not approve the current public Privacy Policy or Terms of Service.

## Why review is required

The current legacy policy pages predate the relaunch architecture and do not adequately describe or reconcile several material flows now being built, including:

- secure Love Note invitation/contact processing and recipient account claim;
- private Love Note content, saved notes and retention/deletion expectations;
- public Live Community persistence, moderation reports and limited AI Host processing;
- pairwise private Chat and private attachment storage;
- professional/therapist/influencer application intake and verification status;
- Stripe recurring membership billing and the approved introductory pricing path;
- OpenAI, Resend, Supabase, Vercel, Stripe and Cloudflare Turnstile vendor/subprocessor roles;
- member-directory visibility versus private full-profile data;
- AI Relationship Coach / AI Content Creator limitations and non-therapy positioning;
- account suspension/deletion, content moderation and data-retention rules;
- age eligibility and geographic privacy-law scope;
- transactional versus marketing communications.

## Legacy wording that must not silently ship

Before public launch, review must specifically address:

1. The legacy Terms' broad submitted-content license. Private Love Notes/private Chat should not be described in a way that implies One2OneLove publicly displays or freely reuses private member content.
2. The legacy Privacy Policy's blanket access/update/delete and cookie statements without a reconciled operational process/inventory.
3. The legacy child-age statement before the actual relaunch eligibility rule is approved.
4. The legacy `legal@one2onelove.com` contact statement until that address is verified as a monitored legal-contact channel.
5. The dated November 2025 update label.
6. Recurring billing/cancellation/refund language for the approved $1.99/month first six months then $5.99/month path, with no separate free trial.
7. AI safety language making clear that AI Host/Relationship Coach are not therapists, medical professionals, emergency responders, or substitutes for qualified help.

## Required owner/legal checkpoint

Before this file may be changed to `Status: APPROVED`, the final production Privacy Policy and Terms of Service should be reviewed for the actual launch markets and operating entity, and the following business facts must be confirmed:

- legal/operator name and mailing/contact information to publish;
- age eligibility;
- launch countries/regions;
- data-retention/deletion approach;
- refund/cancellation rules;
- verified legal/privacy/support contact channels;
- moderation/account-enforcement rules;
- whether pairwise attachments and each premium AI/couple feature are included in first public release.

## Build rule

`scripts/relaunch-legal-readiness-check.mjs` must fail in strict/production preflight while this status remains PENDING. Development previews may continue in advisory mode so the application can keep being built.

Changing this status is an owner/legal-review action, not a routine development edit.
