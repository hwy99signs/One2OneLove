import { loadCollection, insertRecord, updateRecord, deleteRecord } from './guestStore';

// Guest mode is the ONLY mode (owner ruling, 2026-11-25): there are no
// members in the 100% free platform, so custom Date Ideas live in the
// browser-local guest store and this service never calls the member
// API. The server date-ideas API still exists in the worker but is
// switched off (410) with the rest of the member system, ready for
// future re-activation. The userKey argument is accepted for call-site
// compatibility and ignored. (The shared Date Idea library is separate
// and stays public.)
const LOCAL = 'custom_date_ideas';

export async function listDateIdeas(_userKey) {
  return loadCollection(LOCAL);
}

export async function createDateIdea(_userKey, data) {
  return insertRecord(LOCAL, data || {});
}

export async function updateDateIdea(_userKey, id, updates) {
  if (!id) throw new Error('Date idea ID is required.');
  return updateRecord(LOCAL, id, updates || {});
}

export async function deleteDateIdea(_userKey, id) {
  if (!id) throw new Error('Date idea ID is required.');
  deleteRecord(LOCAL, id);
  return id;
}
