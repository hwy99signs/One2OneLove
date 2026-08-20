# One2OneLove Membership Billing Reconciliation

## Purpose

One2OneLove currently has two materially different billing generations that must not be blended accidentally:

1. **Live legacy production billing** — Basic / Premiere / Exclusive, matched by the current `master` client and the currently deployed live Stripe Edge Functions.
2. **Relaunch membership billing** — one server-owned `membership` SKU with the approved relaunch pricing transition and explicit browser/server payment feature switches.

This document defines the production boundary between them. It is a reconciliation plan, not an authorization to change billing.

## Current live legacy state — read-only finding

The connected live Supabase project currently exposes these Stripe-related Edge Functions:

- `create-checkout-session`
- `stripe-webhook`
- `create-billing-portal`

Their live source follows the legacy production contract. `master/src/lib/stripeService.js` also follows that legacy contract, so these functions must be treated as potentially production-relevant.

Aggregate live database checks found:

- 11 accounts represented as `Basic` / `active` in `public.users`;
- 0 rows in `public.payment_history`.

Those aggregates do not prove that Stripe has no external customers or subscriptions. Stripe-side state must be reconciled independently before any cutover.

## Relaunch membership contract

The `relaunch-homepage` billing client must retain all of the following boundaries:

- browser billing switch: `VITE_PAYMENTS_ENABLED === 'true'`;
- server billing switch: `PAYMENTS_ENABLED === 'true'`;
- one plan key: `membership`;
- browser does not choose Stripe Price IDs, price amounts, account IDs, or billing email;
- checkout calls `create-checkout-session` with only the relaunch plan key;
- portal calls the hardened `create-billing-portal-session` endpoint;
- membership reads use the privacy-safe `my_membership` projection;
- staged checkout validates approved Stripe price amount/currency/recurrence server-side;
- staged webhook accepts only the recognized `membership` / `launch_2026` metadata contract;
- old Basic/Premiere/Exclusive feature-matrix access remains disabled in the relaunch.

## Required controlled production sequence

No billing cutover is authorized until an explicit production approval covers this sequence:

1. Inventory live-site calls to the legacy checkout, webhook, and portal functions.
2. Verify live Stripe configuration names/environment and intended price IDs without exposing secret values.
3. Inspect Stripe-side customers, subscriptions, subscription schedules, and configured webhook endpoints through an approved billing reconciliation process.
4. Identify and preserve any real existing paid customer/subscription state.
5. Reconcile legacy `public.users` subscription fields with the staged `member_subscriptions` model.
6. Apply the reviewed membership database migration in a controlled batch and verify the `my_membership` projection/RLS.
7. Deploy the hardened relaunch `create-checkout-session` and `create-billing-portal-session` functions with `PAYMENTS_ENABLED=false`.
8. Deploy/test the relaunch webhook separately without replacing or repointing the existing production webhook until validation succeeds.
9. Confirm the intended Stripe livemode/testmode behavior and approved price configuration.
10. Test checkout, successful payment, failed payment, cancellation, portal access, webhook replay/idempotency, and the six-month intro-to-standard pricing transition in a controlled environment.
11. Only after explicit approval, switch production traffic/webhook configuration and enable the server/browser payment gates in the planned order.
12. Preserve a rollback path that does not orphan existing Stripe subscriptions or erase legacy subscription state.

## Actions explicitly prohibited during normal development

- Do not disable or delete the live legacy Stripe functions.
- Do not overwrite the live legacy webhook.
- Do not repoint a Stripe webhook endpoint.
- Do not create, rotate, replace, reveal, or paste Stripe secret values into chat/source.
- Do not enable `VITE_PAYMENTS_ENABLED` or server `PAYMENTS_ENABLED` in production.
- Do not substitute browser-provided price IDs, amounts, user IDs, or billing emails into the relaunch contract.
- Do not assume the absence of `payment_history` rows means there are no Stripe customers/subscriptions.

## Relaunch safety objective

The relaunch billing implementation should be deployable in a dark/off state, validated against its new membership schema and Stripe configuration, and activated only after legacy production billing has been reconciled. Existing customers must be preserved if any are discovered during the approved reconciliation.