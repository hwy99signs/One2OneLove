import { apiRequest, beaconJson } from './apiClient';
import { guestHeaders } from './guestIdentity';

// Guest participation (2026-11-25): Chat Rooms are open to everyone. Write
// calls carry the browser guest identity (id + chosen display name) so a
// visitor without an account can post, keep presence and manage their own
// messages. Signed-in members are unaffected — the worker prefers the
// member session whenever one exists.

export async function getCommunityChatRooms(scope = 'general') {
  const query = scope === 'lgbtq' ? '?scope=lgbtq' : '';
  const payload = await apiRequest('/api/community-chat/rooms' + query);
  return payload?.rooms || [];
}

export async function getCommunityChatMessages(roomId, topicId = null) {
  const params = new URLSearchParams({ limit: '80' });
  if (topicId) params.set('topic', topicId);
  const payload = await apiRequest(`/api/community-chat/rooms/${encodeURIComponent(roomId)}/messages?${params.toString()}`, {
    headers: guestHeaders(),
  });
  return payload?.messages || [];
}

export async function sendCommunityChatMessage(roomId, content, replyToId = null, topicId = null) {
  const payload = await apiRequest(`/api/community-chat/rooms/${encodeURIComponent(roomId)}/messages`, {
    method: 'POST',
    headers: guestHeaders(),
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
    headers: guestHeaders(),
    body: { title, opening_message: openingMessage || '' },
  });
  return payload?.topic || null;
}

export async function touchCommunityChatPresence(roomId) {
  await apiRequest(`/api/community-chat/rooms/${encodeURIComponent(roomId)}/presence`, {
    method: 'POST',
    headers: guestHeaders(),
    body: {},
  });
}

// Explicit leave: stepping out of a room closes it for this member — the
// server deletes the presence row immediately instead of waiting for the
// presence TTL, so an empty room reads empty (and burns nothing) at once.
export async function leaveCommunityChatRoom(roomId) {
  await apiRequest(`/api/community-chat/rooms/${encodeURIComponent(roomId)}/leave`, {
    method: 'POST',
    headers: guestHeaders(),
    body: {},
  });
}

// Leave variant for page teardown (tab close / navigate away), where a
// normal request would be aborted before it lands. (sendBeacon cannot set
// the guest headers, so a guest's presence row simply expires by TTL.)
export function beaconLeaveCommunityChatRoom(roomId) {
  return beaconJson(`/api/community-chat/rooms/${encodeURIComponent(roomId)}/leave`, {});
}

export async function deleteCommunityChatMessage(messageId) {
  await apiRequest(`/api/community-chat/messages/${encodeURIComponent(messageId)}`, {
    method: 'DELETE',
    headers: guestHeaders(),
  });
}


export async function reportCommunityChatMessage(messageId, reason) {
  await apiRequest(`/api/community-chat/messages/${encodeURIComponent(messageId)}/report`, {
    method: 'POST',
    headers: guestHeaders(),
    body: { reason },
  });
}

export async function muteCommunityChatUser(userId) {
  await apiRequest(`/api/community-chat/users/${encodeURIComponent(userId)}/mute`, {
    method: 'POST',
    headers: guestHeaders(),
    body: {},
  });
}

export async function unmuteCommunityChatUser(userId) {
  await apiRequest(`/api/community-chat/users/${encodeURIComponent(userId)}/mute`, {
    method: 'DELETE',
    headers: guestHeaders(),
  });
}
