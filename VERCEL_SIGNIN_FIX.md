# 🔐 Fix Sign-In on Vercel - Complete Setup Guide

If sign-in isn't working on your Vercel deployment, you need to configure environment variables in Vercel and update Supabase settings.

---

## ✅ Step 1: Add Environment Variables in Vercel

### 1.1 Go to Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**

### 1.2 Add Required Variables

Add these **two required** environment variables:

#### Variable 1: `VITE_SUPABASE_URL`
- **Key**: `VITE_SUPABASE_URL`
- **Value**: Your Supabase project URL (e.g., `https://hphhmjcutesqsdnubnnw.supabase.co`)
- **Where to find it**: 
  - Go to [Supabase Dashboard](https://app.supabase.com)
  - Select your project
  - Go to **Settings** → **API**
  - Copy the **Project URL**

#### Variable 2: `VITE_SUPABASE_ANON_KEY`
- **Key**: `VITE_SUPABASE_ANON_KEY`
- **Value**: Your Supabase anon/public key (starts with `eyJhbGci...`)
- **Where to find it**:
  - Same location: **Settings** → **API**
  - Copy the **anon public** key (NOT the service_role key)

### 1.3 Set for All Environments

**IMPORTANT**: When adding each variable, make sure to select:
- ✅ **Production**
- ✅ **Preview** 
- ✅ **Development**

This ensures the variables work for all deployments.

### 1.4 Redeploy

After adding the variables:
1. Go to **Deployments** tab
2. Click the **three dots** (⋯) on your latest deployment
3. Click **Redeploy**
4. Wait for the build to complete

---

## ✅ Step 2: Update Supabase Redirect URLs

Supabase needs to know your Vercel domain is allowed for authentication.

### 2.1 Get Your Vercel URL

Your Vercel deployment URL looks like:
- `https://your-project.vercel.app` (production)
- Or your custom domain if you have one

### 2.2 Update Supabase Settings

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Authentication** → **URL Configuration**
4. Under **Site URL**, set your production URL:
   ```
   https://your-project.vercel.app
   ```
   (Or your custom domain)

5. Under **Redirect URLs**, add:
   ```
   https://your-project.vercel.app/**
   https://your-project.vercel.app/*
   ```
   
   **Also add your custom domain if you have one:**
   ```
   https://yourdomain.com/**
   https://yourdomain.com/*
   ```

6. Click **Save**

---

## ✅ Step 3: Verify the Fix

### 3.1 Test Sign-In

1. Go to your Vercel deployment URL
2. Click **Sign In**
3. Enter your email and password
4. It should now work! ✅

### 3.2 Check Browser Console (if still not working)

1. Open browser Developer Tools (F12)
2. Go to **Console** tab
3. Try signing in again
4. Look for errors:
   - ❌ "Supabase Configuration Missing" → Environment variables not set
   - ❌ "Invalid API key" → Wrong `VITE_SUPABASE_ANON_KEY`
   - ❌ "Redirect URL not allowed" → Supabase redirect URLs not configured

---

## 🔍 Troubleshooting

### Issue: "Application is not properly configured"

**Cause**: Environment variables missing or incorrect

**Fix**:
1. Double-check variable names are exactly:
   - `VITE_SUPABASE_URL` (not `SUPABASE_URL`)
   - `VITE_SUPABASE_ANON_KEY` (not `SUPABASE_ANON_KEY`)
2. Make sure values are complete (no truncation)
3. Redeploy after adding variables

### Issue: "Invalid login credentials" but credentials are correct

**Cause**: Supabase redirect URLs not configured

**Fix**:
1. Add your Vercel URL to Supabase redirect URLs (Step 2)
2. Make sure to include both `/**` and `/*` patterns
3. Wait a few minutes for changes to propagate

### Issue: Sign-in works locally but not on Vercel

**Cause**: Environment variables only set locally

**Fix**:
1. Add environment variables in Vercel (Step 1)
2. Make sure to select all environments (Production, Preview, Development)
3. Redeploy your project

### Issue: "Network error" or "Connection failed"

**Cause**: Wrong Supabase URL or CORS issue

**Fix**:
1. Verify `VITE_SUPABASE_URL` is correct
2. Check Supabase project is active (not paused)
3. In Supabase, go to **Settings** → **API** → **CORS** and ensure your Vercel domain is allowed

---

## 📋 Quick Checklist

Before testing sign-in on Vercel, verify:

- [ ] `VITE_SUPABASE_URL` is set in Vercel (all environments)
- [ ] `VITE_SUPABASE_ANON_KEY` is set in Vercel (all environments)
- [ ] Project has been redeployed after adding variables
- [ ] Vercel URL is added to Supabase Site URL
- [ ] Vercel URL is added to Supabase Redirect URLs (with `/**` and `/*`)
- [ ] Supabase project is active (not paused)

---

## 🎯 Summary

The sign-in issue on Vercel is almost always caused by:

1. **Missing environment variables** → Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel
2. **Missing redirect URLs** → Add your Vercel domain to Supabase redirect URLs

Once both are configured, sign-in should work perfectly! 🎉

---

## 📞 Still Having Issues?

If sign-in still doesn't work after following these steps:

1. Check Vercel build logs for errors
2. Check browser console for specific error messages
3. Verify your Supabase project is active
4. Test with a fresh browser session (clear cache/cookies)
5. Make sure you're using the correct Supabase project (if you have multiple)

