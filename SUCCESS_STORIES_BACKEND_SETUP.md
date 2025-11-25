# 📖 Success Stories Backend Setup Guide

This guide will help you set up the complete backend for the Success Stories feature in the Community page using Supabase.

## 📋 Overview

The Success Stories feature allows users to:
- Share their relationship success stories, challenges, advice, and milestones
- Post anonymously or with their name
- Like and mark stories as helpful
- Search and filter stories
- Moderate content (admin feature)

## 🗄️ Database Structure

The backend uses three tables:

### 1. `success_stories` - Main stories table
- Story content (title, content, type)
- Author information (name, anonymous flag)
- Story details (relationship length, tags)
- Moderation status (pending/approved/rejected)
- Engagement metrics (likes, helpful, views)
- Featured flag

### 2. `story_likes` - Track who liked which stories
- Prevents duplicate likes
- Auto-updates likes_count on stories

### 3. `story_helpful` - Track helpful marks
- Prevents duplicate helpful marks
- Auto-updates helpful_count on stories

## 🚀 Setup Instructions

### Step 1: Run the Database Schema

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Click **SQL Editor** in the left sidebar

2. **Create New Query**
   - Click **New query** button
   - Copy the entire contents of `supabase-success-stories-schema.sql`
   - Paste it into the SQL Editor

3. **Run the Query**
   - Click **Run** (or press `Ctrl + Enter`)
   - Wait for "Success. No rows returned" message

4. **Verify Tables Created**
   - Go to **Table Editor** in the left sidebar
   - You should see three tables:
     - ✅ `success_stories`
     - ✅ `story_likes`
     - ✅ `story_helpful`

### Step 2: Verify Row Level Security (RLS)

The schema automatically sets up RLS policies:

**For `success_stories`:**
- ✅ Anyone can view approved stories (public)
- ✅ Users can view their own stories (all statuses)
- ✅ Users can create their own stories
- ✅ Users can update their own stories (if pending/approved)
- ✅ Users can delete their own stories
- ✅ Admins can moderate any story

**For `story_likes` and `story_helpful`:**
- ✅ Anyone can view likes/helpful marks
- ✅ Users can like/unlike stories
- ✅ Users can mark/unmark stories as helpful

### Step 3: Test the Feature

1. **Start your app**: `npm run dev`
2. **Navigate to**: Community page
3. **Click**: "Success Stories" tab
4. **Click**: "Share Story" button
5. **Fill out the form** and submit
6. **Verify**: Story appears in the list

## 📝 Service Functions

The `successStoriesService.js` provides these functions:

### CRUD Operations
```javascript
import { 
  getStories,
  getStoryById,
  getMyStories,
  createStory,
  updateStory,
  deleteStory 
} from '@/lib/successStoriesService';

// Get all approved stories (with search and filters)
const stories = await getStories('-created_at', 'success', 'communication');

// Get a specific story
const story = await getStoryById(storyId);

// Get user's own stories
const myStories = await getMyStories();

// Create a new story
const newStory = await createStory({
  title: 'How We Overcame Long Distance',
  content: 'Our story...',
  story_type: 'success',
  is_anonymous: false,
  relationship_length: '2 years',
  tags: ['communication', 'trust', 'long-distance']
});

// Update a story
const updated = await updateStory(storyId, {
  title: 'Updated title'
});

// Delete a story
await deleteStory(storyId);
```

### Interactions
```javascript
import { 
  likeStory,
  unlikeStory,
  toggleLikeStory,
  markStoryHelpful,
  toggleHelpfulStory
} from '@/lib/successStoriesService';

// Like a story
await likeStory(storyId);

// Toggle like (recommended)
await toggleLikeStory(storyId, isCurrentlyLiked);

// Mark as helpful
await toggleHelpfulStory(storyId, isCurrentlyHelpful);
```

### Admin Functions
```javascript
import { 
  approveStory,
  rejectStory,
  featureStory
} from '@/lib/successStoriesService';

// Approve a story
await approveStory(storyId);

// Reject a story with notes
await rejectStory(storyId, 'Inappropriate content');

// Feature a story
await featureStory(storyId, true);
```

## 🎨 Story Types

