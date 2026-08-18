/**
 * Chat Service
 * Handles pairwise messaging operations with Supabase.
 *
 * Privacy rule: other-member identity is loaded only from public.member_directory.
 * Account email and other private public.users fields are never requested here.
 */

import { supabase } from './supabase';

const MEMBER_FIELDS = 'id,name,avatar_url';
const UNKNOWN_MEMBER = 'One2OneLove member';

const avatarForMember = (member, fallbackId = 'member') =>
  member?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(member?.id || fallbackId)}`;

const loadMemberSummaries = async (userIds) => {
  const ids = [...new Set((userIds || []).filter(Boolean))];
  if (!ids.length) return {};

  const { data, error } = await supabase
    .from('member_directory')
    .select(MEMBER_FIELDS)
    .in('id', ids);

  if (error) {
    console.warn('Unable to load chat member summaries:', error);
    return {};
  }

  return Object.fromEntries((data || []).map((member) => [member.id, member]));
};

const getAuthenticatedUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('User not authenticated');
  return user;
};

/**
 * Get all conversations for the current user.
 */
export const getMyConversations = async () => {
  try {
    const user = await getAuthenticatedUser();

    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('last_message_time', { ascending: false, nullsFirst: false });

    if (error) throw error;

    const participantIds = new Set();
    (conversations || []).forEach((conversation) => {
      participantIds.add(conversation.user1_id);
      participantIds.add(conversation.user2_id);
    });
    const membersById = await loadMemberSummaries([...participantIds]);

    return (conversations || []).map((conversation) => {
      const isUser1 = conversation.user1_id === user.id;
      const otherUserId = isUser1 ? conversation.user2_id : conversation.user1_id;
      const otherMember = membersById[otherUserId] || { id: otherUserId, name: UNKNOWN_MEMBER };

      return {
        id: conversation.id,
        otherUserId,
        name: otherMember.name || UNKNOWN_MEMBER,
        // Preserve the historical response shape without exposing an account email.
        email: null,
        avatar: avatarForMember(otherMember, otherUserId),
        lastMessage: conversation.last_message || '',
        lastMessageTime: conversation.last_message_time,
        unreadCount: isUser1 ? conversation.user1_unread_count : conversation.user2_unread_count,
        isMuted: isUser1 ? conversation.user1_muted : conversation.user2_muted,
        isPinned: isUser1 ? conversation.user1_pinned : conversation.user2_pinned,
        isArchived: isUser1 ? conversation.user1_archived : conversation.user2_archived,
        isOnline: false,
        createdAt: conversation.created_at,
        updatedAt: conversation.updated_at,
      };
    });
  } catch (error) {
    console.error('Error in getMyConversations:', error);
    throw error;
  }
};

/**
 * Get or create a conversation between the signed-in member and another member.
 */
export const getOrCreateConversation = async (otherUserId) => {
  try {
    const user = await getAuthenticatedUser();
    if (!otherUserId || otherUserId === user.id) throw new Error('Invalid conversation participant');

    const { data, error } = await supabase.rpc('get_or_create_conversation', {
      p_user1_id: user.id,
      p_user2_id: otherUserId,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error in getOrCreateConversation:', error);
    throw error;
  }
};

/**
 * Get messages for a specific conversation.
 */
export const getMessages = async (conversationId) => {
  try {
    const user = await getAuthenticatedUser();

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (error) throw error;

    if (messages?.length) {
      const undeliveredIds = messages
        .filter((message) => message.receiver_id === user.id && !message.delivered_at)
        .map((message) => message.id);

      if (undeliveredIds.length) {
        const now = new Date().toISOString();
        const { error: deliveredError } = await supabase
          .from('messages')
          .update({ delivered_at: now })
          .in('id', undeliveredIds)
          .eq('receiver_id', user.id)
          .is('delivered_at', null);

        if (deliveredError) {
          console.warn('Unable to mark fetched messages delivered:', deliveredError);
        } else {
          const deliveredSet = new Set(undeliveredIds);
          messages.forEach((message) => {
            if (deliveredSet.has(message.id)) message.delivered_at = now;
          });
        }
      }
    }

    const participantIds = new Set();
    (messages || []).forEach((message) => {
      participantIds.add(message.sender_id);
      participantIds.add(message.receiver_id);
    });
    const membersById = await loadMemberSummaries([...participantIds]);

    const replyToIds = [...new Set((messages || []).filter((message) => message.reply_to_id).map((message) => message.reply_to_id))];
    const replyMessagesById = {};

    if (replyToIds.length) {
      const { data: replyMessages, error: replyError } = await supabase
        .from('messages')
        .select('id, content, message_type, sender_id')
        .in('id', replyToIds);

      if (replyError) console.warn('Unable to load reply context:', replyError);
      (replyMessages || []).forEach((message) => {
        replyMessagesById[message.id] = message;
      });
    }

    return (messages || []).map((message) => {
      const sender = membersById[message.sender_id] || { id: message.sender_id, name: UNKNOWN_MEMBER };
      let replyToMessage = null;

      if (message.reply_to_id && replyMessagesById[message.reply_to_id]) {
        const original = replyMessagesById[message.reply_to_id];
        const originalSender = membersById[original.sender_id] || { id: original.sender_id, name: UNKNOWN_MEMBER };
        replyToMessage = {
          id: original.id,
          content: original.content,
          messageType: original.message_type,
          senderId: original.sender_id,
          senderName: originalSender.name || UNKNOWN_MEMBER,
        };
      }

      let status = 'sent';
      if (message.read_at || (message.is_read && message.delivered_at)) status = 'read';
      else if (message.delivered_at) status = 'delivered';

      const transformed = {
        id: message.id,
        conversationId: message.conversation_id,
        senderId: message.sender_id,
        receiverId: message.receiver_id,
        senderName: sender.name || UNKNOWN_MEMBER,
        senderAvatar: avatarForMember(sender, message.sender_id),
        type: message.message_type,
        text: message.content,
        content: message.content,
        fileUrl: message.file_url,
        fileName: message.file_name,
        fileSize: message.file_size,
        fileType: message.file_type,
        locationLat: message.location_lat,
        locationLng: message.location_lng,
        locationAddress: message.location_address,
        isRead: message.is_read,
        isEdited: message.is_edited,
        replyToId: message.reply_to_id,
        replyToMessage,
        timestamp: message.created_at,
        createdAt: message.created_at,
        sentAt: message.created_at,
        deliveredAt: message.delivered_at,
        readAt: message.read_at,
        updatedAt: message.updated_at,
        isOwn: message.sender_id === user.id,
        status,
      };

      if (message.message_type === 'image') {
        transformed.imageUrl = message.file_url;
        transformed.caption = message.content;
      } else if (message.message_type === 'voice' || message.message_type === 'audio') {
        transformed.audioUrl = message.file_url;
        transformed.duration = message.duration || 0;
      } else if (message.message_type === 'location') {
        transformed.latitude = message.location_lat;
        transformed.longitude = message.location_lng;
        transformed.address = message.location_address;
      }

      return transformed;
    });
  } catch (error) {
    console.error('Error in getMessages:', error);
    throw error;
  }
};

/**
 * Send a text message.
 */
export const sendMessage = async (conversationId, receiverId, content, messageType = 'text', replyToId = null) => {
  try {
    const user = await getAuthenticatedUser();
    const cleanContent = typeof content === 'string' ? content.trim() : content;
    if (!cleanContent) throw new Error('Message cannot be empty');

    const messageData = {
      conversation_id: conversationId,
      sender_id: user.id,
      receiver_id: receiverId,
      content: cleanContent,
      message_type: messageType,
    };
    if (replyToId) messageData.reply_to_id = replyToId;

    const { data: message, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single();

    if (error) throw error;

    try {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const { error: recalcError } = await supabase.rpc('recalculate_unread_count', {
        p_conversation_id: conversationId,
        p_user_id: receiverId,
      });
      if (recalcError) console.warn('Unread-count recalculation deferred:', recalcError);
    } catch (recalcError) {
      console.warn('Unread-count recalculation deferred:', recalcError);
    }

    return message;
  } catch (error) {
    console.error('Error in sendMessage:', error);
    throw error;
  }
};

/**
 * Send a file message (image, video, audio, file).
 */
export const sendFileMessage = async (conversationId, receiverId, file, messageType) => {
  try {
    const user = await getAuthenticatedUser();
    if (!file) throw new Error('No file selected');

    const fileExt = file.name?.split('.').pop() || 'bin';
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const filePath = `chat-files/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('chat-files')
      .upload(filePath, file);
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('chat-files')
      .getPublicUrl(filePath);

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

    if (error) throw error;
    return message;
  } catch (error) {
    console.error('Error in sendFileMessage:', error);
    throw error;
  }
};

