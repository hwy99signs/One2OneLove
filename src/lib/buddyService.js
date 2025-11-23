import { supabase, handleSupabaseError } from './supabase';

/**
 * Buddy/Friend System Service
 * Handles finding users and managing buddy requests
 */

/**
 * Get all users for the buddy finder (excluding current user)
 * @param {string} currentUserId - The current user's ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of users
 */
export const getAllUsers = async (currentUserId, options = {}) => {
  try {
    console.log('🔍 getAllUsers called with userId:', currentUserId);
    
    // Select all user fields including optional location
    let query = supabase
      .from('users')
      .select('*')
      .neq('id', currentUserId); // Exclude current user

    // REMOVED STRICT user_type FILTER - show all users regardless of type
    // This ensures users show up even if user_type is NULL or not set
    if (options.userType) {
      console.log('Filtering by user_type:', options.userType);
      query = query.eq('user_type', options.userType);
    }
    // Note: If no userType specified, we show ALL users (no filter)

    // NO search filter applied in the query - we'll filter in the frontend
    // This is because OR with NULL values can cause issues

    // Apply sorting
    const sortBy = options.sortBy || 'created_at';
    const sortOrder = options.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Limit results (default to 100 to show more users)
    const limit = options.limit || 100;
    query = query.limit(limit);

    console.log('📡 Executing Supabase query...');
    const { data, error } = await query;

    if (error) {
      console.error('❌ Supabase query error:', error);
      throw error;
    }
    
    console.log('✅ Query successful! Returned users:', data?.length || 0);
    console.log('👥 Users data:', data);
    return data || [];
  } catch (error) {
    console.error('💥 Error fetching users:', error);
    throw new Error(handleSupabaseError(error));
  }
};

/**
 * Search users by query
 * @param {string} currentUserId - The current user's ID  
 * @param {string} searchQuery - Search query
 * @returns {Promise<Array>} Array of matching users
 */
