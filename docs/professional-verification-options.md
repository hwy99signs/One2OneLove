# Professional / Therapist / Influencer Verification — Launch Decision

This document records a product/security decision for the One2OneLove relaunch. It does not activate any provider, incur any cost, or change production.

## Current development finding

The legacy Therapist, Influencer, and Professional signup pages contain placeholder verification logic that displays and accepts the hard-coded code `123456` for both email and phone verification.

That logic is useful only as an old prototype. It must not be presented as real verification in a public launch.

The rebuilt AuthContext now treats Supabase Auth as the source of truth for account email confirmation, so a hard-coded UI flag can no longer create an authenticated, email-unconfirmed One2OneLove session. However, the legacy application pages can still mark their own application fields as “verified,” including phone verification, using the placeholder code. That remains a product-integrity problem.

## Option A — Keep these application routes out of the initial launch

Recommended for the lean beta if therapists/influencers/professionals are not required on day one.

- Hide or disable links into the three application routes for the public beta.
- Keep the code on the development branch while the consumer/community product is tested.
- Reopen the routes only after real verification and application review are ready.

Advantages:
- fastest and lowest-cost launch path;
- no fake verification is exposed;
- keeps beta attention on Live Community, Love Notes, and relationship tools.

Tradeoff:
- professional marketplace/application growth starts later.

## Option B — Use real email confirmation now; defer phone verification

This is the simplest path if applications must be visible during beta.

- Supabase Auth email confirmation is already the account-level email verification source of truth.
- Remove the separate hard-coded email-code UI.
- Do not label a phone number as verified.
- Treat phone as optional/unverified contact information until a real phone verification provider is connected.
- Application review can still be manual.

Advantages:
- no new SMS verification cost;
- truthful verification language;
- applications can open earlier.

Tradeoff:
- phone ownership is not verified.

## Option C — Real email + real phone verification

Use only when phone verification is a genuine launch requirement.

- Supabase Auth handles email confirmation.
- Add a real phone OTP flow through an approved provider/service.
- Apply rate limits, expiration, retry controls, abuse prevention, and provider-cost monitoring.
- Never expose verification codes in browser source or UI helper text.

Advantages:
- strongest verification signal of the three options.

Tradeoffs:
- provider cost and operational complexity;
- phone/SMS compliance and abuse controls;
- additional launch testing.

## Recommended beta direction

Use **Option A** if professional applications are not central to the first beta. If those applications must be open, use **Option B**: real Supabase email confirmation and explicitly unverified phone contact information.

Do not use the legacy `123456` flow in any public environment.

## Work that can proceed before the decision

- Keep the relaunch safety check failing while the mock verification remains in reachable launch code.
- Continue consumer/community development independently.
- Do not purchase or activate an SMS/OTP provider without owner approval.
- Do not rewrite these application flows silently because removing/deferring phone verification changes the public application requirements and should be an owner decision.
