# 🎉 Relationship Milestones & Anniversaries - Backend Setup Guide

This guide will help you set up the complete backend for the Relationship Milestones & Anniversaries feature using Supabase.

## 📋 Overview

The Milestones feature allows users to:
- Track important relationship milestones (first date, engagement, wedding, etc.)
- Set up recurring anniversaries that celebrate yearly
- Add photos and details to each milestone
- Get reminders before important dates
- View upcoming and past celebrations

## 🗄️ Database Structure

The backend uses a single table: `relationship_milestones`

### Table Fields:
- **id**: Unique identifier (UUID)
- **user_id**: Links to the authenticated user
- **title**: Name of the milestone
- **milestone_type**: Type (first_date, engagement, wedding, etc.)
- **date**: Date of the milestone
- **description**: Details about the milestone
- **location**: Where it happened
- **partner_email**: Partner's email (optional)
- **media_urls**: Array of photo/video URLs
- **is_recurring**: Whether to celebrate annually
- **reminder_enabled**: Enable/disable reminders
- **reminder_days_before**: Days before to send reminder
- **celebration_completed**: Track if celebrated
- **created_at/updated_at**: Timestamps

## 🚀 Setup Instructions

### Step 1: Run the Database Schema

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Click **SQL Editor** in the left sidebar

2. **Create New Query**
   - Click **New query** button
   - Copy the entire contents of `supabase-milestones-schema.sql`
   - Paste it into the SQL Editor

3. **Run the Query**
   - Click **Run** (or press `Ctrl + Enter`)
   - Wait for "Success. No rows returned" message

4. **Verify Table Created**
   - Go to **Table Editor** in the left sidebar
   - You should see `relationship_milestones` table
   - Click on it to view the structure

### Step 2: Verify Row Level Security (RLS)

The schema automatically sets up RLS policies so users can only access their own milestones:

1. Go to **Authentication** → **Policies**
2. Find `relationship_milestones` table
3. You should see 4 policies:
   - ✅ Users can view own milestones
   - ✅ Users can insert own milestones
   - ✅ Users can update own milestones
   - ✅ Users can delete own milestones

### Step 3: Test the Backend

The service file (`src/lib/milestonesService.js`) is already integrated into your app.

**Test by:**
1. Start your development server: `npm run dev`
2. Log in to your app
3. Navigate to "Relationship Milestones" page
4. Try adding a new milestone
5. Check Supabase Table Editor to see the data

## 📝 Service Functions

The `milestonesService.js` provides these functions:

### CRUD Operations
```javascript
import { 
  getMilestones,
  getMilestoneById,
  createMilestone,
  updateMilestone,
  deleteMilestone 
} from '@/lib/milestonesService';

// Get all milestones (sorted by date, descending)
const milestones = await getMilestones('-date');

// Get a specific milestone
const milestone = await getMilestoneById(milestoneId);

// Create a new milestone
const newMilestone = await createMilestone({
  title: 'Our First Date',
  milestone_type: 'first_date',
  date: '2024-01-15',
  description: 'We met at Central Park...',
  location: 'Central Park, New York',
  is_recurring: true,
  reminder_enabled: true
});

// Update a milestone
const updated = await updateMilestone(milestoneId, {
  description: 'Updated description...'
});

// Delete a milestone
await deleteMilestone(milestoneId);
```

### Query Helpers
```javascript
import { 
  getUpcomingMilestones,
  getPastMilestones,
  getMilestonesByType,
  getDaysUntil
} from '@/lib/milestonesService';

// Get milestones in next 60 days
const upcoming = await getUpcomingMilestones(60);

// Get past milestones
const past = await getPastMilestones();

// Get milestones by type
const engagements = await getMilestonesByType('engagement');

// Calculate days until a date
const days = getDaysUntil('2024-12-25'); // Returns number of days
```

### Special Functions
```javascript
import { 
  markCelebrationCompleted,
  updateMilestoneMedia,
  getMilestoneStats
} from '@/lib/milestonesService';

// Mark a milestone as celebrated
await markCelebrationCompleted(milestoneId);

// Update photos
await updateMilestoneMedia(milestoneId, [
  'https://example.com/photo1.jpg',
  'https://example.com/photo2.jpg'
]);

// Get statistics
const stats = await getMilestoneStats();
// Returns: { total, upcoming, past, recurring, withPhotos, celebrated }
```

