import { supabase } from './supabase';

/**
 * Relationship Milestones Service
 * Handles all operations for relationship milestones and anniversaries
 */

// ============================================================================
// FILE UPLOAD OPERATIONS
// ============================================================================

/**
 * Upload a photo to milestone storage
 * @param {File} file - The file to upload
 * @param {string} milestoneId - The milestone ID (optional, for organizing)
 * @returns {Promise<string>} The public URL of the uploaded file
 */
export async function uploadMilestonePhoto(file, milestoneId = null) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = milestoneId 
      ? `${user.id}/${milestoneId}/${fileName}`
      : `${user.id}/${fileName}`;

    // Upload file
    const { data, error } = await supabase.storage
      .from('milestone-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('milestone-photos')
      .getPublicUrl(filePath);

    console.log('✅ Photo uploaded:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Error uploading photo:', error);
    throw error;
  }
}

/**
 * Upload multiple photos to milestone storage
 * @param {File[]} files - Array of files to upload
 * @param {string} milestoneId - The milestone ID (optional)
 * @returns {Promise<string[]>} Array of public URLs
 */
export async function uploadMilestonePhotos(files, milestoneId = null) {
  try {
    const uploadPromises = files.map(file => uploadMilestonePhoto(file, milestoneId));
    const urls = await Promise.all(uploadPromises);
    return urls;
  } catch (error) {
    console.error('Error uploading photos:', error);
    throw error;
  }
}

/**
 * Delete a photo from milestone storage
 * @param {string} photoUrl - The public URL of the photo to delete
 * @returns {Promise<void>}
 */
export async function deleteMilestonePhoto(photoUrl) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Extract file path from URL
    const urlParts = photoUrl.split('/milestone-photos/');
    if (urlParts.length < 2) {
      throw new Error('Invalid photo URL');
    }
    const filePath = urlParts[1];

    // Delete file
    const { error } = await supabase.storage
      .from('milestone-photos')
      .remove([filePath]);

    if (error) throw error;

    console.log('✅ Photo deleted:', filePath);
  } catch (error) {
    console.error('Error deleting photo:', error);
    throw error;
  }
}

/**
 * Delete multiple photos from milestone storage
 * @param {string[]} photoUrls - Array of photo URLs to delete
 * @returns {Promise<void>}
 */
export async function deleteMilestonePhotos(photoUrls) {
  try {
    const deletePromises = photoUrls.map(url => deleteMilestonePhoto(url));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting photos:', error);
    throw error;
  }
}

// ============================================================================
// MILESTONE CRUD OPERATIONS
// ============================================================================

/**
 * Get all milestones for the current user
 * @param {string} orderBy - Field to order by (e.g., '-date' for DESC, 'date' for ASC)
 * @returns {Promise<Array>} Array of milestones
 */
export async function getMilestones(orderBy = '-date') {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Parse orderBy (e.g., '-date' means DESC)
    const isDescending = orderBy.startsWith('-');
    const field = isDescending ? orderBy.substring(1) : orderBy;
    const ascending = !isDescending;

    // Fetch milestones
    const { data: milestones, error } = await supabase
      .from('relationship_milestones')
      .select('*')
      .eq('user_id', user.id)
      .order(field, { ascending });

    if (error) throw error;

    return milestones || [];
  } catch (error) {
    console.error('Error fetching milestones:', error);
    throw error;
  }
}

/**
 * Get a single milestone by ID
 * @param {string} milestoneId - The milestone ID
 * @returns {Promise<Object>} The milestone
 */
export async function getMilestoneById(milestoneId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: milestone, error } = await supabase
      .from('relationship_milestones')
      .select('*')
      .eq('id', milestoneId)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;

    return milestone;
  } catch (error) {
    console.error('Error fetching milestone:', error);
    throw error;
  }
}

/**
 * Create a new milestone
 * @param {Object} milestoneData - The milestone data
 * @returns {Promise<Object>} The created milestone
 */
