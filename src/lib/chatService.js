import { apiRequest } from './apiClient';

export const getMyConversations = async () => {
  const payload = await apiRequest('/api/chat/conversations');
  return payload?.conversations || [];
};

export const getOrCreateConversation = async (otherUserId) => {
  const payload = await apiRequest('/api/chat/conversations', {
    method: 'POST',
    body: { other_user_id: otherUserId },
  });
  return payload?.conversation_id;
};

export const getMessages = async (conversationId) => {
  const payload = await apiRequest(`/api/chat/conversations/${encodeURIComponent(conversationId)}/messages`);
  return payload?.messages || [];
};

export const sendMessage = async (conversationId, receiverId, content, messageType = 'text', replyToId = null) => {
  const payload = await apiRequest(`/api/chat/conversations/${encodeURIComponent(conversationId)}/messages`, {
    method: 'POST',
    body: {
      receiver_id: receiverId,
      content,
      message_type: messageType,
      reply_to_id: replyToId || null,
    },
  });
  return payload?.message || null;
};

export const sendFileMessage = async (conversationId, receiverId, file, messageType = 'file') => {
  if (!file) throw new Error('File is required.');
  const params = new URLSearchParams({
    receiver_id: receiverId,
    message_type: messageType,
    file_name: file.name || 'attachment',
  });
  const payload = await apiRequest(`/api/chat/conversations/${encodeURIComponent(conversationId)}/files?${params}`, {
    method: 'PUT',
    headers: { 'content-type': file.type || 'application/octet-stream' },
    rawBody: file,
  });
  return payload?.message || null;
};

export const sendLocationMessage = async (conversationId, receiverId, location) => {
  const payload = await apiRequest(`/api/chat/conversations/${encodeURIComponent(conversationId)}/location`, {
    method: 'POST',
    body: {
      receiver_id: receiverId,
      lat: location?.lat,
      lng: location?.lng,
      address: location?.address || 'Location',
    },
  });
  return payload?.message || null;
};

export const markMessagesAsRead = async (conversationId) => {
  await apiRequest(`/api/chat/conversations/${encodeURIComponent(conversationId)}/read`, {
    method: 'POST', body: {},
  });
};

export const markMessageDelivered = async (messageId) => {
  await apiRequest(`/api/chat/messages/${encodeURIComponent(messageId)}/delivered`, {
    method: 'POST', body: {},
  });
};

export const markMessageRead = async (messageId) => {
  await apiRequest(`/api/chat/messages/${encodeURIComponent(messageId)}/read`, {
    method: 'POST', body: {},
  });
};

export const markPendingMessagesDelivered = async () => {
  const payload = await apiRequest('/api/chat/deliver-pending', { method: 'POST', body: {} });
  return payload?.delivered || 0;
};

export const getMessageWithReply = async (messageId) => {
  const payload = await apiRequest(`/api/chat/messages/${encodeURIComponent(messageId)}`);
  return payload?.message || null;
};

export const editMessage = async (messageId, newContent) => {
  const payload = await apiRequest(`/api/chat/messages/${encodeURIComponent(messageId)}`, {
    method: 'PATCH', body: { content: newContent },
  });
  return payload?.message || null;
};

export const deleteMessage = async (messageId) => {
  await apiRequest(`/api/chat/messages/${encodeURIComponent(messageId)}`, { method: 'DELETE' });
};

export const updateConversationSettings = async (conversationId, settings) => {
  await apiRequest(`/api/chat/conversations/${encodeURIComponent(conversationId)}/settings`, {
    method: 'PATCH', body: settings,
  });
};

export const deleteConversation = async (conversationId) => {
  await apiRequest(`/api/chat/conversations/${encodeURIComponent(conversationId)}`, { method: 'DELETE' });
};

export const clearConversation = async (conversationId) => {
  await apiRequest(`/api/chat/conversations/${encodeURIComponent(conversationId)}/clear`, { method: 'POST', body: {} });
};

export const markConversationUnread = async (conversationId) => {
  await apiRequest(`/api/chat/conversations/${encodeURIComponent(conversationId)}/unread`, { method: 'POST', body: {} });
};

const subscriptions = new Set();
function makePoller(fetcher, callback, intervalMs = 3000) {
  let active = true;
  let last = '';
  const run = async () => {
    if (!active) return;
    try {
      const value = await fetcher();
      const signature = JSON.stringify(value);
      if (last && signature !== last) callback?.(value);
      last = signature;
    } catch {}
  };
  run();
  const timer = window.setInterval(run, intervalMs);
  const subscription = {
    unsubscribe() {
      active = false;
      window.clearInterval(timer);
      subscriptions.delete(subscription);
    },
  };
  subscriptions.add(subscription);
  return subscription;
}

export const subscribeToMessages = (conversationId, callback) => makePoller(
  () => getMessages(conversationId),
  (messages) => callback?.({ type: 'snapshot', messages }),
  2500,
);

export const unsubscribeFromMessages = (subscription) => subscription?.unsubscribe?.();

export const subscribeToConversations = (callback) => makePoller(
  getMyConversations,
  (conversations) => callback?.({ type: 'snapshot', conversations }),
  5000,
);

export const unsubscribeFromConversations = (subscription) => subscription?.unsubscribe?.();
