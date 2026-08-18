# One2OneLove Relaunch — Data Flow & Privacy Review

Status: **DEVELOPMENT INVENTORY — NOT PUBLISHED LEGAL TEXT**

This document is an engineering disclosure inventory so the Privacy Policy, Terms, consent copy, and vendor agreements can be reviewed before public launch. It is not legal advice and does not itself change any public policy.

## 1. Account and profile data

- Supabase Auth stores account identity, email, authentication/session state, and email-confirmation state.
- `public.users` is treated as the private profile/account table.
- Browser-wide member discovery uses the restricted `member_directory` projection rather than full user rows.
- Public/member directory fields currently prepared for authenticated member discovery include name, avatar, bio, relationship status, user type, location, interests, and created date.
- Account email, partner email, verification state, subscription/billing state, and other private profile fields are intentionally excluded from the member directory.
- Relaunch signup is deliberately lean: name, email, password, Terms/Privacy consent; no payment information is collected during free-account creation.

## 2. Love Notes

- Sender composes a private Love Note and provides recipient contact information for the selected delivery method.
- The notification sent through a provider does **not** contain the Love Note body.
- Email delivery uses Resend when enabled. Resend receives the recipient email address, sender display identity used in the invitation copy, invitation subject/body, and secure One2OneLove reveal link.
- SMS delivery remains disabled for the relaunch unless separately approved.
- The private delivery table stores sender/recipient relationship to the invitation, recipient contact, Love Note body, delivery state, schedule data, provider identifier/failure internals, and only a SHA-256 reveal-token hash.
- Raw reveal tokens are not stored.
- Email reveal requires an authenticated, confirmed account whose email matches the invited address.
- Recipient Save is allowed only after secure reveal/claim.
- Client request IDs are used only for duplicate-send prevention and are not exposed in participant history.

## 3. Live Community and AI Host

- Realtime room presence is minimized to aggregate/pseudonymous presence data; account UUID/name/email are not broadcast as presence payload.
- Live-room messages persist in Supabase when the messaging migration is enabled.
- Reports are private moderation records and are not browser-browsable by ordinary members.
- When AI Host generation is enabled, only a small recent slice of public room message text and room/language context is sent to the OpenAI API for a short catalyst prompt.
- Member names, account IDs, emails, private messages, and private profile fields are not intentionally included in the AI Host request.
- OpenAI request storage is disabled in the prepared function (`store: false`).
- AI Host is designed as a public-room conversation catalyst, not a therapist, emergency service, or private counselor.

## 4. Pairwise Chat

- Pairwise conversation/message rows are participant-only under the staged RLS hardening.
- Sender/receiver identity is database-derived from authenticated conversation participants.
- Recipients can update receipt state only; senders can edit/delete only their own message content/state.
- Physical browser deletion of a shared conversation is being replaced by member-local archive behavior.
- **Launch blocker:** legacy file/image/voice attachment storage is not yet privacy-hardened for launch. Treat text messaging as the safe baseline until a private participant-authorized attachment flow is completed.

## 5. Professional applications

- Therapist, influencer, and professional applications are pre-membership private records.
- Submission does not create an approved account, mark email/phone/credentials verified, or grant a privileged role.
- Application records may include contact information and professional details supplied by the applicant.
- Cloudflare Turnstile is prepared as anti-abuse verification. When enabled, Cloudflare processes the Turnstile challenge/token and request context according to that provider relationship.
- Profile photos are deferred until after review so pre-membership applicant uploads are not placed in public profile storage.

## 6. Waitlist

- Current public waitlist is browser write-only: email/country can be submitted, but browser roles cannot read waitlist records.
- Legacy waitlist records are staged for backend/service-only access.
- Existing Resend secret usage must be inventoried before changing the production email key.

## 7. Membership and Stripe

- Free-account creation does not collect payment information or start paid membership.
- Stripe checkout, when eventually enabled, is server-created for the authenticated confirmed account.
- The browser cannot select arbitrary Stripe Price IDs, amounts, customer IDs, user IDs, or billing email.
- Stripe receives account billing identity and payment information directly through Stripe-hosted Checkout/Customer Portal.
- One2OneLove stores server-side Stripe customer/subscription/schedule/price identifiers and membership state in the private `member_subscriptions` table.
- Browser members see only a safe own-membership status projection without Stripe identifiers.
- Payment and subscription audit history is own-user read-only from the browser and server-written.
- Current development pricing configuration is the approved launch path: $1.99/month for six months, then $5.99/month ongoing. Payment activation remains off pending controlled testing and final membership-feature boundary approval.

## 8. Password recovery and authentication emails

- Password recovery uses Supabase Auth recovery email/session flow.
- Password changes occur through the authenticated recovery session, not a simulated frontend success state.
- Regular account sign-in and Love Note reveal require confirmed email state where specified by the relaunch flow.

## 9. Vendors/subprocessors to review before launch

Prepared/current architecture may involve:

- Supabase — authentication, database, realtime, storage, Edge Functions.
- Vercel — web hosting/deployment.
- Resend — transactional email for Love Note invitations and potentially existing waitlist email functionality.
- OpenAI — AI Host generation when explicitly enabled.
- Stripe — checkout, subscriptions, billing portal, payment processing when explicitly enabled.
- Cloudflare Turnstile — anti-abuse challenge for professional application intake when enabled.
- Any future SMS provider — **not approved/active yet**.

## 10. Public-policy / consent review required before launch

Before production release, legal/business review should confirm public-facing language for:

1. What profile fields are visible to other authenticated members.
2. Love Note contact processing, secure reveal, saved-note retention, deletion expectations, and recipient invitation/account flow.
3. Public Live Community persistence, moderation/reporting, and the limited AI Host processing of public room text.
4. Whether pairwise Chat is included in the first public release and, if so, attachment privacy once completed.
5. Professional-application retention, review, verification, rejection/deletion processes.
6. Stripe recurring billing, the introductory six-month price, the ongoing price, cancellation, refunds, and any trial decision.
7. Vendor/subprocessor disclosures and links/policies as appropriate.
8. Age eligibility, prohibited content, safety/emergency language, moderation enforcement, account suspension/deletion, and data-retention/deletion rules.
9. Marketing/transactional email distinctions and consent/unsubscribe requirements for any non-transactional messages.
10. Geographic privacy-law review based on the actual launch markets/languages before public expansion.

No public legal policy should be replaced merely because this engineering inventory exists. Publication is a separate owner/legal-review checkpoint.
