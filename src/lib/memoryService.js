const LOCAL_KEY = 'o2ol_memories_local_v1';

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
    // Ignore storage failures so the action can still return its in-memory result.
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

function mergeServerAndLocal(serverRecords, localRecords) {
  const localById = new Map(localRecords.map(record => [String(record.id), record]));
  const serverIds = new Set(serverRecords.map(record => String(record.id)));
  const mergedServer = serverRecords.map(record => ({
    ...(localById.get(String(record.id)) || {}),
    ...record,
  }));
  const localOnly = localRecords.filter(record => !serverIds.has(String(record.id)));
  return [...localOnly, ...mergedServer];
}

function upsertLocal(userKey, record) {
  const records = readLocal(userKey);
  const index = records.findIndex(item => String(item.id) === String(record.id));
  if (index >= 0) {
    const next = [...records];
    next[index] = { ...records[index], ...record, __local_mirror: true };
    writeLocal(userKey, next);
    return next[index];
  }
  const nextRecord = { ...record, __local_mirror: true };
  writeLocal(userKey, [nextRecord, ...records]);
  return nextRecord;
}

function removeLocal(userKey, id) {
  writeLocal(userKey, readLocal(userKey).filter(record => String(record.id) !== String(id)));
}

export async function listMemories(userKey) {
  const localRecords = readLocal(userKey);
  try {
    const payload = await apiRequest('/api/memories');
    return mergeServerAndLocal(payload.memories || [], localRecords);
  } catch {
    return localRecords;
  }
}

export async function createMemory(userKey, data) {
  try {
    const payload = await apiRequest('/api/memories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const record = {
      ...data,
      ...(payload.memory || {}),
      tags: data.tags || [],
      partner_email: data.partner_email || '',
    };
    upsertLocal(userKey, record);
    return record;
  } catch {
    const record = {
      id: localId(),
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      __local: true,
    };
    upsertLocal(userKey, record);
    return record;
  }
}

export async function updateMemory(userKey, id, updates) {
  let serverRecord = null;
  if (!String(id || '').startsWith('local-')) {
    try {
      const payload = await apiRequest(`/api/memories/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      serverRecord = payload.memory || null;
    } catch {
      serverRecord = null;
    }
  }

  const existing = readLocal(userKey).find(record => String(record.id) === String(id)) || {};
  const record = {
    ...existing,
    ...updates,
    ...(serverRecord || {}),
    id: serverRecord?.id || id || localId(),
    updated_at: serverRecord?.updated_at || new Date().toISOString(),
    created_at: serverRecord?.created_at || existing.created_at || new Date().toISOString(),
    ...(serverRecord ? {} : { __local: true }),
  };
  upsertLocal(userKey, record);
  return record;
}

export async function deleteMemory(userKey, id) {
  if (!String(id || '').startsWith('local-')) {
    try {
      await apiRequest(`/api/memories/${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch {
      // Keep the UI action functional even if the preview session has no Neon cookie.
    }
  }
  removeLocal(userKey, id);
  return id;
}
