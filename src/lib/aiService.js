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

export async function sendBiancaMessage(conversationId, message, language = 'en', responseLength = 'short') {
  const requestId = globalThis.crypto?.randomUUID?.() || `bianca-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return apiRequest(`/api/mymatchiq/bianca/conversations/${encodeURIComponent(conversationId)}/messages`, {
    method: 'POST',
    body: { message, language, responseLength, requestId },
  });
}

export async function generateBiancaReport(language = 'en') {
  const requestId = globalThis.crypto?.randomUUID?.() || `bianca-report-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const payload = await apiRequest('/api/mymatchiq/bianca/report', { method: 'POST', body: { language, requestId } });
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


export async function createMyMatchIQAssessmentSession({ language='en' }={}) {
  const payload = await apiRequest('/api/mymatchiq/assessment/sessions', { method:'POST', body:{ language } });
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
  return getTokenWallet();
}

export async function createMyMatchIQCreditCheckout(packageCode) {
  return startTokenCheckout(packageCode);
}

export async function updateMyMatchIQAutoReplenish({ enabled, packageCode, triggerBalance }) {
  return updateAutoReplenish({ enabled, packageCode, triggerBalance });
}

export async function createMyMatchIQSetupIntent() {
  return startPaymentMethodSetup();
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


export async function getMyMatchIQAccess() {
  const payload = await apiRequest('/api/mymatchiq/access');
  return payload?.access || {
    access_model:'free_tokens',
    verified_member:true,
    tier:'Free',
    assessment_question_count:225,
    assessment_dimension_count:15,
    token_mode:true,
    token_balance:0,
  };
}

export async function getMyMatchIQLegacyMigrationStatus() {
  const payload = await apiRequest('/api/mymatchiq/legacy/status');
  return payload?.migration || { eligible:false,status:'none' };
}

export async function claimMyMatchIQLegacyMigration() {
  const payload = await apiRequest('/api/mymatchiq/legacy/claim', { method:'POST', body:{} });
  return payload?.migration || null;
}
