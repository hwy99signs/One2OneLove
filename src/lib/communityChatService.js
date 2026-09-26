import { apiRequest } from './apiClient';

export async function getCommunityChatRooms(scope = 'general') {
  const query = scope === 'lgbtq' ? '?scope=lgbtq' : '';
  const payload = await apiRequest('/api/community-chat/rooms' + query);
  return payload?.rooms || [];
}

export async function getCommunityChatMessages(roomId) {
  const payload = await apiRequest(`/api/community-chat/rooms/${encodeURIComponent(roomId)}/messages?limit=80`);
  return payload?.messages || [];
}

export async function sendCommunityChatMessage(roomId, content, replyToId = null) {
  const payload = await apiRequest(`/api/community-chat/rooms/${encodeURIComponent(roomId)}/messages`, {
    method: 'POST',
    body: { content, reply_to_id: replyToId || null },
  });
  return payload?.message || null;
}

export async function touchCommunityChatPresence(roomId) {
  await apiRequest(`/api/community-chat/rooms/${encodeURIComponent(roomId)}/presence`, {
    method: 'POST',
    body: {},
  });
}

export async function deleteCommunityChatMessage(messageId) {
  await apiRequest(`/api/community-chat/messages/${encodeURIComponent(messageId)}`, { method: 'DELETE' });
}


export async function reportCommunityChatMessage(messageId, reason) {
  await apiRequest(`/api/community-chat/messages/${encodeURIComponent(messageId)}/report`, {
    method: 'POST',
    body: { reason },
  });
}

export async function muteCommunityChatUser(userId) {
  await apiRequest(`/api/community-chat/users/${encodeURIComponent(userId)}/mute`, {
    method: 'POST',
    body: {},
  });
}

export async function unmuteCommunityChatUser(userId) {
  await apiRequest(`/api/community-chat/users/${encodeURIComponent(userId)}/mute`, {
    method: 'DELETE',
  });
}
