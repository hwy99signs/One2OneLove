# Quick Fix: Missing User Profile

Your account was created in Supabase Auth (that's why you can sign in), but the profile wasn't created in the `users` table.

## Quick Fix (2 options)

### Option 1: Run SQL Script (Fastest)

1. Go to your Supabase SQL Editor
2. Copy and paste this SQL:

```sql
-- Create profile for your account (replace with your email)
INSERT INTO public.users (
  id,
  email,
  name,
  user_type,
  created_at,
  updated_at
)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'name', email) as name,
  COALESCE(raw_user_meta_data->>'user_type', 'regular') as user_type,
  created_at,
  NOW()
FROM auth.users
WHERE email = 'YOUR_EMAIL_HERE'  -- Replace with your actual email
ON CONFLICT (id) DO NOTHING;
```

3. Replace `YOUR_EMAIL_HERE` with your actual email address
4. Click Run
5. Check the `users` table - you should now see your profile!

### Option 2: Use the Fix Script (For All Users)

1. Go to your Supabase SQL Editor
2. Copy and paste the contents of `supabase-fix-missing-profiles.sql`
3. Click Run
4. This will create profiles for ALL users who don't have profiles

## Verify It Worked

After running the script, check:

```sql
SELECT * FROM public.users WHERE email = 'YOUR_EMAIL_HERE';
```

You should see your profile with:
- `id` - Your user ID
- `email` - Your email
- `name` - Your name
- `user_type` - 'regular'
- `created_at` - When you signed up

## Why This Happened

The profile creation might have failed due to:
- RLS policy blocking the insert
- Network issue during signup
- Error that was caught but not shown

## Prevention

The code has been updated to:
1. Show errors if profile creation fails
2. Auto-create missing profiles when you sign in
3. Better error handling

## Next Time You Sign In

The updated code will automatically create your profile if it's missing, so this shouldn't happen again!

