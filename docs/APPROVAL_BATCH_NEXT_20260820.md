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

### #9C — Final SMS legal publication + support identity
**Type:** LEGAL / COMPLIANCE / DESIGN  
**Status:** NOT READY FOR PRODUCTION; development draft exists.

Approve final launch-market review and publication of SMS-specific Terms/Privacy language, including the actual support method/contact to be used for HELP and compliance inquiries. Final legal wording must preserve the five-language O2OL framework and must not be represented as final until reviewed.

**Current development:** recipient-controlled optional opt-in page and legal draft are staged; existing public Terms/Privacy remain clearly marked final-review-pending.

### #9D — Twilio account, Messaging Service and A2P registration
**Type:** COST / LEGAL / PROVIDER / SECRETS  
**Status:** BLOCKED FOR LATER APPROVAL.

Authorize actual Twilio account/provider setup, Messaging Service configuration, applicable U.S. A2P 10DLC registration, provider fees, and creation/storage of server-only credentials. Do not paste credentials into chat, GitHub, or browser code.

### #9E — Production SMS consent foundation
**Type:** PRODUCTION / PRIVACY / MEDIUM SECURITY  
**Status:** STAGED, NOT LIVE.

Authorize applying the SMS compliance schema to live Supabase and deploying the recipient consent endpoint with consent capture still isolated from SMS sending. Run RLS/grant/advisor verification and a controlled consent-only test. No SMS send under this item.

### #9F — Live Love Notes SMS sending
**Type:** COST / PRODUCTION / COMPLIANCE  
**Status:** BLOCKED UNTIL #9C–#9E VERIFIED.

Authorize the live Twilio delivery path, production switches and controlled SMS send after consent, legal, A2P, credentials, opt-out handling, callback handling and cost configuration are verified. Keep rate limits and scheduled-send consent re-checks enabled.

---

## Relaunch production / deployment

### #10 — Production branch / Vercel release
**Type:** PRODUCTION DEPLOYMENT  
**Status:** NOT READY.

Authorize approved relaunch changes to move to the production branch and production Vercel release only after strict preflight and actual application compile/runtime verification. The current Vercel build-rate-limit failure is not proof of application compile success or failure.

---

## Global Relationship Room programming

### #11 — Creator programming calendar database
**Type:** PRODUCTION DATA MODEL / PRODUCT  
**Status:** STAGED.

Apply the approved 24-hour creator programming calendar foundation, including the initial free creator limit of up to two slots per day and open-slot/replay rules. Paid slot sales remain excluded.

### #12 — Creator programming Edge Functions
**Type:** PRODUCTION SERVER ACTIONS / SECURITY  
**Status:** STAGED.

Deploy booking/list/current/manage programming server functions after final caller/authority audit. Staff/admin authority must remain server UUID allowlist based and must never be inferred from `users.user_type`.

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
**Status:** STAGED.

Activate member reminder records and caller-bound APIs with existing cancellation/slot guards.

### #17 — Reminder dispatcher
**Type:** PRODUCTION AUTOMATION  
**Status:** STAGED.

Activate server-side reminder dispatch only after duplicate prevention, cancellation behavior and schedule handling are verified.

### #18 — External reminder channels
**Type:** COST / PROVIDER / COMPLIANCE  
**Status:** FUTURE.

Authorize paid/external email/SMS/push reminder delivery providers and their associated consent, cost and unsubscribe requirements.

---

## Member safety / moderation / support

### #19 — Member blocking production activation
**Type:** PRIVACY / SAFETY / PRODUCTION  
**Status:** STAGED.

Apply staged blocking enforcement across discovery, connections/chat and live-room visibility after dependency audit. Low-risk hardening may continue in development without interrupting the owner.

### #20 — Programming moderation production activation
**Type:** MODERATION / SECURITY / PRODUCT  
**Status:** STAGED.

Activate creator-program reporting/moderation workflows and authorized staff controls after final authority/audit review.

### #21 — Private member support production activation
**Type:** PRIVACY / OPERATIONS / PRODUCTION  
**Status:** STAGED.

Activate private support requests/responses, quotas, status guards and staff access after final privacy/authority verification.

---

## Billing

### #22 — Membership billing reconciliation / cutover
**Type:** BILLING / COST / PRODUCTION / HIGH IMPACT  
**Status:** HOLD.

Reconcile legacy billing/subscription state with the relaunch membership model, run controlled Stripe tests, verify webhook/idempotency behavior, and approve production entitlement gating/cutover. Do not activate new charging behavior from this batch file alone.

---

## How to approve later

The owner may approve individually (for example, `Approve #11`) or approve a clearly named subset/batch after reviewing the then-current readiness notes. Approval must be evaluated against the current staged implementation at the time it is granted; this file is not standing authorization to perform the listed live/cost/legal actions.
