-- O2OL / MyMatchIQ Prelaunch: credit wallet and auto-replenish foundation
-- Apply to isolated Prelaunch Neon branch first. No live payment charging is enabled by this migration.

CREATE TABLE IF NOT EXISTS public.mmiq_credit_wallets (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  balance integer NOT NULL DEFAULT 0 CHECK (balance >= 0),
  lifetime_purchased integer NOT NULL DEFAULT 0 CHECK (lifetime_purchased >= 0),
  lifetime_used integer NOT NULL DEFAULT 0 CHECK (lifetime_used >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mmiq_credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  wallet_delta integer NOT NULL,
  balance_after integer NOT NULL CHECK (balance_after >= 0),
  transaction_type text NOT NULL CHECK (transaction_type IN ('purchase','use','refund','auto_replenish','admin_adjustment','migration')),
  package_code text,
  amount_cents integer CHECK (amount_cents IS NULL OR amount_cents >= 0),
  provider text,
  provider_reference text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mmiq_credit_transactions_user_created
  ON public.mmiq_credit_transactions(user_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mmiq_credit_transactions_provider_reference
  ON public.mmiq_credit_transactions(provider, provider_reference)
  WHERE provider_reference IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.mmiq_auto_replenish_settings (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  package_code text NOT NULL DEFAULT 'six' CHECK (package_code IN ('single','six','twelve')),
  trigger_balance integer NOT NULL DEFAULT 0 CHECK (trigger_balance BETWEEN 0 AND 12),
  payment_method_reference text,
  last_triggered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (enabled = false OR payment_method_reference IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.mmiq_payment_events (
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
