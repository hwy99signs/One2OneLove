# Cloudflare deployment handoff

This directory contains account-agnostic Cloudflare configuration material for the One2OneLove migration.

The target production topology is:

`Browser -> Cloudflare Worker/API -> Hyperdrive -> Neon PostgreSQL`

and for media:

`Browser -> authenticated Worker route -> R2`

The existing React/Vite user interface remains the application frontend.

## Account-specific resources still required

Before renaming `wrangler.template.jsonc` into the live root Wrangler configuration, create these resources in the intended One2OneLove Cloudflare account:

1. Worker/app: `one2onelove`
2. Hyperdrive configuration connected to Neon project `red-feather-80645172`, database `one2onelove`
3. R2 bucket: `one2onelove-media`
4. Production domain route(s)
5. Worker secrets for delivery/payment providers as applicable

Then replace only the Hyperdrive placeholder ID. Never commit the Neon connection string or private service credentials.

## Scheduled Love Notes

The template includes a five-minute Cron Trigger. The future Worker `scheduled()` handler should atomically claim due rows from `public.scheduled_love_notes`, mark them `processing`, attempt delivery, and set `sent` or `failed` with retry metadata. The schedule is evaluated in UTC, so the application must normalize user-selected local times before delivery processing.

## Storage migration

Several current source files still reference Supabase Storage URLs. Those references must not simply be deleted: first identify/copy the exact approved asset or user media into R2/static assets, verify its checksum/visual identity where applicable, then update the reference. The official One2OneLove logo must never be recreated or visually altered during this migration.
