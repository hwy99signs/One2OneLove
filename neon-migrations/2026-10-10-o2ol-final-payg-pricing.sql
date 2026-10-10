-- Owner-approved final One2OneLove pay-as-you-go pricing.
-- No subscription-based feature access. Wallet unit is one US cent of Credit.
-- Love Note SMS delivery remains region-priced by worker/credit-config.ts.

INSERT INTO public.o2ol_token_feature_prices
  (feature_code,label,token_cost,pricing_unit,active,calibration_only)
VALUES
  ('bianca_response','Bianca reply',10,'response',true,false),
  ('bianca_report','Bianca deeper report',299,'report',true,false),
  ('amora_response','Amora reply',10,'response',true,false),
  ('ai_content_generation','AI content generation',49,'action',true,false),
  ('love_note_ai','Love Note AI generation',25,'action',true,false),
  ('date_idea_unlock','Date Idea unlock',49,'item',true,false),
  ('podcast_episode_unlock','Podcast episode unlock',199,'episode',true,false),
  ('premium_content_unlock','Premium content unlock',299,'item',true,false),
  ('studio_episode_unlock','Studio episode unlock',100,'episode',true,false),
  ('like_minded_session','Like Minded session',49,'session',true,false),
  ('scratch_game_session','Scratch Game session',49,'session',true,false),
  ('premium_game_session','Premium game session',49,'session',true,false),
  ('memories_unlock','Memories & Memory Photos unlock',299,'item',true,false),
  ('journals_unlock','Journals unlock',299,'item',true,false),
  ('milestones_unlock','Milestones unlock',299,'item',true,false),
  ('goals_unlock','Goals Tracker unlock',299,'item',true,false),
  ('calendar_unlock','Calendar Events unlock',299,'item',true,false),
  ('love_language_report','Love Language detailed report',199,'report',true,false),
  ('compatibility_report','MyMatchIQ full compatibility report',299,'report',true,false),
  ('relationship_pattern_report','Relationship pattern report',299,'report',true,false),
  ('premium_report','Premium deeper report',299,'report',true,false)
ON CONFLICT(feature_code) DO UPDATE SET
  label=EXCLUDED.label,
  token_cost=EXCLUDED.token_cost,
  pricing_unit=EXCLUDED.pricing_unit,
  active=true,
  calibration_only=false;
