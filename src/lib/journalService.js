import { supabase } from './supabase';

/**
 * Shared Journals Service
 * Handles all operations for shared journal entries
 */

// ============================================================================
// JOURNAL CRUD OPERATIONS
// ============================================================================

/**
 * Get all journal entries for the current user
 * @param {string} orderBy - Field to order by (e.g., '-entry_date')
 * @returns {Promise<Array>} Array of journal entries
 */
export async function getJournalEntries(orderBy = '-entry_date') {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Parse orderBy (e.g., '-entry_date' means DESC)
    const isDescending = orderBy.startsWith('-');
    const field = isDescending ? orderBy.substring(1) : orderBy;
    const ascending = !isDescending;

    // Fetch journal entries
    const { data: entries, error } = await supabase
      .from('shared_journals')
      .select('*')
      .eq('user_id', user.id)
      .order(field, { ascending });

    if (error) throw error;

    return entries || [];
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    throw error;
  }
}

/**
 * Get a single journal entry by ID
 * @param {string} entryId - The entry ID
 * @returns {Promise<Object>} The journal entry
 */
export async function getJournalEntryById(entryId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: entry, error } = await supabase
      .from('shared_journals')
      .select('*')
      .eq('id', entryId)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;

    return entry;
  } catch (error) {
    console.error('Error fetching journal entry:', error);
    throw error;
  }
}

/**
 * Create a new journal entry
 * @param {Object} entryData - The journal entry data
 * @returns {Promise<Object>} The created journal entry
 */
export async function createJournalEntry(entryData) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Ensure tags is an array
    const tags = Array.isArray(entryData.tags) ? entryData.tags : [];

    // Create the journal entry
    const { data: entry, error } = await supabase
      .from('shared_journals')
      .insert({
        ...entryData,
        user_id: user.id,
        tags: tags,
      })
      .select()
      .single();

    if (error) throw error;

    return entry;
  } catch (error) {
    console.error('Error creating journal entry:', error);
    throw error;
  }
}

/**
 * Update a journal entry
 * @param {string} entryId - The entry ID
 * @param {Object} entryData - The updated journal entry data
 * @returns {Promise<Object>} The updated journal entry
 */
export async function updateJournalEntry(entryId, entryData) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Ensure tags is an array if provided
    const updateData = { ...entryData };
    if (updateData.tags !== undefined) {
      updateData.tags = Array.isArray(updateData.tags) ? updateData.tags : [];
    }

    // Update the journal entry
    const { data: entry, error } = await supabase
      .from('shared_journals')
      .update(updateData)
      .eq('id', entryId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return entry;
  } catch (error) {
    console.error('Error updating journal entry:', error);
    throw error;
  }
}

/**
 * Delete a journal entry
 * @param {string} entryId - The entry ID
 * @returns {Promise<void>}
 */
export async function deleteJournalEntry(entryId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('shared_journals')
      .delete()
      .eq('id', entryId)
      .eq('user_id', user.id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    throw error;
  }
}

/**
 * Toggle favorite status of a journal entry
 * @param {string} entryId - The entry ID
 * @param {boolean} isFavorite - The favorite status
 * @returns {Promise<Object>} The updated journal entry
 */
export async function toggleFavorite(entryId, isFavorite) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: entry, error } = await supabase
      .from('shared_journals')
      .update({ is_favorite: isFavorite })
      .eq('id', entryId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return entry;
  } catch (error) {
    console.error('Error toggling favorite:', error);
    throw error;
  }
}

// ============================================================================
// FILTERING AND SEARCH
// ============================================================================

/**
 * Get journal entries filtered by mood
 * @param {string} mood - The mood to filter by
 * @param {string} orderBy - Field to order by (e.g., '-entry_date')
 * @returns {Promise<Array>} Array of filtered journal entries
 */
export async function getJournalEntriesByMood(mood, orderBy = '-entry_date') {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Parse orderBy
    const isDescending = orderBy.startsWith('-');
    const field = isDescending ? orderBy.substring(1) : orderBy;
    const ascending = !isDescending;

    const { data: entries, error } = await supabase
      .from('shared_journals')
      .select('*')
      .eq('user_id', user.id)
      .eq('mood', mood)
      .order(field, { ascending });

    if (error) throw error;

    return entries || [];
  } catch (error) {
    console.error('Error fetching journal entries by mood:', error);
    throw error;
  }
}

/**
 * Get favorite journal entries
 * @param {string} orderBy - Field to order by (e.g., '-entry_date')
 * @returns {Promise<Array>} Array of favorite journal entries
 */
export async function getFavoriteJournalEntries(orderBy = '-entry_date') {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Parse orderBy
    const isDescending = orderBy.startsWith('-');
    const field = isDescending ? orderBy.substring(1) : orderBy;
    const ascending = !isDescending;

    const { data: entries, error } = await supabase
      .from('shared_journals')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_favorite', true)
      .order(field, { ascending });

    if (error) throw error;

    return entries || [];
  } catch (error) {
    console.error('Error fetching favorite journal entries:', error);
    throw error;
  }
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get journal statistics for the current user
 * @returns {Promise<Object>} Statistics object
 */
export async function getJournalStats() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: entries, error } = await supabase
      .from('shared_journals')
      .select('mood, is_favorite, entry_date')
      .eq('user_id', user.id);

    if (error) throw error;

    const stats = {
      total: entries.length,
      favorites: entries.filter(e => e.is_favorite).length,
      byMood: {
        happy: entries.filter(e => e.mood === 'happy').length,
        grateful: entries.filter(e => e.mood === 'grateful').length,
        reflective: entries.filter(e => e.mood === 'reflective').length,
        excited: entries.filter(e => e.mood === 'excited').length,
        peaceful: entries.filter(e => e.mood === 'peaceful').length,
        challenged: entries.filter(e => e.mood === 'challenged').length,
        loving: entries.filter(e => e.mood === 'loving').length,
      }
    };

    return stats;
  } catch (error) {
    console.error('Error fetching journal stats:', error);
    throw error;
  }
}

export default {
  // CRUD operations
  getJournalEntries,
  getJournalEntryById,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  toggleFavorite,
  
  // Filtering
  getJournalEntriesByMood,
  getFavoriteJournalEntries,
  
  // Statistics
  getJournalStats
};