export async function createMilestone(milestoneData) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Prepare milestone data
    const newMilestone = {
      user_id: user.id,
      title: milestoneData.title,
      milestone_type: milestoneData.milestone_type || 'custom',
      date: milestoneData.date,
      description: milestoneData.description || null,
      location: milestoneData.location || null,
      partner_email: milestoneData.partner_email || null,
      media_urls: milestoneData.media_urls || [],
      is_recurring: milestoneData.is_recurring || false,
      reminder_enabled: milestoneData.reminder_enabled !== false,
      reminder_days_before: milestoneData.reminder_days_before || 7,
      celebration_ideas: milestoneData.celebration_ideas || [],
      celebration_completed: milestoneData.celebration_completed || false,
    };

    const { data: milestone, error } = await supabase
      .from('relationship_milestones')
      .insert(newMilestone)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Milestone created:', milestone.id);
    return milestone;
  } catch (error) {
    console.error('Error creating milestone:', error);
    throw error;
  }
}

/**
 * Update an existing milestone
 * @param {string} milestoneId - The milestone ID
 * @param {Object} updates - The fields to update
 * @returns {Promise<Object>} The updated milestone
 */
export async function updateMilestone(milestoneId, updates) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Remove fields that shouldn't be updated directly
    const { user_id, id, created_at, ...allowedUpdates } = updates;

    const { data: milestone, error } = await supabase
      .from('relationship_milestones')
      .update(allowedUpdates)
      .eq('id', milestoneId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Milestone updated:', milestone.id);
    return milestone;
  } catch (error) {
    console.error('Error updating milestone:', error);
    throw error;
  }
}

/**
 * Delete a milestone
 * @param {string} milestoneId - The milestone ID
 * @returns {Promise<void>}
 */
export async function deleteMilestone(milestoneId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('relationship_milestones')
      .delete()
      .eq('id', milestoneId)
      .eq('user_id', user.id);

    if (error) throw error;

    console.log('✅ Milestone deleted:', milestoneId);
  } catch (error) {
    console.error('Error deleting milestone:', error);
    throw error;
  }
}

// ============================================================================
// MILESTONE QUERY HELPERS
// ============================================================================

/**
 * Get upcoming milestones (within next X days)
 * @param {number} daysAhead - Number of days to look ahead (default: 60)
 * @returns {Promise<Array>} Array of upcoming milestones
 */
export async function getUpcomingMilestones(daysAhead = 60) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);

    const { data: milestones, error } = await supabase
      .from('relationship_milestones')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', today.toISOString().split('T')[0])
      .lte('date', futureDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) throw error;

    // Also include recurring milestones that will occur in this period
    const { data: recurringMilestones, error: recurringError } = await supabase
      .from('relationship_milestones')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_recurring', true);

    if (recurringError) throw recurringError;

    // Calculate next occurrence for recurring milestones
    const recurringWithNextDates = recurringMilestones
      .map(milestone => {
        const nextDate = getNextAnniversary(milestone.date);
        const daysUntil = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntil >= 0 && daysUntil <= daysAhead) {
          return {
            ...milestone,
            displayDate: nextDate.toISOString().split('T')[0],
            daysUntil
          };
        }
        return null;
      })
      .filter(Boolean);

    // Combine and sort
    const allUpcoming = [...(milestones || []), ...recurringWithNextDates]
      .sort((a, b) => {
        const dateA = new Date(a.displayDate || a.date);
        const dateB = new Date(b.displayDate || b.date);
        return dateA - dateB;
      });

    return allUpcoming;
  } catch (error) {
    console.error('Error fetching upcoming milestones:', error);
    throw error;
  }
}

/**
 * Get past milestones
 * @returns {Promise<Array>} Array of past milestones (non-recurring only)
 */
export async function getPastMilestones() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const today = new Date().toISOString().split('T')[0];

    const { data: milestones, error } = await supabase
      .from('relationship_milestones')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_recurring', false)
      .lt('date', today)
      .order('date', { ascending: false });

    if (error) throw error;

    return milestones || [];
  } catch (error) {
    console.error('Error fetching past milestones:', error);
    throw error;
  }
}

