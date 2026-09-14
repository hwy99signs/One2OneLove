import { apiRequest } from './apiClient';

export async function getStories(orderBy = '-created_at', storyType = null, searchQuery = null) {
  const params = new URLSearchParams();
  params.set('order', orderBy);
  if (storyType) params.set('type', storyType);
  if (searchQuery) params.set('search', searchQuery);
  const payload = await apiRequest(`/api/stories?${params.toString()}`);
  return payload?.stories || [];
}

export async function getStoryById(storyId) {
  const payload = await apiRequest(`/api/stories/${encodeURIComponent(storyId)}`);
  return payload?.story || null;
}

export async function getMyStories() {
  const payload = await apiRequest('/api/stories/mine');
  return payload?.stories || [];
}

export async function createStory(storyData) {
  const payload = await apiRequest('/api/stories', { method: 'POST', body: storyData });
  return payload?.story || null;
}

export async function updateStory(storyId, updates) {
  const { id, user_id, created_at, updated_at, moderation_status, author_name, ...allowed } = updates || {};
  const payload = await apiRequest(`/api/stories/${encodeURIComponent(storyId)}`, {
    method: 'PATCH', body: allowed,
  });
  return payload?.story || null;
}

export async function deleteStory(storyId) {
  await apiRequest(`/api/stories/${encodeURIComponent(storyId)}`, { method: 'DELETE' });
}

export async function likeStory(storyId) {
  await apiRequest(`/api/stories/${encodeURIComponent(storyId)}/like`, { method: 'POST', body: {} });
}

export async function unlikeStory(storyId) {
  await apiRequest(`/api/stories/${encodeURIComponent(storyId)}/like`, { method: 'DELETE' });
}

export async function toggleLikeStory(storyId, isLiked) {
  if (isLiked) {
    await unlikeStory(storyId);
    return false;
  }
  await likeStory(storyId);
  return true;
}

export async function markStoryHelpful(storyId) {
  await apiRequest(`/api/stories/${encodeURIComponent(storyId)}/helpful`, { method: 'POST', body: {} });
}

export async function unmarkStoryHelpful(storyId) {
  await apiRequest(`/api/stories/${encodeURIComponent(storyId)}/helpful`, { method: 'DELETE' });
}

export async function toggleHelpfulStory(storyId, isHelpful) {
  if (isHelpful) {
    await unmarkStoryHelpful(storyId);
    return false;
  }
  await markStoryHelpful(storyId);
  return true;
}

export async function approveStory(storyId) {
  const payload = await apiRequest(`/api/stories/${encodeURIComponent(storyId)}/approve`, {
    method: 'PATCH', body: {},
  });
  return payload?.story || null;
}

export async function rejectStory(storyId, notes = '') {
  const payload = await apiRequest(`/api/stories/${encodeURIComponent(storyId)}/reject`, {
    method: 'PATCH', body: { notes },
  });
  return payload?.story || null;
}

export async function featureStory(storyId, featured = true) {
  const payload = await apiRequest(`/api/stories/${encodeURIComponent(storyId)}/feature`, {
    method: 'PATCH', body: { featured },
  });
  return payload?.story || null;
}

export async function getStoryStats() {
  const payload = await apiRequest('/api/stories/stats');
  return payload?.stats || { total: 0, approved: 0, pending: 0, rejected: 0, totalLikes: 0, totalViews: 0 };
}
