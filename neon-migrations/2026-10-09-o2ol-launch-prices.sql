-- Launch pricing (owner call, 2026-10-09): every fixed-price feature is
-- $1.00 (token_cost is in wallet cents) and live, not calibration.
-- Excluded by owner order: bianca_response, bianca_report, amora_response
-- (decided separately) and love_note_send (regional SMS pricing).
-- Mirrored by ensureLaunchPrices() in worker/o2ol-tokens.ts so production
-- applies it on the first wallet/charge touch after deploy.
INSERT INTO public.o2ol_token_feature_prices(feature_code,label,token_cost,pricing_unit,active,calibration_only)
VALUES
  ('podcast_episode_unlock','Podcast episode unlock',100,'episode',true,false),
  ('date_idea_unlock','Date Idea unlock',100,'item',true,false),
  ('premium_content_unlock','Premium content unlock',100,'item',true,false),
  ('like_minded_session','Like Minded session',100,'session',true,false),
  ('premium_game_session','Premium game session',100,'session',true,false),
  ('ai_content_generation','AI content generation',100,'action',true,false),
  ('studio_episode_unlock','Studio episode unlock',100,'episode',true,false)
ON CONFLICT(feature_code) DO UPDATE SET
  token_cost=EXCLUDED.token_cost,
  pricing_unit=EXCLUDED.pricing_unit,
  active=true,
  calibration_only=false;
