-- One2OneLove launch hardening: future user rows default to the paid Basic plan but remain inactive until Stripe activates membership.
ALTER TABLE public.users ALTER COLUMN subscription_price SET DEFAULT 4.99;
ALTER TABLE public.users ALTER COLUMN subscription_status SET DEFAULT 'inactive';
