-- One2OneLove Neon migration: extended user profile + subscription/payment tracking
-- Canonical subscription plan names remain Basis / Premiere / Exclusive.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS interests jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS love_language text,
  ADD COLUMN IF NOT EXISTS date_frequency text,
  ADD COLUMN IF NOT EXISTS communication_style text,
  ADD COLUMN IF NOT EXISTS conflict_resolution text,
  ADD COLUMN IF NOT EXISTS partner_name text,
  ADD COLUMN IF NOT EXISTS profile_completion_percentage integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profile_completed_fields integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profile_total_fields integer NOT NULL DEFAULT 14,
  ADD COLUMN IF NOT EXISTS subscription_plan text NOT NULL DEFAULT 'Basis',
  ADD COLUMN IF NOT EXISTS subscription_price numeric(10,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS subscription_start_date timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS subscription_end_date timestamptz,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS subscription_current_period_start timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_current_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS trial_end_date timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS canceled_at timestamptz;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='users_love_language_check') THEN
    ALTER TABLE public.users ADD CONSTRAINT users_love_language_check
      CHECK (love_language IS NULL OR love_language IN ('words_of_affirmation','quality_time','receiving_gifts','acts_of_service','physical_touch'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='users_profile_completion_percentage_check') THEN
    ALTER TABLE public.users ADD CONSTRAINT users_profile_completion_percentage_check
      CHECK (profile_completion_percentage BETWEEN 0 AND 100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='users_subscription_plan_check') THEN
    ALTER TABLE public.users ADD CONSTRAINT users_subscription_plan_check
      CHECK (subscription_plan IN ('Basis','Premiere','Exclusive'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='users_subscription_status_check') THEN
    ALTER TABLE public.users ADD CONSTRAINT users_subscription_status_check
      CHECK (subscription_status IN ('active','inactive','cancelled','expired','trial'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_stripe_customer_unique ON public.users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON public.users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_subscription_plan ON public.users(subscription_plan);
CREATE INDEX IF NOT EXISTS idx_users_location_search ON public.users USING gin(to_tsvector('english', coalesce(location,'')));

CREATE OR REPLACE FUNCTION public.calculate_profile_completion(p_user public.users)
RETURNS TABLE(completed_fields integer, total_fields integer, completion_percentage integer)
LANGUAGE plpgsql STABLE AS $$
DECLARE
  c integer := 0;
  t integer := 14;
BEGIN
  IF nullif(trim(p_user.name),'') IS NOT NULL THEN c:=c+1; END IF;
  IF nullif(trim(p_user.email),'') IS NOT NULL THEN c:=c+1; END IF;
  IF nullif(trim(p_user.location),'') IS NOT NULL THEN c:=c+1; END IF;
  IF nullif(trim(p_user.partner_email),'') IS NOT NULL THEN c:=c+1; END IF;
  IF p_user.anniversary_date IS NOT NULL THEN c:=c+1; END IF;
  IF nullif(trim(p_user.love_language),'') IS NOT NULL THEN c:=c+1; END IF;
  IF nullif(trim(p_user.relationship_status),'') IS NOT NULL THEN c:=c+1; END IF;
  IF nullif(trim(p_user.avatar_url),'') IS NOT NULL THEN c:=c+1; END IF;
  IF nullif(trim(p_user.date_frequency),'') IS NOT NULL THEN c:=c+1; END IF;
  IF nullif(trim(p_user.communication_style),'') IS NOT NULL THEN c:=c+1; END IF;
  IF nullif(trim(p_user.conflict_resolution),'') IS NOT NULL THEN c:=c+1; END IF;
  IF p_user.interests IS NOT NULL AND jsonb_typeof(p_user.interests)='array' AND jsonb_array_length(p_user.interests)>0 THEN c:=c+1; END IF;
  IF nullif(trim(p_user.bio),'') IS NOT NULL THEN c:=c+1; END IF;
  IF nullif(trim(p_user.partner_name),'') IS NOT NULL THEN c:=c+1; END IF;
  RETURN QUERY SELECT c, t, round((c::numeric/t::numeric)*100)::integer;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_profile_completion()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE d record;
BEGIN
  SELECT * INTO d FROM public.calculate_profile_completion(NEW);
  NEW.profile_completed_fields := d.completed_fields;
  NEW.profile_total_fields := d.total_fields;
  NEW.profile_completion_percentage := d.completion_percentage;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trigger_update_profile_completion ON public.users;
CREATE TRIGGER trigger_update_profile_completion
BEFORE INSERT OR UPDATE OF name,email,location,partner_email,anniversary_date,love_language,relationship_status,avatar_url,date_frequency,communication_style,conflict_resolution,interests,bio,partner_name
ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_profile_completion();

CREATE TABLE IF NOT EXISTS public.payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_payment_intent_id text,
  stripe_invoice_id text,
  amount numeric(10,2) NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL CHECK (status IN ('succeeded','failed','pending','refunded','canceled')),
  subscription_plan text NOT NULL CHECK (subscription_plan IN ('Basis','Premiere','Exclusive')),
  payment_method text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payment_history_user_created ON public.payment_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON public.payment_history(status);
DROP TRIGGER IF EXISTS update_payment_history_updated_at ON public.payment_history;
CREATE TRIGGER update_payment_history_updated_at BEFORE UPDATE ON public.payment_history
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.subscription_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  from_plan text,
  to_plan text NOT NULL,
  change_type text NOT NULL CHECK (change_type IN ('upgrade','downgrade','cancel','reactivate','migration','admin')),
  effective_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_subscription_changes_user_created ON public.subscription_changes(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.update_user_subscription(
  p_user_id uuid,
  p_subscription_plan text,
  p_subscription_status text,
  p_stripe_subscription_id text DEFAULT NULL,
  p_current_period_start timestamptz DEFAULT NULL,
  p_current_period_end timestamptz DEFAULT NULL
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF p_subscription_plan NOT IN ('Basis','Premiere','Exclusive') THEN RAISE EXCEPTION 'invalid subscription plan'; END IF;
  IF p_subscription_status NOT IN ('active','inactive','cancelled','expired','trial') THEN RAISE EXCEPTION 'invalid subscription status'; END IF;
  UPDATE public.users SET
    subscription_plan=p_subscription_plan,
    subscription_status=p_subscription_status,
    stripe_subscription_id=COALESCE(p_stripe_subscription_id,stripe_subscription_id),
    subscription_current_period_start=p_current_period_start,
    subscription_current_period_end=p_current_period_end,
    updated_at=now()
  WHERE id=p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_subscription_change(p_user_id uuid,p_from_plan text,p_to_plan text,p_change_type text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.subscription_changes(user_id,from_plan,to_plan,change_type)
  VALUES(p_user_id,p_from_plan,p_to_plan,p_change_type);
END;
$$;

CREATE OR REPLACE FUNCTION public.is_subscription_active(p_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT coalesce(subscription_status='active' AND (subscription_current_period_end IS NULL OR subscription_current_period_end>now()),false)
  FROM public.users WHERE id=p_user_id;
$$;

CREATE OR REPLACE FUNCTION public.get_subscription_details(p_user_id uuid)
RETURNS TABLE(subscription_plan text,subscription_status text,subscription_price numeric,current_period_start timestamptz,current_period_end timestamptz,cancel_at_period_end boolean,days_remaining integer)
LANGUAGE sql STABLE AS $$
  SELECT u.subscription_plan,u.subscription_status,u.subscription_price,u.subscription_current_period_start,u.subscription_current_period_end,u.cancel_at_period_end,
    CASE WHEN u.subscription_current_period_end IS NULL THEN NULL ELSE greatest(0,floor(extract(epoch from (u.subscription_current_period_end-now()))/86400)::integer) END
  FROM public.users u WHERE u.id=p_user_id;
$$;

UPDATE public.users SET subscription_plan='Basis' WHERE subscription_plan NOT IN ('Basis','Premiere','Exclusive') OR subscription_plan IS NULL;
UPDATE public.users SET subscription_status='active' WHERE subscription_status IS NULL;

INSERT INTO public.app_migrations(migration_key,notes)
VALUES ('20260905_user_profile_billing','Extended profile, completion tracking, subscription and Stripe payment state adapted for Neon/Cloudflare')
ON CONFLICT (migration_key) DO NOTHING;
