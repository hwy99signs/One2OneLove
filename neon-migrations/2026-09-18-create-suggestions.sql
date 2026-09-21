-- One2OneLove public Suggestions form storage.
-- Idempotent so launch/prelaunch migration steps can safely re-run after partial completion.
CREATE TABLE IF NOT EXISTS public.suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NULL,
  email text NULL,
  suggestion_type text NOT NULL CHECK (suggestion_type IN ('feature','improvement','bug','other')),
  suggestion text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewing','planned','closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS suggestions_created_at_idx ON public.suggestions (created_at DESC);
CREATE INDEX IF NOT EXISTS suggestions_status_created_at_idx ON public.suggestions (status, created_at DESC);
