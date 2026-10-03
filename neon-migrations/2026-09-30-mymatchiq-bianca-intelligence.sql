-- O2OL / MyMatchIQ Prelaunch: Bianca conversation intelligence foundation
-- Applied first to Neon branch o2ol-prelaunch-bianca-20260930. Production is intentionally untouched.

ALTER TABLE public.ai_coach_conversations
  ADD COLUMN IF NOT EXISTS product text NOT NULL DEFAULT 'o2ol',
  ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'coach',
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_ai_coach_conversations_product_user_updated
  ON public.ai_coach_conversations(product,user_id,updated_at DESC);

CREATE TABLE IF NOT EXISTS public.mmiq_bianca_profiles (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  interaction_count integer NOT NULL DEFAULT 0 CHECK (interaction_count >= 0),
  conversation_count integer NOT NULL DEFAULT 0 CHECK (conversation_count >= 0),
  phrase_counts jsonb NOT NULL DEFAULT '{}'::jsonb,
  common_phrases jsonb NOT NULL DEFAULT '[]'::jsonb,
  style_summary text,
  context_depth_score integer NOT NULL DEFAULT 0 CHECK (context_depth_score BETWEEN 0 AND 100),
  last_interaction_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mmiq_assessment_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assessment_version text NOT NULL DEFAULT '2026.1',
  language text NOT NULL DEFAULT 'en',
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed','abandoned')),
  question_count integer NOT NULL DEFAULT 0 CHECK (question_count >= 0),
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  dimension_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mmiq_assessment_sessions_user_updated
  ON public.mmiq_assessment_sessions(user_id,updated_at DESC);

CREATE TABLE IF NOT EXISTS public.mmiq_personality_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assessment_session_id uuid REFERENCES public.mmiq_assessment_sessions(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'bianca',
  report_version text NOT NULL DEFAULT '2026.1',
  language text NOT NULL DEFAULT 'en',
  summary text NOT NULL,
  strengths jsonb NOT NULL DEFAULT '[]'::jsonb,
  growth_areas jsonb NOT NULL DEFAULT '[]'::jsonb,
  dimensions jsonb NOT NULL DEFAULT '{}'::jsonb,
  evidence_count integer NOT NULL DEFAULT 0 CHECK (evidence_count >= 0),
  context_depth_score integer NOT NULL DEFAULT 0 CHECK (context_depth_score BETWEEN 0 AND 100),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mmiq_personality_reports_user_created
  ON public.mmiq_personality_reports(user_id,created_at DESC);
