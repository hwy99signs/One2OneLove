import { apiRequest } from './apiClient';
import { clearConversation, deleteConversation as removeConversation, markConversationUnread, updateConversationSettings } from './chatService';

export const toggleReaction = async (messageId, emoji) => {
  const payload = await apiRequest(`/api/chat/messages/${encodeURIComponent(messageId)}/reactions`, {
    method: 'POST', body: { emoji },
  });
  return { success: true, action: payload?.action };
};

export const getMessageReactions = async (messageId) => {
  const payload = await apiRequest(`/api/chat/messages/${encodeURIComponent(messageId)}/reactions`);
  return payload?.reactions || [];
};

export const toggleStarMessage = async (messageId) => {
  const payload = await apiRequest(`/api/chat/messages/${encodeURIComponent(messageId)}/star`, {
    method: 'POST', body: {},
  });
  return { success: true, starred: Boolean(payload?.starred) };
};

export const getStarredMessages = async () => {
  const payload = await apiRequest('/api/chat/starred');
  return payload?.messages || [];
};

export const isMessageStarred = async (messageId) => {
  try {
    const payload = await apiRequest(`/api/chat/messages/${encodeURIComponent(messageId)}/star`);
    return Boolean(payload?.starred);
  } catch { return false; }
};

export const pinMessage = async (messageId, conversationId, expiresAt = null) => {
  await apiRequest(`/api/chat/messages/${encodeURIComponent(messageId)}/pin`, {
    method: 'POST',
    body: { conversation_id: conversationId, expires_at: expiresAt ? new Date(expiresAt).toISOString() : null },
  });
  return { success: true };
};

export const unpinMessage = async (messageId) => {
  await apiRequest(`/api/chat/messages/${encodeURIComponent(messageId)}/pin`, { method: 'DELETE' });
  return { success: true };
};

export const getPinnedMessages = async (conversationId) => {
  const payload = await apiRequest(`/api/chat/conversations/${encodeURIComponent(conversationId)}/pins`);
  return payload?.messages || [];
};

export const isMessagePinned = async (messageId) => {
  try {
    const payload = await apiRequest(`/api/chat/messages/${encodeURIComponent(messageId)}/pin`);
    return Boolean(payload?.pinned);
  } catch { return false; }
};

export const forwardMessage = async (messageId, toConversationId, toReceiverId = null) => {
  const payload = await apiRequest(`/api/chat/messages/${encodeURIComponent(messageId)}/forward`, {
    method: 'POST',
    body: { conversation_id: toConversationId, receiver_id: toReceiverId || undefined },
  });
  return { success: true, newMessageId: payload?.newMessageId, newMessage: payload?.newMessage };
};

export const forwardMessageToMultiple = async (messageId, conversationIds) => {
  const results = [];
  for (const conversationId of conversationIds || []) {
    try {
      const result = await forwardMessage(messageId, conversationId);
      results.push({ conversationId, success: true, ...result });
    } catch (error) {
      results.push({ conversationId, success: false, error: error?.message });
    }
  }
  return { success: true, results };
};

export const markConversationAsUnread = async (conversationId) => {
  await markConversationUnread(conversationId);
  return { success: true };
};

export const archiveConversation = async (conversationId, archived = true) => {
  await updateConversationSettings(conversationId, { isArchived: archived });
  return { success: true };
};

export const clearConversationMessages = async (conversationId) => {
  await clearConversation(conversationId);
  return { success: true };
};

export const deleteConversation = async (conversationId) => {
  await removeConversation(conversationId);
  return { success: true };
};

export const copyMessageContent = async (content) => {
  await navigator.clipboard.writeText(content || '');
  return { success: true };
};

export const getMessageInfo = async (messageId) => {
  const payload = await apiRequest(`/api/chat/messages/${encodeURIComponent(messageId)}/info`);
  const info = payload?.info || null;
  if (!info) return info;
  return {
    ...info,
    sent_at_formatted: info.sent_at ? new Date(info.sent_at).toLocaleString() : null,
    delivered_at_formatted: info.delivered_at ? new Date(info.delivered_at).toLocaleString() : null,
    read_at_formatted: info.read_at ? new Date(info.read_at).toLocaleString() : null,
  };
};

export default {
  toggleReaction, getMessageReactions,
  toggleStarMessage, getStarredMessages, isMessageStarred,
  pinMessage, unpinMessage, getPinnedMessages, isMessagePinned,
  forwardMessage, forwardMessageToMultiple,
  markConversationAsUnread, archiveConversation, clearConversationMessages, deleteConversation,
  copyMessageContent, getMessageInfo,
};
