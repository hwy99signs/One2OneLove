import { apiRequest } from './apiClient';

export async function getJournalEntries(orderBy = '-entry_date') {
  const payload = await apiRequest(`/api/journals?order=${encodeURIComponent(orderBy)}`);
  return payload?.entries || [];
}

export async function getJournalEntryById(entryId) {
  const payload = await apiRequest(`/api/journals/${entryId}`);
  return payload?.entry || null;
}

export async function createJournalEntry(entryData) {
  const payload = await apiRequest('/api/journals', {
    method: 'POST',
    body: {
      ...entryData,
      tags: Array.isArray(entryData?.tags) ? entryData.tags : [],
      is_favorite: Boolean(entryData?.is_favorite),
    },
  });
  return payload?.entry || null;
}

export async function updateJournalEntry(entryId, entryData) {
  const payload = await apiRequest(`/api/journals/${entryId}`, {
    method: 'PATCH',
    body: {
      ...entryData,
      ...(entryData?.tags !== undefined
        ? { tags: Array.isArray(entryData.tags) ? entryData.tags : [] }
        : {}),
    },
  });
  return payload?.entry || null;
}

export async function deleteJournalEntry(entryId) {
  await apiRequest(`/api/journals/${entryId}`, { method: 'DELETE' });
}

export async function toggleFavorite(entryId, isFavorite) {
  return updateJournalEntry(entryId, { is_favorite: Boolean(isFavorite) });
}

export async function getJournalEntriesByMood(mood, orderBy = '-entry_date') {
  const params = new URLSearchParams({ mood, order: orderBy });
  const payload = await apiRequest(`/api/journals?${params.toString()}`);
  return payload?.entries || [];
}

export async function getFavoriteJournalEntries(orderBy = '-entry_date') {
  const params = new URLSearchParams({ favorite: 'true', order: orderBy });
  const payload = await apiRequest(`/api/journals?${params.toString()}`);
  return payload?.entries || [];
}

export async function getJournalStats() {
  const payload = await apiRequest('/api/journals/stats');
  return payload?.stats || {
    total: 0,
    favorites: 0,
    byMood: {
      happy: 0,
      grateful: 0,
      reflective: 0,
      excited: 0,
      peaceful: 0,
      challenged: 0,
      loving: 0,
    },
  };
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
