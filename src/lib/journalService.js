import { loadCollection, insertRecord, updateRecord, deleteRecord, getRecord } from './guestStore';

// Guest mode is the ONLY mode (owner ruling, 2026-11-25): there are no
// members in the 100% free platform, so journal entries live in the
// browser-local guest store and this service never calls the member API.
// The server journals API still exists in the worker but is switched
// off (410) with the rest of the member system, ready for the day the
// owner re-activates accounts.
const LOCAL = 'journals';

function sortEntries(entries, orderBy) {
  const rows = [...(entries || [])];
  const raw = String(orderBy || '-entry_date');
  const field = raw.replace(/^-/, '');
  const desc = raw.startsWith('-');
  rows.sort((a, b) => {
    const av = String(a?.[field] || a?.entry_date || a?.created_at || '');
    const bv = String(b?.[field] || b?.entry_date || b?.created_at || '');
    return desc ? bv.localeCompare(av) : av.localeCompare(bv);
  });
  return rows;
}

export async function getJournalEntries(orderBy = '-entry_date') {
  return sortEntries(loadCollection(LOCAL), orderBy);
}

export async function getJournalEntryById(entryId) {
  return getRecord(LOCAL, entryId);
}

export async function createJournalEntry(entryData) {
  const body = {
    ...entryData,
    tags: Array.isArray(entryData?.tags) ? entryData.tags : [],
    is_favorite: Boolean(entryData?.is_favorite),
  };
  return insertRecord(LOCAL, body);
}

export async function updateJournalEntry(entryId, entryData) {
  const body = {
    ...entryData,
    ...(entryData?.tags !== undefined
      ? { tags: Array.isArray(entryData.tags) ? entryData.tags : [] }
      : {}),
  };
  return updateRecord(LOCAL, entryId, body);
}

export async function deleteJournalEntry(entryId) {
  deleteRecord(LOCAL, entryId);
}

export async function toggleFavorite(entryId, isFavorite) {
  return updateJournalEntry(entryId, { is_favorite: Boolean(isFavorite) });
}

export async function getJournalEntriesByMood(mood, orderBy = '-entry_date') {
  return sortEntries(loadCollection(LOCAL).filter(entry => entry?.mood === mood), orderBy);
}

export async function getFavoriteJournalEntries(orderBy = '-entry_date') {
  return sortEntries(loadCollection(LOCAL).filter(entry => entry?.is_favorite), orderBy);
}

export async function getJournalStats() {
  const rows = loadCollection(LOCAL);
  const byMood = { happy: 0, grateful: 0, reflective: 0, excited: 0, peaceful: 0, challenged: 0, loving: 0 };
  for (const entry of rows) {
    if (entry?.mood && entry.mood in byMood) byMood[entry.mood] += 1;
  }
  return { total: rows.length, favorites: rows.filter(entry => entry?.is_favorite).length, byMood };
}

export default {
  getJournalEntries,
  getJournalEntryById,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  toggleFavorite,
  getJournalEntriesByMood,
  getFavoriteJournalEntries,
  getJournalStats,
};
