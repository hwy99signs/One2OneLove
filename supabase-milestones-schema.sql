-- ============================================================================
-- RELATIONSHIP MILESTONES & ANNIVERSARIES - DATABASE SCHEMA
-- ============================================================================
-- This creates a table for relationship milestones and anniversaries
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. RELATIONSHIP MILESTONES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.relationship_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Milestone Details
  title TEXT NOT NULL,
  milestone_type TEXT NOT NULL CHECK (milestone_type IN (
    'first_date',
    'first_kiss',
    'first_love',
    'moving_in',
    'engagement',
    'wedding',
    'anniversary',
    'first_vacation',
    'met_family',
    'custom'
  )),
  date DATE NOT NULL,
  description TEXT,
  location TEXT,
  
  -- Partner Information
  partner_email TEXT,
  
  -- Media
  media_urls TEXT[], -- Array of photo/video URLs
  
  -- Recurrence & Reminders
  is_recurring BOOLEAN DEFAULT FALSE, -- If true, celebrate this milestone every year
  reminder_enabled BOOLEAN DEFAULT TRUE,
  reminder_days_before INTEGER DEFAULT 7, -- Send reminder X days before
  last_reminder_sent TIMESTAMP WITH TIME ZONE,
  
  -- Celebration
  celebration_ideas TEXT[], -- Array of celebration ideas
  celebration_completed BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_relationship_milestones_user_id 
  ON public.relationship_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_relationship_milestones_date 
  ON public.relationship_milestones(date);
CREATE INDEX IF NOT EXISTS idx_relationship_milestones_type 
  ON public.relationship_milestones(milestone_type);
CREATE INDEX IF NOT EXISTS idx_relationship_milestones_recurring 
  ON public.relationship_milestones(is_recurring);
CREATE INDEX IF NOT EXISTS idx_relationship_milestones_created_at 
  ON public.relationship_milestones(created_at DESC);

-- ============================================================================
-- 2. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on relationship_milestones
ALTER TABLE public.relationship_milestones ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own milestones" ON public.relationship_milestones;
DROP POLICY IF EXISTS "Users can insert own milestones" ON public.relationship_milestones;
DROP POLICY IF EXISTS "Users can update own milestones" ON public.relationship_milestones;
DROP POLICY IF EXISTS "Users can delete own milestones" ON public.relationship_milestones;

-- RLS Policies for relationship_milestones
CREATE POLICY "Users can view own milestones" ON public.relationship_milestones
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own milestones" ON public.relationship_milestones
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own milestones" ON public.relationship_milestones
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own milestones" ON public.relationship_milestones
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 3. HELPER FUNCTIONS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_relationship_milestones_updated_at ON public.relationship_milestones;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_relationship_milestones_updated_at
  BEFORE UPDATE ON public.relationship_milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. HELPER VIEW (Optional - for easier querying with calculated fields)
-- ============================================================================

-- Create a view that adds useful computed fields
CREATE OR REPLACE VIEW public.milestones_with_next_date AS
SELECT 
  m.*,
  CASE 
    WHEN m.is_recurring THEN
      -- Calculate next occurrence for recurring milestones
      CASE 
        WHEN CURRENT_DATE <= (m.date + ((EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM m.date))::INTEGER || ' years')::INTERVAL)::DATE
        THEN (m.date + ((EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM m.date))::INTEGER || ' years')::INTERVAL)::DATE
        ELSE (m.date + ((EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM m.date) + 1)::INTEGER || ' years')::INTERVAL)::DATE
      END
    ELSE m.date
  END AS next_occurrence,
  
  -- Calculate days until next occurrence
  CASE 
    WHEN m.is_recurring THEN
      CASE 
        WHEN CURRENT_DATE <= (m.date + ((EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM m.date))::INTEGER || ' years')::INTERVAL)::DATE
        THEN (m.date + ((EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM m.date))::INTEGER || ' years')::INTERVAL)::DATE - CURRENT_DATE
        ELSE (m.date + ((EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM m.date) + 1)::INTEGER || ' years')::INTERVAL)::DATE - CURRENT_DATE
      END
    ELSE m.date - CURRENT_DATE
  END AS days_until
  
FROM public.relationship_milestones m;

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- Next steps:
-- 1. Run this entire SQL script in your Supabase SQL Editor
-- 2. Verify the table was created by checking the Table Editor
-- 3. Use the milestonesService.js file to interact with this table
-- ============================================================================
