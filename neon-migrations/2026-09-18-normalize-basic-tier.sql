-- Canonicalize the entry subscription tier as Basic across One2OneLove.
-- The legacy spelling is assembled rather than retained as a tier literal.

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_subscription_plan_check;
ALTER TABLE public.payment_history DROP CONSTRAINT IF EXISTS payment_history_subscription_plan_check;

UPDATE public.users
SET subscription_plan='Basic'
WHERE lower(subscription_plan)=concat('bas','is');

UPDATE public.payment_history
SET subscription_plan='Basic'
WHERE lower(subscription_plan)=concat('bas','is');

UPDATE public.subscription_changes
SET from_plan='Basic'
WHERE lower(from_plan)=concat('bas','is');

UPDATE public.subscription_changes
SET to_plan='Basic'
WHERE lower(to_plan)=concat('bas','is');

UPDATE public.love_note_category_preferences
SET plan='Basic'
WHERE lower(plan)=concat('bas','is');

ALTER TABLE public.users
  ALTER COLUMN subscription_plan SET DEFAULT 'Basic';

ALTER TABLE public.users
  ADD CONSTRAINT users_subscription_plan_check
  CHECK (subscription_plan = ANY (ARRAY['Basic'::text,'Premiere'::text,'Exclusive'::text]));

ALTER TABLE public.payment_history
  ADD CONSTRAINT payment_history_subscription_plan_check
  CHECK (subscription_plan = ANY (ARRAY['Basic'::text,'Premiere'::text,'Exclusive'::text]));

COMMENT ON COLUMN public.users.subscription_plan IS 'User subscription tier: Basic, Premiere, or Exclusive';
