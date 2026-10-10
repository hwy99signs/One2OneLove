-- Owner correction, 2026-10-10:
-- Retire the 1-cent / 2-cent calibration placeholders for every fixed-price
-- One2OneLove feature. Wallet units are US cents, so 100 = $1.00.
--
-- Explicit exclusions:
--   bianca_response, bianca_report, amora_response
--   love_note_send (regional pricing lives in worker/credit-config.ts)
--
-- Idempotent: safe to re-run after restores or migration replay.

INSERT INTO public.o2ol_token_feature_prices
  (feature_code,label,token_cost,pricing_unit,active,calibration_only)
VALUES
  ('podcast_episode_unlock','Podcast episode unlock',100,'episode',true,false),
  ('date_idea_unlock','Date Idea unlock',100,'item',true,false),
  ('premium_content_unlock','Premium content unlock',100,'item',true,false),
  ('like_minded_session','Like Minded session',100,'session',true,false),
  ('premium_game_session','Premium game session',100,'session',true,false),
  ('ai_content_generation','AI content generation',100,'action',true,false),
  ('studio_episode_unlock','Studio episode unlock',100,'episode',true,false)
ON CONFLICT(feature_code) DO UPDATE SET
  label=EXCLUDED.label,
  token_cost=EXCLUDED.token_cost,
  pricing_unit=EXCLUDED.pricing_unit,
  active=true,
  calibration_only=false,
  updated_at=now();
