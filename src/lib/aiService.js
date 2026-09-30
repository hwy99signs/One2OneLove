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

export async function deleteBiancaConversation(conversationId) {
  await apiRequest(`/api/mymatchiq/bianca/conversations/${encodeURIComponent(conversationId)}`, { method: 'DELETE' });
}

export async function resetBiancaPersonalization() {
  const payload = await apiRequest('/api/mymatchiq/bianca/profile/reset', { method: 'POST', body: {} });
  return payload?.profile || null;
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

export async function listBiancaReports() {
  const payload = await apiRequest('/api/mymatchiq/bianca/reports');
  return payload?.reports || [];
}


export async function createMyMatchIQAssessmentSession({ language='en', tier='Elite' }={}) {
  const payload = await apiRequest('/api/mymatchiq/assessment/sessions', { method:'POST', body:{ language, tier } });
  return payload?.session || null;
}

export async function getMyMatchIQLatestAssessmentSession() {
  const payload = await apiRequest('/api/mymatchiq/assessment/sessions/latest');
  return payload?.session || null;
}

export async function saveMyMatchIQAssessmentProgress(sessionId, { answers=[], dimensionScores={}, questionCount=0 }={}) {
  const payload = await apiRequest(`/api/mymatchiq/assessment/sessions/${encodeURIComponent(sessionId)}`, {
    method:'PATCH',
    body:{ answers, dimensionScores, questionCount },
  });
  return payload?.session || null;
}

export async function completeMyMatchIQAssessmentSession(sessionId, { answers=[], dimensionScores={}, questionCount=0 }={}) {
  const payload = await apiRequest(`/api/mymatchiq/assessment/sessions/${encodeURIComponent(sessionId)}/complete`, {
    method:'POST',
    body:{ answers, dimensionScores, questionCount },
  });
  return payload?.session || null;
}


export async function getMyMatchIQCreditWallet() {
  return apiRequest('/api/mymatchiq/credits/wallet');
}

export async function createMyMatchIQCreditCheckout(packageCode) {
  return apiRequest('/api/mymatchiq/credits/checkout', { method:'POST', body:{ packageCode } });
}

export async function updateMyMatchIQAutoReplenish({ enabled, packageCode, triggerBalance }) {
  const payload = await apiRequest('/api/mymatchiq/credits/auto-replenish', {
    method:'PUT',
    body:{ enabled, packageCode, triggerBalance },
  });
  return payload?.settings || null;
}

export async function createMyMatchIQSetupIntent() {
  return apiRequest('/api/mymatchiq/credits/setup-intent', { method:'POST', body:{} });
}


export async function getMyMatchIQMemberProfile() {
  const payload = await apiRequest('/api/mymatchiq/members/profile');
  return payload?.profile || null;
}
export async function updateMyMatchIQMemberProfile(profile) {
  const payload = await apiRequest('/api/mymatchiq/members/profile', { method:'PUT', body:profile });
  return payload?.profile || null;
}
export async function discoverMyMatchIQMembers() {
  const payload = await apiRequest('/api/mymatchiq/members/discover');
  return payload?.members || [];
}
export async function listMyMatchIQInvitations() {
  const payload = await apiRequest('/api/mymatchiq/members/invitations');
  return payload?.invitations || [];
}
export async function sendMyMatchIQInvitation(data) {
  const payload = await apiRequest('/api/mymatchiq/members/invitations', { method:'POST', body:data });
  return payload?.invitation || null;
}
export async function respondMyMatchIQInvitation(invitationId,status) {
  const payload = await apiRequest(`/api/mymatchiq/members/invitations/${encodeURIComponent(invitationId)}`, { method:'PATCH', body:{status} });
  return payload?.invitation || null;
}
export async function blockMyMatchIQMember(userId) {
  return apiRequest('/api/mymatchiq/members/block', { method:'POST', body:{userId} });
}
export async function reportMyMatchIQMember({reportedUserId,category='other',details=''}) {
  const payload = await apiRequest('/api/mymatchiq/members/report', { method:'POST', body:{reportedUserId,category,details} });
  return payload?.report || null;
}
