/**
 * Chat Service
 * Handles all chat/messaging operations with Supabase
 */

import { supabase } from './supabase';

/**
 * Get all conversations for the current user
 * Returns conversations sorted by last message time
 */
export const getMyConversations = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('📬 Fetching conversations for user:', user.id);

    // Get conversations where user is either user1 or user2
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('last_message_time', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }

    console.log(`✅ Found ${conversations?.length || 0} conversations`);

    // Get unique user IDs from conversations
    const userIds = new Set();
    conversations?.forEach(conv => {
      userIds.add(conv.user1_id);
      userIds.add(conv.user2_id);
    });

    // Fetch all users in one query from public.users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, avatar_url')
      .in('id', Array.from(userIds));

    if (usersError) {
      console.error('Error fetching users:', usersError);
    }

    // Create a map of users by ID for quick lookup
    const usersMap = {};
    users?.forEach(u => {
      usersMap[u.id] = u;
    });

    console.log('👥 Fetched user data for conversations:', usersMap);

    // Transform conversations to include the "other" user's details
    const transformedConversations = conversations?.map(conv => {
      const isUser1 = conv.user1_id === user.id;
      const otherUserId = isUser1 ? conv.user2_id : conv.user1_id;
      const otherUser = usersMap[otherUserId] || { id: otherUserId, email: 'Unknown' };
      
      console.log(`💬 Conversation ${conv.id}:`, {
        currentUserId: user.id,
        user1_id: conv.user1_id,
        user2_id: conv.user2_id,
        isUser1,
        otherUserId,
        otherUserName: otherUser.name
      });
      
      return {
        id: conv.id,
        otherUserId: otherUser.id,
        name: otherUser.name || otherUser.email || 'Unknown User',
        email: otherUser.email,
        avatar: otherUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser.email}`,
        lastMessage: conv.last_message || '',
        lastMessageTime: conv.last_message_time,
        unreadCount: isUser1 ? conv.user1_unread_count : conv.user2_unread_count,
        isMuted: isUser1 ? conv.user1_muted : conv.user2_muted,
        isPinned: isUser1 ? conv.user1_pinned : conv.user2_pinned,
        isArchived: isUser1 ? conv.user1_archived : conv.user2_archived,
        isOnline: false, // Will be updated by real-time presence
        createdAt: conv.created_at,
        updatedAt: conv.updated_at,
      };
    }) || [];
    
    console.log('✅ Final transformed conversations:', transformedConversations);

    return transformedConversations;
  } catch (error) {
    console.error('Error in getMyConversations:', error);
    throw error;
  }
};

/**
 * Get or create a conversation between two users
 */
export const getOrCreateConversation = async (otherUserId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('💬 Getting/Creating conversation between:', user.id, 'and', otherUserId);

    // Use the database function to handle ordering and creation
    const { data, error } = await supabase.rpc('get_or_create_conversation', {
      p_user1_id: user.id,
      p_user2_id: otherUserId
    });

    if (error) {
      console.error('Error getting/creating conversation:', error);
      throw error;
    }

    console.log('✅ Conversation ID:', data);
    return data; // Returns conversation ID
  } catch (error) {
    console.error('Error in getOrCreateConversation:', error);
    throw error;
  }
};

/**
 * Get messages for a specific conversation
 */
export const getMessages = async (conversationId) => {
  try {
    console.log('💬 Fetching messages for conversation:', conversationId);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }

    console.log(`✅ Found ${messages?.length || 0} messages`);

    // CRITICAL: Auto-mark undelivered messages as delivered when fetching
    // This ensures senders see double ticks when receiver's app loads messages
    if (messages && messages.length > 0) {
      const undeliveredMessages = messages.filter(
        msg => msg.receiver_id === user.id && !msg.delivered_at
      );

      if (undeliveredMessages.length > 0) {
        console.log(`📬 Auto-marking ${undeliveredMessages.length} messages as delivered on fetch`);
        const now = new Date().toISOString();
        
        // Mark all undelivered messages as delivered in batch
        const messageIds = undeliveredMessages.map(m => m.id);
        const { error: deliveredError } = await supabase
          .from('messages')
          .update({ delivered_at: now })
          .in('id', messageIds)
          .eq('receiver_id', user.id)
          .is('delivered_at', null);

        if (deliveredError) {
          console.error('Error auto-marking as delivered:', deliveredError);
        } else {
          console.log('✅ Messages auto-marked as delivered - updating local data');
          // Update local messages array with delivered_at
          messages.forEach(msg => {
            if (undeliveredMessages.find(um => um.id === msg.id)) {
              msg.delivered_at = now;
            }
          });
        }
      }
    }

    // Get unique user IDs from messages
    const userIds = new Set();
    messages?.forEach(msg => {
      userIds.add(msg.sender_id);
      userIds.add(msg.receiver_id);
    });

    // Fetch all users in one query
    let usersMap = {};
    if (userIds.size > 0) {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name, email, avatar_url')
        .in('id', Array.from(userIds));

      if (usersError) {
        console.error('Error fetching users for messages:', usersError);
      }

      // Create a map of users by ID
      users?.forEach(u => {
        usersMap[u.id] = u;
      });
    }

    // Get all reply_to_ids to fetch original messages
    const replyToIds = messages?.filter(msg => msg.reply_to_id).map(msg => msg.reply_to_id);
    let replyMessagesMap = {};
    
    if (replyToIds && replyToIds.length > 0) {
      const { data: replyMessages } = await supabase
        .from('messages')
        .select('id, content, message_type, sender_id')
        .in('id', replyToIds);
      
      replyMessages?.forEach(rm => {
        replyMessagesMap[rm.id] = rm;
      });
    }

    // Transform messages to match expected format
    const transformedMessages = messages?.map(msg => {
      const sender = usersMap[msg.sender_id] || { id: msg.sender_id, email: 'Unknown' };
      
      // Get reply context if this message is a reply
      let replyToMessage = null;
      if (msg.reply_to_id && replyMessagesMap[msg.reply_to_id]) {
        const originalMsg = replyMessagesMap[msg.reply_to_id];
        const originalSender = usersMap[originalMsg.sender_id] || { id: originalMsg.sender_id, email: 'Unknown' };
        replyToMessage = {
          id: originalMsg.id,
          content: originalMsg.content,
          messageType: originalMsg.message_type,
          senderId: originalMsg.sender_id,
          senderName: originalSender.name || originalSender.email || 'Unknown',
        };
      }
      
      // Determine message status - IMPORTANT: Check read_at first, then delivered_at
      // Also check is_read flag as fallback
      let status = 'sent';
      if (msg.read_at || (msg.is_read && msg.delivered_at)) {
        status = 'read';  // If read, show blue ticks
      } else if (msg.delivered_at) {
        status = 'delivered';  // If delivered but not read, show gray double ticks
      }
      
      // Debug logging for YOUR sent messages to track status
      if (msg.sender_id === user?.id) {
        console.log(`📊 YOUR Message "${msg.content?.substring(0, 20)}..." status:`, {
          status,
          delivered_at: msg.delivered_at ? 'SET' : 'NULL',
          read_at: msg.read_at ? 'SET' : 'NULL',
          is_read: msg.is_read
        });
      }
      
      const baseMessage = {
        id: msg.id,
        conversationId: msg.conversation_id,
        senderId: msg.sender_id,
        receiverId: msg.receiver_id,
        senderName: sender.name || sender.email || 'Unknown',
        senderAvatar: sender.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sender.email}`,
        type: msg.message_type,
        text: msg.content,
        content: msg.content,
        fileUrl: msg.file_url,
        fileName: msg.file_name,
        fileSize: msg.file_size,
        fileType: msg.file_type,
        locationLat: msg.location_lat,
        locationLng: msg.location_lng,
        locationAddress: msg.location_address,
        isRead: msg.is_read,
        isEdited: msg.is_edited,
        replyToId: msg.reply_to_id,
        replyToMessage: replyToMessage,
        timestamp: msg.created_at,
        createdAt: msg.created_at,
        sentAt: msg.created_at,
        deliveredAt: msg.delivered_at,
        readAt: msg.read_at,
        updatedAt: msg.updated_at,
        // Determine if this is from current user or other user
        isOwn: msg.sender_id === user?.id,
        status: status,
      };
      
      // Add type-specific fields for ChatMessage component compatibility
      if (msg.message_type === 'image') {
        baseMessage.imageUrl = msg.file_url;
        baseMessage.caption = msg.content;
      } else if (msg.message_type === 'voice' || msg.message_type === 'audio') {
        baseMessage.audioUrl = msg.file_url;
        baseMessage.duration = msg.duration || 0;
      } else if (msg.message_type === 'location') {
        baseMessage.latitude = msg.location_lat;
        baseMessage.longitude = msg.location_lng;
        baseMessage.address = msg.location_address;
      }
      
      return baseMessage;
    }) || [];

    return transformedMessages;
  } catch (error) {
    console.error('Error in getMessages:', error);
    throw error;
  }
};

