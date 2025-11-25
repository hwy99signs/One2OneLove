import { supabase } from './supabase';

/**
 * Success Stories Service
 * Handles all operations for community success stories
 */

// ============================================================================
// STORY CRUD OPERATIONS
// ============================================================================

/**
 * Get all approved stories
 * @param {string} orderBy - Field to order by (e.g., '-created_at')
 * @param {string} storyType - Filter by story type (optional)
 * @param {string} searchQuery - Search in title and content (optional)
 * @returns {Promise<Array>} Array of stories with user interaction data
 */
export async function getStories(orderBy = '-created_at', storyType = null, searchQuery = null) {
  try {
    // Try to get user, but don't fail if not authenticated
    let user = null;
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      user = authUser;
    } catch (authError) {
      // User not authenticated - that's okay, they can still view approved stories
      console.log('User not authenticated, fetching public stories only');
    }
    
    // Parse orderBy (e.g., '-created_at' means DESC)
    const isDescending = orderBy.startsWith('-');
    const field = isDescending ? orderBy.substring(1) : orderBy;
    const ascending = !isDescending;

    // Build query - explicitly get ALL approved stories (not filtered by user)
    let query = supabase
      .from('success_stories')
      .select('*')
      .eq('moderation_status', 'approved')
      .order(field, { ascending });

    // Apply filters
    if (storyType) {
      query = query.eq('story_type', storyType);
    }

    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
    }

    const { data: stories, error } = await query;

    if (error) {
      console.error('Error fetching stories:', error);
      throw error;
    }

    // Get user interaction data (likes, helpful) for each story
    if (user && stories.length > 0) {
      const storyIds = stories.map(s => s.id);
      
      // Get user's likes
      const { data: userLikes } = await supabase
        .from('story_likes')
        .select('story_id')
        .eq('user_id', user.id)
        .in('story_id', storyIds);

      // Get user's helpful marks
      const { data: userHelpful } = await supabase
        .from('story_helpful')
        .select('story_id')
        .eq('user_id', user.id)
        .in('story_id', storyIds);

      const likedStoryIds = new Set(userLikes?.map(l => l.story_id) || []);
      const helpfulStoryIds = new Set(userHelpful?.map(h => h.story_id) || []);

      // Add user interaction flags
      return stories.map(story => ({
        ...story,
        userHasLiked: likedStoryIds.has(story.id),
        userMarkedHelpful: helpfulStoryIds.has(story.id),
        created_date: story.created_at // For compatibility with existing components
      }));
    }

    // Return stories without user interaction data if not logged in
    return stories.map(story => ({
      ...story,
      userHasLiked: false,
      userMarkedHelpful: false,
      created_date: story.created_at
    }));
  } catch (error) {
    console.error('Error fetching stories:', error);
    throw error;
  }
}

/**
 * Get a single story by ID
 * @param {string} storyId - The story ID
 * @returns {Promise<Object>} The story with user interaction data
 */
export async function getStoryById(storyId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const { data: story, error } = await supabase
      .from('success_stories')
      .select('*')
      .eq('id', storyId)
      .single();

    if (error) throw error;

    // Get user interaction data
    let userHasLiked = false;
    let userMarkedHelpful = false;

    if (user) {
      const { data: like } = await supabase
        .from('story_likes')
        .select('id')
        .eq('story_id', storyId)
        .eq('user_id', user.id)
        .single();

      const { data: helpful } = await supabase
        .from('story_helpful')
        .select('id')
        .eq('story_id', storyId)
        .eq('user_id', user.id)
        .single();

      userHasLiked = !!like;
      userMarkedHelpful = !!helpful;
    }

    // Increment views
    await supabase
      .from('success_stories')
      .update({ views_count: (story.views_count || 0) + 1 })
      .eq('id', storyId);

    return {
      ...story,
      userHasLiked,
      userMarkedHelpful,
      created_date: story.created_at
    };
  } catch (error) {
    console.error('Error fetching story:', error);
    throw error;
  }
}

/**
 * Get user's own stories (all statuses)
 * @returns {Promise<Array>} Array of user's stories
 */
