# One2OneLove database migrations

These migrations describe the new dedicated Neon PostgreSQL backend for One2OneLove.

Applied migrations are recorded in `public.app_migrations` inside the `one2onelove` Neon database.

## Rules

- Never paste a Neon connection string, database password, API secret or payment credential into this repository.
- Migrations must be safe to re-run where practical (`IF NOT EXISTS`, idempotent migration markers).
- Supabase-specific `auth.uid()`, `auth.users`, PostgREST assumptions, Storage policies and Realtime behavior must be deliberately adapted rather than copied blindly.
- User authorization is enforced at the Cloudflare Worker/API boundary during this migration.
- Existing production data must be copied only after the actual One2OneLove source Supabase project is positively identified.
