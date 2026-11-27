import { loadCollection, insertRecord, updateRecord, deleteRecord, fileToDataUrl } from './guestStore';

// Guest mode is the ONLY mode (owner ruling, 2026-11-25): there are no
// members in the 100% free platform, so memories live in the
// browser-local guest store and photos are kept as data URLs. This
// service never calls the member API — the server memories API still
// exists in the worker but is switched off (410) with the rest of the
// member system, ready for future re-activation. The userKey argument
// is accepted for call-site compatibility and ignored.
const LOCAL = 'memories';

export async function listMemories(_userKey) {
  return loadCollection(LOCAL);
}

export async function createMemory(_userKey, data) {
  return insertRecord(LOCAL, data || {});
}

export async function updateMemory(_userKey, id, updates) {
  if (!id) throw new Error('Memory ID is required.');
  return updateRecord(LOCAL, id, updates || {});
}

export async function deleteMemory(_userKey, id) {
  if (!id) throw new Error('Memory ID is required.');
  deleteRecord(LOCAL, id);
  return id;
}

export async function uploadMemoryMedia(file, _memoryId = null) {
  if (!(file instanceof File)) throw new Error('Choose a photo or video to upload.');
  // Photos stay in the browser as data URLs — no server upload exists
  // in guest mode.
  return fileToDataUrl(file);
}

export async function deleteMemoryMedia(_url) {
  // Local data URLs need no server delete.
  return false;
}
