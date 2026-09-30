-- O2OL / MyMatchIQ Prelaunch: product-specific access entitlement
-- Keeps MyMatchIQ Free/Premier/Elite separate from O2OL Basic/Premiere/Exclusive.

CREATE TABLE IF NOT EXISTS public.mmiq_access_entitlements (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  tier text NOT NULL DEFAULT 'free' CHECK (tier IN ('free','premier','elite')),
  source text NOT NULL DEFAULT 'o2ol' CHECK (source IN ('o2ol','legacy_mymatchiq','admin','bundle')),
  grandfathered boolean NOT NULL DEFAULT false,
  effective_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mmiq_access_entitlements_tier
  ON public.mmiq_access_entitlements(tier);