/**
 * Get milestones by type
 * @param {string} milestoneType - The milestone type
 * @returns {Promise<Array>} Array of milestones of that type
 */
export async function getMilestonesByType(milestoneType) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: milestones, error } = await supabase
      .from('relationship_milestones')
      .select('*')
      .eq('user_id', user.id)
      .eq('milestone_type', milestoneType)
      .order('date', { ascending: false });

    if (error) throw error;

    return milestones || [];
  } catch (error) {
    console.error('Error fetching milestones by type:', error);
    throw error;
  }
}

/**
 * Mark a milestone celebration as completed
 * @param {string} milestoneId - The milestone ID
 * @returns {Promise<Object>} The updated milestone
 */
export async function markCelebrationCompleted(milestoneId) {
  try {
    return await updateMilestone(milestoneId, {
      celebration_completed: true
    });
  } catch (error) {
    console.error('Error marking celebration as completed:', error);
    throw error;
  }
}

/**
 * Update milestone media (add or remove photos)
 * @param {string} milestoneId - The milestone ID
 * @param {Array<string>} mediaUrls - Array of media URLs
 * @returns {Promise<Object>} The updated milestone
 */
export async function updateMilestoneMedia(milestoneId, mediaUrls) {
  try {
    return await updateMilestone(milestoneId, {
      media_urls: mediaUrls
    });
  } catch (error) {
    console.error('Error updating milestone media:', error);
    throw error;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate the next anniversary date for a recurring milestone
 * @param {string} originalDate - The original date (YYYY-MM-DD)
 * @returns {Date} The next occurrence date
 */
function getNextAnniversary(originalDate) {
  const today = new Date();
  const original = new Date(originalDate);
  const thisYear = new Date(today.getFullYear(), original.getMonth(), original.getDate());
  
  if (thisYear < today) {
    return new Date(today.getFullYear() + 1, original.getMonth(), original.getDate());
  }
  return thisYear;
}

/**
 * Calculate days until a milestone
 * @param {string} date - The milestone date (YYYY-MM-DD)
 * @returns {number} Number of days until the milestone
 */
export function getDaysUntil(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const milestoneDate = new Date(date);
  milestoneDate.setHours(0, 0, 0, 0);
  const diffTime = milestoneDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Check if a milestone needs a reminder sent
 * @param {Object} milestone - The milestone object
 * @returns {boolean} True if reminder should be sent
 */
export function needsReminder(milestone) {
  if (!milestone.reminder_enabled) return false;
  
  const daysUntil = getDaysUntil(milestone.date);
  const daysSinceLastReminder = milestone.last_reminder_sent 
    ? Math.ceil((new Date() - new Date(milestone.last_reminder_sent)) / (1000 * 60 * 60 * 24))
    : Infinity;
  
  return daysUntil <= milestone.reminder_days_before && daysSinceLastReminder >= 1;
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get milestone statistics for the user
 * @returns {Promise<Object>} Statistics object
 */
export async function getMilestoneStats() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: milestones, error } = await supabase
      .from('relationship_milestones')
      .select('*')
      .eq('user_id', user.id);

    if (error) throw error;

    const today = new Date();
    const upcoming = milestones.filter(m => getDaysUntil(m.date) >= 0 && getDaysUntil(m.date) <= 30);
    const past = milestones.filter(m => !m.is_recurring && getDaysUntil(m.date) < 0);
    const recurring = milestones.filter(m => m.is_recurring);
    
    return {
      total: milestones.length,
      upcoming: upcoming.length,
      past: past.length,
      recurring: recurring.length,
      withPhotos: milestones.filter(m => m.media_urls?.length > 0).length,
      celebrated: milestones.filter(m => m.celebration_completed).length
    };
  } catch (error) {
    console.error('Error fetching milestone stats:', error);
    throw error;
  }
}

