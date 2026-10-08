import { apiRequest, beaconJson } from './apiClient';

export async function getCommunityChatRooms(scope = 'general') {
  const query = scope === 'lgbtq' ? '?scope=lgbtq' : '';
  const payload = await apiRequest('/api/community-chat/rooms' + query);
  return payload?.rooms || [];
}

export async function getCommunityChatMessages(roomId, topicId = null) {
  const params = new URLSearchParams({ limit: '80' });
  if (topicId) params.set('topic', topicId);
  const payload = await apiRequest(`/api/community-chat/rooms/${encodeURIComponent(roomId)}/messages?${params.toString()}`);
  return payload?.messages || [];
}

export async function sendCommunityChatMessage(roomId, content, replyToId = null, topicId = null) {
  const payload = await apiRequest(`/api/community-chat/rooms/${encodeURIComponent(roomId)}/messages`, {
    method: 'POST',
    body: { content, reply_to_id: replyToId || null, topic_id: topicId || null },
  });
  return payload?.message || null;
}

export async function getCommunityChatTopics(roomId) {
  const payload = await apiRequest(`/api/community-chat/rooms/${encodeURIComponent(roomId)}/topics`);
  return payload?.topics || [];
}

export async function createCommunityChatTopic(roomId, title, openingMessage = '') {
  const payload = await apiRequest(`/api/community-chat/rooms/${encodeURIComponent(roomId)}/topics`, {
    method: 'POST',
    body: { title, opening_message: openingMessage || '' },
  });
  return payload?.topic || null;
}

export async function touchCommunityChatPresence(roomId) {
  await apiRequest(`/api/community-chat/rooms/${encodeURIComponent(roomId)}/presence`, {
    method: 'POST',
    body: {},
  });
}

// Explicit leave: stepping out of a room closes it for this member — the
// server deletes the presence row immediately instead of waiting for the
// presence TTL, so an empty room reads empty (and burns nothing) at once.
export async function leaveCommunityChatRoom(roomId) {
  await apiRequest(`/api/community-chat/rooms/${encodeURIComponent(roomId)}/leave`, {
    method: 'POST',
    body: {},
  });
}

// Leave variant for page teardown (tab close / navigate away), where a
// normal request would be aborted before it lands.
export function beaconLeaveCommunityChatRoom(roomId) {
  return beaconJson(`/api/community-chat/rooms/${encodeURIComponent(roomId)}/leave`, {});
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
