-- One2OneLove legacy identity mapping for controlled Supabase -> Neon Auth migration.
-- Stores IDs only; authentication secrets/passwords are never copied into this table.

CREATE TABLE IF NOT EXISTS public.legacy_identity_map (
  legacy_user_id uuid PRIMARY KEY,
  neon_user_id uuid UNIQUE NOT NULL REFERENCES neon_auth."user"(id) ON DELETE RESTRICT,
  source_system text NOT NULL DEFAULT 'supabase',
  source_project_ref text NOT NULL,
  legacy_created_at timestamptz,
  legacy_email_confirmed boolean NOT NULL DEFAULT false,
  legacy_last_sign_in_at timestamptz,
  migrated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_legacy_identity_map_neon_user ON public.legacy_identity_map(neon_user_id);

INSERT INTO public.app_migrations(migration_key,notes)
VALUES ('20260905_legacy_identity_map','Mapping layer for preserving legacy Supabase identities while moving authentication to Neon Auth')
ON CONFLICT (migration_key) DO NOTHING;
