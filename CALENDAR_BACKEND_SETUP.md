# Calendar Backend Setup Guide

## 🎯 Overview

This guide walks you through setting up the Supabase backend for the calendar feature, allowing users to create, view, update, and delete their calendar events.

## 📋 Prerequisites

- Supabase project set up
- Access to Supabase SQL Editor
- User authentication working (users can sign in)

## 🚀 Step 1: Create Database Table

1. **Go to Supabase Dashboard**: https://app.supabase.com
2. **Select your project**
3. **Click "SQL Editor"** in the left sidebar
4. **Click "+ New query"**
5. **Copy and paste the SQL from** `supabase-calendar-schema.sql`
6. **Click "Run"** or press `Ctrl+Enter`

You should see: **"Success"**

## ✅ What This Creates

### Database Table: `calendar_events`

Stores all calendar events with the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique event ID |
| `user_id` | UUID | User who created the event |
| `title` | TEXT | Event title (required) |
| `description` | TEXT | Event description |
| `event_date` | DATE | Event date (required) |
| `event_time` | TIME | Event time |
| `event_type` | TEXT | Type: date, anniversary, milestone, etc. |
| `location` | TEXT | Event location |
| `notes` | TEXT | Additional notes |
| `color` | TEXT | Event color for UI |
| `reminder_enabled` | BOOLEAN | Enable reminder |
| `reminder_days_before` | INTEGER | Days before to remind |
| `is_recurring` | BOOLEAN | Is recurring event |
| `recurrence_pattern` | TEXT | daily, weekly, monthly, yearly |
| `created_at` | TIMESTAMP | When event was created |
| `updated_at` | TIMESTAMP | Last update time |

### Row Level Security (RLS) Policies

✅ Users can only see their own events  
✅ Users can only create events for themselves  
✅ Users can only update their own events  
✅ Users can only delete their own events  

### Indexes

✅ Fast queries by user_id  
✅ Fast queries by event_date  
✅ Fast queries by event_type  

## 🧪 Step 2: Test the Setup

### Verify Table Creation

Run this in SQL Editor to verify:

```sql
SELECT * FROM calendar_events LIMIT 5;
```

You should see an empty table (no error).

### Verify RLS Policies

Run this to check policies:

```sql
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'calendar_events';
```

You should see 4 policies:
1. Users can view own calendar events (SELECT)
2. Users can insert own calendar events (INSERT)
3. Users can update own calendar events (UPDATE)
4. Users can delete own calendar events (DELETE)

## 📝 Step 3: Update Frontend (Already Done!)

The following files have been created/updated:

1. ✅ **`src/lib/calendarService.js`** - Calendar API service
2. ✅ **`src/pages/CouplesCalendar.jsx`** - Updated to use Supabase
3. ✅ **SQL Schema** - Database setup script

## 🎮 Step 4: Test the Feature

1. **Sign in** to your app
2. **Navigate to** Calendar page: http://localhost:5174/couplescalendar
3. **Click "+ Add Event"**
4. **Fill out the form**:
   - Event Title: "Date Night"
   - Date: Select a date
   - Time: Select a time
   - Event Type: "Date"
   - Location: "Italian Restaurant"
   - Description: "Romantic dinner"
5. **Click "Save Event"**
6. **Verify**:
   - Event appears in calendar
   - Event is saved in Supabase database
   - You can edit and delete the event

## 🔍 Verify in Supabase

1. Go to **Database** → **Tables** in Supabase
2. Click on **`calendar_events`** table
3. You should see your newly created event!

## 🎯 Features Enabled

### ✅ Create Events
- Users can add calendar events with all details
- Events are linked to the user's account
- Support for different event types

### ✅ View Events
- Calendar grid view
- List view
- Filter by event type
- Filter by time range (today, this week, this month)

### ✅ Update Events
- Edit any event details
- Changes are saved immediately

### ✅ Delete Events
- Remove events with confirmation
- Soft delete (can be implemented later)

### ✅ Event Types
- Date
- Anniversary
- Milestone
- Reminder
- Appointment
- Activity
- Other

### ✅ Event Features
- Date and time
- Location
- Description
- Reminders (days before)
- Recurring events (daily, weekly, monthly, yearly)
- Color coding

## 🐛 Troubleshooting

### Issue: "Permission denied" when creating events

**Solution**: Make sure RLS policies are created correctly. Run the SQL schema again.

### Issue: Events not showing up

**Solution**: 
1. Check if user is signed in
2. Verify `user_id` in the events table matches the signed-in user
3. Check browser console for errors

### Issue: Can't create events

**Solution**:
1. Make sure Supabase URL and key are in `.env` file
2. Restart dev server
3. Check network tab in browser devtools for API errors

## 📊 Database Queries for Testing

### View all events for a specific user:
```sql
SELECT * FROM calendar_events 
WHERE user_id = 'user-uuid-here'
ORDER BY event_date ASC;
```

### Count events by type:
```sql
SELECT event_type, COUNT(*) 
FROM calendar_events 
GROUP BY event_type;
```

### Get upcoming events:
```sql
SELECT * FROM calendar_events 
WHERE event_date >= CURRENT_DATE
ORDER BY event_date ASC
LIMIT 10;
```

## 🚀 Next Steps (Optional)

1. **Email Reminders**: Set up cron job to send email reminders
2. **Push Notifications**: Send browser notifications for upcoming events
3. **Shared Calendars**: Allow couples to share calendars
4. **Calendar Export**: Export to Google Calendar, iCal, etc.
5. **Recurring Events**: Implement recurring event generation

## 📚 API Reference

The calendar service (`src/lib/calendarService.js`) provides these functions:

- `getCalendarEvents(userId, options)` - Get all events
- `getCalendarEvent(eventId, userId)` - Get single event
- `createCalendarEvent(userId, eventData)` - Create new event
- `updateCalendarEvent(eventId, userId, updates)` - Update event
- `deleteCalendarEvent(eventId, userId)` - Delete event
- `getUpcomingEvents(userId, limit)` - Get upcoming events
- `getEventsForMonth(userId, month)` - Get events for specific month
- `getEventsByType(userId, eventType)` - Get events by type

## ✅ Done!

Your calendar backend is now set up and ready to use! Users can add, view, edit, and delete their calendar events. 🎉

