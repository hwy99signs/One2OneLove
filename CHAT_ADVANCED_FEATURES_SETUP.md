# 💬 Advanced Chat Features Backend Setup

This document provides setup instructions for advanced chat features including **Reply**, **Forward**, **Pin**, and **Message Info** (status tracking).

## 📋 Table of Contents
1. [Features Overview](#features-overview)
2. [Database Setup](#database-setup)
3. [Service Layer](#service-layer)
4. [Feature Details](#feature-details)
5. [Frontend Integration](#frontend-integration)

---

## 🎯 Features Overview

### 1. **Reply to Messages** 📩
- Reply to specific messages in a conversation
- Shows the original message context above the reply
- WhatsApp-like reply functionality

### 2. **Forward Messages** ⏩
- Forward messages to other conversations
- Support for forwarding to multiple conversations
- Tracks forwarding history

### 3. **Pin Messages** 📌
- Pin important messages to the top of conversation
- Optional expiry dates (24 hours, 7 days, 30 days)
- Multiple pins per conversation

### 4. **Message Info** ℹ️
- View detailed message metadata
- Track message status: **Sent**, **Delivered**, **Read**
- View timestamps for each status
- See sender/receiver information

---

## 🗄️ Database Setup

### Step 1: Run Message Status Tracking SQL

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `supabase-chat-message-status-tracking.sql`
5. Click **Run**

This will:
- Add `delivered_at` and `read_at` columns to `messages` table
- Create helper functions for marking messages as delivered/read
- Update existing messages with default timestamps

### Step 2: Verify Schema

Run this query to verify the columns exist:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND column_name IN ('delivered_at', 'read_at', 'reply_to_id')
ORDER BY column_name;
```

You should see:
- `delivered_at` (timestamp with time zone)
- `read_at` (timestamp with time zone)
- `reply_to_id` (uuid) - already exists from previous setup

---

## 🔧 Service Layer

All features are implemented in the service layer:

### Files Updated:
- `src/lib/chatService.js` - Core messaging functions
- `src/lib/chatFeaturesService.js` - Advanced features

### Key Functions:

#### Reply to Message
```javascript
import { sendMessage } from '@/lib/chatService';

// Send a reply to a specific message
const reply = await sendMessage(
  conversationId,
  receiverId,
  "This is my reply",
  'text',
  replyToMessageId  // ID of message being replied to
);
```

#### Forward Message
```javascript
import { forwardMessage, forwardMessageToMultiple } from '@/lib/chatFeaturesService';

// Forward to single conversation
const result = await forwardMessage(messageId, targetConversationId);

// Forward to multiple conversations
const results = await forwardMessageToMultiple(messageId, [convId1, convId2, convId3]);
```

#### Pin Message
```javascript
import { pinMessage, unpinMessage, getPinnedMessages } from '@/lib/chatFeaturesService';

// Pin a message (with optional expiry)
const expiresAt = new Date();
expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
await pinMessage(messageId, conversationId, expiresAt);

// Get all pinned messages
const pinned = await getPinnedMessages(conversationId);

// Unpin a message
await unpinMessage(messageId, conversationId);
```

#### Message Status Tracking
```javascript
import { 
  markMessageDelivered, 
  markMessageRead,
  getMessageInfo 
} from '@/lib/chatService';

// Mark message as delivered (called when message is received)
await markMessageDelivered(messageId);

// Mark message as read (called when user views message)
await markMessageRead(messageId);

// Get full message info with status
const info = await getMessageInfo(messageId);
// Returns: { sent_at, delivered_at, read_at, status, ... }
```

---

## 📝 Feature Details

### 1. Reply Functionality

**How it works:**
- When a user replies to a message, the `reply_to_id` field is set
- The original message context is fetched and included in the message object
- Frontend displays the original message above the reply

**Database:**
- `messages.reply_to_id` - References the original message
- Already exists in schema, no migration needed

**Service:**
- `sendMessage()` now accepts optional `replyToId` parameter
- `getMessages()` automatically fetches reply context
- `getMessageWithReply()` fetches a single message with its reply context

### 2. Forward Functionality

**How it works:**
- User selects a message to forward
- User selects one or more conversations to forward to
- New messages are created in target conversations
- Forwarding history is tracked in `forwarded_messages` table

**Database:**
- `forwarded_messages` table - Already exists
- Tracks: original message, new message, forwarder, target conversation

**Service:**
- `forwardMessage()` - Forward to single conversation
- `forwardMessageToMultiple()` - Forward to multiple conversations
- Both functions create new messages and record forwarding history

### 3. Pin Functionality

**How it works:**
- User pins a message in a conversation
- Pinned messages appear at the top of the conversation
- Optional expiry dates (24h, 7d, 30d)
- Multiple messages can be pinned per conversation

**Database:**
- `pinned_messages` table - Already exists
- Fields: `message_id`, `conversation_id`, `pinned_by`, `expires_at`

**Service:**
- `pinMessage()` - Pin a message with optional expiry
- `unpinMessage()` - Remove pin
- `getPinnedMessages()` - Get all pinned messages for a conversation
- `isMessagePinned()` - Check if message is pinned

### 4. Message Info (Status Tracking)

**How it works:**
- Messages have three statuses: **Sent**, **Delivered**, **Read**
- Timestamps are tracked for each status
- Status is automatically updated when messages are received/read

**Database:**
- `messages.delivered_at` - When message was delivered to receiver
- `messages.read_at` - When message was read by receiver
- `messages.created_at` - When message was sent (already exists)

**Service:**
- `markMessageDelivered()` - Mark as delivered (call when message received)
- `markMessageRead()` - Mark as read (call when user views message)
- `getMessageInfo()` - Get full message metadata including status timestamps

**Status Flow:**
1. **Sent** - Message created (`created_at` set)
2. **Delivered** - Message received by client (`delivered_at` set)
3. **Read** - Message viewed by user (`read_at` set)

---

## 🎨 Frontend Integration

### Reply Implementation

```javascript
// In your message input component
const handleReply = async (messageToReply) => {
  setReplyingTo(messageToReply);
  // Show reply preview in input area
};

const handleSendReply = async () => {
  await sendMessage(
    conversationId,
    receiverId,
    messageContent,
    'text',
    replyingTo?.id  // Pass reply_to_id
  );
  setReplyingTo(null);
};
```

### Forward Implementation

```javascript
// Show conversation list for forwarding
const handleForward = async (messageId) => {
  // Show modal with conversation list
  const selectedConversations = await showConversationPicker();
  
  // Forward to selected conversations
  await forwardMessageToMultiple(messageId, selectedConversations);
};
```

### Pin Implementation

```javascript
// Pin with expiry
const handlePin = async (messageId, expiryDays = null) => {
  let expiresAt = null;
  if (expiryDays) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);
  }
  
  await pinMessage(messageId, conversationId, expiresAt);
};

// Display pinned messages at top
const PinnedMessages = ({ conversationId }) => {
  const [pinned, setPinned] = useState([]);
  
  useEffect(() => {
    getPinnedMessages(conversationId).then(setPinned);
  }, [conversationId]);
  
  return (
    <div className="pinned-messages">
      {pinned.map(msg => (
        <PinnedMessageCard key={msg.id} message={msg} />
      ))}
    </div>
  );
};
```

### Message Info Implementation

```javascript
// Show message info modal
const handleShowInfo = async (messageId) => {
  const info = await getMessageInfo(messageId);
  
  // Display:
  // - Sent: {info.sent_at_formatted}
  // - Delivered: {info.delivered_at_formatted || 'Not delivered'}
  // - Read: {info.read_at_formatted || 'Not read'}
  // - Status: {info.status}
};
```

### Status Indicators

```javascript
// In message component
const MessageStatus = ({ message }) => {
  if (message.status === 'read') {
    return <CheckCheck className="text-blue-500" />; // Double check (blue)
  } else if (message.status === 'delivered') {
    return <CheckCheck className="text-gray-500" />; // Double check (gray)
  } else {
    return <Check className="text-gray-400" />; // Single check
  }
};
```

---

## 🔄 Real-time Updates

For real-time status updates, subscribe to message changes:

```javascript
import { supabase } from '@/lib/supabase';

// Subscribe to message updates
const subscription = supabase
  .channel('message-status')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'messages',
    filter: `conversation_id=eq.${conversationId}`
  }, (payload) => {
    // Update message status in UI
    updateMessageStatus(payload.new.id, {
      delivered_at: payload.new.delivered_at,
      read_at: payload.new.read_at,
      status: payload.new.read_at ? 'read' : 
              payload.new.delivered_at ? 'delivered' : 'sent'
    });
  })
  .subscribe();
```

---

## ✅ Testing Checklist

- [ ] Run SQL migration for status tracking
- [ ] Test reply functionality
- [ ] Test forward to single conversation
- [ ] Test forward to multiple conversations
- [ ] Test pin message with expiry
- [ ] Test unpin message
- [ ] Test message status tracking (sent → delivered → read)
- [ ] Test getMessageInfo returns all timestamps
- [ ] Verify pinned messages appear at top
- [ ] Verify reply context shows original message

---

## 🐛 Troubleshooting

### Messages not showing status
- Ensure `delivered_at` and `read_at` columns exist
- Check that `markMessageDelivered()` and `markMessageRead()` are being called
- Verify RLS policies allow updates to messages

### Replies not showing context
- Verify `reply_to_id` is set when sending reply
- Check that `getMessages()` includes reply context
- Ensure original message hasn't been deleted

### Forward not working
- Check that target conversation exists
- Verify user has permission to send messages to target conversation
- Check `forwarded_messages` table for errors

### Pins not appearing
- Verify `pinned_messages` table exists
- Check that pin hasn't expired (`expires_at`)
- Ensure RLS policies allow viewing pinned messages

---

## 📚 Additional Resources

- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Timestamps](https://www.postgresql.org/docs/current/datatype-datetime.html)

---

## 🎉 Setup Complete!

All advanced chat features are now ready to use. The backend is fully configured and the service layer provides all necessary functions for:
- ✅ Replying to messages
- ✅ Forwarding messages
- ✅ Pinning messages
- ✅ Tracking message status (sent, delivered, read)

Happy coding! 💕

