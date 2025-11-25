-- ============================================================================
-- SHARED JOURNALS - COMPLETE DATABASE SCHEMA
-- ============================================================================
-- This creates tables for shared journal entries
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. SHARED JOURNALS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.shared_journals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Journal Entry Details
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  entry_date DATE NOT NULL,
  mood TEXT NOT NULL CHECK (mood IN (
    'happy',
    'grateful',
    'reflective',
    'excited',
    'peaceful',
    'challenged',
    'loving'
  )),
  
  -- Tags (stored as text array)
  tags TEXT[] DEFAULT '{}',
  
  -- Favorite flag
  is_favorite BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_shared_journals_user_id ON public.shared_journals(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_journals_entry_date ON public.shared_journals(entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_shared_journals_mood ON public.shared_journals(mood);
CREATE INDEX IF NOT EXISTS idx_shared_journals_is_favorite ON public.shared_journals(is_favorite);
CREATE INDEX IF NOT EXISTS idx_shared_journals_created_at ON public.shared_journals(created_at DESC);

-- ============================================================================
-- 2. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on shared_journals
ALTER TABLE public.shared_journals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own journal entries" ON public.shared_journals;
DROP POLICY IF EXISTS "Users can insert own journal entries" ON public.shared_journals;
DROP POLICY IF EXISTS "Users can update own journal entries" ON public.shared_journals;
DROP POLICY IF EXISTS "Users can delete own journal entries" ON public.shared_journals;

-- RLS Policies for shared_journals
CREATE POLICY "Users can view own journal entries" ON public.shared_journals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal entries" ON public.shared_journals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries" ON public.shared_journals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries" ON public.shared_journals
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 3. HELPER FUNCTIONS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_shared_journals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_shared_journals_updated_at ON public.shared_journals;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_shared_journals_updated_at
  BEFORE UPDATE ON public.shared_journals
  FOR EACH ROW
  EXECUTE FUNCTION update_shared_journals_updated_at();

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- Next steps:
-- 1. Run this entire SQL script in your Supabase SQL Editor
-- 2. Verify tables were created by checking the Table Editor
-- 3. Use the journalService.js file to interact with these tables
-- ============================================================================

