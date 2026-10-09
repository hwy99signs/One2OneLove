-- Production finalization for the approved One2OneLove dollar Credit model.
-- Applied after the Oct 3, Oct 4, Oct 7 and Oct 9 additive release migrations.
-- Internal o2ol_token_* names remain for backwards-compatible storage/API contracts.

ALTER TABLE public.users ALTER COLUMN subscription_status SET DEFAULT 'inactive';

-- Calibration-only packages stay in history but cannot be purchased in production.
UPDATE public.o2ol_token_packages
   SET active=false, updated_at=now()
 WHERE code IN ('starter','value','best_value');

-- Auto-Replenish defaults to a real dollar Credit package.
ALTER TABLE public.o2ol_auto_replenish_settings
  ALTER COLUMN package_code SET DEFAULT 'credit_10';

UPDATE public.o2ol_auto_replenish_settings
   SET package_code='credit_10', updated_at=now()
 WHERE package_code IN ('starter','value','best_value');

INSERT INTO public.app_migrations(migration_key,notes)
VALUES (
  '2026-10-09-o2ol-production-credit-18plus-promotion',
  'Production promotion: Free account defaults, unified dollar Credit ledger, Credit packages, content unlocks, visitor identity stitching, and retired legacy calibration packages.'
)
ON CONFLICT (migration_key) DO NOTHING;
