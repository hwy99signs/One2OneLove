# Fix Sign Up Issue on Vercel

## Problem
- ✅ Sign in works on Vercel
- ❌ Sign up doesn't work on Vercel
- Works fine on localhost

## Root Causes

### 1. **Email Confirmation Required**
Supabase might require email confirmation for sign up. If email confirmation is enabled but redirect URL isn't configured, sign up will fail silently.

### 2. **Redirect URL Not Configured**
Vercel domain needs to be added to Supabase redirect URLs.

### 3. **Environment Variables**
Make sure all environment variables are set in Vercel.

## Fix Steps

### Step 1: Configure Supabase Redirect URLs

1. Go to **Supabase Dashboard** → Your Project
2. Navigate to **Authentication** → **URL Configuration**
3. Under **Redirect URLs**, add:
   ```
   https://one2-one-love.vercel.app/**
   https://one2-one-love.vercel.app/auth/callback
   ```
4. Under **Site URL**, set:
   ```
   https://one2-one-love.vercel.app
   ```
5. Click **Save**

### Step 2: Configure Email Confirmation (Choose One)

#### Option A: Disable Email Confirmation (For Testing)
1. Go to **Authentication** → **Providers**
2. Find **Email** provider
3. **Uncheck** "Confirm email" 
4. Click **Save**
5. Users can sign up and sign in immediately without email verification

#### Option B: Keep Email Confirmation (For Production)
1. Keep "Confirm email" **enabled**
2. Make sure email templates are configured
3. Users will receive confirmation email and must click link to activate account

### Step 3: Verify Vercel Environment Variables

1. Go to **Vercel Dashboard** → Your Project
2. Navigate to **Settings** → **Environment Variables**
3. Verify these are set:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
4. Make sure they're set for **Production** environment
5. **Redeploy** after adding/changing variables

### Step 4: Check Browser Console

When trying to sign up, check the browser console (F12) for errors:
- Look for Supabase auth errors
- Check network tab for failed requests
- Look for CORS errors

### Step 5: Test Sign Up Flow

1. Go to `https://one2-one-love.vercel.app/SignUp`
2. Fill out the form
3. Submit
4. Check console for errors
5. Check Supabase Dashboard → **Authentication** → **Users** to see if user was created

## Common Errors & Solutions

### Error: "Email already registered"
- User already exists in Supabase
- Delete the user from **Authentication** → **Users** in Supabase dashboard
- Or try a different email

### Error: "Invalid redirect URL"
- The redirect URL isn't in Supabase's allowed list
- Add it in **Authentication** → **URL Configuration** → **Redirect URLs**

### Error: "Email not confirmed"
- Email confirmation is required
- Check spam folder for confirmation email
- Or disable email confirmation in Supabase settings

### Error: "User profile creation failed"
- RLS policy might be blocking insert
- Check `fix-signup-rls-policy.sql` was run
- Verify user has permission to insert into `users` table

### No Error But Sign Up Doesn't Work
- Check if user was created in Supabase → **Authentication** → **Users**
- If user exists but profile doesn't, RLS policy issue
- Run the RLS fix SQL: `fix-signup-rls-policy.sql`

## Code Changes Made

The code has been updated to:
1. ✅ Include `emailRedirectTo` in sign up call
2. ✅ Use dynamic redirect URL based on current domain
3. ✅ Better error handling and logging

## Verification Checklist

- [ ] Redirect URLs configured in Supabase
- [ ] Site URL set in Supabase
- [ ] Environment variables set in Vercel
- [ ] Vercel deployment redeployed after env var changes
- [ ] Email confirmation settings configured
- [ ] RLS policies allow user creation
- [ ] Browser console shows no errors
- [ ] User appears in Supabase → Authentication → Users after sign up

## Still Not Working?

1. **Check Supabase Logs:**
   - Go to **Logs** → **Auth Logs** in Supabase
   - Look for sign up attempts and errors

2. **Check Vercel Logs:**
   - Go to **Deployments** → Click latest deployment → **Functions** tab
   - Look for errors

3. **Test with Different Email:**
   - Try a completely new email address
   - Some emails might be blocked or already exist

4. **Compare Local vs Production:**
   - Does it work on localhost?
   - What's different between local and Vercel?

