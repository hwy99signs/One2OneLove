import { apiRequest } from './apiClient';
import { loadCollection, insertRecord, updateRecord, deleteRecord, isUnauthorized } from './guestStore';

// Guest mode (2026-11-25): with no account, custom Date Ideas live in the
// browser-local guest store. Members keep the server API. Calls try the
// API first and fall back locally only on a 401 (no session) or when the
// caller already knows there is no account.
const LOCAL = 'custom_date_ideas';

function hasAccount(userKey) {
  return Boolean(userKey) && userKey !== 'guest';
}

export async function listDateIdeas(userKey) {
  if (!hasAccount(userKey)) return loadCollection(LOCAL);
  try {
    const payload = await apiRequest('/api/date-ideas');
    return payload?.ideas || [];
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    return loadCollection(LOCAL);
  }
}

export async function createDateIdea(userKey, data) {
  if (!hasAccount(userKey)) return insertRecord(LOCAL, data || {});
  try {
    const payload = await apiRequest('/api/date-ideas', { method: 'POST', body: data });
    return payload?.idea || null;
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    return insertRecord(LOCAL, data || {});
  }
}

export async function updateDateIdea(userKey, id, updates) {
  if (!id) throw new Error('Date idea ID is required.');
  if (!hasAccount(userKey)) return updateRecord(LOCAL, id, updates || {});
  try {
    const payload = await apiRequest(`/api/date-ideas/${encodeURIComponent(id)}`, { method: 'PATCH', body: updates });
    return payload?.idea || null;
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    return updateRecord(LOCAL, id, updates || {});
  }
}

export async function deleteDateIdea(userKey, id) {
  if (!id) throw new Error('Date idea ID is required.');
  if (!hasAccount(userKey)) { deleteRecord(LOCAL, id); return id; }
  try {
    await apiRequest(`/api/date-ideas/${encodeURIComponent(id)}`, { method: 'DELETE' });
    return id;
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    deleteRecord(LOCAL, id);
    return id;
  }
}
