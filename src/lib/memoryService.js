import { apiRequest } from '@/lib/apiClient';

export async function listMemories(_userKey) {
  const payload = await apiRequest('/api/memories');
  return payload?.memories || [];
}

export async function createMemory(userKey, data) {
  if (!userKey || userKey === 'guest') throw new Error('Please sign in to create a memory.');
  const payload = await apiRequest('/api/memories', {
    method: 'POST',
    body: data,
  });
  return payload?.memory || null;
}

export async function updateMemory(userKey, id, updates) {
  if (!userKey || userKey === 'guest') throw new Error('Please sign in to update a memory.');
  if (!id) throw new Error('Memory ID is required.');
  const payload = await apiRequest(`/api/memories/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: updates,
  });
  return payload?.memory || null;
}

export async function deleteMemory(userKey, id) {
  if (!userKey || userKey === 'guest') throw new Error('Please sign in to delete a memory.');
  if (!id) throw new Error('Memory ID is required.');
  await apiRequest(`/api/memories/${encodeURIComponent(id)}`, { method: 'DELETE' });
  return id;
}

export async function uploadMemoryMedia(file, memoryId = null) {
  if (!(file instanceof File)) throw new Error('Choose a photo or video to upload.');
  const suffix = memoryId ? `?memoryId=${encodeURIComponent(memoryId)}` : '';
  const payload = await apiRequest(`/api/memories/media${suffix}`, {
    method: 'POST',
    headers: { 'content-type': file.type || 'application/octet-stream' },
    rawBody: file,
  });
  return payload?.url || null;
}

export async function deleteMemoryMedia(url) {
  const match = String(url || '').match(/\/api\/media\/memories\/[0-9a-f-]{36}\/([0-9a-f-]{36})$/i);
  if (!match) return false;
  await apiRequest(`/api/memories/media/${match[1]}`, { method: 'DELETE' });
  return true;
}
