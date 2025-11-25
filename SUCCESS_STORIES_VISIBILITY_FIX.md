# 🔧 Fix: Success Stories Visibility Issue

## Problem
Only the user who posted a success story can see it, but all users should be able to see all approved success stories.

## Solution
Update the Row Level Security (RLS) policy to allow all users (authenticated and anonymous) to view approved stories.

## 🚀 Quick Fix - Run This SQL in Supabase

```sql
-- ============================================================================
-- FIX: Success Stories RLS - Allow All Users to View Approved Stories
-- ============================================================================

-- Step 1: Drop existing SELECT policies
DROP POLICY IF EXISTS "Anyone can view approved stories" ON public.success_stories;
DROP POLICY IF EXISTS "Users can view own stories" ON public.success_stories;

-- Step 2: Create policy for public access (all users can see approved stories)
CREATE POLICY "Anyone can view approved stories" ON public.success_stories
  FOR SELECT 
  TO public  -- 'public' includes both authenticated and anonymous users
  USING (moderation_status = 'approved');

-- Step 3: Create policy for users to view their own stories (all statuses)
CREATE POLICY "Users can view own stories" ON public.success_stories
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

-- Step 4: Verify RLS is enabled
ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;
```

## 📋 Step-by-Step Instructions

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Click **SQL Editor**

2. **Run the Fix SQL**
   - Click **New query**
   - Copy and paste the SQL above
   - Click **Run**

3. **Verify the Fix**
   - Go to **Table Editor** → `success_stories`
   - You should see all approved stories regardless of who created them
   - Test in your app - all users should now see all approved stories

## ✅ What This Fixes

- ✅ All users (logged in or not) can see all approved success stories
- ✅ Users can still see their own stories even if pending/rejected
- ✅ Stories are truly public once approved
- ✅ No more visibility restrictions based on who posted

## 🔍 Verification

After running the fix, test:
1. **As User A**: Create a success story
2. **As User B**: Should be able to see User A's story
3. **As anonymous user**: Should also be able to see approved stories

## 🐛 If Still Not Working

If stories still aren't visible:

1. **Check moderation_status**:
   ```sql
   SELECT id, title, moderation_status FROM public.success_stories;
   ```
   - Stories must have `moderation_status = 'approved'` to be visible

2. **Check RLS policies**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'success_stories';
   ```
   - Should see both policies listed

3. **Test query directly**:
   ```sql
   SELECT * FROM public.success_stories WHERE moderation_status = 'approved';
   ```
   - This should return all approved stories

4. **Check browser console** for any errors when fetching stories

## 📝 Additional Notes

- The service code has also been updated to handle unauthenticated users better
- Stories are automatically approved when created (moderation_status: 'approved')
- If you want to enable moderation, change the default to 'pending' in the create function

---

**After running this fix, all users will be able to see all approved success stories!** 🎉

