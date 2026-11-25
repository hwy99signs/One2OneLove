import { apiRequest } from '@/lib/apiClient';
import { loadCollection, insertRecord, updateRecord, deleteRecord, isUnauthorized, fileToDataUrl } from './guestStore';

// Guest mode (2026-11-25): with no account, memories live in the
// browser-local guest store and photos are kept as data URLs. Members keep
// the server API. Calls try the API first and fall back locally only on a
// 401 (no session) or when the caller already knows there is no account.
const LOCAL = 'memories';

function hasAccount(userKey) {
  return Boolean(userKey) && userKey !== 'guest';
}

export async function listMemories(_userKey) {
  try {
    const payload = await apiRequest('/api/memories');
    return payload?.memories || [];
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    return loadCollection(LOCAL);
  }
}

export async function createMemory(userKey, data) {
  if (!hasAccount(userKey)) return insertRecord(LOCAL, data || {});
  try {
    const payload = await apiRequest('/api/memories', { method: 'POST', body: data });
    return payload?.memory || null;
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    return insertRecord(LOCAL, data || {});
  }
}

export async function updateMemory(userKey, id, updates) {
  if (!id) throw new Error('Memory ID is required.');
  if (!hasAccount(userKey)) return updateRecord(LOCAL, id, updates || {});
  try {
    const payload = await apiRequest(`/api/memories/${encodeURIComponent(id)}`, { method: 'PATCH', body: updates });
    return payload?.memory || null;
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    return updateRecord(LOCAL, id, updates || {});
  }
}

export async function deleteMemory(userKey, id) {
  if (!id) throw new Error('Memory ID is required.');
  if (!hasAccount(userKey)) { deleteRecord(LOCAL, id); return id; }
  try {
    await apiRequest(`/api/memories/${encodeURIComponent(id)}`, { method: 'DELETE' });
    return id;
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    deleteRecord(LOCAL, id);
    return id;
  }
}

export async function uploadMemoryMedia(file, memoryId = null) {
  if (!(file instanceof File)) throw new Error('Choose a photo or video to upload.');
  const suffix = memoryId ? `?memoryId=${encodeURIComponent(memoryId)}` : '';
  try {
    const payload = await apiRequest(`/api/memories/media${suffix}`, {
      method: 'POST',
      headers: { 'content-type': file.type || 'application/octet-stream' },
      rawBody: file,
    });
    return payload?.url || null;
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    // Guest: keep the photo in the browser as a data URL.
    return fileToDataUrl(file);
  }
}

export async function deleteMemoryMedia(url) {
  const match = String(url || '').match(/\/api\/media\/memories\/[0-9a-f-]{36}\/([0-9a-f-]{36})$/i);
  if (!match) return false; // local data URLs need no server delete
  try {
    await apiRequest(`/api/memories/media/${match[1]}`, { method: 'DELETE' });
    return true;
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    return false;
  }
}
