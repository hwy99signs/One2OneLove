# 💬 Complete Chat Features Backend Setup

This document provides setup instructions for all advanced chat features including reactions, stars, pins, forwards, and conversation management.

## 📋 Table of Contents
1. [Features Overview](#features-overview)
2. [Database Setup](#database-setup)
3. [Frontend Integration](#frontend-integration)
4. [Feature Details](#feature-details)
5. [Testing](#testing)

---

## 🎯 Features Overview

### Message Features
- ✅ **Reactions** - Add emoji reactions to messages (👍 ❤️ 😂 😊 😍 🎉)
- ✅ **Star Messages** - Save important messages for quick access
- ✅ **Pin Messages** - Pin important messages to top of conversation
- ✅ **Forward Messages** - Forward messages to other conversations
- ✅ **Reply to Messages** - Reply to specific messages (thread support)
- ✅ **Copy Messages** - Copy message content to clipboard
- ✅ **Message Info** - View detailed message metadata

### Conversation Features
- ✅ **Mark as Unread** - Mark conversations as unread
- ✅ **Archive Conversations** - Archive old conversations
- ✅ **Clear Messages** - Clear all messages in a conversation
- ✅ **Delete Conversations** - Permanently delete conversations
- ✅ **View Profile** - View other user's profile from chat
- ✅ **Pop-out Chat** - Open chat in separate window

---

## 🗄️ Database Setup

### Step 1: Run SQL Schema

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `supabase-chat-features-schema.sql`
5. Click **Run**

This will create:
- `message_reactions` table
- `starred_messages` table
- `pinned_messages` table
- `forwarded_messages` table
- All necessary RLS policies
- Helper functions for reactions and pins

### Step 2: Verify Tables

Run this query to verify all tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'message_reactions',
    'starred_messages',
    'pinned_messages',
    'forwarded_messages'
);
```

You should see all 4 tables listed.

### Step 3: Test RLS Policies

```sql
-- Test as authenticated user
SET ROLE authenticated;
SET request.jwt.claims.sub = 'your-user-id-here';

-- Try selecting reactions (should work)
SELECT * FROM message_reactions;

-- Try inserting a reaction (should work)
INSERT INTO message_reactions (message_id, user_id, emoji)
VALUES ('some-message-id', 'your-user-id', '👍');

-- Reset role
RESET ROLE;
```

---

## 🔧 Frontend Integration

### Import the Service

```javascript
import chatFeaturesService from '@/lib/chatFeaturesService';
```

### Example: Message Context Menu Component

```javascript
import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Reply,
  Copy,
  Star,
  Pin,
  Forward,
  Trash2,
  Info,
  MoreVertical,
} from 'lucide-react';
import chatFeaturesService from '@/lib/chatFeaturesService';
import { toast } from 'sonner';

export const MessageContextMenu = ({ message, onReply, onRefresh }) => {
  const handleStar = async () => {
    try {
      await chatFeaturesService.toggleStarMessage(message.id);
      toast.success('Message starred');
      onRefresh?.();
    } catch (error) {
      toast.error('Failed to star message');
    }
  };

  const handlePin = async () => {
    try {
      await chatFeaturesService.pinMessage(message.id, message.conversation_id);
      toast.success('Message pinned');
      onRefresh?.();
    } catch (error) {
      toast.error('Failed to pin message');
    }
  };

  const handleCopy = async () => {
    try {
      await chatFeaturesService.copyMessageContent(message.content);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleInfo = async () => {
    try {
      const info = await chatFeaturesService.getMessageInfo(message.id);
      // Display info in a dialog
      console.log('Message info:', info);
    } catch (error) {
      toast.error('Failed to get message info');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-1 hover:bg-gray-100 rounded">
          <MoreVertical className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onReply?.(message)}>
          <Reply className="w-4 h-4 mr-2" />
          Reply
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopy}>
          <Copy className="w-4 h-4 mr-2" />
          Copy
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleStar}>
          <Star className="w-4 h-4 mr-2" />
          Star
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePin}>
          <Pin className="w-4 h-4 mr-2" />
          Pin
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleInfo}>
          <Info className="w-4 h-4 mr-2" />
          Info
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
```

### Example: Message Reactions Component

```javascript
import React, { useState, useEffect } from 'react';
import chatFeaturesService from '@/lib/chatFeaturesService';
import { Plus } from 'lucide-react';

const COMMON_EMOJIS = ['👍', '❤️', '😂', '😊', '😍', '🎉'];

export const MessageReactions = ({ messageId }) => {
  const [reactions, setReactions] = useState([]);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    loadReactions();
  }, [messageId]);

  const loadReactions = async () => {
    try {
      const data = await chatFeaturesService.getMessageReactions(messageId);
      setReactions(data);
    } catch (error) {
      console.error('Failed to load reactions:', error);
    }
  };

  const handleToggleReaction = async (emoji) => {
    try {
      await chatFeaturesService.toggleReaction(messageId, emoji);
      loadReactions(); // Refresh
    } catch (error) {
      console.error('Failed to toggle reaction:', error);
    }
  };

  return (
    <div className="flex items-center gap-1 mt-1 flex-wrap">
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => handleToggleReaction(reaction.emoji)}
          className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 transition-colors ${
            reaction.userReacted
              ? 'bg-blue-100 border-blue-300'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          <span>{reaction.emoji}</span>
          <span className="text-xs">{reaction.count}</span>
        </button>
      ))}
      
      {/* Quick reaction picker */}
      {showPicker ? (
        <div className="flex gap-1">
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                handleToggleReaction(emoji);
                setShowPicker(false);
              }}
              className="hover:scale-125 transition-transform text-lg"
            >
              {emoji}
            </button>
          ))}
        </div>
      ) : (
        <button
          onClick={() => setShowPicker(true)}
          className="p-1 hover:bg-gray-100 rounded-full"
        >
          <Plus className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
```

### Example: Conversation Context Menu

```javascript
import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  User,
  Mail,
  Pin,
  Archive,
  Trash2,
  MoreVertical,
  ExternalLink,
} from 'lucide-react';
import chatFeaturesService from '@/lib/chatFeaturesService';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/lib/utils';

