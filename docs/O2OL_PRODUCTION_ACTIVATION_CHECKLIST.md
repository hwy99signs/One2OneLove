# O2OL Production Activation Checklist

Updated: 2026-08-19
Branch: `o2ol-build-branch-2026-08-18`

This checklist contains only production actions that depend on an external owner/account decision or credential. Code and database work should continue without blocking on these items.

## 1. Vercel production deployment

- Confirm access to the Vercel team/project that owns the One2OneLove production deployment.
- Clear the current Vercel build-rate-limit condition before relying on preview/production deployments.
- Do not change to a paid Vercel plan automatically; owner approval is required for any new cost.
- Confirm the production domain and canonical site origin before final release.

## 2. Stripe paid membership activation

The secure Edge Functions are deployed in the O2OL Supabase project, but paid checkout must remain fail-closed until the Stripe account is configured.

Required Supabase Edge Function secrets/configuration:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PREMIERE`
- `STRIPE_PRICE_EXCLUSIVE`
- `SITE_URL`

Stripe account actions:

- Create/confirm recurring Stripe Prices for Premiere and Exclusive.
- Put those server-side Price IDs into the Supabase secrets above.
- Configure a Stripe webhook endpoint for the deployed `stripe-webhook` Edge Function.
- Subscribe the webhook to checkout-session, subscription, and invoice lifecycle events used by the function.
- Configure Stripe Customer Portal options for plan cancellation/change and payment-method management.
- Perform a Stripe test-mode end-to-end checkout before any live-mode activation.
- Confirm that a paid plan becomes active only after a verified Stripe webhook writes the subscription state.
- Confirm that cancellation/downgrade returns the account to Basic only through verified Stripe/server events.

## 3. Global Relationship Room activation

- Assign the first trusted Global Relationship Room moderator/admin account when the owner is ready.
- Do not auto-promote any ordinary account.
- Seed the first official O2OL programs/replays before public launch so a new 24-hour room does not appear abandoned.
- Run a moderator smoke test: creator application -> creator approval -> slot submission -> slot approval -> public schedule -> report -> cancellation request -> audit trail.

## 4. Authentication and account smoke tests

Test all five active languages (EN / ES / FR / IT / DE):

- regular signup
- sign in / sign out
- email-confirmation behavior, if enabled
- forgot password / reset password
- influencer application
- professional application
- profile loading and editing
- friend discovery / buddy request flow
- chat conversation and private attachment access

No development-only verification code or temporary-password flow is permitted.

## 5. Privacy/security production checks

- Confirm `public.users` is self-only under RLS.
- Confirm social discovery uses `public.user_directory_profiles`, not private account rows.
- Confirm chat attachment bucket remains private.
- Confirm only message participants can obtain chat attachment access.
- Confirm payment history is self-only and anonymous access is denied.
- Confirm partner moderation fields cannot be changed by the partner account.
- Confirm Global Room trusted moderator tables/RPCs remain non-public.
- Run Supabase security/performance advisors after the final production migration set.

## 6. Final launch gates

Before merging the active build branch:

- O2OL Source Verification must pass.
- O2OL Security Verification must pass.
- O2OL Social Privacy must pass.
- O2OL Build Verification must pass.
- O2OL Launch Readiness must pass.
- Production bundle must compile on Node.js 24.
- Draft PR remains unmerged until external activation items above are intentionally completed or explicitly deferred by the owner.

## Deferred by product decision

These are not launch blockers for the current core build:

- paid Global Relationship Room creator slots
- sponsorship/ad inventory
- creator verification thresholds beyond the current moderation controls
- final appeals/escalation policy
- privacy-law-heavy future relationship inference/sensitive-data features