/**
 * Send location message.
 */
export const sendLocationMessage = async (conversationId, receiverId, location) => {
  try {
    const user = await getAuthenticatedUser();

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        receiver_id: receiverId,
        content: location?.address || 'Location',
        message_type: 'location',
        location_lat: location?.lat,
        location_lng: location?.lng,
        location_address: location?.address,
      })
      .select()
      .single();

    if (error) throw error;
    return message;
  } catch (error) {
    console.error('Error in sendLocationMessage:', error);
    throw error;
  }
};

/**
 * Mark messages as delivered/read for the current receiver.
 */
export const markMessagesAsRead = async (conversationId) => {
  try {
    const user = await getAuthenticatedUser();
    const now = new Date().toISOString();

    const { error: deliveredError } = await supabase
      .from('messages')
      .update({ delivered_at: now })
      .eq('conversation_id', conversationId)
      .eq('receiver_id', user.id)
      .is('delivered_at', null);
    if (deliveredError) console.warn('Unable to mark messages delivered:', deliveredError);

    const { error: messagesError } = await supabase
      .from('messages')
      .update({ is_read: true, read_at: now })
      .eq('conversation_id', conversationId)
      .eq('receiver_id', user.id)
      .or('is_read.eq.false,read_at.is.null');
    if (messagesError) throw messagesError;

    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('user1_id, user2_id, user1_unread_count, user2_unread_count')
      .eq('id', conversationId)
      .single();

    if (conversationError || !conversation) return;

    const isUser1 = conversation.user1_id === user.id;
    const updateField = isUser1 ? 'user1_unread_count' : 'user2_unread_count';
    const { count: actualUnreadCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)
      .eq('receiver_id', user.id)
      .or('is_read.eq.false,read_at.is.null');

    const newCount = actualUnreadCount || 0;
    const { error: recalcError } = await supabase.rpc('recalculate_unread_count', {
      p_conversation_id: conversationId,
      p_user_id: user.id,
    });

    if (recalcError) {
      const { error: updateError } = await supabase
        .from('conversations')
        .update({ [updateField]: newCount, updated_at: new Date().toISOString() })
        .eq('id', conversationId);
      if (updateError) console.warn('Unable to reset unread count:', updateError);
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
    const { data: verifiedConversation } = await supabase
      .from('conversations')
      .select(updateField)
      .eq('id', conversationId)
      .single();

    if ((verifiedConversation?.[updateField] || 0) !== newCount) {
      await supabase
        .from('conversations')
        .update({ [updateField]: newCount, updated_at: new Date().toISOString() })
        .eq('id', conversationId);
    }
  } catch (error) {
    console.error('Error in markMessagesAsRead:', error);
    throw error;
  }
};

export const markMessageDelivered = async (messageId) => {
  try {
    const user = await getAuthenticatedUser();
    const { error } = await supabase
      .from('messages')
      .update({ delivered_at: new Date().toISOString() })
      .eq('id', messageId)
      .eq('receiver_id', user.id)
      .is('delivered_at', null);
    if (error) throw error;
  } catch (error) {
    console.error('Error in markMessageDelivered:', error);
    throw error;
  }
};

export const markMessageRead = async (messageId) => {
  try {
    const user = await getAuthenticatedUser();
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', messageId)
      .eq('receiver_id', user.id)
      .is('read_at', null);
    if (error) throw error;
  } catch (error) {
    console.error('Error in markMessageRead:', error);
    throw error;
  }
};

export const getMessageWithReply = async (messageId) => {
  try {
    const { data: message, error } = await supabase
      .from('messages')
      .select('*, reply_to:messages!messages_reply_to_id_fkey(*)')
      .eq('id', messageId)
      .single();
    if (error) throw error;
    return message;
  } catch (error) {
    console.error('Error in getMessageWithReply:', error);
    throw error;
  }
};

export const editMessage = async (messageId, newContent) => {
  try {
    const user = await getAuthenticatedUser();
    const cleanContent = String(newContent || '').trim();
    if (!cleanContent) throw new Error('Message cannot be empty');

    const { data: message, error } = await supabase
      .from('messages')
      .update({ content: cleanContent, is_edited: true })
      .eq('id', messageId)
      .eq('sender_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return message;
  } catch (error) {
    console.error('Error in editMessage:', error);
    throw error;
  }
};

export const deleteMessage = async (messageId) => {
  try {
    const user = await getAuthenticatedUser();
    const { error } = await supabase
      .from('messages')
      .update({ is_deleted: true })
      .eq('id', messageId)
      .eq('sender_id', user.id);
    if (error) throw error;
  } catch (error) {
    console.error('Error in deleteMessage:', error);
    throw error;
  }
};

export const updateConversationSettings = async (conversationId, settings) => {
  try {
    const user = await getAuthenticatedUser();

    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('user1_id, user2_id')
      .eq('id', conversationId)
      .single();

    if (conversationError || !conversation) throw conversationError || new Error('Conversation not found');
    if (conversation.user1_id !== user.id && conversation.user2_id !== user.id) throw new Error('Conversation not found');

    const prefix = conversation.user1_id === user.id ? 'user1_' : 'user2_';
    const updateData = {};
    if (settings.isMuted !== undefined) updateData[`${prefix}muted`] = settings.isMuted;
    if (settings.isPinned !== undefined) updateData[`${prefix}pinned`] = settings.isPinned;
    if (settings.isArchived !== undefined) updateData[`${prefix}archived`] = settings.isArchived;

    const { error } = await supabase
      .from('conversations')
      .update(updateData)
      .eq('id', conversationId);
    if (error) throw error;
  } catch (error) {
    console.error('Error in updateConversationSettings:', error);
    throw error;
  }
};

export const deleteConversation = async (conversationId) => {
  try {
    await getAuthenticatedUser();
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);
    if (error) throw error;
  } catch (error) {
    console.error('Error in deleteConversation:', error);
    throw error;
  }
};

export const subscribeToMessages = (conversationId, callback) => {
  const subscription = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
      (payload) => callback(payload.new)
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
      (payload) => callback(payload.new)
    )
    .subscribe();

  return subscription;
};

export const unsubscribeFromMessages = (subscription) => {
  if (subscription) supabase.removeChannel(subscription);
};

export const subscribeToConversations = (callback) => {
  return supabase
    .channel('conversations')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, callback)
    .subscribe();
};
