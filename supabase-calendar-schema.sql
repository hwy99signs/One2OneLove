-- ============================================================================
-- CALENDAR EVENTS TABLE SCHEMA
-- ============================================================================
-- Run this in your Supabase SQL Editor to create the calendar_events table
-- ============================================================================

-- Create calendar_events table
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  event_type TEXT NOT NULL CHECK (event_type IN ('date', 'anniversary', 'milestone', 'reminder', 'appointment', 'activity', 'other')),
  location TEXT,
  notes TEXT,
  color TEXT DEFAULT 'pink',
  -- Reminder settings
  reminder_enabled BOOLEAN DEFAULT TRUE,
  reminder_days_before INTEGER DEFAULT 1,
  -- Recurring event settings
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern TEXT CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly', 'yearly')),
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can insert own calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can update own calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can delete own calendar events" ON public.calendar_events;

-- RLS Policies: Users can only access their own calendar events
CREATE POLICY "Users can view own calendar events"
  ON public.calendar_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar events"
  ON public.calendar_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar events"
  ON public.calendar_events
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar events"
  ON public.calendar_events
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS calendar_events_user_id_idx ON public.calendar_events(user_id);
CREATE INDEX IF NOT EXISTS calendar_events_event_date_idx ON public.calendar_events(event_date);
CREATE INDEX IF NOT EXISTS calendar_events_event_type_idx ON public.calendar_events(event_type);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_calendar_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on row update
DROP TRIGGER IF EXISTS update_calendar_events_updated_at_trigger ON public.calendar_events;
CREATE TRIGGER update_calendar_events_updated_at_trigger
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_events_updated_at();

-- ============================================================================
-- DONE! Calendar events table is ready to use.
-- ============================================================================

-- Verify the table was created
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'calendar_events'
ORDER BY ordinal_position;

