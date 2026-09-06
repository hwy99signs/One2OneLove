-- One2OneLove Neon migration: Love Notes tracking and scheduled delivery queue
-- Applied to Neon project red-feather-80645172 on 2026-09-05.

CREATE TABLE IF NOT EXISTS public.sent_love_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  note_title text NOT NULL,
  note_content text NOT NULL,
  recipient_type text NOT NULL CHECK (recipient_type IN ('partner','sms','social_media','other')),
  recipient_identifier text,
  social_platform text,
  sent_date timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sent_love_notes_user_id ON public.sent_love_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_sent_love_notes_recipient_type ON public.sent_love_notes(recipient_type);
CREATE INDEX IF NOT EXISTS idx_sent_love_notes_sent_date ON public.sent_love_notes(sent_date DESC);

CREATE TABLE IF NOT EXISTS public.scheduled_love_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  note_title text NOT NULL,
  note_content text NOT NULL,
  scheduled_date date NOT NULL,
  scheduled_time time NOT NULL,
  recipient_phone text NOT NULL,
  delivery_method text NOT NULL DEFAULT 'sms'
    CHECK (delivery_method IN ('sms','email','whatsapp')),
  note_language text NOT NULL DEFAULT 'en',
  status text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','processing','sent','failed','cancelled')),
  attempts integer NOT NULL DEFAULT 0,
  last_attempt_at timestamptz,
  sent_at timestamptz,
  failure_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_love_notes_user_id ON public.scheduled_love_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_love_notes_due ON public.scheduled_love_notes(status, scheduled_date, scheduled_time);

DROP TRIGGER IF EXISTS update_scheduled_love_notes_updated_at ON public.scheduled_love_notes;
CREATE TRIGGER update_scheduled_love_notes_updated_at
BEFORE UPDATE ON public.scheduled_love_notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.app_migrations(migration_key, notes)
VALUES (
  '20260905_love_notes_core',
  'Sent and scheduled Love Notes schema created for Neon; ready for Cloudflare scheduled delivery worker'
)
ON CONFLICT (migration_key) DO NOTHING;
