-- Click identity (owner rule, 2026-10-10): a signed-in member's clicks
-- carry their username into the admin feeds; "Anonymous" is only for true
-- guests. Adds a username snapshot column to public.interaction_events.
-- The ingest worker (worker/feature-usage.ts, ensureInteractionSchema)
-- applies the same additive change lazily at runtime, so this file is the
-- recorded migration and the runtime ALTER is the provisioning path —
-- the convention the codebase already uses for additive analytics schema.
-- No existing rows are touched: history keeps its stored values.

ALTER TABLE public.interaction_events
  ADD COLUMN IF NOT EXISTS username text;

INSERT INTO public.app_migrations(migration_key,notes)
VALUES (
  '2026-10-10-interaction-events-username',
  'Adds the username snapshot column to interaction_events so signed-in members'' clicks are attributed by username in the admin clicks feed.'
)
ON CONFLICT (migration_key) DO NOTHING;
