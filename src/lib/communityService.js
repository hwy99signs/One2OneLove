import { supabase } from './supabase';

/**
 * Community Service
 * Handles all operations for communities, posts, comments, likes, and shares
 */

// ============================================================================
// COMMUNITY CRUD OPERATIONS
// ============================================================================

/**
 * Get all public communities or communities user has joined
 * @param {string} orderBy - Field to order by (e.g., '-created_at')
 * @param {string} category - Filter by category (optional)
 * @param {string} searchQuery - Search in name/description (optional)
 * @returns {Promise<Array>} Array of communities
 */
export async function getCommunities(orderBy = '-created_at', category = null, searchQuery = null) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Parse orderBy
    const isDescending = orderBy.startsWith('-');
    const field = isDescending ? orderBy.substring(1) : orderBy;
    const ascending = !isDescending;

    // Build query
    let query = supabase
      .from('communities')
      .select('*')
      .order(field, { ascending });

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }

    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    const { data: communities, error } = await query;

    if (error) throw error;

    // Get user's membership status for each community
    if (user && communities.length > 0) {
      const communityIds = communities.map(c => c.id);
      const { data: memberships } = await supabase
        .from('community_members')
        .select('community_id, status, role')
        .eq('user_id', user.id)
        .in('community_id', communityIds);

      const membershipMap = new Map(
        memberships?.map(m => [m.community_id, { status: m.status, role: m.role }]) || []
      );

      return communities.map(community => ({
        ...community,
        userMembership: membershipMap.get(community.id) || null,
        isMember: membershipMap.has(community.id) && membershipMap.get(community.id).status === 'active',
        isCreator: community.creator_id === user.id
      }));
    }

    return communities.map(community => ({
      ...community,
      userMembership: null,
      isMember: false,
      isCreator: false
    }));
  } catch (error) {
    console.error('Error fetching communities:', error);
    throw error;
  }
}

/**
 * Get a single community by ID
 * @param {string} communityId - The community ID
 * @returns {Promise<Object>} The community with membership info
 */
export async function getCommunityById(communityId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const { data: community, error } = await supabase
      .from('communities')
      .select('*')
      .eq('id', communityId)
      .single();

    if (error) throw error;

    // Get user's membership
    if (user) {
      const { data: membership } = await supabase
        .from('community_members')
        .select('*')
        .eq('community_id', communityId)
        .eq('user_id', user.id)
        .single();

      return {
        ...community,
        userMembership: membership || null,
        isMember: membership?.status === 'active',
        isCreator: community.creator_id === user.id
      };
    }

    return {
      ...community,
      userMembership: null,
      isMember: false,
      isCreator: false
    };
  } catch (error) {
    console.error('Error fetching community:', error);
    throw error;
  }
}

/**
 * Create a new community
 * @param {Object} communityData - The community data
 * @returns {Promise<Object>} The created community
 */
export async function createCommunity(communityData) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const newCommunity = {
      creator_id: user.id,
      name: communityData.name,
      description: communityData.description || null,
      icon: communityData.icon || '💬',
      category: communityData.category || 'general',
      is_public: communityData.is_public !== false,
      requires_approval: communityData.requires_approval || false,
      allow_member_posts: communityData.allow_member_posts !== false,
    };

    const { data: community, error } = await supabase
      .from('communities')
      .insert(newCommunity)
      .select()
      .single();

    if (error) throw error;

    // Auto-join creator as admin
    await joinCommunity(community.id, true);

    console.log('✅ Community created:', community.id);
    return community;
  } catch (error) {
    console.error('Error creating community:', error);
    throw error;
  }
}

/**
 * Update a community
 * @param {string} communityId - The community ID
 * @param {Object} updates - The fields to update
 * @returns {Promise<Object>} The updated community
 */
export async function updateCommunity(communityId, updates) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { creator_id, id, created_at, member_count, post_count, ...allowedUpdates } = updates;

    const { data: community, error } = await supabase
      .from('communities')
      .update(allowedUpdates)
      .eq('id', communityId)
      .eq('creator_id', user.id)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Community updated:', community.id);
    return community;
  } catch (error) {
    console.error('Error updating community:', error);
    throw error;
  }
}

