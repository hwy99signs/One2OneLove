# One2OneLove — Next Approval Batch

**Created:** 2026-08-20

**Purpose:** Keep relaunch development moving without interrupting the owner for every approval. Development/staging work may continue. Items below remain blocked from production, paid-provider activation, final legal publication, secrets, billing, or other material live effects until the owner later reviews this batch.

## Standing authorization already granted

The owner has authorized low-risk security hardening to proceed without separate approval when it only adds protection and does not materially change product behavior, cost, legal obligations, or design.

Still batch/hold for approval:
- medium/high security risk;
- paid services, purchases, provider fees or meaningful new operating cost;
- legal/compliance commitments or final legal wording;
- material design/product decisions;
- production/master deployment or live Supabase mutations not previously approved;
- secret creation/rotation/replacement;
- billing activation/cutover;
- irreversible live actions.

---

## SMS / Love Notes

### #9C — Final SMS legal publication + support identity + recipient verification choice
**Type:** LEGAL / COMPLIANCE / DESIGN  
**Status:** NOT READY FOR PRODUCTION; development draft exists.

Approve final launch-market review and publication of SMS-specific Terms/Privacy language, including the actual support method/contact to be used for HELP and compliance inquiries. Final legal wording must preserve the five-language O2OL framework and must not be represented as final until reviewed.

Also approve the production method used to bind web SMS consent to the actual recipient/number. The staged public form currently includes explicit recipient self-attestation, but production consent capture must not rely on a sender being able to forge another person's checkbox submission. Candidate approaches include a provider verification/OTP flow or an authenticated/server-bound recipient flow. A paid verification product is **not** selected by the current development code.

**Current development:** recipient-controlled optional opt-in page, server-only consent capture source, signed Twilio opt-out webhook source, and legal draft are staged; existing public Terms/Privacy remain clearly marked final-review-pending.

### #9D — Twilio account, Messaging Service, webhook credentials and A2P registration
**Type:** COST / LEGAL / PROVIDER / SECRETS  
**Status:** BLOCKED FOR LATER APPROVAL.

Authorize actual Twilio account/provider setup, Messaging Service configuration, applicable U.S. A2P 10DLC registration, provider fees, and creation/storage of server-only credentials. This includes the outbound restricted API key/secret and the separate Account Auth Token required for `X-Twilio-Signature` webhook validation. If #9C selects a paid phone-verification product, its provider fees/configuration also belong here. Do not paste credentials into chat, GitHub, or browser code.

### #9E — Production SMS consent + opt-out foundation
**Type:** PRODUCTION / PRIVACY / MEDIUM SECURITY  
**Status:** STAGED, NOT LIVE.

Authorize applying the SMS compliance schema to live Supabase and deploying the recipient consent endpoint plus signed Twilio STOP/START/HELP synchronization endpoint. Consent capture must remain isolated from SMS sending until recipient verification, final legal copy and provider configuration are verified. Run RLS/grant/advisor verification and controlled consent/opt-out tests. No Love Note SMS send under this item.

### #9F — Live Love Notes SMS sending
**Type:** COST / PRODUCTION / COMPLIANCE  
**Status:** BLOCKED UNTIL #9C–#9E VERIFIED.

Authorize the live Twilio delivery path, production switches and controlled SMS send after consent, legal, A2P, credentials, opt-out handling, callback handling and cost configuration are verified. Keep rate limits and scheduled-send consent re-checks enabled.

---

## Relaunch production / deployment

### #10 — Production branch / Vercel release
**Type:** PRODUCTION DEPLOYMENT  
**Status:** NOT READY.

Authorize approved relaunch changes to move to the production branch and production Vercel release only after strict preflight and actual application compile/runtime verification. The earlier Vercel build-rate-limit failure is not proof of application compile success or failure.

**Current verification limitation (2026-08-20):** the connected Vercel account available to this build session exposes the ERANT/ICG projects but does not expose the One2OneLove Vercel team/project. No substitute project was used and no deployment was triggered. O2OL compile/deployment verification therefore remains unresolved until the correct Vercel project is available or another verified build path is used.

---

## Global Relationship Room programming

### #11 — Creator programming calendar database
**Type:** PRODUCTION DATA MODEL / PRODUCT  
**Status:** STAGED.

Apply the approved 24-hour creator programming calendar foundation, including the initial free creator limit of up to two slots per day and open-slot/replay rules. Paid slot sales remain excluded.

### #12 — Creator programming Edge Functions
**Type:** PRODUCTION SERVER ACTIONS / SECURITY  
**Status:** STAGED; security audit advanced.

Deploy booking/list/current/manage programming server functions after final caller/authority audit. Staff/admin authority remains server UUID allowlist based and is never inferred from `users.user_type`. Current staging additionally validates administrative UUID inputs, filters malformed allowlist entries, requires HTTPS replay URLs, bounds schedule query windows, keeps paid creator bookings disabled, and preserves the two-free-slots/day database backstop.

### #13 — Creator programming frontend activation
**Type:** PRODUCT / DESIGN / PRODUCTION  
**Status:** STAGED.

