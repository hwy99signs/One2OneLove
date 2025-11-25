# 💬 Community Backend Setup Guide

This guide will help you set up the complete backend for the Community feature where users can create communities, join them, post, comment, like, and share.

## 📋 Overview

The Community feature allows users to:
- **Create Communities** - Users can create their own communities with custom settings
- **Join Communities** - Users can join public communities or request to join private ones
- **Create Posts** - Members can create posts in communities they've joined
- **Comment on Posts** - Users can comment and reply to comments
- **Like Posts/Comments** - Users can like posts and comments
- **Share Posts** - Users can share posts internally or externally

## 🗄️ Database Structure

The backend uses 7 tables:

### 1. `communities` - User-created communities
- Community details (name, description, icon, category)
- Settings (public/private, approval required, member posts allowed)
- Statistics (member_count, post_count - auto-updated)

### 2. `community_members` - Track memberships
- User membership in communities
- Roles (member, moderator, admin)
- Status (pending, active, banned, left)

### 3. `community_posts` - Posts in communities
- Post content (title, content, tags)
- Author information (name, anonymous flag)
- Moderation status
- Engagement metrics (likes, comments, shares, views)

### 4. `post_comments` - Comments on posts
- Comment content
- Parent comment ID (for nested replies)
- Author information
- Likes count

### 5. `post_likes` - Track post likes
- Prevents duplicate likes
- Auto-updates likes_count on posts

### 6. `post_shares` - Track post shares
- Share method (internal, facebook, twitter, etc.)
- Shared to another community (optional)

### 7. `comment_likes` - Track comment likes
- Prevents duplicate likes
- Auto-updates likes_count on comments

## 🚀 Setup Instructions

### Step 1: Run the Database Schema

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Click **SQL Editor** in the left sidebar

2. **Create New Query**
   - Click **New query** button
   - Copy the entire contents of `supabase-communities-schema.sql`
   - Paste it into the SQL Editor

3. **Run the Query**
   - Click **Run** (or press `Ctrl + Enter`)
   - Wait for "Success. No rows returned" message

4. **Verify Tables Created**
   - Go to **Table Editor** in the left sidebar
   - You should see 7 tables:
     - ✅ `communities`
     - ✅ `community_members`
     - ✅ `community_posts`
     - ✅ `post_comments`
     - ✅ `post_likes`
     - ✅ `post_shares`
     - ✅ `comment_likes`

### Step 2: Verify Row Level Security (RLS)

The schema automatically sets up comprehensive RLS policies:

**For `communities`:**
- ✅ Anyone can view public communities
- ✅ Users can view communities they joined
- ✅ Users can create communities
- ✅ Creators can update/delete their communities

**For `community_members`:**
- ✅ Users can view members of public communities
- ✅ Users can join/leave communities
- ✅ Admins/moderators can manage members

**For `community_posts`:**
- ✅ Members can view approved posts in joined communities
- ✅ Members can create posts
- ✅ Authors can update/delete their posts

**For `post_comments`:**
- ✅ Members can view approved comments
- ✅ Members can create comments (if post not locked)
- ✅ Authors can update/delete their comments

**For `post_likes`, `post_shares`, `comment_likes`:**
- ✅ Users can like/unlike posts and comments
- ✅ Users can share posts

### Step 3: Test the Feature

1. **Start your app**: `npm run dev`
2. **Navigate to**: Community page
3. **Click**: "Discussion Forums" tab
4. **Create a community** (if button exists)
5. **Join a community**
6. **Create a post**
7. **Comment on a post**
8. **Like a post**

## 📝 Service Functions

The `communityService.js` provides comprehensive functions:

### Community Operations
```javascript
import { 
  getCommunities,
  getCommunityById,
  createCommunity,
  updateCommunity,
  deleteCommunity,
  joinCommunity,
  leaveCommunity,
  getMyCommunities
} from '@/lib/communityService';

// Get all communities
const communities = await getCommunities('-created_at', 'dating', 'search term');

// Get a specific community
const community = await getCommunityById(communityId);

// Create a community
const newCommunity = await createCommunity({
  name: 'Long Distance Relationships',
  description: 'Support for LDR couples',
  icon: '💕',
  category: 'long_distance',
  is_public: true,
  requires_approval: false
});

// Join a community
await joinCommunity(communityId);

// Leave a community
await leaveCommunity(communityId);

// Get user's communities
const myCommunities = await getMyCommunities();
```

### Post Operations
```javascript
import { 
  getCommunityPosts,
  createPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  togglePostLike,
  sharePost
} from '@/lib/communityService';

// Get posts in a community
const posts = await getCommunityPosts(communityId, '-created_at', 'search');

// Create a post
const newPost = await createPost(communityId, {
  title: 'How we survived 2 years apart',
  content: 'Our story...',
  is_anonymous: false,
  tags: ['long-distance', 'communication']
});

// Like a post
await togglePostLike(postId, isCurrentlyLiked);

// Share a post
await sharePost(postId, 'facebook'); // or 'internal', 'twitter', 'email'
```

