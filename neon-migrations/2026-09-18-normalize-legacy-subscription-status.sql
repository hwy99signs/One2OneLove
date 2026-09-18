-- Launch normalization: paid access must be backed by a Stripe subscription.
-- Existing legacy/test rows that claim active/trial access without Stripe are made inactive.
UPDATE public.users
SET subscription_status='inactive',updated_at=now()
WHERE stripe_subscription_id IS NULL
  AND lower(COALESCE(subscription_status,'')) IN ('active','trial','trialing');