/**
 * Delete a community
 * @param {string} communityId - The community ID
 * @returns {Promise<void>}
 */
export async function deleteCommunity(communityId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('communities')
      .delete()
      .eq('id', communityId)
      .eq('creator_id', user.id);

    if (error) throw error;

    console.log('✅ Community deleted:', communityId);
  } catch (error) {
    console.error('Error deleting community:', error);
    throw error;
  }
}

// ============================================================================
// COMMUNITY MEMBERSHIP OPERATIONS
// ============================================================================

/**
 * Join a community
 * @param {string} communityId - The community ID
 * @param {boolean} asAdmin - Join as admin (for creator)
 * @returns {Promise<Object>} The membership record
 */
export async function joinCommunity(communityId, asAdmin = false) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: community } = await supabase
      .from('communities')
      .select('requires_approval')
      .eq('id', communityId)
      .single();

    const status = community?.requires_approval && !asAdmin ? 'pending' : 'active';
    const role = asAdmin ? 'admin' : 'member';

    const { data: membership, error } = await supabase
      .from('community_members')
      .insert({
        community_id: communityId,
        user_id: user.id,
        role,
        status
      })
      .select()
      .single();

    if (error) {
      // If already a member, update status
      if (error.code === '23505') {
        const { data: existing } = await supabase
          .from('community_members')
          .update({ status: 'active' })
          .eq('community_id', communityId)
          .eq('user_id', user.id)
          .select()
          .single();
        return existing;
      }
      throw error;
    }

    console.log('✅ Joined community:', communityId);
    return membership;
  } catch (error) {
    console.error('Error joining community:', error);
    throw error;
  }
}

/**
 * Leave a community
 * @param {string} communityId - The community ID
 * @returns {Promise<void>}
 */
export async function leaveCommunity(communityId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('community_members')
      .delete()
      .eq('community_id', communityId)
      .eq('user_id', user.id);

    if (error) throw error;

    console.log('✅ Left community:', communityId);
  } catch (error) {
    console.error('Error leaving community:', error);
    throw error;
  }
}

/**
 * Get user's communities
 * @returns {Promise<Array>} Array of communities user has joined
 */
export async function getMyCommunities() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: memberships, error } = await supabase
      .from('community_members')
      .select('*, communities(*)')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (error) throw error;

    return memberships.map(m => ({
      ...m.communities,
      membership: {
        role: m.role,
        status: m.status,
        joined_at: m.joined_at
      }
    }));
  } catch (error) {
    console.error('Error fetching my communities:', error);
    throw error;
  }
}

// ============================================================================
// POST CRUD OPERATIONS
// ============================================================================

/**
 * Get posts in a community
 * @param {string} communityId - The community ID
 * @param {string} orderBy - Field to order by (e.g., '-created_at')
 * @param {string} searchQuery - Search in title/content (optional)
 * @returns {Promise<Array>} Array of posts
 */
export async function getCommunityPosts(communityId, orderBy = '-created_at', searchQuery = null) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const isDescending = orderBy.startsWith('-');
    const field = isDescending ? orderBy.substring(1) : orderBy;
    const ascending = !isDescending;

    let query = supabase
      .from('community_posts')
      .select('*')
      .eq('community_id', communityId)
      .eq('moderation_status', 'approved')
      .order('is_pinned', { ascending: false }) // Pinned posts first
      .order(field, { ascending });

    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
    }

    const { data: posts, error } = await query;

    if (error) throw error;

    // Get user's likes for posts
    if (user && posts.length > 0) {
      const postIds = posts.map(p => p.id);
      const { data: userLikes } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds);

      const likedPostIds = new Set(userLikes?.map(l => l.post_id) || []);

      return posts.map(post => ({
        ...post,
        userHasLiked: likedPostIds.has(post.id),
        created_date: post.created_at,
        replies_count: post.comments_count
      }));
    }

    return posts.map(post => ({
      ...post,
      userHasLiked: false,
      created_date: post.created_at,
      replies_count: post.comments_count
    }));
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
}

/**
 * Create a post in a community
 * @param {string} communityId - The community ID
 * @param {Object} postData - The post data
 * @returns {Promise<Object>} The created post
 */
