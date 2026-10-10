-- Bianca / Amora member-selected reply lengths.
-- Existing *_response rows remain as 10-cent Medium aliases for backward compatibility.
INSERT INTO public.o2ol_token_feature_prices
  (feature_code,label,token_cost,pricing_unit,active,calibration_only)
VALUES
  ('bianca_response_short','Bianca short reply',5,'response',true,false),
  ('bianca_response_medium','Bianca medium reply',10,'response',true,false),
  ('bianca_response_long','Bianca long reply',20,'response',true,false),
  ('amora_response_short','Amora short reply',5,'response',true,false),
  ('amora_response_medium','Amora medium reply',10,'response',true,false),
  ('amora_response_long','Amora long reply',20,'response',true,false)
ON CONFLICT(feature_code) DO UPDATE SET
  label=EXCLUDED.label,
  token_cost=EXCLUDED.token_cost,
  pricing_unit=EXCLUDED.pricing_unit,
  active=true,
  calibration_only=false;