## 🎨 Milestone Types

The system supports these milestone types:
- `first_date` - First Date
- `first_kiss` - First Kiss
- `first_love` - First "I Love You"
- `moving_in` - Moving In Together
- `engagement` - Engagement
- `wedding` - Wedding
- `anniversary` - Anniversary
- `first_vacation` - First Vacation Together
- `met_family` - Met the Family
- `custom` - Custom Milestone

## 🔔 Reminders System

Milestones support automatic reminders:
- **reminder_enabled**: Turn reminders on/off
- **reminder_days_before**: Send reminder X days before (default: 7)
- **last_reminder_sent**: Track when last reminder was sent

You can implement reminder logic using:
```javascript
import { needsReminder } from '@/lib/milestonesService';

// Check if a milestone needs a reminder
if (needsReminder(milestone)) {
  // Send reminder email/notification
}
```

## 🔄 Recurring Milestones

For anniversaries and events that repeat yearly:
1. Set `is_recurring: true` when creating the milestone
2. The system automatically calculates the next occurrence
3. Use `getUpcomingMilestones()` to get next anniversary dates

## 📸 Media Upload

To add photos to milestones:
1. Upload files using your file upload service
2. Get the URLs
3. Store them in the `media_urls` array field

```javascript
const milestone = await updateMilestone(milestoneId, {
  media_urls: [
    'https://storage.example.com/photo1.jpg',
    'https://storage.example.com/photo2.jpg'
  ]
});
```

## 🔍 Querying Tips

### Get milestones within a date range
```javascript
const { supabase } = await import('./supabase');

const { data } = await supabase
  .from('relationship_milestones')
  .select('*')
  .gte('date', '2024-01-01')
  .lte('date', '2024-12-31')
  .order('date');
```

### Get only recurring anniversaries
```javascript
const { data } = await supabase
  .from('relationship_milestones')
  .select('*')
  .eq('is_recurring', true)
  .order('date');
```

### Search milestones by title
```javascript
const { data } = await supabase
  .from('relationship_milestones')
  .select('*')
  .ilike('title', '%first%')
  .order('date');
```

## 🐛 Troubleshooting

### Issue: "User not authenticated" error
**Solution**: Make sure user is logged in before calling milestone functions

### Issue: Can't see milestones after creating them
**Solution**: 
1. Check browser console for errors
2. Verify RLS policies are enabled
3. Make sure you're logged in with the same account

### Issue: Photos not showing
**Solution**: 
1. Verify media URLs are publicly accessible
2. Check that URLs are in the `media_urls` array

### Issue: Reminders not working
**Solution**: You need to implement the reminder sending logic separately (email/SMS service)

## 📊 Database Indexes

The schema includes these indexes for better performance:
- `idx_relationship_milestones_user_id` - Fast user queries
- `idx_relationship_milestones_date` - Fast date sorting
- `idx_relationship_milestones_type` - Fast type filtering
- `idx_relationship_milestones_recurring` - Fast recurring milestone queries

## 🔐 Security

- ✅ Row Level Security (RLS) enabled
- ✅ Users can only access their own milestones
- ✅ All queries are automatically filtered by user_id
- ✅ SQL injection protection via Supabase parameterized queries

## 📈 Next Steps

1. ✅ Database schema created
2. ✅ Service functions implemented
3. ✅ UI components integrated
4. 🔄 Add reminder notification system (optional)
5. 🔄 Add partner sharing features (optional)
6. 🔄 Add calendar sync (optional)

## 💡 Feature Ideas

Consider adding these features later:
- Email reminders before important dates
- Share milestones with partner
- Export milestones to calendar (iCal)
- Print timeline of relationship
- Generate anniversary celebration ideas based on milestone type
- Milestone achievements/badges

## 🆘 Need Help?

If you encounter issues:
1. Check the browser console for error messages
2. Verify your Supabase connection in `.env` file
3. Make sure the table was created successfully
4. Check that RLS policies are active
5. Ensure you're using the latest version of the service file

---

**Backend Setup Complete! 🎉**

Your Relationship Milestones feature is now ready to use with full Supabase backend support.

