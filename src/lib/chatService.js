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
      .select(`
        *,
        user1:user1_id(id, name, email, avatar_url),
        user2:user2_id(id, name, email, avatar_url)
      `)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('last_message_time', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }

    console.log(`✅ Found ${conversations?.length || 0} conversations`);

    // Transform conversations to include the "other" user's details
    const transformedConversations = conversations?.map(conv => {
      const isUser1 = conv.user1_id === user.id;
      const otherUser = isUser1 ? conv.user2 : conv.user1;
      
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

    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id(id, name, email, avatar_url),
        receiver:receiver_id(id, name, email, avatar_url)
      `)
      .eq('conversation_id', conversationId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }

    console.log(`✅ Found ${messages?.length || 0} messages`);

    const { data: { user } } = await supabase.auth.getUser();

    // Transform messages to match expected format
    const transformedMessages = messages?.map(msg => ({
      id: msg.id,
      conversationId: msg.conversation_id,
      senderId: msg.sender_id,
      receiverId: msg.receiver_id,
      senderName: msg.sender?.name || msg.sender?.email || 'Unknown',
      senderAvatar: msg.sender?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sender?.email}`,
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
      timestamp: msg.created_at,
      createdAt: msg.created_at,
      updatedAt: msg.updated_at,
      // Determine if this is from current user or other user
      isOwn: msg.sender_id === user?.id,
      status: msg.is_read ? 'read' : 'delivered',
    })) || [];

    return transformedMessages;
  } catch (error) {
    console.error('Error in getMessages:', error);
    throw error;
  }
};

/**
 * Send a text message
 */
export const sendMessage = async (conversationId, receiverId, content, messageType = 'text') => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('📤 Sending message:', { conversationId, receiverId, messageType });

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        receiver_id: receiverId,
        content: content,
        message_type: messageType,
      })
      .select(`
        *,
        sender:sender_id(id, name, email, avatar_url),
        receiver:receiver_id(id, name, email, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Error sending message:', error);
      throw error;
    }

    console.log('✅ Message sent:', message.id);
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
      .select(`
        *,
        sender:sender_id(id, name, email, avatar_url),
        receiver:receiver_id(id, name, email, avatar_url)
      `)
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
      .select(`
        *,
        sender:sender_id(id, name, email, avatar_url),
        receiver:receiver_id(id, name, email, avatar_url)
      `)
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

    // Mark all unread messages where current user is receiver
    const { error: messagesError } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .eq('receiver_id', user.id)
      .eq('is_read', false);

    if (messagesError) {
      console.error('Error marking messages as read:', messagesError);
      throw messagesError;
    }

    // Reset unread count in conversation
    const { error: convError } = await supabase.rpc('reset_unread_count', {
      p_conversation_id: conversationId,
      p_user_id: user.id
    });

    // If the function doesn't exist, update manually
    if (convError && convError.code === '42883') {
      const { data: conv } = await supabase
        .from('conversations')
        .select('user1_id, user2_id')
        .eq('id', conversationId)
        .single();

      if (conv) {
        const isUser1 = conv.user1_id === user.id;
        const updateField = isUser1 ? 'user1_unread_count' : 'user2_unread_count';
        
        await supabase
          .from('conversations')
          .update({ [updateField]: 0 })
          .eq('id', conversationId);
      }
    }

    console.log('✅ Messages marked as read');
  } catch (error) {
    console.error('Error in markMessagesAsRead:', error);
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

