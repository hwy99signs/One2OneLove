# One2OneLove — Neon + Cloudflare Migration

Status date: 2026-09-05

## Locked migration rule

Preserve the existing One2OneLove product, approved branding, exact approved logo assets, O2OL + Amora identities, content libraries, five-language framework, and current user-facing screens. This is an infrastructure migration, not a redesign or rebuild.

## Target stack

- Frontend: existing React + Vite app
- Runtime/API: Cloudflare Workers using the Cloudflare Vite plugin
- Database: dedicated Neon PostgreSQL project
- Authentication: Neon Auth (Better Auth)
- Database access from Cloudflare: Hyperdrive preferred
- File/media storage: Cloudflare R2
- Scheduled Love Notes: Cloudflare Worker scheduled handler / Cron Trigger
- Realtime chat/presence: migrate away from Supabase Realtime to a Cloudflare-compatible realtime layer before cutover
- Payments: preserve Stripe behavior; move Supabase Edge Function responsibilities to authenticated Worker API routes

## Dedicated Neon resources

- Neon project name: `One2OneLove`
- Neon project ID: `red-feather-80645172`
- Database: `one2onelove`
- Default Neon branch: `main`
- Neon branch ID: `br-long-moon-aram55co`
- PostgreSQL: 18
- Neon Auth provider: Better Auth
- Auth schema: `neon_auth`

No database passwords, connection strings, Stripe secrets, SMS credentials, or Cloudflare credentials belong in this repository.

## GitHub migration branch

`migration/neon-cloudflare-one2onelove-20260905`

`master` remains the protected current-code baseline until migration testing and cutover are complete.

## Completed

- [x] Created isolated One2OneLove Neon project
- [x] Enabled Neon Auth using Better Auth
- [x] Created Neon-compatible `public.users` profile table linked to `neon_auth."user"`
- [x] Migrated therapist profile schema
- [x] Migrated influencer profile schema
- [x] Migrated professional profile schema
- [x] Created Love Notes sent-note tracking schema
- [x] Created Love Notes scheduled-delivery queue schema
- [x] Added migration ledger table
- [x] Created isolated GitHub migration branch
- [x] Confirmed the existing app is heavily coupled to Supabase and requires compatibility-first replacement rather than a blind database swap

## In progress / next

- [ ] Inventory and migrate remaining application tables: chat, messages, message status, community, calendar, goals, milestones, journals, friends/buddy, presence, notifications, subscriptions and related tables
- [ ] Replace direct browser-side Supabase table access with authenticated Worker API routes
- [ ] Replace Supabase Auth usage in `AuthContext` with Neon Auth
- [ ] Create Cloudflare Vite/Worker deployment configuration
- [ ] Create Hyperdrive binding to the dedicated Neon database
- [ ] Create R2 buckets/bindings for approved logo, avatars, profile photos and user media
- [ ] Replace Supabase Storage URLs without changing the underlying approved artwork
- [ ] Implement scheduled Love Note delivery worker and delivery provider integration
- [ ] Implement realtime chat/presence replacement
- [ ] Move Stripe checkout/webhook endpoints from Supabase Edge Functions to Cloudflare Workers
- [ ] Perform five-language QA for all migrated user-facing functions
- [ ] Run mobile and signed-in end-to-end QA
- [ ] Cut over production only after data and behavior parity are verified

## Current external blockers

### Source Supabase production data

The currently connected Supabase organization does not expose an identifiable One2OneLove project. Therefore schema/code migration can proceed, but existing production auth users, database rows, and Storage objects cannot be copied until the actual source Supabase project/account is identified.

Do **not** delete, disable, or overwrite any unknown legacy Supabase resource during this period.

### Cloudflare account resources

The current ChatGPT tool connections do not expose a Cloudflare account-management connector. Repository configuration can be prepared, but account-specific resources such as the Worker, Hyperdrive configuration, R2 bucket, DNS routes and production secrets require Cloudflare account access before they can be created and bound.

## Cutover gates

Do not point the production One2OneLove domain to the new stack until all of the following pass:

1. Existing production data is identified and migrated.
2. Signup/login/session recovery work with Neon Auth.
3. Profile and partner/couple flows work.
4. Love Notes browse/send/schedule/cancel/delivery work end to end.
5. Chat and community work with correct authorization.
6. Media uploads and exact approved logo/assets work through R2/static assets.
7. Stripe checkout, webhook handling and entitlements work.
8. Five-language behavior is preserved.
9. Mobile UX passes on iPhone, Android and mobile browser.
10. Security/authorization tests pass.
11. Rollback procedure is confirmed.

## Architecture principle

The browser must not receive a Neon database connection string. The React app talks to authenticated Cloudflare Worker endpoints; the Worker talks to Neon via Hyperdrive. Cloudflare bindings should be used for R2 and other Cloudflare resources so secrets are not exposed to the frontend.
