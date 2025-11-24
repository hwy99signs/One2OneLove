/**
 * Chat Features Service
 * Handles reactions, stars, pins, forwards, archives, and other chat features
 */

import { supabase } from './supabase';

// =====================================================
// MESSAGE REACTIONS
// =====================================================

/**
 * Add or toggle a reaction to a message
 * @param {string} messageId - Message ID
 * @param {string} emoji - Emoji to react with
 */
export const toggleReaction = async (messageId, emoji) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    console.log('👍 Toggling reaction:', { messageId, emoji });

    // Check if reaction already exists
    const { data: existingReaction, error: checkError } = await supabase
      .from('message_reactions')
      .select('id')
      .eq('message_id', messageId)
      .eq('user_id', user.id)
      .eq('emoji', emoji)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    // If exists, remove it (toggle off)
    if (existingReaction) {
      const { error: deleteError } = await supabase
        .from('message_reactions')
        .delete()
        .eq('id', existingReaction.id);

      if (deleteError) throw deleteError;

      console.log('✅ Reaction removed');
      return { success: true, action: 'removed' };
    }

    // Otherwise, add it
    const { error: insertError } = await supabase
      .from('message_reactions')
      .insert({
        message_id: messageId,
        user_id: user.id,
        emoji: emoji,
      });

    if (insertError) throw insertError;

    console.log('✅ Reaction added');
    return { success: true, action: 'added' };
  } catch (error) {
    console.error('❌ Error toggling reaction:', error);
    throw error;
  }
};

/**
 * Get all reactions for a message
 * @param {string} messageId - Message ID
 */
export const getMessageReactions = async (messageId) => {
  try {
    console.log('📊 Fetching reactions for message:', messageId);

    const { data, error } = await supabase
      .from('message_reactions')
      .select('emoji, user_id')
      .eq('message_id', messageId);

    if (error) throw error;

    // Group reactions by emoji and count
    const reactionCounts = {};
    const { data: { user } } = await supabase.auth.getUser();

    data?.forEach(reaction => {
      if (!reactionCounts[reaction.emoji]) {
        reactionCounts[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          userReacted: false,
        };
      }
      reactionCounts[reaction.emoji].count++;
      if (user && reaction.user_id === user.id) {
        reactionCounts[reaction.emoji].userReacted = true;
      }
    });

    const reactions = Object.values(reactionCounts);
    console.log('✅ Reactions fetched:', reactions);
    return reactions;
  } catch (error) {
    console.error('❌ Error fetching reactions:', error);
    throw error;
  }
};

// =====================================================
// STARRED MESSAGES
// =====================================================

/**
 * Toggle star on a message
 * @param {string} messageId - Message ID
 */
export const toggleStarMessage = async (messageId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    console.log('⭐ Toggling star for message:', messageId);

    // Check if already starred
    const { data: existingStar, error: checkError } = await supabase
      .from('starred_messages')
      .select('id')
      .eq('message_id', messageId)
      .eq('user_id', user.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    // If exists, remove it
    if (existingStar) {
      const { error: deleteError } = await supabase
        .from('starred_messages')
        .delete()
        .eq('id', existingStar.id);

      if (deleteError) throw deleteError;

      console.log('✅ Message unstarred');
      return { success: true, starred: false };
    }

    // Otherwise, add it
    const { error: insertError } = await supabase
      .from('starred_messages')
      .insert({
        message_id: messageId,
        user_id: user.id,
      });

    if (insertError) throw insertError;

    console.log('✅ Message starred');
    return { success: true, starred: true };
  } catch (error) {
    console.error('❌ Error toggling star:', error);
    throw error;
  }
};

/**
 * Get all starred messages for current user
 */
