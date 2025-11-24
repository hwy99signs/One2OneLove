# Love Language Quiz Backend Setup Guide

## Overview

This guide explains how the Love Language Quiz backend is set up to save user quiz results to their profile.

## ✅ What's Been Set Up

1. **Database Column**: `love_language` column in the `users` table with proper constraints
2. **Service Functions**: Backend functions to save and retrieve love language data
3. **Quiz Integration**: Quiz now saves results automatically to user profile
4. **Profile Completion**: Saving love language increases profile completion percentage

## 📋 Features

### 1. Love Language Options

The system supports 5 love languages (mapped from quiz IDs):

| Quiz ID  | Database Value         | Display Name            |
|----------|------------------------|-------------------------|
| words    | words_of_affirmation   | Words of Affirmation    |
| quality  | quality_time           | Quality Time            |
| gifts    | receiving_gifts        | Receiving Gifts         |
| service  | acts_of_service        | Acts of Service         |
| touch    | physical_touch         | Physical Touch          |

### 2. Database Schema

```sql
-- love_language column
love_language TEXT CHECK (
  love_language IN (
    'words_of_affirmation',
    'quality_time',
    'receiving_gifts',
    'acts_of_service',
    'physical_touch'
  ) OR love_language IS NULL
)
```

### 3. API Functions

**Save Love Language:**
```javascript
import { saveLoveLanguage } from '@/lib/profileService';

// Save quiz result
await saveLoveLanguage(userId, 'words'); // Quiz ID
// Automatically maps to 'words_of_affirmation' in database
```

**Get Love Language:**
```javascript
import { getUserLoveLanguage } from '@/lib/profileService';

const loveLanguage = await getUserLoveLanguage(userId);
// Returns: 'words_of_affirmation' or null
```

## 🚀 How It Works

### Quiz Flow

1. **User takes quiz** - Answers 15 questions about preferences
2. **Results calculated** - System determines top love language
3. **Results displayed** - Shows user their love language with description
4. **Save to Profile** - User clicks "Save to Profile" button
5. **Backend saves** - Love language saved to database
6. **Profile updates** - Profile completion percentage increases
7. **Success feedback** - Toast notification confirms save

### Automatic Features

- ✅ **Profile Completion**: Automatically increases when love language is set
- ✅ **Validation**: Only valid love language values can be saved
- ✅ **User Type Check**: Only regular users can save to profile
- ✅ **Error Handling**: Graceful error messages if save fails

## 🧪 Testing

### 1. Verify Column Exists

Run this in Supabase SQL Editor:

```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND column_name = 'love_language';
```

### 2. Test Quiz Flow

1. Go to Love Language Quiz page
2. Complete all 15 questions
3. See results displayed
4. Click "Save to Profile" button
5. See success message
6. Check profile page - completion percentage should increase
7. Check profile settings - love language should be saved

### 3. Verify Data Saved

```sql
SELECT 
  id,
  name,
  love_language,
  profile_completion_percentage
FROM public.users
WHERE love_language IS NOT NULL
LIMIT 10;
```

## 📝 UI Components

### Save Button States

**Not Saved:**
```jsx
<Button>
  <Save /> Save to Profile
</Button>
```

**Saving:**
```jsx
<Button disabled>
  <Spinner /> Saving...
</Button>
```

**Saved:**
```jsx
<Button disabled>
  <CheckCircle /> Saved to Profile
</Button>
```

## 🔧 Customization

### Add New Love Language

1. **Update database constraint:**
   ```sql
   ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_love_language_check;
   ALTER TABLE public.users ADD CONSTRAINT users_love_language_check
     CHECK (love_language IN (
       'words_of_affirmation',
       'quality_time',
       'receiving_gifts',
       'acts_of_service',
       'physical_touch',
       'your_new_language'  -- Add here
     ) OR love_language IS NULL);
   ```

2. **Update service mapping:**
   ```javascript
   const languageMap = {
     'words': 'words_of_affirmation',
     'quality': 'quality_time',
     'gifts': 'receiving_gifts',
     'service': 'acts_of_service',
     'touch': 'physical_touch',
     'newlang': 'your_new_language'  // Add here
   };
   ```

3. **Update quiz options** in `LoveLanguageQuiz.jsx`

## 🐛 Troubleshooting

### Issue: "Invalid love language value"

**Cause:** Trying to save a value not in the CHECK constraint

**Solution:**
- Verify the quiz ID maps correctly in `languageMap`
- Check database constraint includes the value

### Issue: "Failed to save love language"

**Possible causes:**
1. User not logged in
2. User is not regular user type
3. Database connection issue

**Solution:**
- Check user authentication
- Verify user type in database
- Check browser console for errors

### Issue: Profile completion not updating

**Solution:**
- The trigger should update automatically
- Try manually refreshing: `UPDATE users SET updated_at = NOW() WHERE id = 'user-id'`

## 📊 Profile Integration

Love language is displayed in:
- ✅ Profile page
- ✅ Profile edit form
- ✅ Couples profile view
- ✅ Profile completion tracking

## 🔐 Security

- ✅ **RLS Policies**: Users can only update their own love language
- ✅ **Validation**: Only valid values accepted
- ✅ **User Type Check**: Only regular users can save
- ✅ **Authentication**: Must be logged in to save

## 📚 Related Files

- `src/pages/LoveLanguageQuiz.jsx` - Quiz component
- `src/lib/profileService.js` - Service functions
- `src/pages/Profile.jsx` - Profile display
- `supabase-verify-love-language-setup.sql` - Database setup

## 💡 Future Enhancements

Potential improvements:
- Save detailed quiz results (not just final language)
- Track when love language was last updated
- Show love language compatibility with partner
- Recommend activities based on love language
- Love language history/changes over time

---

**Setup Complete!** Users can now take the Love Language Quiz and save results to their profile. 🎉

