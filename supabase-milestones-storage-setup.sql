-- ============================================================================
-- MILESTONE PHOTOS STORAGE BUCKET SETUP
-- ============================================================================
-- This creates a storage bucket for milestone photos with proper RLS policies
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. CREATE STORAGE BUCKET
-- ============================================================================

-- Insert the bucket (this creates it in Supabase Storage)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'milestone-photos',
  'milestone-photos',
  true, -- Public bucket so photos can be viewed via URL
  5242880, -- 5MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. STORAGE POLICIES (Row Level Security)
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload milestone photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view milestone photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own milestone photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own milestone photos" ON storage.objects;

-- Policy: Users can upload their own milestone photos
CREATE POLICY "Users can upload milestone photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'milestone-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Anyone can view milestone photos (public bucket)
CREATE POLICY "Users can view milestone photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'milestone-photos');

-- Policy: Users can update their own milestone photos
CREATE POLICY "Users can update own milestone photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'milestone-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own milestone photos
CREATE POLICY "Users can delete own milestone photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'milestone-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================================
-- STORAGE SETUP COMPLETE!
-- ============================================================================
-- Next steps:
-- 1. Run this SQL script in Supabase SQL Editor
-- 2. Verify bucket was created: Storage → Buckets → milestone-photos
-- 3. Use the upload functions in milestonesService.js
-- ============================================================================

