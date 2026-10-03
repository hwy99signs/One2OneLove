-- One2OneLove token economy and cost-intelligence foundation.
-- Additive and idempotent. First applied only to isolated Prelaunch Neon branch.

CREATE TABLE IF NOT EXISTS public.o2ol_token_wallets (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  balance integer NOT NULL DEFAULT 0 CHECK (balance >= 0),
  lifetime_purchased integer NOT NULL DEFAULT 0 CHECK (lifetime_purchased >= 0),
  lifetime_used integer NOT NULL DEFAULT 0 CHECK (lifetime_used >= 0),
  lifetime_granted integer NOT NULL DEFAULT 0 CHECK (lifetime_granted >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.o2ol_token_packages (
  code text PRIMARY KEY,
  label text NOT NULL,
  tokens integer NOT NULL CHECK (tokens > 0),
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  active boolean NOT NULL DEFAULT true,
  calibration_only boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.o2ol_token_packages(code,label,tokens,amount_cents,active,calibration_only,display_order) VALUES
  ('starter','Starter',50,499,true,true,10),
  ('value','Value',110,999,true,true,20),
  ('best_value','Best Value',250,1999,true,true,30)
ON CONFLICT(code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.o2ol_token_feature_prices (
  feature_code text PRIMARY KEY,
  label text NOT NULL,
  token_cost integer NOT NULL CHECK (token_cost >= 0),
  pricing_unit text NOT NULL DEFAULT 'action' CHECK (pricing_unit IN ('action','response','session','minute','send','report')),
  active boolean NOT NULL DEFAULT true,
  calibration_only boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.o2ol_token_feature_prices(feature_code,label,token_cost,pricing_unit,active,calibration_only) VALUES
  ('bianca_response','Bianca response',1,'response',true,true),
  ('amora_response','Amora response',1,'response',true,true),
  ('bianca_report','Bianca deeper report',5,'report',true,true),
  ('love_note_send','Love Note send',3,'send',true,true),
  ('premium_game_session','Premium game session',2,'session',true,true),
  ('ai_content_generation','AI content generation',1,'action',true,true),
  ('like_minded_session','Like Minded session',2,'session',true,true)
ON CONFLICT(feature_code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.o2ol_token_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  wallet_delta integer NOT NULL,
  balance_after integer NOT NULL CHECK (balance_after >= 0),
  transaction_type text NOT NULL CHECK (transaction_type IN (
    'purchase','reserve','release','refund','grant','founding_bonus','migration_credit','auto_replenish','admin_adjustment'
  )),
  feature_code text,
  package_code text,
  amount_cents integer CHECK (amount_cents IS NULL OR amount_cents >= 0),
  provider text,
  provider_reference text,
  idempotency_key text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_o2ol_token_transactions_idempotency
  ON public.o2ol_token_transactions(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_o2ol_token_transactions_user_created
  ON public.o2ol_token_transactions(user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS public.o2ol_token_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  feature_code text NOT NULL,
  tokens integer NOT NULL CHECK (tokens > 0),
  status text NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved','consumed','released')),
  idempotency_key text NOT NULL UNIQUE,
  transaction_id uuid REFERENCES public.o2ol_token_transactions(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  consumed_at timestamptz,
  released_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_o2ol_token_reservations_user_status
  ON public.o2ol_token_reservations(user_id,status,created_at DESC);

CREATE TABLE IF NOT EXISTS public.o2ol_auto_replenish_settings (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  package_code text NOT NULL DEFAULT 'value' REFERENCES public.o2ol_token_packages(code),
  trigger_balance integer NOT NULL DEFAULT 0 CHECK (trigger_balance >= 0),
  payment_method_reference text,
  last_triggered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (enabled = false OR payment_method_reference IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.o2ol_token_payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  event_id text NOT NULL,
  event_type text NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider,event_id)
);

CREATE TABLE IF NOT EXISTS public.o2ol_calibration_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  feature_code text NOT NULL,
  package_code text,
  starting_balance integer,
  ending_balance integer,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.o2ol_cost_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_key text NOT NULL DEFAULT 'one2onelove',
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  calibration_session_id uuid REFERENCES public.o2ol_calibration_sessions(id) ON DELETE SET NULL,
  feature_code text NOT NULL,
  provider text NOT NULL,
  provider_product text,
  provider_request_id text,
  wallet_transaction_id uuid REFERENCES public.o2ol_token_transactions(id) ON DELETE SET NULL,
  input_characters bigint NOT NULL DEFAULT 0 CHECK (input_characters >= 0),
  output_characters bigint NOT NULL DEFAULT 0 CHECK (output_characters >= 0),
  context_characters bigint NOT NULL DEFAULT 0 CHECK (context_characters >= 0),
  provider_input_units bigint NOT NULL DEFAULT 0 CHECK (provider_input_units >= 0),
  provider_output_units bigint NOT NULL DEFAULT 0 CHECK (provider_output_units >= 0),
  provider_cached_input_units bigint NOT NULL DEFAULT 0 CHECK (provider_cached_input_units >= 0),
  provider_cost_micros bigint CHECK (provider_cost_micros IS NULL OR provider_cost_micros >= 0),
  customer_tokens_charged integer NOT NULL DEFAULT 0 CHECK (customer_tokens_charged >= 0),
  customer_value_cents numeric(12,4),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_o2ol_cost_events_feature_created
  ON public.o2ol_cost_events(feature_code,created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_o2ol_cost_events_stripe_fee_once
  ON public.o2ol_cost_events(provider,provider_request_id,feature_code)
  WHERE provider='stripe' AND feature_code='token_purchase' AND provider_request_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.o2ol_subscription_conversion_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_subscription_id text,
  old_plan text,
  period_start timestamptz,
  period_end timestamptz,
  amount_paid_cents integer CHECK (amount_paid_cents IS NULL OR amount_paid_cents >= 0),
  unused_value_cents integer CHECK (unused_value_cents IS NULL OR unused_value_cents >= 0),
  token_value_micros integer CHECK (token_value_micros IS NULL OR token_value_micros > 0),
  proposed_tokens integer CHECK (proposed_tokens IS NULL OR proposed_tokens >= 0),
  status text NOT NULL DEFAULT 'preview' CHECK (status IN ('preview','approved','credited','cancelled')),
  calculation jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  applied_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_o2ol_conversion_one_open
  ON public.o2ol_subscription_conversion_quotes(user_id)
  WHERE status IN ('preview','approved');

CREATE TABLE IF NOT EXISTS public.o2ol_founding_token_benefits (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  monthly_tokens integer NOT NULL DEFAULT 0 CHECK (monthly_tokens >= 0),
  months_total integer NOT NULL DEFAULT 6 CHECK (months_total BETWEEN 1 AND 24),
  months_granted integer NOT NULL DEFAULT 0 CHECK (months_granted >= 0),
  next_grant_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','complete','cancelled')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);


CREATE TABLE IF NOT EXISTS public.o2ol_game_access_passes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  game text NOT NULL,
  token_transaction_id uuid REFERENCES public.o2ol_token_transactions(id) ON DELETE SET NULL,
  tokens_charged integer NOT NULL DEFAULT 0 CHECK(tokens_charged >= 0),
  status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','expired','revoked')),
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_o2ol_game_access_passes_user_game
  ON public.o2ol_game_access_passes(user_id,game,expires_at DESC);


-- Token-economy free-account defaults. Legacy tier values remain valid for migration.
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_subscription_plan_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_subscription_plan_check
  CHECK (subscription_plan = ANY (ARRAY['Free'::text,'Basic'::text,'Premiere'::text,'Exclusive'::text]));
ALTER TABLE public.users ALTER COLUMN subscription_plan SET DEFAULT 'Free';
ALTER TABLE public.users ALTER COLUMN subscription_price SET DEFAULT 0;

-- Every existing account receives an empty wallet/settings row without changing prior balances.
INSERT INTO public.o2ol_token_wallets(user_id)
SELECT id FROM public.users
ON CONFLICT(user_id) DO NOTHING;

INSERT INTO public.o2ol_auto_replenish_settings(user_id)
SELECT id FROM public.users
ON CONFLICT(user_id) DO NOTHING;
