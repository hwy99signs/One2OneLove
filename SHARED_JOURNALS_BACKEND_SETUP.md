# Shared Journals Backend Setup Guide

This guide explains how to set up the backend for the Shared Journals feature.

## Overview

The Shared Journals feature has been migrated from base44 to Supabase. The backend includes:
- Database schema for `shared_journals` table
- Service layer (`journalService.js`) for CRUD operations
- Updated frontend components to use the new service

## Setup Steps

### 1. Run the Database Schema

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `supabase-shared-journals-schema.sql`
5. Click **Run** to execute the SQL

This will create:
- `shared_journals` table with all necessary fields
- Row Level Security (RLS) policies
- Indexes for performance
- Triggers for automatic timestamp updates

### 2. Verify Table Creation

1. Go to **Table Editor** in Supabase
2. You should see the `shared_journals` table
3. Verify the following columns exist:
   - `id` (UUID)
   - `user_id` (UUID, references users)
   - `title` (TEXT)
   - `content` (TEXT)
   - `entry_date` (DATE)
   - `mood` (TEXT)
   - `tags` (TEXT[])
   - `is_favorite` (BOOLEAN)
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

### 3. Test the Feature

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the Shared Journals page
3. Try creating a new journal entry
4. Verify you can:
   - Create entries
   - Edit entries
   - Delete entries
   - Filter by mood
   - Mark entries as favorites

## Database Schema Details

### Table: `shared_journals`

**Fields:**
- `id`: UUID primary key
- `user_id`: References `users.id` (CASCADE delete)
- `title`: Journal entry title (required)
- `content`: Journal entry content/thoughts (required)
- `entry_date`: Date of the entry (required)
- `mood`: One of: happy, grateful, reflective, excited, peaceful, challenged, loving
- `tags`: Array of text tags
- `is_favorite`: Boolean flag for favorites
- `created_at`: Auto-generated timestamp
- `updated_at`: Auto-updated timestamp

**Security:**
- Row Level Security (RLS) enabled
- Users can only view/edit/delete their own entries
- All operations require authentication

## Service API

The `journalService.js` provides the following functions:

### CRUD Operations
- `getJournalEntries(orderBy)` - Get all entries for current user
- `getJournalEntryById(entryId)` - Get a single entry
- `createJournalEntry(entryData)` - Create a new entry
- `updateJournalEntry(entryId, entryData)` - Update an entry
- `deleteJournalEntry(entryId)` - Delete an entry
- `toggleFavorite(entryId, isFavorite)` - Toggle favorite status

### Filtering
- `getJournalEntriesByMood(mood, orderBy)` - Filter by mood
- `getFavoriteJournalEntries(orderBy)` - Get favorites only

### Statistics
- `getJournalStats()` - Get statistics about journal entries

## Files Changed

1. **New Files:**
   - `supabase-shared-journals-schema.sql` - Database schema
   - `src/lib/journalService.js` - Service layer

2. **Updated Files:**
   - `src/pages/SharedJournals.jsx` - Updated to use journalService
   - `src/pages/CouplesDashboard.jsx` - Updated to use journalService

## Troubleshooting

### Error: "User not authenticated"
- Make sure the user is logged in
- Check that Supabase authentication is working

### Error: "relation 'shared_journals' does not exist"
- Run the SQL schema file in Supabase SQL Editor
- Verify the table was created in Table Editor

### Entries not showing up
- Check browser console for errors
- Verify RLS policies are correctly set
- Ensure `user_id` matches the authenticated user

### Tags not saving
- Tags are stored as a TEXT array
- Make sure tags are passed as an array: `['tag1', 'tag2']`

## Next Steps

The backend is now fully set up! The Shared Journals feature should work with:
- ✅ Create, read, update, delete operations
- ✅ Mood filtering
- ✅ Favorite entries
- ✅ Tag management
- ✅ Date-based sorting

All data is stored securely in Supabase with proper authentication and authorization.

