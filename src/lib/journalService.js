import { supabase, handleSupabaseError } from './supabase';

const JOURNAL_FIELDS = 'id,user_id,title,content,entry_date,mood,tags,is_favorite,shared_with_partner,created_at,updated_at';
const ORDER_FIELDS = new Set(['entry_date', 'created_at', 'updated_at', 'title']);

async function requireUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error('Authentication required');
  return data.user;
}

function parseOrder(orderBy = '-entry_date') {
  const descending = String(orderBy).startsWith('-');
  const candidate = descending ? String(orderBy).slice(1) : String(orderBy);
  return { field: ORDER_FIELDS.has(candidate) ? candidate : 'entry_date', ascending: !descending };
}

function normalizeEntry(entry, userId) {
  return { ...entry, isOwn: entry.user_id === userId };
}

function writePayload(entryData = {}) {
  return {
    title: String(entryData.title || '').trim(),
    content: String(entryData.content || '').trim(),
    entry_date: entryData.entry_date,
    mood: entryData.mood || 'reflective',
    tags: Array.isArray(entryData.tags) ? entryData.tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 20) : [],
    is_favorite: Boolean(entryData.is_favorite),
    shared_with_partner: Boolean(entryData.shared_with_partner),
  };
}

export async function getJournalEntries(orderBy = '-entry_date') {
  try {
    const user = await requireUser();
    const { field, ascending } = parseOrder(orderBy);
    const { data, error } = await supabase
      .from('shared_journals')
      .select(JOURNAL_FIELDS)
      .order(field, { ascending });
    if (error) throw error;
    return (data || []).map((entry) => normalizeEntry(entry, user.id));
  } catch (error) {
    throw new Error(handleSupabaseError(error));
  }
}

export async function getJournalEntryById(entryId) {
  try {
    const user = await requireUser();
    const { data, error } = await supabase
      .from('shared_journals')
      .select(JOURNAL_FIELDS)
      .eq('id', entryId)
      .single();
    if (error) throw error;
    return normalizeEntry(data, user.id);
  } catch (error) {
    throw new Error(handleSupabaseError(error));
  }
}

export async function createJournalEntry(entryData) {
  try {
    const user = await requireUser();
    const payload = writePayload(entryData);
    if (!payload.title || !payload.content || !payload.entry_date) throw new Error('Journal title, content and date are required');
    const { data, error } = await supabase
      .from('shared_journals')
      .insert({ ...payload, user_id: user.id })
      .select(JOURNAL_FIELDS)
      .single();
    if (error) throw error;
    return normalizeEntry(data, user.id);
  } catch (error) {
    throw new Error(handleSupabaseError(error));
  }
}

export async function updateJournalEntry(entryId, entryData) {
  try {
    const user = await requireUser();
    const payload = writePayload(entryData);
    const { data, error } = await supabase
      .from('shared_journals')
      .update(payload)
      .eq('id', entryId)
      .eq('user_id', user.id)
      .select(JOURNAL_FIELDS)
      .single();
    if (error) throw error;
    return normalizeEntry(data, user.id);
  } catch (error) {
    throw new Error(handleSupabaseError(error));
  }
}

export async function deleteJournalEntry(entryId) {
  try {
    const user = await requireUser();
    const { error } = await supabase
      .from('shared_journals')
      .delete()
      .eq('id', entryId)
      .eq('user_id', user.id);
    if (error) throw error;
  } catch (error) {
    throw new Error(handleSupabaseError(error));
  }
}

export async function toggleFavorite(entryId, isFavorite) {
  try {
    const user = await requireUser();
    const { data, error } = await supabase
      .from('shared_journals')
      .update({ is_favorite: Boolean(isFavorite) })
      .eq('id', entryId)
      .eq('user_id', user.id)
      .select(JOURNAL_FIELDS)
      .single();
    if (error) throw error;
    return normalizeEntry(data, user.id);
  } catch (error) {
    throw new Error(handleSupabaseError(error));
  }
}

export async function getJournalEntriesByMood(mood, orderBy = '-entry_date') {
  const entries = await getJournalEntries(orderBy);
  return entries.filter((entry) => entry.mood === mood);
}

export async function getFavoriteJournalEntries(orderBy = '-entry_date') {
  const entries = await getJournalEntries(orderBy);
  return entries.filter((entry) => entry.isOwn && entry.is_favorite);
}

export async function getJournalStats() {
  const entries = (await getJournalEntries('-entry_date')).filter((entry) => entry.isOwn);
  const byMood = {};
  for (const mood of ['happy', 'grateful', 'reflective', 'excited', 'peaceful', 'challenged', 'loving']) {
    byMood[mood] = entries.filter((entry) => entry.mood === mood).length;
  }
  return {
    total: entries.length,
    favorites: entries.filter((entry) => entry.is_favorite).length,
    shared: entries.filter((entry) => entry.shared_with_partner).length,
    byMood,
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