export async function getMyStories() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: stories, error } = await supabase
      .from('success_stories')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return stories.map(story => ({
      ...story,
      created_date: story.created_at
    }));
  } catch (error) {
    console.error('Error fetching my stories:', error);
    throw error;
  }
}

/**
 * Create a new story
 * @param {Object} storyData - The story data
 * @returns {Promise<Object>} The created story
 */
export async function createStory(storyData) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get user's name if not anonymous
    let authorName = null;
    if (!storyData.is_anonymous) {
      const { data: userProfile } = await supabase
        .from('users')
        .select('name')
        .eq('id', user.id)
        .single();
      
      authorName = userProfile?.name || user.email?.split('@')[0] || 'User';
    }

    // Prepare story data
    const newStory = {
      user_id: user.id,
      title: storyData.title,
      content: storyData.content,
      story_type: storyData.story_type || 'success',
      author_name: authorName,
      is_anonymous: storyData.is_anonymous || false,
      relationship_length: storyData.relationship_length || null,
      tags: storyData.tags || [],
      moderation_status: storyData.moderation_status || 'pending', // Auto-approve for now, change to 'pending' for moderation
    };

    const { data: story, error } = await supabase
      .from('success_stories')
      .insert(newStory)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Story created:', story.id);
    return {
      ...story,
      created_date: story.created_at
    };
  } catch (error) {
    console.error('Error creating story:', error);
    throw error;
  }
}

/**
 * Update an existing story
 * @param {string} storyId - The story ID
 * @param {Object} updates - The fields to update
 * @returns {Promise<Object>} The updated story
 */
export async function updateStory(storyId, updates) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Remove fields that shouldn't be updated directly
    const { user_id, id, created_at, moderation_status, ...allowedUpdates } = updates;

    // Update author name if not anonymous
    if (!allowedUpdates.is_anonymous && !allowedUpdates.author_name) {
      const { data: userProfile } = await supabase
        .from('users')
        .select('name')
        .eq('id', user.id)
        .single();
      
      allowedUpdates.author_name = userProfile?.name || user.email?.split('@')[0] || 'User';
    }

    const { data: story, error } = await supabase
      .from('success_stories')
      .update(allowedUpdates)
      .eq('id', storyId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Story updated:', story.id);
    return {
      ...story,
      created_date: story.created_at
    };
  } catch (error) {
    console.error('Error updating story:', error);
    throw error;
  }
}

/**
 * Delete a story
 * @param {string} storyId - The story ID
 * @returns {Promise<void>}
 */
export async function deleteStory(storyId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('success_stories')
      .delete()
      .eq('id', storyId)
      .eq('user_id', user.id);

    if (error) throw error;

    console.log('✅ Story deleted:', storyId);
  } catch (error) {
    console.error('Error deleting story:', error);
    throw error;
  }
}

// ============================================================================
// STORY INTERACTIONS (Likes & Helpful)
// ============================================================================

/**
 * Like a story
 * @param {string} storyId - The story ID
 * @returns {Promise<void>}
 */
export async function likeStory(storyId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('story_likes')
      .insert({
        story_id: storyId,
        user_id: user.id
      });

    if (error) {
      // If already liked, ignore the error (idempotent)
      if (error.code !== '23505') throw error;
    }

    console.log('✅ Story liked:', storyId);
  } catch (error) {
    console.error('Error liking story:', error);
    throw error;
  }
}

/**
 * Unlike a story
 * @param {string} storyId - The story ID
 * @returns {Promise<void>}
 */
export async function unlikeStory(storyId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('story_likes')
      .delete()
      .eq('story_id', storyId)
      .eq('user_id', user.id);

    if (error) throw error;

    console.log('✅ Story unliked:', storyId);
  } catch (error) {
    console.error('Error unliking story:', error);
    throw error;
  }
}

/**
 * Toggle like on a story
 * @param {string} storyId - The story ID
 * @param {boolean} isLiked - Current like status
 * @returns {Promise<boolean>} New like status
 */
