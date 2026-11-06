import { apiRequest } from './apiClient';
import { getTokenWallet, startTokenCheckout, updateAutoReplenish, startPaymentMethodSetup } from './tokenService';

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

export async function sendCoachMessage(conversationId, message, responseLength = 'short') {
  const requestId = globalThis.crypto?.randomUUID?.() || `amora-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return apiRequest(`/api/ai/coach/conversations/${encodeURIComponent(conversationId)}/messages`, {
    method: 'POST',
    body: { message, responseLength, requestId },
  });
}

export async function generateRelationshipContent(data) {
  const requestId = globalThis.crypto?.randomUUID?.() || `ai-content-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const payload = await apiRequest('/api/ai/content', {
    method: 'POST',
    body: { ...data, requestId },
  });
  return payload?.content || '';
}
