-- One2OneLove final Free + O2OL Tokens production promotion.
-- Additive/idempotent. Apply only after:
--   2026-10-03-o2ol-token-economy.sql
--   2026-10-04-o2ol-token-content-unlocks.sql
--   2026-10-09-o2ol-lightweight-visitor-registry.sql
-- This migration intentionally does NOT apply the abandoned 2026-10-07 Credit model.

-- Auto-Replenish safety metadata. Token balances remain integer O2OL Tokens;
-- monthly_cap_cents limits actual USD card charges, not wallet units.
ALTER TABLE public.o2ol_auto_replenish_settings
  ADD COLUMN IF NOT EXISTS monthly_cap_cents integer
  CHECK (monthly_cap_cents IS NULL OR monthly_cap_cents >= 0);
ALTER TABLE public.o2ol_auto_replenish_settings
  ADD COLUMN IF NOT EXISTS consent_at timestamptz;

-- SMS STOP/opt-out safety retained independently from the abandoned Credit model.
CREATE TABLE IF NOT EXISTS public.o2ol_sms_optouts (
  phone_number text PRIMARY KEY,
  opted_out boolean NOT NULL DEFAULT true,
  source text NOT NULL DEFAULT 'twilio_inbound',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Production Token packages: exact owner-approved package values.
INSERT INTO public.o2ol_token_packages
  (code,label,tokens,amount_cents,active,calibration_only,display_order)
VALUES
  ('starter','Starter',50,499,true,false,10),
  ('value','Value',110,999,true,false,20),
  ('best_value','Best Value',250,1999,true,false,30)
ON CONFLICT(code) DO UPDATE SET
  label=EXCLUDED.label,
  tokens=EXCLUDED.tokens,
  amount_cents=EXCLUDED.amount_cents,
  active=true,
  calibration_only=false,
  display_order=EXCLUDED.display_order,
  updated_at=now();

-- Defensive retirement only: preserve any historical rows but never offer
-- abandoned Credit packages if a prior experiment ever created them.
UPDATE public.o2ol_token_packages
   SET active=false, updated_at=now()
 WHERE code LIKE 'credit#_%' ESCAPE '#';

-- Exact production Token prices. Content-unlock units are enabled by the
-- corrected 2026-10-04 migration.
INSERT INTO public.o2ol_token_feature_prices
  (feature_code,label,token_cost,pricing_unit,active,calibration_only,metadata)
VALUES
  ('bianca_response','Bianca response',1,'response',true,false,'{}'::jsonb),
  ('amora_response','Amora response',1,'response',true,false,'{}'::jsonb),
  ('bianca_report','Bianca deeper report',5,'report',true,false,'{}'::jsonb),
  ('love_note_send','Love Note send',3,'send',true,false,'{}'::jsonb),
  ('premium_game_session','Premium game session',2,'session',true,false,'{}'::jsonb),
  ('ai_content_generation','AI content generation',1,'action',true,false,'{}'::jsonb),
  ('like_minded_session','Like Minded session',2,'session',true,false,'{}'::jsonb),
  ('date_idea_unlock','Date Idea unlock',1,'item',true,false,'{}'::jsonb),
  ('podcast_episode_unlock','Podcast episode unlock',1,'episode',true,false,'{}'::jsonb),
  ('premium_content_unlock','Premium content unlock',1,'item',true,false,'{}'::jsonb)
ON CONFLICT(feature_code) DO UPDATE SET
  label=EXCLUDED.label,
  token_cost=EXCLUDED.token_cost,
  pricing_unit=EXCLUDED.pricing_unit,
  active=true,
  calibration_only=false,
  metadata=EXCLUDED.metadata,
  updated_at=now();

-- Remove abandoned Credit/regional-pricing metadata from Love Notes while
-- preserving the approved 3-Token charge.
UPDATE public.o2ol_token_feature_prices
   SET token_cost=3,
       pricing_unit='send',
       active=true,
       calibration_only=false,
       metadata='{}'::jsonb,
       updated_at=now()
 WHERE feature_code='love_note_send';

-- Existing accounts get wallet/settings rows without granting or consuming Tokens.
INSERT INTO public.o2ol_token_wallets(user_id)
SELECT id FROM public.users
ON CONFLICT(user_id) DO NOTHING;

INSERT INTO public.o2ol_auto_replenish_settings(user_id)
SELECT id FROM public.users
ON CONFLICT(user_id) DO NOTHING;

INSERT INTO public.app_migrations(migration_key,notes)
VALUES (
  '2026-10-09-o2ol-final-free-tokens-production',
  'Promotes Free + O2OL Tokens to production; exact Token packages/prices, Auto-Replenish safety, SMS opt-outs, Credit model retired.'
)
ON CONFLICT (migration_key) DO NOTHING;
