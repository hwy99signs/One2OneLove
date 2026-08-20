# One2OneLove Live Drift Audit — 2026-08-20

This document records read-only verification of the connected live Supabase project while relaunch development continues on `relaunch-homepage`.

## Staged relaunch database scope

The live database was checked for the staged relaunch tables below:

- `room_messages`
- `room_message_reports`
- `creator_programming_slots`
- `programming_reminders`
- `programming_notifications`
- `programming_reports`
- `member_blocks`
- `support_requests`
- `support_request_audit`
- `privacy_requests`

### Database result

**No listed table was present in the live `public` schema at the time of this audit.**

This confirms that the currently staged Live Room messaging/moderation, creator/O2OL programming, programming reminders, programming moderation, member blocking, private member support, and privacy-request database work has not been applied to the connected live database.

## Live Edge Function inventory

A read-only Edge Function inventory found these functions active in the connected live project:

- `send-waitlist-notifications`
- `create-checkout-session`
- `stripe-webhook`
- `create-billing-portal`

The newly staged relaunch Edge Functions for Live Room programming, reminders, moderation, member blocking, privacy requests, and private member support were **not** present in the live Edge Function inventory.

## Membership billing drift finding

The three live Stripe-related functions are the **legacy production billing implementation**, not the hardened relaunch implementation currently stored on `relaunch-homepage`.

### Live legacy contract

The live `create-checkout-session` function:

- uses the old `Premiere` / `Exclusive` plan model;
- accepts the legacy browser request shape containing plan/price/account fields;
- reads legacy Stripe Price configuration;
- does not contain the relaunch `PAYMENTS_ENABLED` server switch.

The live `stripe-webhook` function:

- is the legacy webhook implementation;
- synchronizes subscription state into the older account/subscription fields;
- is not the staged relaunch `membership` / `launch_2026` webhook contract.

The live billing-portal function is named `create-billing-portal`, while the relaunch client and staged hardened backend use `create-billing-portal-session`.

### Production/master compatibility

A read-only check of `master/src/lib/stripeService.js` confirmed that the current production branch still uses the same old Basic/Premiere/Exclusive browser contract expected by the live legacy billing functions. Therefore these live functions must be treated as potentially production-relevant and **must not be disabled, overwritten, renamed, or replaced automatically**.

### Relaunch contract is deliberately incompatible and gated

The `relaunch-homepage` client uses:

- `VITE_PAYMENTS_ENABLED === 'true'` as the browser activation switch;
- a single server-owned membership key: `membership`;
- no browser-supplied Stripe Price ID, amount, user ID, or billing email;
- `create-checkout-session` with `{ planKey: 'membership' }`;
- `create-billing-portal-session` for hosted billing management;
- the private `my_membership` projection instead of exposing Stripe identifiers.

The staged relaunch `create-checkout-session` additionally requires server-side `PAYMENTS_ENABLED=true`, validates the approved launch price configuration, and writes the new `member_subscriptions` state. The staged relaunch webhook uses `membership` / `launch_2026` metadata and is explicitly marked not to replace the production webhook until the legacy Stripe usage is inventoried and an approved migration occurs.

Because the relaunch browser contract does not match the currently deployed legacy checkout contract, and the relaunch portal slug is not deployed live, the relaunch branch cannot silently reuse those legacy live endpoints as its intended membership flow. This is a safety property, **not permission to modify the live legacy functions**.

## Aggregate live billing-state snapshot

A read-only aggregate query intentionally avoided member identities.

Observed account subscription state in `public.users`:

- `Basic` / `active`: **11 accounts**

Observed `public.payment_history` state:

- total rows: **0**

These aggregates do **not** prove that no Stripe customers or subscriptions exist externally. Legacy database recording may be incomplete, and Stripe account/webhook state was not modified or assumed from these counts. Any production billing migration must preserve existing customers/subscriptions if they are found during reconciliation.

## Required billing reconciliation before relaunch payment activation

Before any relaunch payment switch is enabled or any live Stripe function is replaced:

1. Inventory whether the legacy production checkout/portal/webhook endpoints are currently called by the live site.
2. Verify the presence and intended environment of Stripe configuration/secrets and Price IDs without exposing secret values.
3. Inspect Stripe-side customer/subscription/webhook state through an approved billing reconciliation process.
4. Reconcile legacy `public.users` subscription fields with the staged `member_subscriptions` model.
5. Preserve any existing paid member/customer/subscription state discovered during reconciliation.
6. Apply the reviewed membership schema in a controlled migration batch before relying on `my_membership`.
7. Deploy the hardened relaunch checkout and portal functions with server `PAYMENTS_ENABLED=false` first.
8. Test the new webhook contract separately before replacing or repointing the existing production webhook.
9. Enable browser and server payment switches only in the explicitly approved production payment activation step.

## Operating consequence

- Keep treating the newly staged migrations and Edge Functions as development-only.
- Keep `VITE_PAYMENTS_ENABLED=false` for the relaunch until the billing reconciliation/activation batch is explicitly approved.
- Do not turn on newly staged browser or Edge Function feature switches against live production.
- Do not assume any staged UI is backed by live persistence until the relevant approval-queue batch is explicitly approved and applied in order.
- Do not modify the existing live Stripe functions merely because the relaunch code uses a newer contract.
- Repeat this read-only audit immediately before any production migration or billing cutover because live state may change after this snapshot.

## Production safety rule

This audit is observational only. It does not authorize any migration, Edge Function deployment, secret creation/change, Stripe configuration change, feature-switch activation, billing action, webhook change, or production branch promotion.