### Comment Operations
```javascript
import { 
  getPostComments,
  createComment,
  updateComment,
  deleteComment,
  toggleCommentLike
} from '@/lib/communityService';

// Get comments for a post
const comments = await getPostComments(postId);

// Create a comment
const newComment = await createComment(postId, {
  content: 'Great post!',
  is_anonymous: false
});

// Reply to a comment
const reply = await createComment(postId, {
  content: 'I agree!',
  is_anonymous: false
}, parentCommentId);

// Like a comment
await toggleCommentLike(commentId, isCurrentlyLiked);
```

## 🎨 Community Categories

The system supports these categories:
- `long_distance` - Long Distance Relationships
- `premarital` - Pre-marital
- `marriage` - Marriage
- `dating` - Dating
- `lgbtq` - LGBTQ+
- `parenting` - Parenting
- `conflict_resolution` - Conflict Resolution
- `intimacy` - Intimacy
- `communication` - Communication
- `general` - General

## 🔐 Security Features

1. **Public/Private Communities**: Communities can be public or private
2. **Approval System**: Communities can require approval to join
3. **Member-Only Posts**: Communities can restrict posts to members only
4. **RLS Enabled**: All tables have Row Level Security
5. **User Isolation**: Users can only edit/delete their own content
6. **Moderation**: Posts and comments can be moderated

## 📊 Auto-Updating Counts

The database automatically updates:
- `member_count` - When users join/leave communities
- `post_count` - When posts are created/deleted
- `likes_count` - When posts/comments are liked/unliked
- `comments_count` - When comments are created/deleted
- `shares_count` - When posts are shared

## 🎯 Community Settings

When creating a community, you can set:
- **is_public**: `true` = anyone can view, `false` = members only
- **requires_approval**: `true` = join requests need approval
- **allow_member_posts**: `true` = members can create posts

## 🔍 Search & Filtering

Communities and posts support:
- **Search**: Search in name/description (communities) or title/content (posts)
- **Category Filter**: Filter communities by category
- **Sorting**: Sort by date (newest/oldest)
- **Tag Search**: Search posts by tags

## 🐛 Troubleshooting

### Issue: "User not authenticated" error
**Solution**: Make sure user is logged in before creating communities/posts

### Issue: Can't join community
**Solutions**:
1. Check if community requires approval
2. Verify user is logged in
3. Check RLS policies are active
4. Ensure community exists

### Issue: Can't create posts
**Solutions**:
1. Verify user is a member of the community
2. Check `allow_member_posts` is true
3. Ensure membership status is 'active'
4. Check browser console for errors

### Issue: Counts not updating
**Solutions**:
1. Verify triggers are created
2. Check trigger functions exist
3. Manually run: `SELECT * FROM pg_trigger WHERE tgname LIKE '%community%';`

### Issue: Can't view posts
**Solutions**:
1. Check user is a member of the community
2. Verify post moderation_status is 'approved'
3. Check RLS policies allow viewing
4. Ensure community is public or user is member

## 📈 Performance Indexes

The schema includes these indexes:
- Community indexes (creator_id, category, is_public, created_at)
- Member indexes (community_id, user_id, status)
- Post indexes (community_id, author_id, moderation_status, created_at, is_pinned, tags)
- Comment indexes (post_id, author_id, parent_comment_id, created_at)
- Like/Share indexes (post_id, user_id, comment_id)

## 💡 Feature Ideas

Consider adding these features later:
- Community moderation tools
- Post pinning by admins
- Post locking (disable comments)
- Community announcements
- Member roles (moderator, admin)
- Community rules/guidelines
- Email notifications for new posts
- Post mentions (@username)
- Rich text editor for posts
- Image uploads in posts
- Post reactions (beyond just likes)
- Community analytics

## ✅ Setup Checklist

- [ ] Run SQL script in Supabase SQL Editor
- [ ] Verify 7 tables created
- [ ] Check RLS policies are active
- [ ] Test creating a community
- [ ] Test joining a community
- [ ] Test creating a post
- [ ] Test commenting on a post
- [ ] Test liking a post
- [ ] Test sharing a post
- [ ] Test nested comments (replies)
- [ ] Test search functionality
- [ ] Verify counts update automatically

## 🔄 Integration with UI

The service is ready to be integrated with:
- `src/pages/Community.jsx` - Main community page
- `src/components/community/ForumCard.jsx` - Community card component
- `src/components/community/ForumPostCard.jsx` - Post card component

**Next Step**: Update `Community.jsx` to use `communityService.js` instead of `base44`.

## 📚 Related Files

- **Schema**: `supabase-communities-schema.sql`
- **Service**: `src/lib/communityService.js`
- **Components**: 
  - `src/pages/Community.jsx`
  - `src/components/community/ForumCard.jsx`
  - `src/components/community/ForumPostCard.jsx`

---

**Backend Setup Complete! 🎉**

Your Community feature is now ready to use with full Supabase backend support!

