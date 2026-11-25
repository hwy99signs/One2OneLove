import { apiRequest } from './apiClient';
import { loadCollection, insertRecord, updateRecord, deleteRecord, getRecord, isUnauthorized } from './guestStore';

// Guest mode (2026-11-25): with no account, journal entries live in the
// browser-local guest store. Members keep the server API. Every call tries
// the API first and falls back locally only on a 401 (no session).
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
  try {
    const payload = await apiRequest(`/api/journals?order=${encodeURIComponent(orderBy)}`);
    return payload?.entries || [];
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    return sortEntries(loadCollection(LOCAL), orderBy);
  }
}

export async function getJournalEntryById(entryId) {
  try {
    const payload = await apiRequest(`/api/journals/${entryId}`);
    return payload?.entry || null;
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    return getRecord(LOCAL, entryId);
  }
}

export async function createJournalEntry(entryData) {
  const body = {
    ...entryData,
    tags: Array.isArray(entryData?.tags) ? entryData.tags : [],
    is_favorite: Boolean(entryData?.is_favorite),
  };
  try {
    const payload = await apiRequest('/api/journals', { method: 'POST', body });
    return payload?.entry || null;
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    return insertRecord(LOCAL, body);
  }
}

export async function updateJournalEntry(entryId, entryData) {
  const body = {
    ...entryData,
    ...(entryData?.tags !== undefined
      ? { tags: Array.isArray(entryData.tags) ? entryData.tags : [] }
      : {}),
  };
  try {
    const payload = await apiRequest(`/api/journals/${entryId}`, { method: 'PATCH', body });
    return payload?.entry || null;
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    return updateRecord(LOCAL, entryId, body);
  }
}

export async function deleteJournalEntry(entryId) {
  try {
    await apiRequest(`/api/journals/${entryId}`, { method: 'DELETE' });
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    deleteRecord(LOCAL, entryId);
  }
}

export async function toggleFavorite(entryId, isFavorite) {
  return updateJournalEntry(entryId, { is_favorite: Boolean(isFavorite) });
}

export async function getJournalEntriesByMood(mood, orderBy = '-entry_date') {
  try {
    const params = new URLSearchParams({ mood, order: orderBy });
    const payload = await apiRequest(`/api/journals?${params.toString()}`);
    return payload?.entries || [];
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    return sortEntries(loadCollection(LOCAL).filter(entry => entry?.mood === mood), orderBy);
  }
}

export async function getFavoriteJournalEntries(orderBy = '-entry_date') {
  try {
    const params = new URLSearchParams({ favorite: 'true', order: orderBy });
    const payload = await apiRequest(`/api/journals?${params.toString()}`);
    return payload?.entries || [];
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    return sortEntries(loadCollection(LOCAL).filter(entry => entry?.is_favorite), orderBy);
  }
}

export async function getJournalStats() {
  try {
    const payload = await apiRequest('/api/journals/stats');
    return payload?.stats || { total: 0, favorites: 0, byMood: {} };
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    const rows = loadCollection(LOCAL);
    const byMood = { happy: 0, grateful: 0, reflective: 0, excited: 0, peaceful: 0, challenged: 0, loving: 0 };
    for (const entry of rows) {
      if (entry?.mood && entry.mood in byMood) byMood[entry.mood] += 1;
    }
    return { total: rows.length, favorites: rows.filter(entry => entry?.is_favorite).length, byMood };
  }
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
