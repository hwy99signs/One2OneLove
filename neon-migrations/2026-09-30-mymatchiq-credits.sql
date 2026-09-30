-- MyMatchIQ credit wallet / Auto Replenish foundation.
-- Safe default: no checkout or auto charge occurs unless MMIQ_CREDIT_BILLING_ENABLED=true is configured in the Worker environment.

CREATE SCHEMA IF NOT EXISTS mymatchiq;

CREATE TABLE IF NOT EXISTS mymatchiq.credit_wallets (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  balance integer NOT NULL DEFAULT 0 CHECK(balance>=0),
  lifetime_purchased integer NOT NULL DEFAULT 0 CHECK(lifetime_purchased>=0),
  lifetime_used integer NOT NULL DEFAULT 0 CHECK(lifetime_used>=0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mymatchiq.credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  delta integer NOT NULL CHECK(delta<>0),
  reason text NOT NULL CHECK(reason IN ('purchase','auto_replenish','insight','play','adjustment','refund','migration')),
  reference text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mymatchiq.auto_replenish_settings (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  refill_package_cents integer NOT NULL DEFAULT 999 CHECK(refill_package_cents IN (199,999,1999)),
  threshold_credits integer NOT NULL DEFAULT 1 CHECK(threshold_credits BETWEEN 0 AND 50),
  payment_method_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mymatchiq.credit_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  package_code text NOT NULL CHECK(package_code IN ('single','six','twelve')),
  amount_cents integer NOT NULL CHECK(amount_cents IN (199,999,1999)),
  credits integer NOT NULL CHECK(credits IN (1,6,12)),
  status text NOT NULL DEFAULT 'created' CHECK(status IN ('created','paid','failed','refunded')),
  stripe_payment_intent_id text,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mmiq_credit_ledger_user_created
  ON mymatchiq.credit_ledger(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mmiq_credit_purchases_user_created
  ON mymatchiq.credit_purchases(user_id,created_at DESC);