/**
 * Send a text message
 * @param {string} conversationId - Conversation ID
 * @param {string} receiverId - Receiver user ID
 * @param {string} content - Message content
 * @param {string} messageType - Message type (default: 'text')
 * @param {string} replyToId - Optional: ID of message being replied to
 */
export const sendMessage = async (conversationId, receiverId, content, messageType = 'text', replyToId = null) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('📤 Sending message:', { conversationId, receiverId, messageType, replyToId });

    const messageData = {
      conversation_id: conversationId,
      sender_id: user.id,
      receiver_id: receiverId,
      content: content,
      message_type: messageType,
    };

    // Add reply_to_id if replying to a message
    if (replyToId) {
      messageData.reply_to_id = replyToId;
    }

    const { data: message, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      throw error;
    }

    console.log('✅ Message sent:', message.id);
    
    // CRITICAL: After sending a message, recalculate unread count for receiver
    // This ensures the count is accurate even if trigger increments it
    try {
      // Wait a bit for trigger to run first
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Recalculate unread count for the receiver
      const { data: recalcCount, error: recalcError } = await supabase
        .rpc('recalculate_unread_count', {
          p_conversation_id: conversationId,
          p_user_id: receiverId
        });
      
      if (recalcError) {
        console.warn('⚠️ Could not recalculate after send, will be fixed on next read:', recalcError);
      } else {
        console.log(`✅ Recalculated unread count for receiver: ${recalcCount}`);
      }
    } catch (error) {
      console.warn('⚠️ Error recalculating after send:', error);
    }
    
    return message;
  } catch (error) {
    console.error('Error in sendMessage:', error);
    throw error;
  }
};

