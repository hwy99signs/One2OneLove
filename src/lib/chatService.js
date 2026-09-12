import { apiRequest, ONE2ONE_API_BASE } from './one2oneApi';

const POLL_MESSAGES_MS = 3000;
const POLL_CONVERSATIONS_MS = 5000;

async function parseRawResponse(response) {
  const type = response.headers.get('content-type') || '';
  const payload = type.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null);
  if (!response.ok) {
    const error = new Error(payload?.error?.message || payload?.message || `Request failed (${response.status})`);
    error.status = response.status;
    error.code = payload?.error?.code || null;
    throw error;
  }
  return payload;
}

function messageFingerprint(messages) {
  return JSON.stringify((messages || []).map(m => [m.id, m.updatedAt, m.deliveredAt, m.readAt, m.isEdited, m.content]));
}
function conversationFingerprint(conversations) {
  return JSON.stringify((conversations || []).map(c => [c.id, c.updatedAt, c.lastMessageTime, c.unreadCount, c.isPinned, c.isMuted, c.isArchived]));
}
function legacyEventShape(message) {
  if (!message) return null;
  return {
    ...message,
    conversation_id: message.conversationId,
    sender_id: message.senderId,
    receiver_id: message.receiverId,
    delivered_at: message.deliveredAt,
    read_at: message.readAt,
    created_at: message.createdAt,
    updated_at: message.updatedAt,
  };
}

export const getMyConversations = async () => {
  const data = await apiRequest('/api/chat/conversations');
  return data?.conversations || [];
};

export const getOrCreateConversation = async (otherUserId) => {
  const data = await apiRequest('/api/chat/conversations', {
    method: 'POST',
    body: { other_user_id: otherUserId },
  });
  return data?.conversation_id;
};

export const getMessages = async (conversationId) => {
  if (!conversationId) return [];
  const data = await apiRequest(`/api/chat/conversations/${conversationId}/messages`);
  return data?.messages || [];
};

export const sendMessage = async (conversationId, receiverId, content, messageType = 'text', replyToId = null) => {
  const data = await apiRequest(`/api/chat/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: {
      receiver_id: receiverId,
      content,
      message_type: messageType,
      reply_to_id: replyToId,
    },
  });
  return data?.message || null;
};

export const sendFileMessage = async (conversationId, receiverId, file, messageType = 'file') => {
  if (!file) throw new Error('A file is required.');
  const params = new URLSearchParams({
    receiver_id: receiverId,
    message_type: messageType || 'file',
    file_name: file.name || 'attachment',
  });
  const response = await fetch(`${ONE2ONE_API_BASE}/api/chat/conversations/${conversationId}/files?${params.toString()}`, {
    method: 'PUT',
    headers: { 'content-type': file.type || 'application/octet-stream' },
    body: file,
    credentials: 'include',
    cache: 'no-store',
  });
  const data = await parseRawResponse(response);
  return data?.message || null;
};

export const sendLocationMessage = async (conversationId, receiverId, location) => {
  const data = await apiRequest(`/api/chat/conversations/${conversationId}/location`, {
    method: 'POST',
    body: {
      receiver_id: receiverId,
      lat: location?.lat,
      lng: location?.lng,
      address: location?.address,
    },
  });
  return data?.message || null;
};

export const markMessagesAsRead = async (conversationId) => {
  return apiRequest(`/api/chat/conversations/${conversationId}/read`, { method: 'POST', body: {} });
};

export const markMessageDelivered = async (messageId) => {
  return apiRequest(`/api/chat/messages/${messageId}/delivered`, { method: 'POST', body: {} });
};

export const markMessageRead = async (messageId) => {
  return apiRequest(`/api/chat/messages/${messageId}/read`, { method: 'POST', body: {} });
};

export const getMessageWithReply = async (messageId) => {
  const data = await apiRequest(`/api/chat/messages/${messageId}`);
  return data?.message || null;
};

export const editMessage = async (messageId, newContent) => {
  const data = await apiRequest(`/api/chat/messages/${messageId}`, {
    method: 'PATCH',
    body: { content: newContent },
  });
  return data?.message || null;
};

export const deleteMessage = async (messageId) => {
  return apiRequest(`/api/chat/messages/${messageId}`, { method: 'DELETE' });
};

export const updateConversationSettings = async (conversationId, settings) => {
  return apiRequest(`/api/chat/conversations/${conversationId}/settings`, {
    method: 'PATCH',
    body: settings || {},
  });
};

export const deleteConversation = async (conversationId) => {
  return apiRequest(`/api/chat/conversations/${conversationId}`, { method: 'DELETE' });
};

export const markPendingMessagesDelivered = async () => {
  return apiRequest('/api/chat/deliver-pending', { method: 'POST', body: {} });
};

export const subscribeToMessages = (conversationId, callback) => {
  let stopped = false;
  let fingerprint = null;

  const poll = async (initial = false) => {
    if (stopped) return;
    try {
      const messages = await getMessages(conversationId);
      const next = messageFingerprint(messages);
      if (!initial && fingerprint !== null && next !== fingerprint && typeof callback === 'function') {
        const newest = messages[messages.length - 1] || null;
        callback(legacyEventShape(newest) || { conversation_id: conversationId, type: 'refresh' });
      }
      fingerprint = next;
    } catch (error) {
      if (!stopped) console.warn('Chat message polling failed:', error);
    }
  };

  poll(true);
  const timer = window.setInterval(() => poll(false), POLL_MESSAGES_MS);
  return {
    type: 'polling',
    unsubscribe() {
      stopped = true;
      window.clearInterval(timer);
    },
  };
};

export const subscribeToConversations = (callback) => {
  let stopped = false;
  let fingerprint = null;

  const poll = async (initial = false) => {
    if (stopped) return;
    try {
      await markPendingMessagesDelivered().catch(() => null);
      const conversations = await getMyConversations();
      const next = conversationFingerprint(conversations);
      if (!initial && fingerprint !== null && next !== fingerprint && typeof callback === 'function') {
        callback({ eventType: 'poll', conversations });
      }
      fingerprint = next;
    } catch (error) {
      if (!stopped) console.warn('Chat conversation polling failed:', error);
    }
  };

  poll(true);
  const timer = window.setInterval(() => poll(false), POLL_CONVERSATIONS_MS);
  return {
    type: 'polling',
    unsubscribe() {
      stopped = true;
      window.clearInterval(timer);
    },
  };
};

export const unsubscribeFromMessages = (subscription) => {
  try {
    subscription?.unsubscribe?.();
  } catch (error) {
    console.warn('Unable to stop chat subscription:', error);
  }
};

export default {
  getMyConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  sendFileMessage,
  sendLocationMessage,
  markMessagesAsRead,
  markMessageDelivered,
  markMessageRead,
  getMessageWithReply,
  editMessage,
  deleteMessage,
  updateConversationSettings,
  deleteConversation,
  markPendingMessagesDelivered,
  subscribeToMessages,
  unsubscribeFromMessages,
  subscribeToConversations,
};