export async function createPost(communityId, postData) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get user's name if not anonymous
    let authorName = null;
    if (!postData.is_anonymous) {
      const { data: userProfile } = await supabase
        .from('users')
        .select('name')
        .eq('id', user.id)
        .single();
      
      authorName = userProfile?.name || user.email?.split('@')[0] || 'User';
    }

    const newPost = {
      community_id: communityId,
      author_id: user.id,
      title: postData.title,
      content: postData.content,
      author_name: authorName,
      is_anonymous: postData.is_anonymous || false,
      tags: postData.tags || [],
      moderation_status: postData.moderation_status || 'approved'
    };

    const { data: post, error } = await supabase
      .from('community_posts')
      .insert(newPost)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Post created:', post.id);
    return {
      ...post,
      created_date: post.created_at
    };
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
}

/**
 * Update a post
 * @param {string} postId - The post ID
 * @param {Object} updates - The fields to update
 * @returns {Promise<Object>} The updated post
 */
export async function updatePost(postId, updates) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { author_id, id, created_at, community_id, ...allowedUpdates } = updates;

    const { data: post, error } = await supabase
      .from('community_posts')
      .update(allowedUpdates)
      .eq('id', postId)
      .eq('author_id', user.id)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Post updated:', post.id);
    return {
      ...post,
      created_date: post.created_at
    };
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
}

/**
 * Delete a post
 * @param {string} postId - The post ID
 * @returns {Promise<void>}
 */
export async function deletePost(postId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('community_posts')
      .delete()
      .eq('id', postId)
      .eq('author_id', user.id);

    if (error) throw error;

    console.log('✅ Post deleted:', postId);
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
}

// ============================================================================
// POST INTERACTIONS (Likes & Shares)
// ============================================================================

/**
 * Like a post
 * @param {string} postId - The post ID
 * @returns {Promise<void>}
 */
export async function likePost(postId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('post_likes')
      .insert({
        post_id: postId,
        user_id: user.id
      });

    if (error && error.code !== '23505') throw error; // Ignore duplicate likes

    console.log('✅ Post liked:', postId);
  } catch (error) {
    console.error('Error liking post:', error);
    throw error;
  }
}

/**
 * Unlike a post
 * @param {string} postId - The post ID
 * @returns {Promise<void>}
 */
export async function unlikePost(postId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.id);

    if (error) throw error;

    console.log('✅ Post unliked:', postId);
  } catch (error) {
    console.error('Error unliking post:', error);
    throw error;
  }
}

/**
 * Toggle like on a post
 * @param {string} postId - The post ID
 * @param {boolean} isLiked - Current like status
 * @returns {Promise<boolean>} New like status
 */
export async function togglePostLike(postId, isLiked) {
  try {
    if (isLiked) {
      await unlikePost(postId);
      return false;
    } else {
      await likePost(postId);
      return true;
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    throw error;
  }
}

/**
 * Share a post
 * @param {string} postId - The post ID
 * @param {string} sharedVia - How it was shared ('internal', 'facebook', 'twitter', etc.)
 * @param {string} sharedToCommunityId - If shared to another community (optional)
 * @returns {Promise<Object>} The share record
 */
export async function sharePost(postId, sharedVia = 'internal', sharedToCommunityId = null) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: share, error } = await supabase
      .from('post_shares')
      .insert({
        post_id: postId,
        user_id: user.id,
        shared_via: sharedVia,
        shared_to_community_id: sharedToCommunityId
      })
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Post shared:', postId);
    return share;
  } catch (error) {
    console.error('Error sharing post:', error);
    throw error;
  }
}

// ============================================================================
// COMMENT OPERATIONS
// ============================================================================

/**
 * Get comments for a post
 * @param {string} postId - The post ID
 * @returns {Promise<Array>} Array of comments
 */
