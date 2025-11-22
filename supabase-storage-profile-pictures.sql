-- Create Storage Bucket for Profile Pictures
-- Run this in your Supabase SQL Editor

-- Create the bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-pictures',
  'profile-pictures',
  true, -- Public bucket so profile pictures can be viewed
  5242880, -- 5MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload their own profile pictures
CREATE POLICY "Users can upload own profile picture"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'profile-pictures' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to update their own profile pictures
CREATE POLICY "Users can update own profile picture"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'profile-pictures' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'profile-pictures' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to delete their own profile pictures
CREATE POLICY "Users can delete own profile picture"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'profile-pictures' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow anyone to view profile pictures (public read)
CREATE POLICY "Anyone can view profile pictures"
ON storage.objects
FOR SELECT
USING (bucket_id = 'profile-pictures');

-- Note: The folder structure will be: profile-pictures/{user_id}/{filename}
-- This ensures each user's pictures are organized by their user ID