export const ConversationContextMenu = ({ conversation, onRefresh }) => {
  const navigate = useNavigate();

  const handleMarkUnread = async () => {
    try {
      await chatFeaturesService.markConversationAsUnread(conversation.id);
      toast.success('Marked as unread');
      onRefresh?.();
    } catch (error) {
      toast.error('Failed to mark as unread');
    }
  };

  const handleArchive = async () => {
    try {
      await chatFeaturesService.archiveConversation(
        conversation.id,
        !conversation.isArchived
      );
      toast.success(conversation.isArchived ? 'Unarchived' : 'Archived');
      onRefresh?.();
    } catch (error) {
      toast.error('Failed to archive');
    }
  };

  const handleClearMessages = async () => {
    if (!confirm('Clear all messages in this conversation?')) return;
    
    try {
      await chatFeaturesService.clearConversationMessages(conversation.id);
      toast.success('Messages cleared');
      onRefresh?.();
    } catch (error) {
      toast.error('Failed to clear messages');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this conversation permanently?')) return;
    
    try {
      await chatFeaturesService.deleteConversation(conversation.id);
      toast.success('Conversation deleted');
      onRefresh?.();
    } catch (error) {
      toast.error('Failed to delete conversation');
    }
  };

  const handleViewProfile = () => {
    navigate(`${createPageUrl('Profile')}?userId=${conversation.otherUserId}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-1 hover:bg-gray-100 rounded">
          <MoreVertical className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleViewProfile}>
          <User className="w-4 h-4 mr-2" />
          View Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleMarkUnread}>
          <Mail className="w-4 h-4 mr-2" />
          Mark as unread
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleArchive}>
          <Archive className="w-4 h-4 mr-2" />
          {conversation.isArchived ? 'Unarchive' : 'Archive'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleClearMessages}>
          <Trash2 className="w-4 h-4 mr-2" />
          Clear messages
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDelete} className="text-red-600">
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
```

---

## 📚 Feature Details

### 1. Message Reactions

**Add/Remove Reaction:**
```javascript
await chatFeaturesService.toggleReaction(messageId, '👍');
```

**Get All Reactions:**
```javascript
const reactions = await chatFeaturesService.getMessageReactions(messageId);
// Returns: [{ emoji: '👍', count: 5, userReacted: true }, ...]
```

### 2. Starred Messages

**Star/Unstar Message:**
```javascript
const result = await chatFeaturesService.toggleStarMessage(messageId);
// Returns: { success: true, starred: true/false }
```

**Get All Starred Messages:**
```javascript
const starredMessages = await chatFeaturesService.getStarredMessages();
```

**Check if Starred:**
```javascript
const isStarred = await chatFeaturesService.isMessageStarred(messageId);
```

### 3. Pinned Messages

**Pin Message:**
```javascript
// Pin without expiry
await chatFeaturesService.pinMessage(messageId, conversationId);

// Pin with expiry (7 days)
const expiryDate = new Date();
expiryDate.setDate(expiryDate.getDate() + 7);
await chatFeaturesService.pinMessage(messageId, conversationId, expiryDate);
```

**Unpin Message:**
```javascript
await chatFeaturesService.unpinMessage(messageId, conversationId);
```

**Get Pinned Messages:**
```javascript
const pinnedMessages = await chatFeaturesService.getPinnedMessages(conversationId);
```

### 4. Forward Messages

**Forward to Another Conversation:**
```javascript
const result = await chatFeaturesService.forwardMessage(
  messageId,
  targetConversationId
);
// Returns: { success: true, newMessageId: '...' }
```

### 5. Conversation Management

**Mark as Unread:**
```javascript
await chatFeaturesService.markConversationAsUnread(conversationId);
```

**Archive/Unarchive:**
```javascript
// Archive
await chatFeaturesService.archiveConversation(conversationId, true);

// Unarchive
await chatFeaturesService.archiveConversation(conversationId, false);
```

**Clear All Messages:**
```javascript
await chatFeaturesService.clearConversationMessages(conversationId);
```

**Delete Conversation:**
```javascript
await chatFeaturesService.deleteConversation(conversationId);
```

### 6. Utilities

**Copy Message:**
```javascript
await chatFeaturesService.copyMessageContent(messageContent);
```

**Get Message Info:**
```javascript
const info = await chatFeaturesService.getMessageInfo(messageId);
// Returns full message metadata including reactions count, starred status, etc.
```

---

## 🧪 Testing

### Test Message Reactions

1. Send a message
2. Click the reaction button
3. Select an emoji (👍)
4. Verify the reaction appears with count
5. Click again to remove reaction
6. Verify it disappears

### Test Starred Messages

1. Long-press or right-click a message
2. Click "Star"
3. Go to starred messages view
4. Verify message appears
5. Unstar and verify it's removed

### Test Pinned Messages

1. Right-click a message
2. Click "Pin"
3. Verify message appears at top of chat
4. Unpin and verify it returns to normal position

### Test Forward

1. Right-click a message
2. Click "Forward"
3. Select a conversation
4. Verify message appears in target conversation
5. Check forwarding history

### Test Conversation Options

1. Right-click a conversation
2. Test "Mark as unread" - verify unread badge appears
3. Test "Archive" - verify conversation moves to archive
4. Test "Clear messages" - verify messages are cleared
5. Test "Delete" - verify conversation is removed

---

## 🎨 UI Integration Tips

### 1. Message Long Press (Mobile)

```javascript
const [pressTimer, setPressTimer] = useState(null);

const handleTouchStart = () => {
  const timer = setTimeout(() => {
    // Show context menu
    setShowContextMenu(true);
  }, 500); // 500ms long press
  setPressTimer(timer);
};

const handleTouchEnd = () => {
  if (pressTimer) {
    clearTimeout(pressTimer);
  }
};

return (
  <div
    onTouchStart={handleTouchStart}
    onTouchEnd={handleTouchEnd}
    onContextMenu={(e) => {
      e.preventDefault();
      setShowContextMenu(true);
    }}
  >
    {/* Message content */}
  </div>
);
```

### 2. Reaction Picker Animation

```css
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.reaction-picker {
  animation: slideIn 0.2s ease-out;
}
```

### 3. Pinned Messages Banner

```javascript
export const PinnedMessagesBanner = ({ conversationId }) => {
  const [pinnedMessages, setPinnedMessages] = useState([]);

  useEffect(() => {
    loadPinnedMessages();
  }, [conversationId]);

  const loadPinnedMessages = async () => {
    const messages = await chatFeaturesService.getPinnedMessages(conversationId);
    setPinnedMessages(messages);
  };

  if (pinnedMessages.length === 0) return null;

  return (
    <div className="bg-blue-50 border-b border-blue-200 p-3">
      <div className="flex items-center gap-2">
        <Pin className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-medium text-blue-900">
          {pinnedMessages.length} pinned message(s)
        </span>
      </div>
      {pinnedMessages.map((msg) => (
        <div key={msg.id} className="mt-2 text-sm text-gray-700 truncate">
          {msg.content}
        </div>
      ))}
    </div>
  );
};
```

---

## 🔐 Security Notes

- All features respect RLS policies
- Users can only react/star/pin messages they have access to
- Forwarding requires access to both source and target conversations
- Conversation deletion requires user to be a participant
- All operations are logged in their respective tables

---

## 📝 Summary

You now have a complete chat features backend with:

✅ Message reactions with emoji support  
✅ Star/favorite messages for quick access  
✅ Pin important messages to conversations  
✅ Forward messages between conversations  
✅ Archive old conversations  
✅ Mark conversations as unread  
✅ Clear or delete entire conversations  
✅ Copy message content  
✅ View detailed message information  

All features are:
- ✅ Fully secured with RLS
- ✅ Optimized with indexes
- ✅ Ready for real-time updates
- ✅ Mobile and desktop friendly

---

## 🆘 Need Help?

If you encounter issues:

1. Check Supabase logs in Dashboard > Logs
2. Verify RLS policies are active
3. Test with console.log in service functions
4. Check browser console for errors
5. Verify user authentication status

Common issues:
- **RLS Error**: Check if policies exist and user is authenticated
- **Foreign Key Error**: Ensure message/conversation IDs are valid
- **Not showing**: Verify the query filters are correct

