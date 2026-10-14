-- One2OneLove Founding Member Giveaway — 2026-10-10
-- Owner directives 2026-10-10: 1st 100 qualifying signups (username +
-- email + password credential, creation order) claim $10.00 Game Credit
-- + 2 free Love Note sends; 2nd 100 claim $5.00 Game Credit + 1 free
-- send. Claim requires email on profile + phone verified + >= $5.00
-- Credit balance. Claimed first-100 members also receive $10.00 Game
-- Credit monthly for 6 months (kind 'founding_monthly' ledger entries).
-- NO EXPIRY on founding grants (owner's settled decision).
-- The worker also lazy-ensures this schema (worker/founding-perks.ts
-- ensureFoundingSchema) following the codebase convention.

CREATE TABLE IF NOT EXISTS public.o2ol_founding_perks(
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  cohort_number integer NOT NULL UNIQUE CHECK(cohort_number BETWEEN 1 AND 200),
  tier text NOT NULL CHECK(tier IN ('first100','second100')),
  status text NOT NULL DEFAULT 'unclaimed' CHECK(status IN ('unclaimed','claimed')),
  game_credit_cents integer NOT NULL,
  free_sends_total integer NOT NULL DEFAULT 0,
  free_sends_used integer NOT NULL DEFAULT 0,
  free_sends_expire_at timestamptz,
  game_credit_ledger_id uuid,
  claimed_at timestamptz,
  monthly_stopped_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.o2ol_founding_perks ADD COLUMN IF NOT EXISTS monthly_stopped_at timestamptz;

CREATE TABLE IF NOT EXISTS public.o2ol_founding_free_send_uses(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  request_key text NOT NULL UNIQUE,
  sent_love_note_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  restored_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_o2ol_founding_uses_user ON public.o2ol_founding_free_send_uses(user_id,created_at DESC);

-- Extend the game-credit ledger kinds with the monthly founding entry
-- type (fresh installs already include it via worker/game-economy.ts).
DO $$
DECLARE c record;
BEGIN
  FOR c IN
    SELECT con.conname FROM pg_constraint con
      JOIN pg_class rel ON rel.oid=con.conrelid
      JOIN pg_namespace nsp ON nsp.oid=rel.relnamespace
     WHERE nsp.nspname='public' AND rel.relname='o2ol_game_credit_ledger' AND con.contype='c'
       AND pg_get_constraintdef(con.oid) LIKE '%signup_bonus%'
       AND pg_get_constraintdef(con.oid) NOT LIKE '%founding_monthly%'
  LOOP
    EXECUTE 'ALTER TABLE public.o2ol_game_credit_ledger DROP CONSTRAINT ' || quote_ident(c.conname);
  END LOOP;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
      JOIN pg_class rel ON rel.oid=con.conrelid
      JOIN pg_namespace nsp ON nsp.oid=rel.relnamespace
     WHERE nsp.nspname='public' AND rel.relname='o2ol_game_credit_ledger' AND con.contype='c'
       AND pg_get_constraintdef(con.oid) LIKE '%founding_monthly%'
  ) THEN
    ALTER TABLE public.o2ol_game_credit_ledger
      ADD CONSTRAINT o2ol_game_credit_ledger_kind_check
      CHECK(kind IN ('signup_bonus','admin_grant','promo_grant','founding_monthly','spend','expire'));
  END IF;
END $$;

INSERT INTO public.app_migrations(migration_key,notes)
VALUES (
  '2026-10-10-founding-giveaway',
  'Founding Member Giveaway: first-100 ($10 Game Credit + 2 free Love Note sends + $10/mo Game Credit x6) and second-100 ($5 + 1 send) cohort perks, claim requirements, free-send consumption ledger; extends game-credit ledger kinds with founding_monthly.'
)
ON CONFLICT (migration_key) DO NOTHING;