The system supports these story types:
- `success` - Success Story (default)
- `challenge` - Challenge overcome
- `advice` - Advice for others
- `milestone` - Relationship milestone
- `transformation` - Personal transformation

## 🔍 Search & Filtering

Stories support:
- **Search**: Search in title and content
- **Type Filter**: Filter by story type
- **Sorting**: Sort by date (newest/oldest)
- **Tag Search**: Search by tags (array field)

Example:
```javascript
// Search for stories about communication
const stories = await getStories('-created_at', null, 'communication');

// Get only success stories
const successStories = await getStories('-created_at', 'success');
```

## 🔐 Security Features

1. **Public Viewing**: Only approved stories are visible to public
2. **User Privacy**: Users can post anonymously
3. **User Isolation**: Users can only edit/delete their own stories
4. **Moderation**: Admins can approve/reject stories
5. **RLS Enabled**: All tables have Row Level Security

## 📊 Auto-Updating Counts

The database automatically updates:
- `likes_count` - When users like/unlike
- `helpful_count` - When users mark/unmark helpful
- `views_count` - When story is viewed (increment on getStoryById)

## 🎯 Moderation Workflow

### Current Setup (Auto-approve):
Stories are automatically approved when created:
```javascript
moderation_status: 'approved'
```

### To Enable Moderation:
1. Change in `PostStoryForm.jsx`:
   ```javascript
   moderation_status: "pending" // Instead of "approved"
   ```

2. Change in `Community.jsx`:
   ```javascript
   moderation_status: 'pending' // Instead of 'approved'
   ```

3. Admins can then approve/reject stories using:
   ```javascript
   await approveStory(storyId);
   await rejectStory(storyId, 'Reason for rejection');
   ```

## 🐛 Troubleshooting

### Issue: "User not authenticated" error
**Solution**: Make sure user is logged in before creating stories

### Issue: Stories not appearing
**Solutions**:
1. Check moderation_status is 'approved'
2. Verify RLS policies are active
3. Check browser console for errors
4. Ensure you're viewing approved stories (not pending)

### Issue: Can't like stories
**Solutions**:
1. Check user is logged in
2. Verify story_likes table exists
3. Check RLS policies for story_likes
4. Check browser console for errors

### Issue: Counts not updating
**Solutions**:
1. Verify triggers are created (check SQL Editor)
2. Check trigger functions exist
3. Manually run: `SELECT * FROM pg_trigger WHERE tgname LIKE '%story%';`

## 📈 Performance Indexes

The schema includes these indexes:
- `idx_success_stories_user_id` - Fast user queries
- `idx_success_stories_moderation_status` - Fast moderation filtering
- `idx_success_stories_story_type` - Fast type filtering
- `idx_success_stories_created_at` - Fast date sorting
- `idx_success_stories_featured` - Fast featured story queries
- `idx_success_stories_tags` - Fast tag searches (GIN index)

## 💡 Feature Ideas

Consider adding these features later:
- Story categories/topics
- Story comments/replies
- Story sharing (social media)
- Email notifications for new stories
- Story recommendations based on tags
- Story analytics dashboard
- Story export (PDF)
- Story templates

## ✅ Setup Checklist

- [ ] Run SQL script in Supabase SQL Editor
- [ ] Verify 3 tables created (success_stories, story_likes, story_helpful)
- [ ] Check RLS policies are active
- [ ] Test creating a story in your app
- [ ] Test liking a story
- [ ] Test marking story as helpful
- [ ] Test search functionality
- [ ] Verify counts update automatically
- [ ] Test anonymous posting
- [ ] Test moderation (if enabled)

## 🔄 Current Integration

The Success Stories feature is already integrated:
- ✅ `Community.jsx` - Main page with Success Stories tab
- ✅ `PostStoryForm.jsx` - Form to share stories
- ✅ `StoryCard.jsx` - Display story cards
- ✅ `successStoriesService.js` - Complete service layer

## 📚 Related Files

- **Schema**: `supabase-success-stories-schema.sql`
- **Service**: `src/lib/successStoriesService.js`
- **Components**: 
  - `src/pages/Community.jsx`
  - `src/components/community/PostStoryForm.jsx`
  - `src/components/community/StoryCard.jsx`

---

**Backend Setup Complete! 🎉**

Your Success Stories feature is now ready to use with full Supabase backend support!