/**
 * Send a file message (image, video, audio, file)
 */
export const sendFileMessage = async (conversationId, receiverId, file, messageType) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('📤 Sending file message:', { conversationId, receiverId, messageType });

    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const filePath = `chat-files/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('chat-files')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('chat-files')
      .getPublicUrl(filePath);

    // Create message with file info
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        receiver_id: receiverId,
        content: file.name,
        message_type: messageType,
        file_url: publicUrl,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating file message:', error);
      throw error;
    }

    console.log('✅ File message sent:', message.id);
    return message;
  } catch (error) {
    console.error('Error in sendFileMessage:', error);
    throw error;
  }
};

/**
 * Send location message
 */
export const sendLocationMessage = async (conversationId, receiverId, location) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('📤 Sending location message:', { conversationId, receiverId });

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        receiver_id: receiverId,
        content: location.address || 'Location',
        message_type: 'location',
        location_lat: location.lat,
        location_lng: location.lng,
        location_address: location.address,
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending location:', error);
      throw error;
    }

    console.log('✅ Location message sent:', message.id);
    return message;
  } catch (error) {
    console.error('Error in sendLocationMessage:', error);
    throw error;
  }
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (conversationId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('✅ Marking messages as read for conversation:', conversationId);

    const now = new Date().toISOString();

    // FIRST: Mark all undelivered messages as delivered (where current user is receiver)
    const { error: deliveredError } = await supabase
      .from('messages')
      .update({ 
        delivered_at: now
      })
      .eq('conversation_id', conversationId)
      .eq('receiver_id', user.id)
      .is('delivered_at', null); // Only update if not already delivered

    if (deliveredError) {
      console.error('Error marking messages as delivered:', deliveredError);
    } else {
      console.log('✅ Messages marked as delivered');
    }

    // THEN: Mark ALL unread messages as read (where current user is receiver)
    // Remove the is_read check to ensure we update even if there's a mismatch
    const { data: updatedMessages, error: messagesError } = await supabase
      .from('messages')
      .update({ 
        is_read: true,
        read_at: now
      })
      .eq('conversation_id', conversationId)
      .eq('receiver_id', user.id)
      .or('is_read.eq.false,read_at.is.null') // Mark if either condition is true
      .select('id'); // Return IDs to verify update

    if (messagesError) {
      console.error('❌ Error marking messages as read:', messagesError);
      throw messagesError;
    } else {
      console.log(`✅ Marked ${updatedMessages?.length || 0} messages as read`);
    }

    // Get conversation to determine which field to update
    const { data: conv, error: convError } = await supabase
      .from('conversations')
      .select('user1_id, user2_id, user1_unread_count, user2_unread_count')
      .eq('id', conversationId)
      .single();

    if (convError) {
      console.error('Error fetching conversation:', convError);
    } else if (conv) {
      const isUser1 = conv.user1_id === user.id;
      const updateField = isUser1 ? 'user1_unread_count' : 'user2_unread_count';
      const currentCount = isUser1 ? conv.user1_unread_count : conv.user2_unread_count;
      
      console.log(`📊 Current unread count for ${updateField}:`, currentCount);
      
      // CRITICAL: Always recalculate unread count based on actual unread messages
      // This ensures accuracy even if trigger increments it incorrectly
      
      // Count actual unread messages
      const { count: actualUnreadCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', user.id)
        .or('is_read.eq.false,read_at.is.null');

      const newCount = actualUnreadCount || 0;
      
      // Try using RPC function first (if SQL fix was applied)
      const { error: recalcError } = await supabase
        .rpc('recalculate_unread_count', {
          p_conversation_id: conversationId,
          p_user_id: user.id
        });

      if (recalcError) {
        // Fallback: Manual update if RPC function doesn't exist
        console.log('⚠️ RPC function not available, using manual update');
        const { error: updateError } = await supabase
          .from('conversations')
          .update({ 
            [updateField]: newCount,
            updated_at: new Date().toISOString()
          })
          .eq('id', conversationId);

        if (updateError) {
          console.error('❌ Error resetting unread count:', updateError);
        } else {
          console.log(`✅✅✅ Reset ${updateField} from ${currentCount} to ${newCount} (manual)`);
        }
      } else {
        console.log(`✅✅✅ Recalculated ${updateField} to ${newCount} using database function`);
      }
      
      // CRITICAL: Double-check and force update if needed (race condition protection)
      // Wait a moment for any triggers to finish
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Verify and force correct count one more time
      const { data: verifyConv } = await supabase
        .from('conversations')
        .select(`${updateField}`)
        .eq('id', conversationId)
        .single();
      
      const verifiedCount = verifyConv?.[updateField] || 0;
      if (verifiedCount !== newCount) {
        console.log(`⚠️ Count mismatch detected (${verifiedCount} vs ${newCount}), forcing correction`);
        await supabase
          .from('conversations')
          .update({ 
            [updateField]: newCount,
            updated_at: new Date().toISOString()
          })
          .eq('id', conversationId);
        console.log(`✅✅✅ Forced ${updateField} to ${newCount}`);
      }
    } else {
      console.warn('⚠️ Conversation not found:', conversationId);
    }

    console.log('✅ All messages marked as delivered and read');
  } catch (error) {
    console.error('Error in markMessagesAsRead:', error);
    throw error;
  }
};

/**
 * Mark a specific message as delivered
 * @param {string} messageId - Message ID
 */
export const markMessageDelivered = async (messageId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('📬 Marking message as delivered:', messageId);

    // Only mark as delivered if current user is the receiver
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('messages')
      .update({ 
        delivered_at: now
      })
      .eq('id', messageId)
      .eq('receiver_id', user.id)
      .is('delivered_at', null);

    if (error) {
      console.error('Error marking message as delivered:', error);
      throw error;
    }

    console.log('✅ Message marked as delivered');
  } catch (error) {
    console.error('Error in markMessageDelivered:', error);
    throw error;
  }
};

/**
 * Mark a specific message as read
 * @param {string} messageId - Message ID
 */
export const markMessageRead = async (messageId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('✅ Marking message as read:', messageId);

    // Only mark as read if current user is the receiver
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('messages')
      .update({ 
        is_read: true,
        read_at: now
      })
      .eq('id', messageId)
      .eq('receiver_id', user.id)
      .is('read_at', null);

    if (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }

    console.log('✅ Message marked as read');
  } catch (error) {
    console.error('Error in markMessageRead:', error);
    throw error;
  }
};

/**
 * Get message with reply context (the original message being replied to)
 * @param {string} messageId - Message ID
 */
export const getMessageWithReply = async (messageId) => {
  try {
    const { data: message, error } = await supabase
      .from('messages')
      .select('*, reply_to:messages!messages_reply_to_id_fkey(*)')
      .eq('id', messageId)
      .single();

    if (error) {
      console.error('Error fetching message with reply:', error);
      throw error;
    }

    return message;
  } catch (error) {
    console.error('Error in getMessageWithReply:', error);
    throw error;
  }
};

/**
 * Edit a message
 */
export const editMessage = async (messageId, newContent) => {
  try {
    console.log('✏️ Editing message:', messageId);

    const { data: message, error } = await supabase
      .from('messages')
      .update({
        content: newContent,
        is_edited: true,
      })
      .eq('id', messageId)
      .select()
      .single();

    if (error) {
      console.error('Error editing message:', error);
      throw error;
    }

    console.log('✅ Message edited');
    return message;
  } catch (error) {
    console.error('Error in editMessage:', error);
    throw error;
  }
};

/**
 * Delete a message (soft delete)
 */
export const deleteMessage = async (messageId) => {
  try {
    console.log('🗑️ Deleting message:', messageId);

    const { error } = await supabase
      .from('messages')
      .update({ is_deleted: true })
      .eq('id', messageId);

    if (error) {
      console.error('Error deleting message:', error);
      throw error;
    }

    console.log('✅ Message deleted');
  } catch (error) {
    console.error('Error in deleteMessage:', error);
    throw error;
  }
};

/**
 * Update conversation settings (mute, pin, archive)
 */
export const updateConversationSettings = async (conversationId, settings) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('⚙️ Updating conversation settings:', conversationId);

    // Get conversation to determine if user is user1 or user2
    const { data: conv } = await supabase
      .from('conversations')
      .select('user1_id, user2_id')
      .eq('id', conversationId)
      .single();

    if (!conv) {
      throw new Error('Conversation not found');
    }

    const isUser1 = conv.user1_id === user.id;
    const prefix = isUser1 ? 'user1_' : 'user2_';

    // Build update object with proper field names
    const updateData = {};
    if (settings.isMuted !== undefined) updateData[`${prefix}muted`] = settings.isMuted;
    if (settings.isPinned !== undefined) updateData[`${prefix}pinned`] = settings.isPinned;
    if (settings.isArchived !== undefined) updateData[`${prefix}archived`] = settings.isArchived;

    const { error } = await supabase
      .from('conversations')
      .update(updateData)
      .eq('id', conversationId);

    if (error) {
      console.error('Error updating conversation settings:', error);
      throw error;
    }

    console.log('✅ Conversation settings updated');
  } catch (error) {
    console.error('Error in updateConversationSettings:', error);
    throw error;
  }
};

/**
 * Delete entire conversation
 */
export const deleteConversation = async (conversationId) => {
  try {
    console.log('🗑️ Deleting conversation:', conversationId);

    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }

    console.log('✅ Conversation deleted');
  } catch (error) {
    console.error('Error in deleteConversation:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time messages for a conversation
 */
export const subscribeToMessages = (conversationId, callback) => {
  console.log('🔔 Subscribing to real-time messages for:', conversationId);

  const subscription = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        console.log('📨 New message received:', payload);
        callback(payload.new);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        console.log('📨 Message updated (read status):', payload);
        // Trigger callback to update UI when read status changes
        callback(payload.new);
      }
    )
    .subscribe();

  return subscription;
};

/**
 * Unsubscribe from real-time messages
 */
export const unsubscribeFromMessages = (subscription) => {
  if (subscription) {
    console.log('🔕 Unsubscribing from messages');
    supabase.removeChannel(subscription);
  }
};

/**
 * Subscribe to conversation updates
 */
export const subscribeToConversations = (callback) => {
  console.log('🔔 Subscribing to conversation updates');

  const subscription = supabase
    .channel('conversations')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations',
      },
      (payload) => {
        console.log('📬 Conversation updated:', payload);
        callback(payload);
      }
    )
    .subscribe();

  return subscription;
};

