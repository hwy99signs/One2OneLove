# Profile Completion Backend Setup Guide

## Overview

This guide explains how to set up backend tracking for profile completion. The system automatically calculates and stores profile completion percentage in the database, which updates whenever a user updates their profile.

## ✅ What's Been Set Up

1. **Database Columns**: Added `profile_completion_percentage`, `profile_completed_fields`, and `profile_total_fields` to the `users` table
2. **Automatic Calculation**: Database function calculates completion based on 14 profile fields
3. **Auto-Update Trigger**: Database trigger automatically recalculates completion when profile fields change
4. **Frontend Integration**: Profile page now uses backend-stored completion values

## 📋 Step 1: Run the SQL Migration

1. Go to your **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor**
4. Open the file: `supabase-add-profile-completion-tracking.sql`
5. Copy and paste the entire SQL script
6. Click **Run** to execute

This will:
- Add profile completion columns to the `users` table
- Create a function to calculate profile completion
- Create a trigger to auto-update completion on profile changes
- Update all existing users with their current completion status

## 📊 Profile Fields Tracked

The system tracks completion for these 14 fields:

1. **name** (required)
2. **email** (required)
3. **location**
4. **partner_email**
5. **anniversary_date**
6. **love_language**
7. **relationship_status**
8. **avatar_url**
9. **date_frequency**
10. **communication_style**
11. **conflict_resolution**
12. **interests** (JSONB array)
13. **bio**
14. **partner_name**

## 🔄 How It Works

### Automatic Updates

When a user updates their profile:
1. The database trigger fires automatically
2. The `calculate_profile_completion()` function runs
3. Completion percentage is recalculated
4. New values are saved to the database

### Manual Refresh

If you need to manually refresh completion (rarely needed):

```javascript
import { refreshProfileCompletion } from '@/lib/profileService';

await refreshProfileCompletion(userId);
```

## 🎯 Frontend Usage

The Profile page automatically uses backend-stored values:

```javascript
// Backend values (preferred)
const completionPercentage = user?.profile_completion_percentage;
const completedFields = user?.profile_completed_fields;
const totalFields = user?.profile_total_fields;

// Frontend fallback (if backend values not available)
// Calculates on the fly as backup
```

## 🧪 Testing

1. **Check existing users:**
   ```sql
   SELECT 
     id, 
     name, 
     profile_completed_fields, 
     profile_total_fields, 
     profile_completion_percentage 
   FROM public.users 
   LIMIT 10;
   ```

2. **Update a profile field:**
   - Go to Profile page
   - Edit any field (e.g., add location)
   - Save changes
   - Check that completion percentage updated

3. **Verify trigger works:**
   ```sql
   -- Update a user's location
   UPDATE public.users 
   SET location = 'New York' 
   WHERE id = 'your-user-id';
   
   -- Check completion updated
   SELECT profile_completion_percentage 
   FROM public.users 
   WHERE id = 'your-user-id';
   ```

## 📝 Database Schema

### New Columns Added

- `profile_completion_percentage` (INTEGER, 0-100)
  - Percentage of profile completion
  - Automatically calculated

- `profile_completed_fields` (INTEGER)
  - Number of completed fields
  - Automatically calculated

- `profile_total_fields` (INTEGER, default: 14)
  - Total number of profile fields
  - Can be customized if needed

### Functions Created

- `calculate_profile_completion(user_record)` 
  - Calculates completion for a user record
  - Returns: completed_fields, total_fields, completion_percentage

- `update_profile_completion()`
  - Trigger function that updates completion on INSERT/UPDATE

### Triggers Created

- `trigger_update_profile_completion`
  - Fires BEFORE INSERT OR UPDATE on `users` table
  - Automatically recalculates completion

## 🔧 Troubleshooting

### Issue: Completion not updating

**Solution:**
1. Check if trigger exists:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'trigger_update_profile_completion';
   ```

2. Manually refresh completion:
   ```sql
   -- Update a user to trigger recalculation
   UPDATE public.users 
   SET updated_at = NOW() 
   WHERE id = 'user-id';
   ```

### Issue: Completion percentage is 0 for all users

**Solution:**
1. Run the migration script again (it's safe to run multiple times)
2. Check if all profile fields exist:
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'users' 
   AND column_name IN ('location', 'love_language', 'date_frequency', 'communication_style', 'conflict_resolution', 'partner_name', 'interests');
   ```

### Issue: Frontend shows old completion values

**Solution:**
1. Refresh the user profile in AuthContext
2. Check browser console for errors
3. Verify the user object includes completion fields:
   ```javascript
   console.log(user?.profile_completion_percentage);
   ```

## 📈 Performance

- **Trigger Performance**: The trigger is lightweight and runs only on profile updates
- **Calculation Speed**: Completion calculation is fast (checks 14 fields)
- **Indexing**: No additional indexes needed (uses existing user table indexes)

## 🔐 Security

- **RLS Policies**: Completion fields follow existing RLS policies
- **User Access**: Users can only see their own completion data
- **Automatic Updates**: Only the database trigger can update completion (prevents manipulation)

## 🚀 Next Steps

1. ✅ Run the SQL migration
2. ✅ Verify existing users have completion values
3. ✅ Test updating a profile and see completion update
4. ✅ Monitor completion percentages in your dashboard

## 📚 Related Files

- `supabase-add-profile-completion-tracking.sql` - Database migration
- `src/lib/profileService.js` - Service functions
- `src/pages/Profile.jsx` - Profile page component
- `src/contexts/AuthContext.jsx` - User data fetching

## 💡 Customization

### Change Total Fields Count

If you add/remove profile fields, update the total:

```sql
-- Update total fields count
UPDATE public.users 
SET profile_total_fields = 15  -- New total
WHERE profile_total_fields = 14;

-- Update the function to check 15 fields instead of 14
-- (Edit calculate_profile_completion function)
```

### Add New Profile Field

1. Add the column to `users` table
2. Update `calculate_profile_completion()` function to include the new field
3. Update the frontend Profile.jsx to include the field in the list

---

**Need Help?** Check the troubleshooting section or review the SQL migration file for detailed comments.

