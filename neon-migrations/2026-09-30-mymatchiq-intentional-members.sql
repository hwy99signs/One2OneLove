-- O2OL / MyMatchIQ Prelaunch: intentional-member safety and consent controls
-- Apply to isolated Prelaunch Neon branch first. No production schema change is performed here.

CREATE TABLE IF NOT EXISTS public.mmiq_member_profiles (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  display_name text,
  bio text,
  discoverable boolean NOT NULL DEFAULT false,
  allow_invitations boolean NOT NULL DEFAULT false,
  show_profile_photo boolean NOT NULL DEFAULT true,
  interests jsonb NOT NULL DEFAULT '[]'::jsonb,
  relationship_intent text,
  profile_complete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mmiq_member_blocks (
  blocker_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  blocked_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(blocker_user_id, blocked_user_id),
  CHECK (blocker_user_id <> blocked_user_id)
);

CREATE TABLE IF NOT EXISTS public.mmiq_member_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reported_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('harassment','spam','impersonation','unsafe_behavior','inappropriate_content','other')),
  details text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewing','resolved','dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  CHECK (reporter_user_id <> reported_user_id)
);

CREATE INDEX IF NOT EXISTS idx_mmiq_member_reports_reported_created
  ON public.mmiq_member_reports(reported_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.mmiq_member_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  invitation_type text NOT NULL DEFAULT 'like_minded' CHECK (invitation_type IN ('like_minded','compatibility_scan')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','cancelled','expired')),
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  CHECK (from_user_id <> to_user_id)
);

CREATE INDEX IF NOT EXISTS idx_mmiq_member_invitations_recipient_status
  ON public.mmiq_member_invitations(to_user_id, status, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mmiq_member_invitations_one_pending
  ON public.mmiq_member_invitations(from_user_id,to_user_id,invitation_type)
  WHERE status='pending';
