import { journalApi } from './journalApi';

export async function getJournalEntries(orderBy = '-entry_date') {
  try { return await journalApi.list({ orderBy }); }
  catch (error) { console.error('Error fetching journal entries:', error); throw error; }
}

export async function getJournalEntryById(entryId) {
  try { return await journalApi.get(entryId); }
  catch (error) { console.error('Error fetching journal entry:', error); throw error; }
}

export async function createJournalEntry(entryData) {
  try {
    return await journalApi.create({ ...entryData, tags: Array.isArray(entryData?.tags) ? entryData.tags : [] });
  } catch (error) {
    console.error('Error creating journal entry:', error);
    throw error;
  }
}

export async function updateJournalEntry(entryId, entryData) {
  try {
    const payload = { ...entryData };
    if (payload.tags !== undefined) payload.tags = Array.isArray(payload.tags) ? payload.tags : [];
    delete payload.id;
    delete payload.user_id;
    delete payload.created_at;
    delete payload.updated_at;
    return await journalApi.update(entryId, payload);
  } catch (error) {
    console.error('Error updating journal entry:', error);
    throw error;
  }
}

export async function deleteJournalEntry(entryId) {
  try { await journalApi.remove(entryId); }
  catch (error) { console.error('Error deleting journal entry:', error); throw error; }
}

export async function toggleFavorite(entryId, isFavorite) {
  try { return await journalApi.update(entryId, { is_favorite: Boolean(isFavorite) }); }
  catch (error) { console.error('Error toggling favorite:', error); throw error; }
}

export async function getJournalEntriesByMood(mood, orderBy = '-entry_date') {
  try { return await journalApi.list({ mood, orderBy }); }
  catch (error) { console.error('Error fetching journal entries by mood:', error); throw error; }
}

export async function getFavoriteJournalEntries(orderBy = '-entry_date') {
  try { return await journalApi.list({ favorite: true, orderBy }); }
  catch (error) { console.error('Error fetching favorite journal entries:', error); throw error; }
}

export async function getJournalStats() {
  try { return await journalApi.stats(); }
  catch (error) { console.error('Error fetching journal stats:', error); throw error; }
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