Expose the creator scheduling experience once #11/#12 are verified, preserving the exact Global Relationship Room name/tagline, multilingual behavior, room disclaimers and free-slot rules.

### #14 — O2OL staff programming controls
**Type:** SECURITY / OPERATIONS / PRODUCT  
**Status:** STAGED.

Activate official O2OL programming management using server-side authorized UUID allowlists only.

### #15 — Paid creator programming slots
**Type:** COST / BILLING / PRODUCT DESIGN  
**Status:** FUTURE — intentionally separate.

Add paid creator slot sales only after pricing, refund/cancellation rules, billing treatment, creator terms and support processes are approved.

---

## Programming reminders

### #16 — Programming reminder database/API
**Type:** PRODUCTION DATA / PRODUCT  
**Status:** STAGED; security audit advanced.

Activate member reminder records and caller-bound APIs with cancellation/slot guards. Current staging validates slot UUIDs before privileged queries, keeps reminder ownership bound to the authenticated caller, and prevents re-arming already-processing/sent reminders.

### #17 — Reminder dispatcher
**Type:** PRODUCTION AUTOMATION  
**Status:** STAGED.

Activate server-side reminder dispatch only after duplicate prevention, cancellation behavior and schedule handling are verified. Current design is in-app only, uses a dispatch secret, claims reminders before work, recovers stale claims, and relies on unique `reminder_id` notification rows to prevent duplicate delivery.

### #18 — External reminder channels
**Type:** COST / PROVIDER / COMPLIANCE  
**Status:** FUTURE.

Authorize paid/external email/SMS/push reminder delivery providers and their associated consent, cost and unsubscribe requirements.

---

## Member safety / moderation / support

### #19 — Member blocking production activation + accepted-connection behavior
**Type:** PRIVACY / SAFETY / PRODUCTION / PRODUCT DESIGN  
**Status:** STAGED; production disabled pending the product decision below.

The staged security model now enforces blocked-pair privacy at the database source rather than relying only on UI filtering. It covers the privacy-safe member directory source, presence source, Live Room messages/reactions, pairwise conversations/messages, the current `buddy_requests` model, reviewed legacy connection/request models, and defense-in-depth member discovery. Pending buddy/connection requests are removed when a block is created. Privileged helpers use the established non-exposed `o2ol_private` schema with fixed search paths.

**One explicit product decision remains required before activation:** what should happen to an already **accepted** connection when either member blocks the other?

- **Option A — Permanently sever the accepted connection.** Blocking ends/deletes the accepted connection. Unblocking does not restore it; the two members must intentionally reconnect. Stronger safety expectation, but destructive and requires clear confirmation copy.
- **Option B — Preserve but suppress while blocked.** Keep the accepted connection row inaccessible while either side blocks the other. If the block is removed, the old accepted connection becomes available again. Non-destructive, but the restored connection could surprise users.

Current staging does **not** silently finalize either option. The RLS layer suppresses blocked access for safety, while accepted rows are not deleted until the owner approves Option A or Option B and the block-confirmation UX reflects that choice.

Production activation must include controlled two-account tests for: mutual directory disappearance, mutual presence hiding, Live Room message/reaction hiding, chat/request denial, pending-request cleanup, unrelated-member isolation, unblock behavior, and no block-list enumeration.

### #20 — Programming moderation production activation
**Type:** MODERATION / SECURITY / PRODUCT  
**Status:** STAGED; security audit advanced.

Activate creator-program reporting/moderation workflows and authorized staff controls after final authority/audit review. Current staging keeps reporter identity out of the moderation payload, requires server-side UUID allowlist authority, filters malformed admin allowlist entries, validates program/report UUIDs before service-role queries, and preserves reminder cancellation when reported programming is removed.

### #21 — Private member support production activation
**Type:** PRIVACY / OPERATIONS / PRODUCTION  
**Status:** STAGED; security audit advanced.

Activate private support requests/responses, quotas, status guards and staff access after final privacy/authority verification. Current staging binds member actions to the authenticated user, validates request UUIDs before privileged queries, filters malformed staff allowlist entries, omits member UUIDs from the ordinary staff queue, and keeps quota/lifecycle/read-state trigger helpers in non-public `o2ol_private` as `SECURITY INVOKER` functions with empty search paths. Support delivery remains in-app only.

---

## Billing

### #22 — Membership billing reconciliation / cutover
**Type:** BILLING / COST / PRODUCTION / HIGH IMPACT  
**Status:** HOLD.

Reconcile legacy billing/subscription state with the relaunch membership model, run controlled Stripe tests, verify webhook/idempotency behavior, and approve production entitlement gating/cutover. Do not activate new charging behavior from this batch file alone.

---

## How to approve later

The owner may approve individually (for example, `Approve #11`) or approve a clearly named subset/batch after reviewing the then-current readiness notes. Approval must be evaluated against the current staged implementation at the time it is granted; this file is not standing authorization to perform the listed live/cost/legal actions.
