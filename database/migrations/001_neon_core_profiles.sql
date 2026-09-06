-- One2OneLove Neon migration: core identity and profile schema
-- Applied to Neon project red-feather-80645172 on 2026-09-05.
-- Authentication source: Neon Auth (Better Auth), schema neon_auth.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.app_migrations (
  id bigserial PRIMARY KEY,
  migration_key text UNIQUE NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now(),
  notes text
);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  user_type text NOT NULL DEFAULT 'regular'
    CHECK (user_type IN ('regular','therapist','influencer','professional')),
  relationship_status text
    CHECK (relationship_status IN ('single','dating','engaged','married','complicated')),
  anniversary_date date,
  partner_email text,
  avatar_url text,
  bio text,
  is_verified boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON public.users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_relationship_status ON public.users(relationship_status);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.therapist_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  profile_photo_url text,
  licensed_countries text[] DEFAULT '{}',
  licensed_states text[] DEFAULT '{}',
  therapy_types text[] DEFAULT '{}',
  specializations text[] DEFAULT '{}',
  certifications text[] DEFAULT '{}',
  years_experience integer,
  consultation_fee numeric(10,2),
  professional_bio text,
  license_number text,
  social_media_platforms jsonb DEFAULT '{}'::jsonb,
  email_verified boolean DEFAULT false,
  phone_verified boolean DEFAULT false,
  status text DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','suspended')),
  rejection_reason text,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_therapist_profiles_user_id ON public.therapist_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_therapist_profiles_status ON public.therapist_profiles(status);
CREATE INDEX IF NOT EXISTS idx_therapist_profiles_licensed_countries ON public.therapist_profiles USING GIN(licensed_countries);
CREATE INDEX IF NOT EXISTS idx_therapist_profiles_therapy_types ON public.therapist_profiles USING GIN(therapy_types);
CREATE INDEX IF NOT EXISTS idx_therapist_profiles_specializations ON public.therapist_profiles USING GIN(specializations);

DROP TRIGGER IF EXISTS update_therapist_profiles_updated_at ON public.therapist_profiles;
CREATE TRIGGER update_therapist_profiles_updated_at
BEFORE UPDATE ON public.therapist_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.influencer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  profile_photo_url text,
  total_follower_count integer NOT NULL,
  platform_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  content_categories text[] NOT NULL DEFAULT '{}',
  collaboration_types text[] NOT NULL DEFAULT '{}',
  bio text NOT NULL CHECK (char_length(bio) >= 100),
  media_kit_url text,
  email_verified boolean DEFAULT false,
  phone_verified boolean DEFAULT false,
  status text DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','suspended')),
  rejection_reason text,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_influencer_profiles_user_id ON public.influencer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_influencer_profiles_status ON public.influencer_profiles(status);
CREATE INDEX IF NOT EXISTS idx_influencer_profiles_content_categories ON public.influencer_profiles USING GIN(content_categories);
CREATE INDEX IF NOT EXISTS idx_influencer_profiles_collaboration_types ON public.influencer_profiles USING GIN(collaboration_types);
CREATE INDEX IF NOT EXISTS idx_influencer_profiles_platform_links ON public.influencer_profiles USING GIN(platform_links);

DROP TRIGGER IF EXISTS update_influencer_profiles_updated_at ON public.influencer_profiles;
CREATE TRIGGER update_influencer_profiles_updated_at
BEFORE UPDATE ON public.influencer_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.professional_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  profile_photo_url text,
  organization_name text NOT NULL,
  practice_type text NOT NULL,
  service_description text NOT NULL CHECK (char_length(service_description) <= 500),
  professional_bio text NOT NULL CHECK (char_length(professional_bio) BETWEEN 100 AND 1000),
  website_url text,
  email_verified boolean DEFAULT false,
  phone_verified boolean DEFAULT false,
  status text DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','suspended')),
  rejection_reason text,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_professional_profiles_user_id ON public.professional_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_professional_profiles_status ON public.professional_profiles(status);
CREATE INDEX IF NOT EXISTS idx_professional_profiles_practice_type ON public.professional_profiles(practice_type);

DROP TRIGGER IF EXISTS update_professional_profiles_updated_at ON public.professional_profiles;
CREATE TRIGGER update_professional_profiles_updated_at
BEFORE UPDATE ON public.professional_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.app_migrations(migration_key, notes)
VALUES (
  '20260905_core_profiles_neon',
  'Core identity/profile schema moved from Supabase auth.users to Neon Auth neon_auth.user'
)
ON CONFLICT (migration_key) DO NOTHING;
