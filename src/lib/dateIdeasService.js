const LOCAL_KEY = 'o2ol_date_ideas_local_v1';

function storageKey(userKey) {
  return `${LOCAL_KEY}:${userKey || 'guest'}`;
}

function readLocal(userKey) {
  try {
    const raw = window.localStorage.getItem(storageKey(userKey));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocal(userKey, records) {
  try {
    window.localStorage.setItem(storageKey(userKey), JSON.stringify(records));
  } catch {
    // Ignore storage failures; caller still gets the in-memory result.
  }
}

function localId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return `local-${crypto.randomUUID()}`;
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'include',
    headers: {
      accept: 'application/json',
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.error?.message || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

function shouldFallback(error) {
  return !error?.status || error.status === 401 || error.status === 403 || error.status === 404;
}

export async function listDateIdeas(userKey) {
  try {
    const payload = await apiRequest('/api/date-ideas');
    return payload.ideas || [];
  } catch (error) {
    if (!shouldFallback(error)) throw error;
    return readLocal(userKey);
  }
}

export async function createDateIdea(userKey, data) {
  try {
    const payload = await apiRequest('/api/date-ideas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return payload.idea;
  } catch (error) {
    if (!shouldFallback(error)) throw error;
    const records = readLocal(userKey);
    const record = {
      id: localId(),
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      __local: true,
    };
    const next = [record, ...records];
    writeLocal(userKey, next);
    return record;
  }
}

export async function updateDateIdea(userKey, id, updates) {
  if (!String(id || '').startsWith('local-')) {
    try {
      const payload = await apiRequest(`/api/date-ideas/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      return payload.idea;
    } catch (error) {
      if (!shouldFallback(error)) throw error;
    }
  }

  const records = readLocal(userKey);
  const index = records.findIndex(record => record.id === id);
  if (index === -1) {
    const record = {
      id: id || localId(),
      ...updates,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      __local: true,
    };
    writeLocal(userKey, [record, ...records]);
    return record;
  }
  const updated = {
    ...records[index],
    ...updates,
    updated_at: new Date().toISOString(),
    __local: true,
  };
  const next = [...records];
  next[index] = updated;
  writeLocal(userKey, next);
  return updated;
}

export async function deleteDateIdea(userKey, id) {
  if (!String(id || '').startsWith('local-')) {
    try {
      await apiRequest(`/api/date-ideas/${encodeURIComponent(id)}`, { method: 'DELETE' });
      return;
    } catch (error) {
      if (!shouldFallback(error)) throw error;
    }
  }
  const records = readLocal(userKey).filter(record => record.id !== id);
  writeLocal(userKey, records);
}

export function upsertLocalDateIdea(userKey, matcher, data) {
  const records = readLocal(userKey);
  const index = records.findIndex(matcher);
  if (index >= 0) {
    const updated = { ...records[index], ...data, updated_at: new Date().toISOString(), __local: true };
    const next = [...records];
    next[index] = updated;
    writeLocal(userKey, next);
    return updated;
  }
  const record = {
    id: localId(),
    ...data,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    __local: true,
  };
  writeLocal(userKey, [record, ...records]);
  return record;
}