export const searchUsers = async (currentUserId, searchQuery) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, avatar_url, bio, relationship_status, user_type, location, interests, partner_email, created_at')
      .neq('id', currentUserId)
      .eq('user_type', 'regular')
      .or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%,bio.ilike.%${searchQuery}%`)
      .order('name', { ascending: true })
      .limit(100);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching users:', error);
    throw new Error(handleSupabaseError(error));
  }
};

/**
 * Get user profile by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User profile
 */
export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw new Error(handleSupabaseError(error));
  }
};

/**
 * Send a buddy/friend request
 * @param {string} fromUserId - Sender's user ID
 * @param {string} toUserId - Recipient's user ID
 * @returns {Promise<Object>} Created request
 */
export const sendBuddyRequest = async (fromUserId, toUserId) => {
  try {
    // Check if request already exists
    const { data: existing, error: checkError } = await supabase
      .from('buddy_requests')
      .select('id, status')
      .or(`and(from_user_id.eq.${fromUserId},to_user_id.eq.${toUserId}),and(from_user_id.eq.${toUserId},to_user_id.eq.${fromUserId})`)
      .single();

    if (existing) {
      if (existing.status === 'pending') {
        throw new Error('A buddy request already exists');
      } else if (existing.status === 'accepted') {
        throw new Error('You are already buddies');
      }
    }

    // Create new request
    const { data, error } = await supabase
      .from('buddy_requests')
      .insert({
        from_user_id: fromUserId,
        to_user_id: toUserId,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error sending buddy request:', error);
    throw new Error(handleSupabaseError(error));
  }
};

/**
 * Cancel a buddy request
 * @param {string} requestId - Request ID
 * @param {string} userId - User ID (must be the sender)
 * @returns {Promise<void>}
 */
export const cancelBuddyRequest = async (requestId, userId) => {
  try {
    const { error } = await supabase
      .from('buddy_requests')
      .delete()
      .eq('id', requestId)
      .eq('from_user_id', userId)
      .eq('status', 'pending');

    if (error) throw error;
  } catch (error) {
    console.error('Error cancelling buddy request:', error);
    throw new Error(handleSupabaseError(error));
  }
};

/**
 * Get sent buddy requests for current user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of sent requests
 */
export const getSentBuddyRequests = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('buddy_requests')
      .select('*')
      .eq('from_user_id', userId)
      .eq('status', 'pending');

    if (error) throw error;

    // Get user IDs
    const userIds = data?.map(req => req.to_user_id) || [];
    
    if (userIds.length === 0) return [];

    // Fetch user data
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, avatar_url, bio')
      .in('id', userIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
    }

    // Create map
    const usersMap = {};
    users?.forEach(u => {
      usersMap[u.id] = u;
    });

    // Combine data
    const requests = data.map(req => ({
      ...req,
      to_user: usersMap[req.to_user_id] || { id: req.to_user_id, email: 'Unknown' }
    }));

    return requests;
  } catch (error) {
    console.error('Error fetching sent requests:', error);
    throw new Error(handleSupabaseError(error));
  }
};

/**
 * Get received buddy requests for current user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of received requests
 */
export const getReceivedBuddyRequests = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('buddy_requests')
      .select('*')
      .eq('to_user_id', userId)
      .eq('status', 'pending');

    if (error) throw error;

    // Get user IDs
    const userIds = data?.map(req => req.from_user_id) || [];
    
    if (userIds.length === 0) return [];

    // Fetch user data
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, avatar_url, bio')
      .in('id', userIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
    }

    // Create map
    const usersMap = {};
    users?.forEach(u => {
      usersMap[u.id] = u;
    });

    // Combine data
    const requests = data.map(req => ({
      ...req,
      from_user: usersMap[req.from_user_id] || { id: req.from_user_id, email: 'Unknown' }
    }));

    return requests;
  } catch (error) {
    console.error('Error fetching received requests:', error);
    throw new Error(handleSupabaseError(error));
  }
};

/**
 * Accept a buddy request
 * @param {string} requestId - Request ID
 * @param {string} userId - User ID (must be the recipient)
 * @returns {Promise<Object>} Updated request
 */
export const acceptBuddyRequest = async (requestId, userId) => {
  try {
    const { data, error } = await supabase
      .from('buddy_requests')
      .update({
        status: 'accepted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .eq('to_user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error accepting buddy request:', error);
    throw new Error(handleSupabaseError(error));
  }
};

/**
 * Reject a buddy request
 * @param {string} requestId - Request ID
 * @param {string} userId - User ID (must be the recipient)
 * @returns {Promise<void>}
 */
export const rejectBuddyRequest = async (requestId, userId) => {
  try {
    const { error} = await supabase
      .from('buddy_requests')
      .update({
        status: 'rejected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .eq('to_user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error rejecting buddy request:', error);
    throw new Error(handleSupabaseError(error));
  }
};

/**
 * Get accepted buddies for current user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of buddies
 */
export const getMyBuddies = async (userId) => {
  try {
    console.log('👥 Fetching buddies for user:', userId);
    
    // Fetch buddy requests without joins
    const { data, error } = await supabase
      .from('buddy_requests')
      .select('*')
      .eq('status', 'accepted')
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`);

    if (error) throw error;

    console.log('✅ Found buddy requests:', data);

    // Get unique user IDs
    const userIds = new Set();
    data?.forEach(request => {
      userIds.add(request.from_user_id);
      userIds.add(request.to_user_id);
    });

    // Fetch all user data in one query
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, avatar_url, bio, relationship_status, location')
      .in('id', Array.from(userIds));

    if (usersError) {
      console.error('Error fetching users:', usersError);
    }

    console.log('✅ Fetched user data:', users);

    // Create a map of users by ID
    const usersMap = {};
    users?.forEach(u => {
      usersMap[u.id] = u;
    });

    // Transform data to return the other user's info
    const buddies = (data || []).map(request => {
      const isFromUser = request.from_user_id === userId;
      const otherUserId = isFromUser ? request.to_user_id : request.from_user_id;
      const buddy = usersMap[otherUserId] || { id: otherUserId, email: 'Unknown' };
      
      console.log('🎴 Processing buddy:', { 
        requestId: request.id, 
        isFromUser, 
        otherUserId, 
        buddyName: buddy.name 
      });
      
      return {
        ...buddy,
        request_id: request.id,
        connected_since: request.updated_at || request.created_at,
        status: 'active',
      };
    });

    console.log('✅ Transformed buddies:', buddies);
    return buddies;
  } catch (error) {
    console.error('Error fetching buddies:', error);
    throw new Error(handleSupabaseError(error));
  }
};

