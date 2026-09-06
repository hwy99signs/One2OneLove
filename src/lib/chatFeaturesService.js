import { apiRequest } from './one2oneApi';

export const toggleReaction = async (messageId, emoji) => {
  const data = await apiRequest(`/api/chat/messages/${messageId}/reactions`, {
    method: 'POST',
    body: { emoji },
  });
  return { success: true, action: data?.action || 'added' };
};

export const getMessageReactions = async (messageId) => {
  const data = await apiRequest(`/api/chat/messages/${messageId}/reactions`);
  return data?.reactions || [];
};

export const toggleStarMessage = async (messageId) => {
  const data = await apiRequest(`/api/chat/messages/${messageId}/star`, { method: 'POST', body: {} });
  return { success: true, starred: Boolean(data?.starred) };
};

export const getStarredMessages = async () => {
  const data = await apiRequest('/api/chat/starred');
  return data?.messages || [];
};

export const isMessageStarred = async (messageId) => {
  try {
    const data = await apiRequest(`/api/chat/messages/${messageId}/star`);
    return Boolean(data?.starred);
  } catch {
    return false;
  }
};

export const pinMessage = async (messageId, conversationId, expiresAt = null) => {
  const expires = expiresAt instanceof Date ? expiresAt.toISOString() : expiresAt;
  await apiRequest(`/api/chat/messages/${messageId}/pin`, {
    method: 'POST',
    body: { conversation_id: conversationId, expires_at: expires || null },
  });
  return { success: true };
};

export const unpinMessage = async (messageId, conversationId) => {
  await apiRequest(`/api/chat/messages/${messageId}/pin`, {
    method: 'DELETE',
    body: { conversation_id: conversationId },
  });
  return { success: true };
};

export const getPinnedMessages = async (conversationId) => {
  const data = await apiRequest(`/api/chat/conversations/${conversationId}/pins`);
  return data?.messages || [];
};

export const isMessagePinned = async (messageId, conversationId) => {
  try {
    const data = await apiRequest(`/api/chat/messages/${messageId}/pin?conversation_id=${encodeURIComponent(conversationId || '')}`);
    return Boolean(data?.pinned);
  } catch {
    return false;
  }
};

export const forwardMessage = async (messageId, toConversationId, toReceiverId = null) => {
  const data = await apiRequest(`/api/chat/messages/${messageId}/forward`, {
    method: 'POST',
    body: { conversation_id: toConversationId, receiver_id: toReceiverId || null },
  });
  return {
    success: true,
    newMessageId: data?.newMessageId,
    newMessage: data?.newMessage || null,
  };
};

export const forwardMessageToMultiple = async (messageId, conversationIds) => {
  const results = [];
  for (const conversationId of conversationIds || []) {
    try {
      const result = await forwardMessage(messageId, conversationId);
      results.push({ conversationId, success: true, ...result });
    } catch (error) {
      results.push({ conversationId, success: false, error: error?.message || 'Forward failed' });
    }
  }
  return { success: true, results };
};

export const markConversationAsUnread = async (conversationId) => {
  await apiRequest(`/api/chat/conversations/${conversationId}/unread`, { method: 'POST', body: {} });
  return { success: true };
};

export const archiveConversation = async (conversationId, archived = true) => {
  await apiRequest(`/api/chat/conversations/${conversationId}/settings`, {
    method: 'PATCH',
    body: { isArchived: Boolean(archived) },
  });
  return { success: true };
};

export const clearConversationMessages = async (conversationId) => {
  await apiRequest(`/api/chat/conversations/${conversationId}/clear`, { method: 'POST', body: {} });
  return { success: true };
};

export const deleteConversation = async (conversationId) => {
  await apiRequest(`/api/chat/conversations/${conversationId}`, { method: 'DELETE' });
  return { success: true };
};

export const copyMessageContent = async (content) => {
  await navigator.clipboard.writeText(content);
  return { success: true };
};

export const getMessageInfo = async (messageId) => {
  const data = await apiRequest(`/api/chat/messages/${messageId}/info`);
  const info = data?.info || null;
  if (!info) return null;
  return {
    ...info,
    sent_at_formatted: info.sent_at ? new Date(info.sent_at).toLocaleString() : null,
    delivered_at_formatted: info.delivered_at ? new Date(info.delivered_at).toLocaleString() : null,
    read_at_formatted: info.read_at ? new Date(info.read_at).toLocaleString() : null,
  };
};

export default {
  toggleReaction,
  getMessageReactions,
  toggleStarMessage,
  getStarredMessages,
  isMessageStarred,
  pinMessage,
  unpinMessage,
  getPinnedMessages,
  isMessagePinned,
  forwardMessage,
  forwardMessageToMultiple,
  markConversationAsUnread,
  archiveConversation,
  clearConversationMessages,
  deleteConversation,
  copyMessageContent,
  getMessageInfo,
};