export async function getPostComments(postId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const { data: comments, error } = await supabase
      .from('post_comments')
      .select('*')
      .eq('post_id', postId)
      .eq('moderation_status', 'approved')
      .is('parent_comment_id', null) // Top-level comments only
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Get user's likes for comments
    if (user && comments.length > 0) {
      const commentIds = comments.map(c => c.id);
      const { data: userLikes } = await supabase
        .from('comment_likes')
        .select('comment_id')
        .eq('user_id', user.id)
        .in('comment_id', commentIds);

      const likedCommentIds = new Set(userLikes?.map(l => l.comment_id) || []);

      // Get replies for each comment
      const commentsWithReplies = await Promise.all(
        comments.map(async (comment) => {
          const { data: replies } = await supabase
            .from('post_comments')
            .select('*')
            .eq('parent_comment_id', comment.id)
            .eq('moderation_status', 'approved')
            .order('created_at', { ascending: true });

          return {
            ...comment,
            userHasLiked: likedCommentIds.has(comment.id),
            replies: replies || [],
            created_date: comment.created_at
          };
        })
      );

      return commentsWithReplies;
    }

    return comments.map(comment => ({
      ...comment,
      userHasLiked: false,
      replies: [],
      created_date: comment.created_at
    }));
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
}

/**
 * Create a comment on a post
 * @param {string} postId - The post ID
 * @param {Object} commentData - The comment data
 * @param {string} parentCommentId - Parent comment ID for replies (optional)
 * @returns {Promise<Object>} The created comment
 */
export async function createComment(postId, commentData, parentCommentId = null) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get user's name if not anonymous
    let authorName = null;
    if (!commentData.is_anonymous) {
      const { data: userProfile } = await supabase
        .from('users')
        .select('name')
        .eq('id', user.id)
        .single();
      
      authorName = userProfile?.name || user.email?.split('@')[0] || 'User';
    }

    const newComment = {
      post_id: postId,
      author_id: user.id,
      parent_comment_id: parentCommentId,
      content: commentData.content,
      author_name: authorName,
      is_anonymous: commentData.is_anonymous || false,
      moderation_status: commentData.moderation_status || 'approved'
    };

    const { data: comment, error } = await supabase
      .from('post_comments')
      .insert(newComment)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Comment created:', comment.id);
    return {
      ...comment,
      created_date: comment.created_at,
      replies: []
    };
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error;
  }
}

/**
 * Update a comment
 * @param {string} commentId - The comment ID
 * @param {Object} updates - The fields to update
 * @returns {Promise<Object>} The updated comment
 */
export async function updateComment(commentId, updates) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { author_id, id, created_at, post_id, parent_comment_id, ...allowedUpdates } = updates;

    const { data: comment, error } = await supabase
      .from('post_comments')
      .update(allowedUpdates)
      .eq('id', commentId)
      .eq('author_id', user.id)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Comment updated:', comment.id);
    return {
      ...comment,
      created_date: comment.created_at
    };
  } catch (error) {
    console.error('Error updating comment:', error);
    throw error;
  }
}

/**
 * Delete a comment
 * @param {string} commentId - The comment ID
 * @returns {Promise<void>}
 */
export async function deleteComment(commentId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('post_comments')
      .delete()
      .eq('id', commentId)
      .eq('author_id', user.id);

    if (error) throw error;

    console.log('✅ Comment deleted:', commentId);
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
}

/**
 * Like a comment
 * @param {string} commentId - The comment ID
 * @returns {Promise<void>}
 */
export async function likeComment(commentId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('comment_likes')
      .insert({
        comment_id: commentId,
        user_id: user.id
      });

    if (error && error.code !== '23505') throw error;

    console.log('✅ Comment liked:', commentId);
  } catch (error) {
    console.error('Error liking comment:', error);
    throw error;
  }
}

/**
 * Unlike a comment
 * @param {string} commentId - The comment ID
 * @returns {Promise<void>}
 */
export async function unlikeComment(commentId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('comment_likes')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', user.id);

    if (error) throw error;

    console.log('✅ Comment unliked:', commentId);
  } catch (error) {
    console.error('Error unliking comment:', error);
    throw error;
  }
}

/**
 * Toggle like on a comment
 * @param {string} commentId - The comment ID
 * @param {boolean} isLiked - Current like status
 * @returns {Promise<boolean>} New like status
 */
export async function toggleCommentLike(commentId, isLiked) {
  try {
    if (isLiked) {
      await unlikeComment(commentId);
      return false;
    } else {
      await likeComment(commentId);
      return true;
    }
  } catch (error) {
    console.error('Error toggling comment like:', error);
    throw error;
  }
}

