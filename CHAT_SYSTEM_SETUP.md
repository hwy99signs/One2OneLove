# 💬 Chat System Setup Guide

This guide will help you set up the complete chat/messaging system with Supabase backend.

## 📋 Table of Contents
1. [Database Setup](#database-setup)
2. [Storage Setup](#storage-setup)
3. [Testing the System](#testing-the-system)
4. [Features](#features)
5. [Troubleshooting](#troubleshooting)

---

## 🗄️ Database Setup

### Step 1: Run the SQL Schema

1. Go to your **Supabase Dashboard** → **SQL Editor**
2. Open the file `supabase-chat-schema.sql` from your project root
3. **Copy all the SQL code** and paste it into the SQL Editor
4. Click **"Run"** to execute

This will create:
- ✅ `conversations` table (stores chat metadata between users)
- ✅ `messages` table (stores all messages)
- ✅ Indexes for performance
- ✅ Row Level Security (RLS) policies
- ✅ Triggers for automatic updates
- ✅ Helper function `get_or_create_conversation()`

### Step 2: Verify Tables Created

Run this query to verify:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('conversations', 'messages');
```

You should see both tables listed.

### Step 3: Check RLS Policies

Run this to check RLS is enabled and policies are created:

```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('conversations', 'messages');
```

You should see multiple policies for each table.

---

## 📦 Storage Setup

### Step 1: Create Storage Bucket

1. Go to **Supabase Dashboard** → **Storage**
2. Click **"New bucket"**
3. Name: `chat-files`
4. **Public bucket:** ✅ Yes (so files are accessible via public URL)
5. Click **"Create bucket"**

### Step 2: Set Storage Policies

Go to **Storage** → **chat-files** → **Policies** and add these:

#### Policy 1: Allow Authenticated Users to Upload
```sql
CREATE POLICY "Authenticated users can upload chat files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);
```

#### Policy 2: Allow Public Read Access
```sql
CREATE POLICY "Public can view chat files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chat-files');
```

#### Policy 3: Allow Users to Delete Their Own Files
```sql
CREATE POLICY "Users can delete their own chat files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 🧪 Testing the System

### Step 1: Sign in to Your App
Make sure you're signed in with a valid user account.

### Step 2: Test Chat Creation
1. Go to **Community** → **Buddy System**
2. Find a friend and click **"Message [Name]"**
3. You should be taken to the **Chat page**

### Step 3: Send a Message
1. Type a message and hit Enter
2. Check the browser console for logs:
   - `📤 Sending message:`
   - `✅ Message sent:`
3. The message should appear in the chat window

### Step 4: Check Database
Go to Supabase **Table Editor** → `messages` table and verify your message is there.

### Step 5: Test Real-Time Updates
1. Open the same chat in **two different browser windows** (or Incognito)
2. Send a message from one window
3. It should appear in the other window automatically! 🎉

---

## ✨ Features

### Core Features
- ✅ **One-on-one messaging** between users
- ✅ **Real-time message delivery** (using Supabase Realtime)
- ✅ **Message read status** (read/unread)
- ✅ **Message editing** (edit your own messages)
- ✅ **Message deletion** (soft delete)
- ✅ **Conversation management** (pin, mute, archive)
- ✅ **Unread message count** per conversation
- ✅ **Last message preview** in conversation list

### Message Types Supported
- 📝 **Text messages**
- 🖼️ **Image messages** (via file upload to storage)
- 🎥 **Video messages** (via file upload)
- 🎤 **Voice notes** (via file upload)
- 📄 **Document sharing** (via file upload)
- 📍 **Location sharing** (lat/lng coordinates)

### Conversation Features
- 📌 **Pin conversations** to top
- 🔇 **Mute notifications** for specific chats
- 📦 **Archive conversations** to hide them
- 🗑️ **Delete conversations** entirely

### Real-Time Features
- 🔔 **Live message updates** (no refresh needed)
- ⚡ **Instant delivery status**
- 🟢 **Online status** (coming soon)
- ✅ **Typing indicators** (coming soon)

---

## 🐛 Troubleshooting

### Issue 1: "No conversations yet" showing but I sent messages
**Solution:**
1. Check if the conversation was created in Supabase:
   ```sql
   SELECT * FROM public.conversations WHERE user1_id = 'YOUR_USER_ID' OR user2_id = 'YOUR_USER_ID';
   ```
2. Check RLS policies are enabled on `conversations` table
3. Make sure you're authenticated (check `user` in Auth context)

### Issue 2: Messages not sending
**Solution:**
1. Open browser console and check for errors
2. Verify the `messages` table has proper RLS policies
3. Check that the conversation exists:
   ```sql
   SELECT * FROM public.conversations WHERE id = 'CONVERSATION_ID';
   ```
4. Make sure the `get_or_create_conversation()` function exists

### Issue 3: Real-time updates not working
**Solution:**
1. Go to **Supabase Dashboard** → **Database** → **Replication**
2. Make sure `messages` and `conversations` tables have **replication enabled**
3. Check browser console for subscription logs: `🔔 Subscribing to real-time messages`
4. Try refreshing the page to re-establish the connection

### Issue 4: File uploads failing
**Solution:**
1. Verify the `chat-files` storage bucket exists
2. Check storage policies are set correctly
3. Make sure the bucket is **public**
4. Check file size (Supabase has upload limits)

### Issue 5: "User not authenticated" error
**Solution:**
1. Sign out and sign back in
2. Clear browser cache and cookies
3. Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in `.env`
4. Verify Supabase session is persisting (check `localStorage`)

### Issue 6: Can't see messages from other users
**Solution:**
1. Check RLS policies on `messages` table:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'messages';
   ```
2. The policy should allow viewing messages where you're sender OR receiver
3. Make sure the `receiver_id` is correctly set in messages

---

## 🔍 Useful SQL Queries for Debugging

### Check all your conversations:
```sql
SELECT 
  c.*,
  u1.name as user1_name,
  u2.name as user2_name
FROM public.conversations c
LEFT JOIN public.users u1 ON c.user1_id = u1.id
LEFT JOIN public.users u2 ON c.user2_id = u2.id
WHERE c.user1_id = 'YOUR_USER_ID' OR c.user2_id = 'YOUR_USER_ID'
ORDER BY c.last_message_time DESC;
```

### Check all messages in a conversation:
```sql
SELECT 
  m.*,
  sender.name as sender_name,
  receiver.name as receiver_name
FROM public.messages m
LEFT JOIN public.users sender ON m.sender_id = sender.id
LEFT JOIN public.users receiver ON m.receiver_id = receiver.id
WHERE m.conversation_id = 'CONVERSATION_ID'
ORDER BY m.created_at ASC;
```

### Check unread messages:
```sql
SELECT COUNT(*) as unread_count
FROM public.messages
WHERE receiver_id = 'YOUR_USER_ID' AND is_read = false;
```

### Reset unread count for testing:
```sql
UPDATE public.conversations
SET user1_unread_count = 0, user2_unread_count = 0
WHERE user1_id = 'YOUR_USER_ID' OR user2_id = 'YOUR_USER_ID';
```

---

## 🚀 Next Steps

1. **Enable Real-Time:** Make sure Supabase Realtime is enabled for `messages` and `conversations` tables
2. **Add Online Status:** Implement user presence tracking
3. **Add Typing Indicators:** Show when the other user is typing
4. **Add Voice/Video Calls:** Integrate WebRTC for live calls
5. **Add Message Reactions:** Allow users to react to messages with emojis
6. **Add Message Search:** Search through message history
7. **Add Media Gallery:** View all shared images/videos in one place

---

## 📝 Code Structure

### Files Created/Modified:
- `supabase-chat-schema.sql` - Database schema and policies
- `src/lib/chatService.js` - All chat API functions
- `src/pages/Chat.jsx` - Main chat page (uses real data)
- `src/components/community/BuddyCard.jsx` - Added "Message" button navigation

### Key Functions in `chatService.js`:
- `getMyConversations()` - Fetch all user's conversations
- `getOrCreateConversation(otherUserId)` - Get/create chat with another user
- `getMessages(conversationId)` - Fetch messages for a chat
- `sendMessage(...)` - Send a text message
- `sendFileMessage(...)` - Send image/video/file
- `sendLocationMessage(...)` - Share location
- `markMessagesAsRead(...)` - Mark messages as read
- `editMessage(...)` - Edit a message
- `deleteMessage(...)` - Delete a message
- `updateConversationSettings(...)` - Pin/mute/archive chat
- `subscribeToMessages(...)` - Real-time message subscription
- `subscribeToConversations(...)` - Real-time conversation updates

---

## 🎉 Success Indicators

You'll know the system is working when:
- ✅ You can see existing conversations in the chat list
- ✅ Clicking "Message" on a friend card opens the chat
- ✅ Messages send and appear instantly
- ✅ Messages from buddies appear in real-time
- ✅ Unread counts update correctly
- ✅ Last message preview shows in conversation list
- ✅ You can edit and delete your own messages
- ✅ Files can be uploaded and shared

---

## 📞 Support

If you run into issues:
1. Check the browser console for error logs
2. Check Supabase logs in the Dashboard
3. Verify all RLS policies are correct
4. Make sure Realtime is enabled
5. Test with simple SQL queries in Supabase SQL Editor

**Happy chatting! 💬✨**

