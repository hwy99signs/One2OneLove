-- O2OL Token content unlock entitlements
-- Existing locked content can be unlocked with O2OL Tokens without reintroducing subscription tiers.

-- Expand the original Token pricing-unit constraint for item-level/episode unlocks.
ALTER TABLE public.o2ol_token_feature_prices
  DROP CONSTRAINT IF EXISTS o2ol_token_feature_prices_pricing_unit_check;
ALTER TABLE public.o2ol_token_feature_prices
  ADD CONSTRAINT o2ol_token_feature_prices_pricing_unit_check
  CHECK (pricing_unit IN ('action','response','session','minute','send','report','item','episode'));

CREATE TABLE IF NOT EXISTS public.o2ol_token_content_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  feature_code text NOT NULL,
  content_key text NOT NULL,
  token_transaction_id uuid NULL,
  tokens_charged integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, feature_code, content_key)
);

CREATE INDEX IF NOT EXISTS idx_o2ol_token_content_unlocks_user_feature
  ON public.o2ol_token_content_unlocks(user_id, feature_code, unlocked_at DESC);

INSERT INTO public.o2ol_token_feature_prices
  (feature_code,label,token_cost,pricing_unit,active,calibration_only)
VALUES
  ('date_idea_unlock','Date Idea unlock',1,'item',true,true),
  ('podcast_episode_unlock','Podcast episode unlock',1,'episode',true,true),
  ('premium_content_unlock','Premium content unlock',1,'item',true,true)
ON CONFLICT(feature_code) DO NOTHING;