export async function toggleLikeStory(storyId, isLiked) {
  try {
    if (isLiked) {
      await unlikeStory(storyId);
      return false;
    } else {
      await likeStory(storyId);
      return true;
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    throw error;
  }
}

/**
 * Mark a story as helpful
 * @param {string} storyId - The story ID
 * @returns {Promise<void>}
 */
export async function markStoryHelpful(storyId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('story_helpful')
      .insert({
        story_id: storyId,
        user_id: user.id
      });

    if (error) {
      // If already marked helpful, ignore the error (idempotent)
      if (error.code !== '23505') throw error;
    }

    console.log('✅ Story marked helpful:', storyId);
  } catch (error) {
    console.error('Error marking story helpful:', error);
    throw error;
  }
}

/**
 * Unmark a story as helpful
 * @param {string} storyId - The story ID
 * @returns {Promise<void>}
 */
export async function unmarkStoryHelpful(storyId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('story_helpful')
      .delete()
      .eq('story_id', storyId)
      .eq('user_id', user.id);

    if (error) throw error;

    console.log('✅ Story unmarked helpful:', storyId);
  } catch (error) {
    console.error('Error unmarking story helpful:', error);
    throw error;
  }
}

/**
 * Toggle helpful mark on a story
 * @param {string} storyId - The story ID
 * @param {boolean} isHelpful - Current helpful status
 * @returns {Promise<boolean>} New helpful status
 */
export async function toggleHelpfulStory(storyId, isHelpful) {
  try {
    if (isHelpful) {
      await unmarkStoryHelpful(storyId);
      return false;
    } else {
      await markStoryHelpful(storyId);
      return true;
    }
  } catch (error) {
    console.error('Error toggling helpful:', error);
    throw error;
  }
}

// ============================================================================
// ADMIN/MODERATION FUNCTIONS
// ============================================================================

/**
 * Approve a story (admin only)
 * @param {string} storyId - The story ID
 * @returns {Promise<Object>} The updated story
 */
export async function approveStory(storyId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: story, error } = await supabase
      .from('success_stories')
      .update({
        moderation_status: 'approved',
        moderated_by: user.id,
        moderated_at: new Date().toISOString()
      })
      .eq('id', storyId)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Story approved:', storyId);
    return story;
  } catch (error) {
    console.error('Error approving story:', error);
    throw error;
  }
}

/**
 * Reject a story (admin only)
 * @param {string} storyId - The story ID
 * @param {string} notes - Rejection notes
 * @returns {Promise<Object>} The updated story
 */
export async function rejectStory(storyId, notes = '') {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: story, error } = await supabase
      .from('success_stories')
      .update({
        moderation_status: 'rejected',
        moderation_notes: notes,
        moderated_by: user.id,
        moderated_at: new Date().toISOString()
      })
      .eq('id', storyId)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Story rejected:', storyId);
    return story;
  } catch (error) {
    console.error('Error rejecting story:', error);
    throw error;
  }
}

/**
 * Feature a story (admin only)
 * @param {string} storyId - The story ID
 * @param {boolean} featured - Whether to feature or unfeature
 * @returns {Promise<Object>} The updated story
 */
export async function featureStory(storyId, featured = true) {
  try {
    const { data: story, error } = await supabase
      .from('success_stories')
      .update({ is_featured: featured })
      .eq('id', storyId)
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ Story ${featured ? 'featured' : 'unfeatured'}:`, storyId);
    return story;
  } catch (error) {
    console.error('Error featuring story:', error);
    throw error;
  }
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get story statistics
 * @returns {Promise<Object>} Statistics object
 */
export async function getStoryStats() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: stories, error } = await supabase
      .from('success_stories')
      .select('*')
      .eq('user_id', user.id);

    if (error) throw error;

    return {
      total: stories.length,
      approved: stories.filter(s => s.moderation_status === 'approved').length,
      pending: stories.filter(s => s.moderation_status === 'pending').length,
      rejected: stories.filter(s => s.moderation_status === 'rejected').length,
      totalLikes: stories.reduce((sum, s) => sum + (s.likes_count || 0), 0),
      totalViews: stories.reduce((sum, s) => sum + (s.views_count || 0), 0)
    };
  } catch (error) {
    console.error('Error fetching story stats:', error);
    throw error;
  }
}

