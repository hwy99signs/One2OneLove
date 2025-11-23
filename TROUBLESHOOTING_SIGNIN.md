# Sign-In Troubleshooting Guide

## Issue: Sign-In Stuck at "Signing in..."

### Step 1: Check Browser Console

1. **Open Browser Developer Tools**:
   - Press `F12` or `Ctrl+Shift+I` (Windows/Linux)
   - Or `Cmd+Option+I` (Mac)

2. **Go to the Console Tab**

3. **Try to sign in again** and watch for error messages

4. **Look for these specific console messages**:
   - ✅ "Attempting login for: [email]" - Login started
   - ✅ "Auth successful, fetching profile for user: [user-id]" - Supabase auth worked
   - ✅ "ensureUserProfile: Starting for user: [user-id]" - Profile fetch started
   - ✅ "ensureUserProfile: Profile found successfully" - Profile loaded
   - ✅ "Login successful" - Everything worked!

### Step 2: Common Error Messages and Fixes

#### Error: "Application is not properly configured"
**Cause**: Supabase credentials missing or invalid
**Fix**: 
- Check if `.env` file exists in project root
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Restart dev server: Stop (`Ctrl+C`) and run `npm run dev`

#### Error: "Invalid login credentials" or "Invalid email or password"
**Cause**: Wrong email/password or user doesn't exist
**Fix**: 
- Verify email and password are correct
- Try signing up first if you haven't created an account
- Check if email confirmation is required

#### Error: "Row Level Security (RLS) policy"  or "Permission denied"
**Cause**: Database RLS policies preventing access
**Fix**: 
- Run the complete schema SQL in Supabase SQL Editor
- File: `supabase-complete-schema.sql`
- This will set up proper RLS policies

#### Error: "Profile not found" or PGRST116
**Cause**: User exists in auth but not in users table
**Fix**: 
- The app will automatically create the profile
- If it fails, check the console for "Error creating missing profile"
- May need to manually create user record in Supabase dashboard

#### Error: Network/Timeout
**Cause**: Can't reach Supabase or network issue
**Fix**:
- Check internet connection
- Verify Supabase project URL is correct
- Check if Supabase project is paused (free tier limitation)

### Step 3: Verify Supabase Setup

1. **Go to your Supabase Dashboard**: https://app.supabase.com
2. **Select your project**
3. **Check these things**:

#### Authentication
- Go to **Authentication** → **Users**
- Does the user you're trying to sign in with exist?
- Is the email confirmed? (look for green checkmark)

#### Database
- Go to **Database** → **Tables**
- Check if `users` table exists
- If user exists in Auth, check if they also exist in the `users` table
- If not, you may need to manually add them or let the app create the profile

#### SQL Editor
- Go to **SQL Editor**
- Run this query to check RLS policies:
```sql
SELECT * FROM pg_policies WHERE tablename = 'users';
```
- Should see policies for SELECT, UPDATE, INSERT

### Step 4: Test with a Fresh Reload

1. **Clear browser cache** or open an **Incognito/Private window**
2. **Navigate to** http://localhost:5174/signin
3. **Open console** (F12)
4. **Try signing in** and watch console messages

### Step 5: Check Database User

In Supabase SQL Editor, check if user exists:

```sql
-- Check if user exists in auth
SELECT id, email, created_at, confirmed_at 
FROM auth.users 
WHERE email = 'your-email@example.com';

-- Check if user exists in public.users table
SELECT id, email, name, user_type, created_at 
FROM public.users 
WHERE email = 'your-email@example.com';
```

If user exists in `auth.users` but NOT in `public.users`, the app should auto-create it. If this fails, manually create:

```sql
INSERT INTO public.users (id, email, name, user_type, created_at, updated_at)
SELECT id, email, COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)), 'regular', created_at, NOW()
FROM auth.users
WHERE email = 'your-email@example.com'
AND NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.users.id);
```

### Step 6: Next Steps

**What to share for help:**
1. Screenshot of browser console showing errors
2. The specific error message you see
3. Whether the user exists in Supabase Auth (yes/no)
4. Whether the user exists in `public.users` table (yes/no)

**Still stuck?**
- Check the enhanced console logging I added to AuthContext.jsx
- Every step of the login process now logs to console
- Share the console output for detailed diagnosis

