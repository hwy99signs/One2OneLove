import { apiRequest } from './apiClient';

export async function getAiConfig() {
  return apiRequest('/api/ai/config');
}

export async function listCoachConversations() {
  const payload = await apiRequest('/api/ai/coach/conversations');
  return payload?.conversations || [];
}

export async function createCoachConversation() {
  const payload = await apiRequest('/api/ai/coach/conversations', { method: 'POST', body: {} });
  return payload?.conversation || null;
}

export async function deleteCoachConversation(conversationId) {
  await apiRequest(`/api/ai/coach/conversations/${encodeURIComponent(conversationId)}`, { method: 'DELETE' });
}

export async function listCoachMessages(conversationId) {
  const payload = await apiRequest(`/api/ai/coach/conversations/${encodeURIComponent(conversationId)}/messages`);
  return payload?.messages || [];
}

export async function sendCoachMessage(conversationId, message) {
  return apiRequest(`/api/ai/coach/conversations/${encodeURIComponent(conversationId)}/messages`, {
    method: 'POST',
    body: { message },
  });
}

export async function generateRelationshipContent(data) {
  const payload = await apiRequest('/api/ai/content', {
    method: 'POST',
    body: data,
  });
  return payload?.content || '';
}
