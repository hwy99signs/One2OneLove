import { supabase, handleSupabaseError } from './supabase';

const DIRECTORY_FIELDS = 'id, name, avatar_url, bio, relationship_status, user_type, location, interests';
const CHAT_BUCKET = 'chat-files';
const SIGNED_URL_TTL_SECONDS = 60 * 60;

const requireCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error('Authentication required');
  return data.user;
};

const safeAvatar = (profile, userId) => profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile?.name || userId || 'O2OL')}`;

const getDirectoryMap = async (ids) => {
  const uniqueIds = [...new Set((ids || []).filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('user_directory_profiles')
    .select(DIRECTORY_FIELDS)
    .in('id', uniqueIds);

  if (error) throw error;
  return new Map((data || []).map((profile) => [profile.id, profile]));
};

const assertConversationParticipant = async (conversationId, userId) => {
  const { data, error } = await supabase
    .from('conversations')
    .select('id, user1_id, user2_id, user1_unread_count, user2_unread_count')
    .eq('id', conversationId)
    .single();

  if (error || !data || ![data.user1_id, data.user2_id].includes(userId)) {
    throw new Error('Conversation not available');
  }
  return data;
};

const normalizeChatObjectPath = (value) => {
  if (!value) return '';
  const raw = String(value);
  if (!/^https?:\/\//i.test(raw)) return raw.replace(/^\/+/, '');

  const markers = [
    `/storage/v1/object/public/${CHAT_BUCKET}/`,
    `/storage/v1/object/sign/${CHAT_BUCKET}/`,
    `/storage/v1/object/authenticated/${CHAT_BUCKET}/`,
  ];

  for (const marker of markers) {
    const index = raw.indexOf(marker);
    if (index >= 0) {
      const objectPath = raw.slice(index + marker.length).split('?')[0];
      try {
        return decodeURIComponent(objectPath);
      } catch {
        return objectPath;
      }
    }
  }
  return '';
};

const createAttachmentSignedUrl = async (fileReference) => {
  const objectPath = normalizeChatObjectPath(fileReference);
  if (!objectPath) return null;

  const { data, error } = await supabase.storage
    .from(CHAT_BUCKET)
    .createSignedUrl(objectPath, SIGNED_URL_TTL_SECONDS);

  if (error) return null;
  return data?.signedUrl || null;
};

const getAttachmentUrlMap = async (messages) => {
  const entries = await Promise.all(
    (messages || [])
      .filter((message) => message.file_url)
      .map(async (message) => [message.id, await createAttachmentSignedUrl(message.file_url)]),
  );
  return new Map(entries);
};

export const getOrCreateConversation = async (otherUserId) => {
  try {
    const user = await requireCurrentUser();
    if (!otherUserId || otherUserId === user.id) throw new Error('Invalid conversation participant');

    const { data, error } = await supabase.rpc('get_or_create_conversation', {
      p_user1_id: user.id,
      p_user2_id: otherUserId,
    });

    if (error || !data) throw error || new Error('Conversation could not be created');
    return data;
  } catch (error) {
    throw new Error(handleSupabaseError(error));
  }
};

export const getMyConversations = async () => {
  try {
    const user = await requireCurrentUser();
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (error) throw error;
    if (!conversations?.length) return [];

    const otherUserIds = conversations.map((conversation) => conversation.user1_id === user.id ? conversation.user2_id : conversation.user1_id);
    const profiles = await getDirectoryMap(otherUserIds);

    const lastMessageIds = conversations.map((conversation) => conversation.last_message_id).filter(Boolean);
    let lastMessages = new Map();
    if (lastMessageIds.length > 0) {
      const { data: messages } = await supabase
        .from('messages')
        .select('id, content, message_type, file_name, is_deleted')
        .in('id', lastMessageIds);
      lastMessages = new Map((messages || []).map((message) => [message.id, message]));
    }

    return conversations.map((conversation) => {
      const otherUserId = conversation.user1_id === user.id ? conversation.user2_id : conversation.user1_id;
      const profile = profiles.get(otherUserId) || { id: otherUserId, name: 'One2OneLove Member' };
      const lastMessage = conversation.last_message_id ? lastMessages.get(conversation.last_message_id) : null;
      const isUser1 = conversation.user1_id === user.id;

      let lastMessageText = '';
      if (lastMessage) {
        if (lastMessage.is_deleted) lastMessageText = '';
        else if (lastMessage.message_type === 'text') lastMessageText = lastMessage.content || '';
        else if (lastMessage.message_type === 'image') lastMessageText = '📷 Image';
        else if (lastMessage.message_type === 'video') lastMessageText = '🎥 Video';
        else if (lastMessage.message_type === 'audio' || lastMessage.message_type === 'voice') lastMessageText = '🎤 Voice message';
        else if (lastMessage.message_type === 'location') lastMessageText = '📍 Location';
        else if (lastMessage.message_type === 'file') lastMessageText = `📎 ${lastMessage.file_name || 'File'}`;
        else lastMessageText = lastMessage.content || '';
      }

      return {
        id: conversation.id,
        otherUserId,
        otherUserName: profile.name || 'One2OneLove Member',
        otherUserAvatar: safeAvatar(profile, otherUserId),
        lastMessage: lastMessageText,
        lastMessageAt: conversation.last_message_at,
        unreadCount: isUser1 ? (conversation.user1_unread_count || 0) : (conversation.user2_unread_count || 0),
        isMuted: isUser1 ? conversation.user1_muted : conversation.user2_muted,
        isPinned: isUser1 ? conversation.user1_pinned : conversation.user2_pinned,
        isArchived: isUser1 ? conversation.user1_archived : conversation.user2_archived,
        createdAt: conversation.created_at,
        updatedAt: conversation.updated_at,
      };
    });
  } catch (error) {
    throw new Error(handleSupabaseError(error));
  }
};

export const getMessages = async (conversationId, limit = 100) => {
  try {
    const user = await requireCurrentUser();
    await assertConversationParticipant(conversationId, user.id);

    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 200);
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
      .limit(safeLimit);

    if (error) throw error;
    if (!messages?.length) return [];

    const senderIds = messages.map((message) => message.sender_id);
    const profiles = await getDirectoryMap(senderIds);
    const attachmentUrls = await getAttachmentUrlMap(messages);

    const replyIds = messages.map((message) => message.reply_to_id).filter(Boolean);
    let replyMap = new Map();
    if (replyIds.length > 0) {
      const { data: replies } = await supabase
        .from('messages')
        .select('id, content, message_type, sender_id, is_deleted')
        .in('id', replyIds);
      replyMap = new Map((replies || []).map((message) => [message.id, message]));
    }

    return messages.map((message) => {
      const sender = profiles.get(message.sender_id) || { id: message.sender_id, name: 'One2OneLove Member' };
      const reply = message.reply_to_id ? replyMap.get(message.reply_to_id) : null;
      const replySender = reply ? profiles.get(reply.sender_id) : null;
      const status = message.read_at || message.is_read ? 'read' : message.delivered_at ? 'delivered' : 'sent';
      const signedFileUrl = attachmentUrls.get(message.id) || null;

      const transformed = {
        id: message.id,
        conversationId: message.conversation_id,
        senderId: message.sender_id,
        receiverId: message.receiver_id,
        senderName: sender.name || 'One2OneLove Member',
        senderAvatar: safeAvatar(sender, message.sender_id),
        type: message.message_type,
        text: message.content,
        content: message.content,
        fileUrl: signedFileUrl,
        fileName: message.file_name,
        fileSize: message.file_size,
        fileType: message.file_type,
        locationLat: message.location_lat,
        locationLng: message.location_lng,
        locationAddress: message.location_address,
        isRead: Boolean(message.is_read || message.read_at),
        isEdited: Boolean(message.is_edited),
        replyToId: message.reply_to_id,
        replyToMessage: reply ? {
          id: reply.id,
          content: reply.is_deleted ? '' : reply.content,
          messageType: reply.message_type,
          senderId: reply.sender_id,
          senderName: replySender?.name || 'One2OneLove Member',
        } : null,
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
        transformed.imageUrl = signedFileUrl;
        transformed.caption = message.content;
      } else if (message.message_type === 'voice' || message.message_type === 'audio') {
        transformed.audioUrl = signedFileUrl;
        transformed.duration = message.duration || 0;
      } else if (message.message_type === 'location') {
        transformed.latitude = message.location_lat;
        transformed.longitude = message.location_lng;
        transformed.address = message.location_address;
      }

      return transformed;
    });
  } catch (error) {
    throw new Error(handleSupabaseError(error));
  }
};

export const sendMessage = async (conversationId, receiverId, content, messageType = 'text', replyToId = null) => {
  try {
    const user = await requireCurrentUser();
    const conversation = await assertConversationParticipant(conversationId, user.id);
    const expectedReceiver = conversation.user1_id === user.id ? conversation.user2_id : conversation.user1_id;
    if (receiverId !== expectedReceiver) throw new Error('Invalid message recipient');

    const cleanContent = String(content || '').slice(0, 10000);
    if (!cleanContent && messageType === 'text') throw new Error('Message cannot be empty');

    const messageData = {
      conversation_id: conversationId,
      sender_id: user.id,
      receiver_id: receiverId,
      content: cleanContent,
      message_type: messageType,
    };
    if (replyToId) messageData.reply_to_id = replyToId;

    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw new Error(handleSupabaseError(error));
  }
};

export const sendFileMessage = async (conversationId, receiverId, file, messageType) => {
  try {
    const user = await requireCurrentUser();
    const conversation = await assertConversationParticipant(conversationId, user.id);
    const expectedReceiver = conversation.user1_id === user.id ? conversation.user2_id : conversation.user1_id;
    if (receiverId !== expectedReceiver) throw new Error('Invalid message recipient');
    if (!file || file.size <= 0) throw new Error('Invalid file');

    const extension = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const filePath = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from(CHAT_BUCKET).upload(filePath, file, { upsert: false });
    if (uploadError) throw uploadError;

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        receiver_id: receiverId,
        content: String(file.name || '').slice(0, 255),
        message_type: messageType,
        file_url: filePath,
        file_name: String(file.name || '').slice(0, 255),
        file_size: file.size,
        file_type: file.type || null,
      })
      .select()
      .single();

    if (error) {
      await supabase.storage.from(CHAT_BUCKET).remove([filePath]);
      throw error;
    }

    const signedUrl = await createAttachmentSignedUrl(filePath);
    return { ...data, file_url: signedUrl, file_path: filePath };
  } catch (error) {
    throw new Error(handleSupabaseError(error));
  }
};

export const sendLocationMessage = async (conversationId, receiverId, location) => {
  try {
    const user = await requireCurrentUser();
    const conversation = await assertConversationParticipant(conversationId, user.id);
    const expectedReceiver = conversation.user1_id === user.id ? conversation.user2_id : conversation.user1_id;
    if (receiverId !== expectedReceiver) throw new Error('Invalid message recipient');

    const latitude = Number(location?.lat);
    const longitude = Number(location?.lng);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw new Error('Invalid location');
    }

    const address = String(location?.address || 'Location').slice(0, 500);
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        receiver_id: receiverId,
        content: address,
        message_type: 'location',
        location_lat: latitude,
        location_lng: longitude,
        location_address: address,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw new Error(handleSupabaseError(error));
  }
};

export const markMessagesAsRead = async (conversationId) => {
  try {
    const user = await requireCurrentUser();
    await assertConversationParticipant(conversationId, user.id);
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('messages')
      .update({ delivered_at: now, is_read: true, read_at: now })
      .eq('conversation_id', conversationId)
      .eq('receiver_id', user.id)
      .or('is_read.eq.false,read_at.is.null');

    if (error) throw error;

    const { error: recalcError } = await supabase.rpc('recalculate_unread_count', {
      p_conversation_id: conversationId,
      p_user_id: user.id,
    });
    if (recalcError) throw recalcError;
  } catch (error) {
    throw new Error(handleSupabaseError(error));
  }
};

export const markMessageDelivered = async (messageId) => {
  try {
    await requireCurrentUser();
    const { error } = await supabase.rpc('mark_message_delivered', { p_message_id: messageId });
    if (error) throw error;
  } catch (error) {
    throw new Error(handleSupabaseError(error));
  }
};

export const markMessageRead = async (messageId) => {
  try {
    await requireCurrentUser();
    const { error } = await supabase.rpc('mark_message_read', { p_message_id: messageId });
    if (error) throw error;
  } catch (error) {
    throw new Error(handleSupabaseError(error));
  }
};

export const getMessageWithReply = async (messageId) => {
  try {
    const user = await requireCurrentUser();
    const { data, error } = await supabase
      .from('messages')
      .select('*, reply_to:messages!messages_reply_to_id_fkey(*)')
      .eq('id', messageId)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    throw new Error(handleSupabaseError(error));
  }
};

export const editMessage = async (messageId, newContent) => {
  try {
    const user = await requireCurrentUser();
    const cleanContent = String(newContent || '').trim().slice(0, 10000);
    if (!cleanContent) throw new Error('Message cannot be empty');

    const { data, error } = await supabase
      .from('messages')
      .update({ content: cleanContent, is_edited: true, updated_at: new Date().toISOString() })
      .eq('id', messageId)
      .eq('sender_id', user.id)
      .eq('is_deleted', false)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw new Error(handleSupabaseError(error));
  }
};

export const deleteMessage = async (messageId) => {
  try {
    const user = await requireCurrentUser();
    const { data: message, error: fetchError } = await supabase
      .from('messages')
      .select('id, sender_id, file_url')
      .eq('id', messageId)
      .eq('sender_id', user.id)
      .single();
    if (fetchError) throw fetchError;

    const { error } = await supabase
      .from('messages')
      .update({ is_deleted: true, content: '', updated_at: new Date().toISOString() })
      .eq('id', messageId)
      .eq('sender_id', user.id);
    if (error) throw error;

    const objectPath = normalizeChatObjectPath(message?.file_url);
    if (objectPath) await supabase.storage.from(CHAT_BUCKET).remove([objectPath]);
  } catch (error) {
    throw new Error(handleSupabaseError(error));
  }
};

export const updateConversationSettings = async (conversationId, settings) => {
  try {
    const user = await requireCurrentUser();
    const conversation = await assertConversationParticipant(conversationId, user.id);
    const prefix = conversation.user1_id === user.id ? 'user1_' : 'user2_';
    const updates = {};

    if (typeof settings?.isMuted === 'boolean') updates[`${prefix}muted`] = settings.isMuted;
    if (typeof settings?.isPinned === 'boolean') updates[`${prefix}pinned`] = settings.isPinned;
    if (typeof settings?.isArchived === 'boolean') updates[`${prefix}archived`] = settings.isArchived;
    if (Object.keys(updates).length === 0) return;
    updates.updated_at = new Date().toISOString();

    const { error } = await supabase.from('conversations').update(updates).eq('id', conversationId);
    if (error) throw error;
  } catch (error) {
    throw new Error(handleSupabaseError(error));
  }
};

export const getOnlineStatus = async (userId) => {
  try {
    await requireCurrentUser();
    const { data, error } = await supabase.rpc('get_user_presence', { p_user_id: userId });
    if (error) throw error;
    return Array.isArray(data) ? data[0] || null : data;
  } catch (error) {
    throw new Error(handleSupabaseError(error));
  }
};
