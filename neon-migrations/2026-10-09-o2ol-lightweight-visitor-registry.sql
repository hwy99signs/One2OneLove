-- O2OL lightweight Registered Free identity + visitor stitching.
-- Additive and idempotent. Prelaunch first, production only through approved promotion.

CREATE TABLE IF NOT EXISTS public.interaction_events (
  id bigserial PRIMARY KEY,
  user_id uuid,
  visitor_id text NOT NULL,
  session_id text NOT NULL,
  actor_type text NOT NULL CHECK (actor_type IN ('anonymous','registered')),
  access_type text NOT NULL CHECK (access_type IN ('open_house','registered_free','subscribed')),
  subscription_plan text,
  subscription_status text,
  event_type text NOT NULL CHECK (event_type IN ('click','page_view','action')),
  route text NOT NULL,
  feature text,
  control_type text,
  control_key text,
  destination text,
  created_at timestamptz NOT NULL DEFAULT now(),
  language text,
  traffic_source text
);
CREATE INDEX IF NOT EXISTS interaction_events_created_at_idx ON public.interaction_events(created_at DESC);
CREATE INDEX IF NOT EXISTS interaction_events_route_idx ON public.interaction_events(route,created_at DESC);
CREATE INDEX IF NOT EXISTS interaction_events_user_idx ON public.interaction_events(user_id,created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS interaction_events_visitor_idx ON public.interaction_events(visitor_id,created_at DESC);
CREATE INDEX IF NOT EXISTS interaction_events_language_idx ON public.interaction_events(language,created_at DESC);
CREATE INDEX IF NOT EXISTS interaction_events_traffic_source_idx ON public.interaction_events(traffic_source,created_at DESC);


ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS marketing_email_opt_in boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_email_opt_in_at timestamptz,
  ADD COLUMN IF NOT EXISTS signup_visitor_id text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_o2ol_users_username_lower_unique
  ON public.users (lower(username))
  WHERE username IS NOT NULL AND btrim(username) <> '';

CREATE INDEX IF NOT EXISTS idx_o2ol_users_signup_visitor
  ON public.users (signup_visitor_id)
  WHERE signup_visitor_id IS NOT NULL;

ALTER TABLE public.signup_consents
  ADD COLUMN IF NOT EXISTS marketing_email_opt_in boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_email_opt_in_at timestamptz;

CREATE TABLE IF NOT EXISTS public.visitor_identity_links (
  visitor_id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  link_source text NOT NULL DEFAULT 'interactive_signup',
  linked_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_visitor_identity_links_user
  ON public.visitor_identity_links (user_id, linked_at DESC);

INSERT INTO public.app_migrations(migration_key,notes)
VALUES (
  '2026-10-09-o2ol-lightweight-visitor-registry',
  'Adds username, promotional-email consent, visitor-to-member identity stitching and Admin visitor-registry support.'
)
ON CONFLICT (migration_key) DO NOTHING;
