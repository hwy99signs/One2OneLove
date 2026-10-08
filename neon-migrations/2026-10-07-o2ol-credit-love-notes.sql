-- One2OneLove Credit system for Love Note SMS (spec 2026-10-07).
-- Additive and idempotent. Prelaunch Neon branch first, per pipeline rule.
--
-- Denomination: the o2ol_token_wallets integer unit is now ONE US CENT of
-- Credit (balances display as $X.XX). Table/column names predate the Credit
-- rename and are unchanged; values are cents from this migration forward.
-- The worker also creates these tables lazily (ensureCreditSchema) so a
-- deploy never hard-fails on a not-yet-applied migration; this file is the
-- canonical record.

-- Credit purchase packages: pure dollar amounts ($5/$10/$15/$20).
-- tokens column = credit cents granted = amount_cents (no conversion rate).
INSERT INTO public.o2ol_token_packages(code,label,tokens,amount_cents,active,calibration_only,display_order) VALUES
  ('credit_5','Add $5 Credit',500,500,true,false,40),
  ('credit_10','Add $10 Credit',1000,1000,true,false,50),
  ('credit_15','Add $15 Credit',1500,1500,true,false,60),
  ('credit_20','Add $20 Credit',2000,2000,true,false,70)
ON CONFLICT(code) DO UPDATE SET
  label=EXCLUDED.label,tokens=EXCLUDED.tokens,amount_cents=EXCLUDED.amount_cents,
  active=true,calibration_only=false,display_order=EXCLUDED.display_order,updated_at=now();
-- Legacy calibration packages (starter/value/best_value) stay active and
-- calibration_only in prelaunch: Eisenhower's Pass-3 calibration harness
-- depends on them. They must be deactivated at production promotion.

-- Love Note send price is regional now (worker/credit-config.ts is the one
-- config table). The shared feature-price row remains as the US display
-- fallback; sends never read it for charging anymore.
UPDATE public.o2ol_token_feature_prices
   SET token_cost=29,
       metadata=COALESCE(metadata,'{}'::jsonb)||'{"regional_pricing":true,"config":"worker/credit-config.ts"}'::jsonb,
       updated_at=now()
 WHERE feature_code='love_note_send';

-- Auto-replenish: user-set monthly cap + explicit mandate consent timestamp.
ALTER TABLE public.o2ol_auto_replenish_settings
  ADD COLUMN IF NOT EXISTS monthly_cap_cents integer CHECK (monthly_cap_cents IS NULL OR monthly_cap_cents >= 0);
ALTER TABLE public.o2ol_auto_replenish_settings
  ADD COLUMN IF NOT EXISTS consent_at timestamptz;

-- SMS opt-outs (recipient STOP handling). One row per phone number.
CREATE TABLE IF NOT EXISTS public.o2ol_sms_optouts (
  phone_number text PRIMARY KEY,
  opted_out boolean NOT NULL DEFAULT true,
  source text NOT NULL DEFAULT 'twilio_inbound',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- First-free-send promo: one row per calendar month (UTC). The pot balance is
-- in PROVIDER-COST cents (estimated worst-case per redemption) so the $50
-- monthly cap is a hard cap on promo spend. Slots never roll over; unspent
-- pot balance rolls into the next month on top of the new $50.
CREATE TABLE IF NOT EXISTS public.o2ol_credit_promo_months (
  month_key text PRIMARY KEY,
  pot_balance_cents integer NOT NULL CHECK (pot_balance_cents >= 0),
  redemptions integer NOT NULL DEFAULT 0 CHECK (redemptions >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- One promo redemption per account and per verified phone number, EVER.
-- The unique constraints are the farming backstop (a recycled number can
-- never earn a second free send for a new account).
CREATE TABLE IF NOT EXISTS public.o2ol_credit_promo_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  phone_number text NOT NULL UNIQUE,
  month_key text NOT NULL,
  region text,
  estimated_cost_cents integer NOT NULL CHECK (estimated_cost_cents >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Audit + counting for every free Love Note send (promo and weekly).
CREATE TABLE IF NOT EXISTS public.o2ol_credit_free_note_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('promo','weekly')),
  phone_number text NOT NULL,
  region text,
  sent_love_note_id uuid,
  request_key text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_o2ol_credit_free_grants_user_kind_created
  ON public.o2ol_credit_free_note_grants(user_id,kind,created_at DESC);
-- Client retries of a send carry the same request key; a free send can never
-- be replayed into a second free send.
CREATE UNIQUE INDEX IF NOT EXISTS idx_o2ol_credit_free_grants_request_key
  ON public.o2ol_credit_free_note_grants(request_key) WHERE request_key IS NOT NULL;
