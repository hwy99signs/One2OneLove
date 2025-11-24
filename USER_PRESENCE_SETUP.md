# 👥 User Presence System - Online/Offline Status

Complete implementation guide for real-time online/offline status tracking with "last seen" timestamps.

## 📋 Table of Contents
1. [Features Overview](#features-overview)
2. [Database Setup](#database-setup)
3. [Frontend Integration](#frontend-integration)
4. [UI Components](#ui-components)
5. [Testing](#testing)

---

## 🎯 Features Overview

### Core Features
- ✅ **Real-time Online/Offline Status** - See who's online in real-time
- ✅ **Last Seen Timestamps** - "Last seen 5 mins ago", "Just now", etc.
- ✅ **Automatic Heartbeat** - Keeps users online automatically
- ✅ **Multiple Status Types** - Online, Offline, Away, Busy
- ✅ **Presence Indicators** - Green dot for online, gray for offline
- ✅ **Stale Cleanup** - Auto-marks inactive users as offline
- ✅ **Tab Visibility Detection** - Pauses when tab is hidden
- ✅ **Offline Detection** - Handles browser going offline

### Display Formats
```
🟢 Online
⚫ Last seen 5 mins ago
⚫ Last seen 2 hours ago
⚫ Last seen yesterday
⚫ Long time ago
```

---

## 🗄️ Database Setup

### Step 1: Run SQL Schema

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `supabase-user-presence-schema.sql`
5. Click **Run**

This will create:
- ✅ `user_presence` table
- ✅ Helper functions (`update_user_presence`, `heartbeat_user_presence`, etc.)
- ✅ RLS policies for security
- ✅ Real-time subscriptions enabled
- ✅ Automatic timestamp updates
- ✅ Presence view for easy querying

### Step 2: Verify Setup

Run this query to verify:

```sql
-- Check if table exists
SELECT * FROM public.user_presence LIMIT 1;

-- Check if functions exist
SELECT proname FROM pg_proc 
WHERE proname LIKE '%presence%';

-- Check if realtime is enabled
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE tablename = 'user_presence';
```

### Step 3: Enable Realtime in Supabase Dashboard

1. Go to **Database** > **Replication**
2. Find `user_presence` table
3. Enable replication for **INSERT**, **UPDATE**, and **DELETE**

---

## 🔧 Frontend Integration

### Step 1: Initialize Presence on Login

Update your `AuthContext.jsx`:

```javascript
import { initializePresence, cleanupPresence } from '@/lib/presenceService';

// In your login function, after successful login:
const login = async (email, password) => {
  // ... existing login code ...
  
  if (result.success) {
    // Initialize presence tracking
    await initializePresence();
    
    // ... rest of login code ...
  }
};

// In your logout function:
const logout = async () => {
  // Clean up presence before logging out
  await cleanupPresence();
  
  // ... existing logout code ...
};
```

### Step 2: Initialize on App Load

Update your `Layout.jsx` or main App component:

```javascript
import { useEffect } from 'react';
import { initializePresence, cleanupPresence } from '@/lib/presenceService';
import { useAuth } from '@/contexts/AuthContext';

export const Layout = () => {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      // Initialize presence when user is authenticated
      initializePresence();
    }

    return () => {
      // Cleanup on unmount
      if (isAuthenticated) {
        cleanupPresence();
      }
    };
  }, [isAuthenticated]);

  // ... rest of layout code ...
};
```

---

## 🎨 UI Components

### 1. Chat Header with Online Status

Update your chat header to show online/offline status:

```javascript
import { UserPresenceBadge } from '@/components/presence/UserPresenceIndicator';

export const ChatHeader = ({ user }) => {
  return (
    <div className="flex items-center gap-3 p-4 border-b">
      <img
        src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
        alt={user.name}
        className="w-10 h-10 rounded-full"
      />
      <div className="flex-1">
        <h2 className="font-semibold">{user.name}</h2>
        {/* Show online/offline status */}
        <UserPresenceBadge 
          userId={user.id} 
          showDot={true} 
          showText={true} 
          size="sm" 
        />
      </div>
      {/* ... action buttons ... */}
    </div>
  );
};
```

### 2. Conversation List with Status Indicators

```javascript
import { AvatarWithStatus } from '@/components/presence/UserPresenceIndicator';

export const ConversationItem = ({ conversation, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
    >
      {/* Avatar with online status indicator */}
      <AvatarWithStatus
        userId={conversation.otherUserId}
        avatarUrl={conversation.avatar}
        name={conversation.name}
        size="md"
        showStatus={true}
      />
      
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold truncate">{conversation.name}</h3>
        <p className="text-sm text-gray-500 truncate">
          {conversation.lastMessage}
        </p>
      </div>
      
      {conversation.unreadCount > 0 && (
        <span className="bg-purple-500 text-white text-xs rounded-full px-2 py-1">
          {conversation.unreadCount}
        </span>
      )}
    </div>
  );
};
```

### 3. Buddy Cards with Online Status

```javascript
import { UserPresenceBadge, OnlineStatusDot } from '@/components/presence/UserPresenceIndicator';

export const BuddyCard = ({ buddy }) => {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="relative">
          <img
            src={buddy.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${buddy.email}`}
            alt={buddy.name}
            className="w-16 h-16 rounded-full"
          />
          {/* Online indicator overlay */}
          <span className="absolute bottom-0 right-0">
            <OnlineStatusDot isOnline={true} size="md" />
          </span>
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold">{buddy.name}</h3>
          {/* Show online/last seen */}
          <UserPresenceBadge 
            userId={buddy.id} 
            showDot={false} 
            showText={true} 
          />
          <p className="text-sm text-gray-600 mt-1">{buddy.bio}</p>
        </div>
      </div>
      
      {/* ... action buttons ... */}
    </div>
  );
};
```

### 4. Find Buddies Page with Online Users

```javascript
import { OnlineUsersCounter } from '@/components/presence/UserPresenceIndicator';
import { AvatarWithStatus } from '@/components/presence/UserPresenceIndicator';

export const FindBuddies = () => {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Find Buddies</h1>
        {/* Show online users count */}
        <OnlineUsersCounter />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => (
          <div key={user.id} className="bg-white rounded-lg p-4 shadow">
            {/* Avatar with status */}
            <AvatarWithStatus
              userId={user.id}
              avatarUrl={user.avatar_url}
              name={user.name}
              size="xl"
              showStatus={true}
            />
            {/* ... user details ... */}
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 5. User Profile with Status Selector

```javascript
import { PresenceStatusSelector, UserPresenceBadge } from '@/components/presence/UserPresenceIndicator';
import { updateUserStatus } from '@/lib/presenceService';
import { toast } from 'sonner';

export const UserProfile = () => {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('online');

  const handleStatusChange = async (newStatus) => {
    try {
      await updateUserStatus(newStatus);
      setCurrentStatus(newStatus);
      setShowStatusMenu(false);
      toast.success(`Status changed to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-4">
        <img
          src={user.avatar_url}
          alt={user.name}
          className="w-20 h-20 rounded-full"
        />
        <div>
          <h1 className="text-2xl font-bold">{user.name}</h1>
          
          {/* Clickable status */}
          <button 
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className="mt-1"
          >
            <UserPresenceBadge 
              userId={user.id} 
              showDot={true} 
              showText={true} 
            />
          </button>
          
          {/* Status selector dropdown */}
          {showStatusMenu && (
            <div className="mt-2">
              <PresenceStatusSelector
                currentStatus={currentStatus}
                onStatusChange={handleStatusChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

---

## 📚 API Reference

### Presence Service Functions

#### `initializePresence()`
Initializes presence tracking system. Call when user logs in.

```javascript
import { initializePresence } from '@/lib/presenceService';

await initializePresence();
```

#### `cleanupPresence()`
Cleans up presence tracking. Call when user logs out.

```javascript
import { cleanupPresence } from '@/lib/presenceService';

await cleanupPresence();
```

#### `setUserOnline()`
Manually set user as online.

```javascript
import { setUserOnline } from '@/lib/presenceService';

await setUserOnline();
```

#### `setUserOffline()`
Manually set user as offline.

```javascript
import { setUserOffline } from '@/lib/presenceService';

await setUserOffline();
```

#### `updateUserStatus(status)`
Update user status. Options: `'online'`, `'offline'`, `'away'`, `'busy'`

```javascript
import { updateUserStatus } from '@/lib/presenceService';

await updateUserStatus('away');
```

#### `getUserPresence(userId)`
Get presence status for a specific user.

```javascript
import { getUserPresence } from '@/lib/presenceService';

const presence = await getUserPresence(userId);
// Returns: { user_id, status, is_online, last_seen_text, last_seen, ... }
```

#### `getMultipleUserPresence(userIds)`
Get presence for multiple users at once.

```javascript
import { getMultipleUserPresence } from '@/lib/presenceService';

const presenceMap = await getMultipleUserPresence([userId1, userId2, userId3]);
// Returns: { [userId]: { is_online, last_seen_text, ... }, ... }
```

#### `getOnlineUsers()`
Get all currently online users.

```javascript
import { getOnlineUsers } from '@/lib/presenceService';

const onlineUsers = await getOnlineUsers();
// Returns: [{ user_id, status, last_seen, name, email, ... }, ...]
```

#### `getOnlineUsersCount()`
Get total count of online users.

```javascript
import { getOnlineUsersCount } from '@/lib/presenceService';

const count = await getOnlineUsersCount();
// Returns: 42
```

#### `subscribeToPresence(callback, userIds)`
Subscribe to real-time presence changes.

```javascript
import { subscribeToPresence } from '@/lib/presenceService';

const subscription = subscribeToPresence((payload) => {
  console.log('Presence changed:', payload);
  // Refresh your UI here
}, [userId1, userId2]); // Optional: specific users to watch

// Later: unsubscribe
subscription.unsubscribe();
```

---

## 🧪 Testing

### Test 1: Basic Online/Offline

1. Sign in with User A
2. Open another browser/incognito with User B
3. Go to chat or buddy list
4. Verify User A shows "Online" for User B
5. Close User B's tab
6. Wait 5-10 seconds
7. Verify User A now shows "Last seen X ago" for User B

### Test 2: Real-time Updates

1. Open User A in one browser
2. Open User B in another browser
3. In User A, go to chat with User B
4. In User B, close the tab
5. Verify User A's chat header updates to "Offline" automatically

### Test 3: Last Seen Timestamp

1. Sign in as User A
2. Wait 2 minutes
3. Sign in as User B
4. Check User A's profile
5. Verify it shows "Last seen 2 mins ago"

### Test 4: Heartbeat System

1. Sign in and monitor browser console
2. Look for "💓 Sending heartbeat" logs every 30 seconds
3. Verify user stays online
4. Open DevTools Network tab
5. Filter for `heartbeat_user_presence`
6. Verify calls every 30 seconds

### Test 5: Tab Visibility

1. Sign in and open chat
2. Switch to another tab for 2 minutes
3. Switch back
4. Verify heartbeat resumes
5. Check presence status is still online

---

## 🎨 Styling Examples

### Custom Status Indicator

```css
/* Animated pulse for online status */
@keyframes pulse-green {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.online-pulse {
  animation: pulse-green 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

### Status Badge Variations

```javascript
// Small inline badge
<UserPresenceBadge userId={userId} showDot={true} showText={false} size="xs" />

// Full status with text
<UserPresenceBadge userId={userId} showDot={true} showText={true} size="sm" />

// Just text, no dot
<UserPresenceBadge userId={userId} showDot={false} showText={true} />

// Avatar with overlay
<AvatarWithStatus userId={userId} avatarUrl={avatar} name={name} size="lg" />
```

---

## 🔐 Security Notes

- ✅ RLS policies ensure users can only update their own presence
- ✅ All users can view other users' presence (public info)
- ✅ Last seen timestamps are automatically managed
- ✅ Heartbeat function uses SECURITY DEFINER for reliability
- ✅ Stale presence cleanup runs automatically

---

## ⚙️ Configuration

### Adjust Online Threshold

By default, users are considered online if active within 5 minutes. To change this, edit the SQL functions:

```sql
-- Change 5 minutes to 3 minutes
WHERE last_active > NOW() - INTERVAL '3 minutes'
```

### Adjust Heartbeat Interval

By default, heartbeat sends every 30 seconds. To change:

```javascript
// In presenceService.js, change:
}, 30000); // 30 seconds

// To:
}, 60000); // 60 seconds
```

---

## 🆘 Troubleshooting

### Status Not Updating

1. Check if realtime is enabled in Supabase
2. Verify heartbeat is running (check console logs)
3. Check RLS policies are set correctly
4. Ensure `initializePresence()` is called on login

### "Last seen" Shows Wrong Time

1. Verify your database timezone is correct
2. Check if `last_active` is being updated
3. Look for heartbeat errors in console
4. Test the `formatLastSeen` function

### Users Always Show Offline

1. Check if user_presence table has records
2. Verify heartbeat function is running
3. Check for JavaScript errors in console
4. Ensure `setUserOnline()` is called

---

## 📝 Summary

You now have a complete presence system with:

✅ Real-time online/offline tracking  
✅ Last seen timestamps  
✅ Automatic heartbeat system  
✅ Multiple status types (online, away, busy, offline)  
✅ React components for easy integration  
✅ Tab visibility detection  
✅ Offline/online browser detection  
✅ Automatic stale presence cleanup  

All features are production-ready and optimized for performance! 🚀