export const getStarredMessages = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    console.log('⭐ Fetching starred messages');

    const { data: starredData, error } = await supabase
      .from('starred_messages')
      .select('message_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch the actual messages
    if (!starredData || starredData.length === 0) {
      return [];
    }

    const messageIds = starredData.map(s => s.message_id);

    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .in('id', messageIds);

    if (messagesError) throw messagesError;

    console.log(`✅ Found ${messages.length} starred messages`);
    return messages;
  } catch (error) {
    console.error('❌ Error fetching starred messages:', error);
    throw error;
  }
};

/**
 * Check if a message is starred
 * @param {string} messageId - Message ID
 */
export const isMessageStarred = async (messageId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('starred_messages')
      .select('id')
      .eq('message_id', messageId)
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error('❌ Error checking if message is starred:', error);
    return false;
  }
};

// =====================================================
// PINNED MESSAGES
// =====================================================

/**
 * Pin a message in a conversation
 * @param {string} messageId - Message ID
 * @param {string} conversationId - Conversation ID
 * @param {Date} expiresAt - Optional expiry date
 */
export const pinMessage = async (messageId, conversationId, expiresAt = null) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    console.log('📌 Pinning message:', { messageId, conversationId });

    const { error } = await supabase
      .from('pinned_messages')
      .insert({
        message_id: messageId,
        conversation_id: conversationId,
        pinned_by: user.id,
        expires_at: expiresAt,
      });

    if (error) throw error;

    console.log('✅ Message pinned');
    return { success: true };
  } catch (error) {
    console.error('❌ Error pinning message:', error);
    throw error;
  }
};

/**
 * Unpin a message
 * @param {string} messageId - Message ID
 * @param {string} conversationId - Conversation ID
 */
export const unpinMessage = async (messageId, conversationId) => {
  try {
    console.log('📌 Unpinning message:', { messageId, conversationId });

    const { error } = await supabase
      .from('pinned_messages')
      .delete()
      .eq('message_id', messageId)
      .eq('conversation_id', conversationId);

    if (error) throw error;

    console.log('✅ Message unpinned');
    return { success: true };
  } catch (error) {
    console.error('❌ Error unpinning message:', error);
    throw error;
  }
};

/**
 * Get all pinned messages for a conversation
 * @param {string} conversationId - Conversation ID
 */
export const getPinnedMessages = async (conversationId) => {
  try {
    console.log('📌 Fetching pinned messages for conversation:', conversationId);

    const { data: pinnedData, error } = await supabase
      .from('pinned_messages')
      .select('message_id, pinned_by, expires_at, created_at')
      .eq('conversation_id', conversationId)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!pinnedData || pinnedData.length === 0) {
      return [];
    }

    // Fetch the actual messages
    const messageIds = pinnedData.map(p => p.message_id);

    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .in('id', messageIds);

    if (messagesError) throw messagesError;

    // Merge pinned data with messages
    const pinnedMessages = messages.map(msg => {
      const pinData = pinnedData.find(p => p.message_id === msg.id);
      return {
        ...msg,
        pinned_by: pinData.pinned_by,
        pinned_at: pinData.created_at,
        pin_expires_at: pinData.expires_at,
      };
    });

    console.log(`✅ Found ${pinnedMessages.length} pinned messages`);
    return pinnedMessages;
  } catch (error) {
    console.error('❌ Error fetching pinned messages:', error);
    throw error;
  }
};

/**
 * Check if a message is pinned
 * @param {string} messageId - Message ID
 * @param {string} conversationId - Conversation ID
 */
export const isMessagePinned = async (messageId, conversationId) => {
  try {
    const { data, error } = await supabase
      .from('pinned_messages')
      .select('id')
      .eq('message_id', messageId)
      .eq('conversation_id', conversationId)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error('❌ Error checking if message is pinned:', error);
    return false;
  }
};

// =====================================================
// MESSAGE FORWARDING
// =====================================================

/**
 * Forward a message to another conversation
 * @param {string} messageId - Original message ID
 * @param {string} toConversationId - Target conversation ID
 */
