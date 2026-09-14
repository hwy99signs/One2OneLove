import { apiRequest } from './apiClient';

export async function listDateIdeas(userKey) {
  if (!userKey || userKey === 'guest') return [];
  const payload = await apiRequest('/api/date-ideas');
  return payload?.ideas || [];
}

export async function createDateIdea(userKey, data) {
  if (!userKey || userKey === 'guest') throw new Error('Please sign in to save date ideas.');
  const payload = await apiRequest('/api/date-ideas', {
    method: 'POST',
    body: data,
  });
  return payload?.idea || null;
}

export async function updateDateIdea(userKey, id, updates) {
  if (!userKey || userKey === 'guest') throw new Error('Please sign in to update date ideas.');
  if (!id) throw new Error('Date idea ID is required.');
  const payload = await apiRequest(`/api/date-ideas/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: updates,
  });
  return payload?.idea || null;
}

export async function deleteDateIdea(userKey, id) {
  if (!userKey || userKey === 'guest') throw new Error('Please sign in to delete date ideas.');
  if (!id) throw new Error('Date idea ID is required.');
  await apiRequest(`/api/date-ideas/${encodeURIComponent(id)}`, { method: 'DELETE' });
  return id;
}
