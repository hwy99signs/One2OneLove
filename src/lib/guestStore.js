// Browser-local data store for guest mode (owner decision, 2026-11-25).
//
// One2OneLove is free with no signup, and the member system is disabled
// (owner ruling, 2026-11-25 10:58 CT), so guest mode is the ONLY mode:
// the personal features (Journals, Memories, Milestones, Goals,
// Calendar, Love Notes, custom Date Ideas) keep their data in this
// browser's local storage, and their services use this store directly —
// they never call the member API. Records stored here never leave the
// device and are not shared with a partner account.

const PREFIX = 'o2ol_guest_store_';

function key(name) { return PREFIX + name; }

export function loadCollection(name) {
  try {
    const raw = localStorage.getItem(key(name));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCollection(name, rows) {
  try {
    localStorage.setItem(key(name), JSON.stringify(rows || []));
  } catch { /* storage full/unavailable — guest data simply won't persist */ }
}

export function newGuestRecordId() {
  try {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  } catch { /* fall through */ }
  return 'local-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
}

export function insertRecord(name, data) {
  const now = new Date().toISOString();
  const record = { ...(data || {}), id: newGuestRecordId(), created_at: now, updated_at: now };
  const rows = loadCollection(name);
  rows.unshift(record);
  saveCollection(name, rows);
  return record;
}

export function updateRecord(name, id, updates) {
  const rows = loadCollection(name);
  const index = rows.findIndex(row => String(row.id) === String(id));
  if (index === -1) return null;
  const { id: _ignored, created_at: _ignoredCreated, ...clean } = updates || {};
  rows[index] = { ...rows[index], ...clean, updated_at: new Date().toISOString() };
  saveCollection(name, rows);
  return rows[index];
}

export function deleteRecord(name, id) {
  const rows = loadCollection(name).filter(row => String(row.id) !== String(id));
  saveCollection(name, rows);
  return id;
}

export function getRecord(name, id) {
  return loadCollection(name).find(row => String(row.id) === String(id)) || null;
}

// Retained for compatibility with older call sites; guest-only services
// no longer branch on API errors because they make no member API calls.
export function isUnauthorized(error) {
  return Number(error?.status) === 401;
}

// Read a File as a data URL so guest photo uploads (Memories, Milestones)
// can be stored locally and displayed without any server upload.
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Unable to read that file.'));
    reader.readAsDataURL(file);
  });
}