export const forwardMessage = async (messageId, toConversationId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    console.log('⏩ Forwarding message:', { messageId, toConversationId });

    // Get the original message
    const { data: originalMessage, error: fetchError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (fetchError) throw fetchError;

    // Get the target conversation to find receiver
    const { data: targetConv, error: convError } = await supabase
      .from('conversations')
      .select('user1_id, user2_id')
      .eq('id', toConversationId)
      .single();

    if (convError) throw convError;

    const receiverId = targetConv.user1_id === user.id ? targetConv.user2_id : targetConv.user1_id;

    // Create new message in target conversation
    const { data: newMessage, error: insertError } = await supabase
      .from('messages')
      .insert({
        conversation_id: toConversationId,
        sender_id: user.id,
        receiver_id: receiverId,
        message_type: originalMessage.message_type,
        content: originalMessage.content,
        file_url: originalMessage.file_url,
        image_url: originalMessage.image_url,
        audio_url: originalMessage.audio_url,
        location_lat: originalMessage.location_lat,
        location_lng: originalMessage.location_lng,
        location_address: originalMessage.location_address,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Record the forward in forwarded_messages table
    const { error: forwardError } = await supabase
      .from('forwarded_messages')
      .insert({
        original_message_id: messageId,
        new_message_id: newMessage.id,
        forwarded_by: user.id,
        forwarded_to_conversation: toConversationId,
      });

    if (forwardError) {
      console.warn('⚠️ Failed to record forward history:', forwardError);
    }

    console.log('✅ Message forwarded successfully');
    return { success: true, newMessageId: newMessage.id };
  } catch (error) {
    console.error('❌ Error forwarding message:', error);
    throw error;
  }
};

// =====================================================
// CONVERSATION MANAGEMENT
// =====================================================

/**
 * Mark conversation as unread
 * @param {string} conversationId - Conversation ID
 */
export const markConversationAsUnread = async (conversationId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    console.log('📭 Marking conversation as unread:', conversationId);

    // Get the conversation to determine which column to update
    const { data: conv, error: convError } = await supabase
      .from('conversations')
      .select('user1_id, user2_id, user1_unread_count, user2_unread_count')
      .eq('id', conversationId)
      .single();

    if (convError) throw convError;

    const isUser1 = conv.user1_id === user.id;

    const { error: updateError } = await supabase
      .from('conversations')
      .update({
        [isUser1 ? 'user1_unread_count' : 'user2_unread_count']: 1,
      })
      .eq('id', conversationId);

    if (updateError) throw updateError;

    console.log('✅ Conversation marked as unread');
    return { success: true };
  } catch (error) {
    console.error('❌ Error marking conversation as unread:', error);
    throw error;
  }
};

/**
 * Archive a conversation
 * @param {string} conversationId - Conversation ID
 * @param {boolean} archived - Archive status
 */
export const archiveConversation = async (conversationId, archived = true) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    console.log(`🗄️ ${archived ? 'Archiving' : 'Unarchiving'} conversation:`, conversationId);

    // Get the conversation to determine which column to update
    const { data: conv, error: convError } = await supabase
      .from('conversations')
      .select('user1_id, user2_id')
      .eq('id', conversationId)
      .single();

    if (convError) throw convError;

    const isUser1 = conv.user1_id === user.id;

    const { error: updateError } = await supabase
      .from('conversations')
      .update({
        [isUser1 ? 'user1_archived' : 'user2_archived']: archived,
      })
      .eq('id', conversationId);

    if (updateError) throw updateError;

    console.log(`✅ Conversation ${archived ? 'archived' : 'unarchived'}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error archiving conversation:', error);
    throw error;
  }
};

/**
 * Clear all messages in a conversation (soft delete)
 * @param {string} conversationId - Conversation ID
 */
export const clearConversationMessages = async (conversationId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    console.log('🗑️ Clearing messages in conversation:', conversationId);

    // Soft delete all messages in the conversation for this user
    const { error } = await supabase
      .from('messages')
      .update({ is_deleted: true })
      .eq('conversation_id', conversationId)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

    if (error) throw error;

    // Reset unread count
    const { data: conv, error: convError } = await supabase
      .from('conversations')
      .select('user1_id')
      .eq('id', conversationId)
      .single();

    if (convError) throw convError;

    const isUser1 = conv.user1_id === user.id;

    await supabase
      .from('conversations')
      .update({
        [isUser1 ? 'user1_unread_count' : 'user2_unread_count']: 0,
        last_message: '',
      })
      .eq('id', conversationId);

    console.log('✅ Messages cleared');
    return { success: true };
  } catch (error) {
    console.error('❌ Error clearing messages:', error);
    throw error;
  }
};

/**
 * Delete entire conversation (for both users)
 * @param {string} conversationId - Conversation ID
 */
export const deleteConversation = async (conversationId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    console.log('🗑️ Deleting conversation:', conversationId);

    // Verify user is part of this conversation
    const { data: conv, error: convError } = await supabase
      .from('conversations')
      .select('user1_id, user2_id')
      .eq('id', conversationId)
      .single();

    if (convError) throw convError;

    if (conv.user1_id !== user.id && conv.user2_id !== user.id) {
      throw new Error('You do not have permission to delete this conversation');
    }

    // Delete all messages (CASCADE will handle reactions, pins, etc.)
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', conversationId);

    if (messagesError) throw messagesError;

    // Delete the conversation
    const { error: deleteError } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (deleteError) throw deleteError;

    console.log('✅ Conversation deleted');
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting conversation:', error);
    throw error;
  }
};

/**
 * Copy message content to clipboard
 * @param {string} content - Message content to copy
 */
export const copyMessageContent = async (content) => {
  try {
    await navigator.clipboard.writeText(content);
    console.log('✅ Message content copied to clipboard');
    return { success: true };
  } catch (error) {
    console.error('❌ Error copying to clipboard:', error);
    throw error;
  }
};

/**
 * Get message info (metadata)
 * @param {string} messageId - Message ID
 */
export const getMessageInfo = async (messageId) => {
  try {
    console.log('ℹ️ Fetching message info:', messageId);

    const { data: message, error } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (error) throw error;

    // Get sender info
    const { data: senderData } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', message.sender_id)
      .single();

    // Get reactions count
    const { data: reactions } = await supabase
      .from('message_reactions')
      .select('emoji')
      .eq('message_id', messageId);

    // Check if starred
    const isStarred = await isMessageStarred(messageId);

    // Check if pinned
    const isPinned = await isMessagePinned(messageId, message.conversation_id);

    // Check if forwarded
    const { data: forwardData } = await supabase
      .from('forwarded_messages')
      .select('original_message_id')
      .eq('new_message_id', messageId)
      .single();

    const info = {
      ...message,
      sender_name: senderData?.name || senderData?.email || 'Unknown',
      reactions_count: reactions?.length || 0,
      is_starred: isStarred,
      is_pinned: isPinned,
      is_forwarded: !!forwardData,
      original_message_id: forwardData?.original_message_id,
    };

    console.log('✅ Message info:', info);
    return info;
  } catch (error) {
    console.error('❌ Error fetching message info:', error);
    throw error;
  }
};

export default {
  // Reactions
  toggleReaction,
  getMessageReactions,
  
  // Stars
  toggleStarMessage,
  getStarredMessages,
  isMessageStarred,
  
  // Pins
  pinMessage,
  unpinMessage,
  getPinnedMessages,
  isMessagePinned,
  
  // Forward
  forwardMessage,
  
  // Conversation management
  markConversationAsUnread,
  archiveConversation,
  clearConversationMessages,
  deleteConversation,
  
  // Utilities
  copyMessageContent,
  getMessageInfo,
};

