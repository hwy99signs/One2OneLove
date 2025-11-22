# Profile Picture & Profile Update Setup

This guide explains how to set up profile picture uploads and profile updates for users.

## Prerequisites

1. Supabase project is set up
2. Database tables are created (run `supabase-complete-schema.sql`)
3. User authentication is working

## Setup Steps

### 1. Create Storage Bucket

Run `supabase-storage-profile-pictures.sql` in your Supabase SQL Editor to:
- Create the `profile-pictures` storage bucket
- Set up RLS policies for secure uploads
- Configure file size limits (5MB) and allowed MIME types

### 2. Add Profile Fields

Run `supabase-add-profile-fields.sql` in your Supabase SQL Editor to add:
- `location` - User's location
- `love_language` - User's love language preference

### 3. Verify Setup

After running the SQL scripts, verify:

```sql
-- Check storage bucket exists
SELECT * FROM storage.buckets WHERE id = 'profile-pictures';

-- Check profile fields exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND column_name IN ('location', 'love_language', 'avatar_url');
```

## How It Works

### Profile Picture Upload

1. User clicks the camera icon on their profile
2. Selects an image file (max 5MB, images only)
3. Image is uploaded to `profile-pictures/{user_id}/profile.{ext}`
4. Old profile picture is automatically deleted
5. User's `avatar_url` in the database is updated
6. Profile page refreshes to show new image

### Profile Update

1. User clicks "Edit Profile"
2. Updates fields:
   - Location
   - Relationship Status
   - Partner Email
   - Anniversary Date
   - Love Language
3. Clicks "Save Changes"
4. Profile is updated in the `users` table
5. Success message is shown

## File Structure

```
profile-pictures/
  └── {user_id}/
      └── profile.jpg  (or .png, .webp, etc.)
```

## Security

- **RLS Policies**: Only authenticated users can upload/update/delete their own profile pictures
- **Public Read**: Anyone can view profile pictures (for displaying in chat, etc.)
- **File Validation**: 
  - Only image files allowed
  - Max file size: 5MB
  - Allowed types: JPEG, PNG, WebP, GIF

## API Functions

### `uploadProfilePicture(file, userId)`
Uploads a profile picture and returns the public URL.

### `updateUserProfile(userId, updates)`
Updates user profile fields in the database.

### `getUserProfile(userId)`
Fetches user profile data.

### `deleteProfilePicture(userId)`
Deletes user's profile picture from storage.

## Testing

1. Sign in to your account
2. Go to Profile page
3. Click the camera icon on your avatar
4. Select an image
5. Wait for upload to complete
6. Verify the image appears on your profile
7. Click "Edit Profile"
8. Update some fields
9. Click "Save Changes"
10. Verify updates are saved

## Troubleshooting

### Image not uploading
- Check browser console for errors
- Verify storage bucket exists: `SELECT * FROM storage.buckets WHERE id = 'profile-pictures';`
- Check RLS policies are set up correctly
- Verify user is authenticated

### Profile updates not saving
- Check browser console for errors
- Verify user has permission to update their profile
- Check RLS policy: `SELECT * FROM pg_policies WHERE tablename = 'users';`
- Verify columns exist in the database

### Image not displaying
- Check `avatar_url` is set in the database
- Verify the URL is accessible (public bucket)
- Check browser network tab for 404 errors

## Next Steps

- Add image cropping/resizing before upload
- Add progress indicator for uploads
- Add ability to delete profile picture
- Add profile picture to chat avatars
- Add profile picture to user cards in Find Buddies

