-- Replace 1-cent/2-cent calibration placeholders with fixed customer-facing Credit prices.
-- Credit unit is USD cents: 49 = $0.49, 99 = $0.99, 199 = $1.99.
-- Variable-cost features (Bianca, Amora, Love Notes, AI generation) are intentionally excluded.

INSERT INTO public.o2ol_token_feature_prices
  (feature_code,label,token_cost,pricing_unit,active,calibration_only)
VALUES
  ('like_minded_session','Like Minded session',199,'session',true,false),
  ('premium_game_session','Premium game session',199,'session',true,false),
  ('date_idea_unlock','Date Idea unlock',49,'item',true,false),
  ('podcast_episode_unlock','Podcast episode unlock',99,'episode',true,false),
  ('premium_content_unlock','Premium content unlock',99,'item',true,false),
  ('studio_episode_unlock','Studio episode unlock',100,'episode',true,false)
ON CONFLICT(feature_code) DO UPDATE SET
  label=EXCLUDED.label,
  token_cost=EXCLUDED.token_cost,
  pricing_unit=EXCLUDED.pricing_unit,
  active=EXCLUDED.active,
  calibration_only=EXCLUDED.calibration_only,
  updated_at=now();
