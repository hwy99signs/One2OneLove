-- One2OneLove Neon migration: timezone-safe scheduled Love Notes.
-- Existing rows default to UTC; new clients should send the browser's IANA timezone.

ALTER TABLE public.scheduled_love_notes
  ADD COLUMN IF NOT EXISTS scheduled_timezone text NOT NULL DEFAULT 'UTC';

CREATE INDEX IF NOT EXISTS idx_scheduled_love_notes_due_timezone
  ON public.scheduled_love_notes(status, scheduled_date, scheduled_time, scheduled_timezone);

CREATE OR REPLACE VIEW public.due_scheduled_love_notes AS
SELECT *
FROM public.scheduled_love_notes
WHERE status = 'scheduled'
  AND ((scheduled_date + scheduled_time) AT TIME ZONE scheduled_timezone) <= now();

INSERT INTO public.app_migrations(migration_key, notes)
VALUES ('20260905_love_notes_timezone', 'Adds IANA timezone handling for safe scheduled Love Notes processing')
ON CONFLICT (migration_key) DO NOTHING;
