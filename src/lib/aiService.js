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

export async function getBiancaProfile() {
  const payload = await apiRequest('/api/mymatchiq/bianca/profile');
  return payload?.profile || null;
}

export async function listBiancaConversations() {
  const payload = await apiRequest('/api/mymatchiq/bianca/conversations');
  return payload?.conversations || [];
}

export async function createBiancaConversation() {
  const payload = await apiRequest('/api/mymatchiq/bianca/conversations', { method: 'POST', body: {} });
  return payload?.conversation || null;
}

export async function listBiancaMessages(conversationId) {
  const payload = await apiRequest(`/api/mymatchiq/bianca/conversations/${encodeURIComponent(conversationId)}/messages`);
  return payload?.messages || [];
}

export async function sendBiancaMessage(conversationId, message, language = 'en') {
  return apiRequest(`/api/mymatchiq/bianca/conversations/${encodeURIComponent(conversationId)}/messages`, {
    method: 'POST',
    body: { message, language },
  });
}

export async function generateBiancaReport(language = 'en') {
  const payload = await apiRequest('/api/mymatchiq/bianca/report', { method: 'POST', body: { language } });
  return payload?.report || null;
}

export async function getLatestBiancaReport() {
  const payload = await apiRequest('/api/mymatchiq/bianca/report');
  return payload?.report || null;
}
