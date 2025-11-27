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
    // Check if request already exists in friend_requests
    const { data: existing, error: checkError } = await supabase
      .from('friend_requests')
      .select('id, status')
      .or(`and(sender_id.eq.${fromUserId},receiver_id.eq.${toUserId}),and(sender_id.eq.${toUserId},receiver_id.eq.${fromUserId})`)
      .single();

    if (existing) {
      if (existing.status === 'pending') {
        throw new Error('A friend request already exists');
      } else if (existing.status === 'accepted') {
        throw new Error('You are already friends');
      }
    }

    // Create new friend request
    const { data, error } = await supabase
      .from('friend_requests')
      .insert({
        sender_id: fromUserId,
        receiver_id: toUserId,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error sending friend request:', error);
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
      .from('friend_requests')
      .delete()
      .eq('id', requestId)
      .eq('sender_id', userId)
      .eq('status', 'pending');

    if (error) throw error;
  } catch (error) {
    console.error('Error cancelling friend request:', error);
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
      .from('friend_requests')
      .select('*')
      .eq('sender_id', userId)
      .eq('status', 'pending');

    if (error) throw error;

    // Get user IDs
    const userIds = data?.map(req => req.receiver_id) || [];
    
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
      to_user: usersMap[req.receiver_id] || { id: req.receiver_id, email: 'Unknown' }
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
      .from('friend_requests')
      .select('*')
      .eq('receiver_id', userId)
      .eq('status', 'pending');

    if (error) throw error;

    // Get user IDs
    const userIds = data?.map(req => req.sender_id) || [];
    
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
      from_user: usersMap[req.sender_id] || { id: req.sender_id, email: 'Unknown' }
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
      .from('friend_requests')
      .update({
        status: 'accepted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .eq('receiver_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error accepting friend request:', error);
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
      .from('friend_requests')
      .update({
        status: 'rejected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .eq('receiver_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    throw new Error(handleSupabaseError(error));
  }
};

/**
 * Get accepted buddies for current user (same as friends)
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of buddies/friends
 */
export const getMyBuddies = async (userId) => {
  try {
    console.log('👥 Fetching buddies (friends) for user:', userId);
    
    // Fetch from friend_requests table (not buddy_requests)
    // Buddies = Friends in the platform
    const { data, error } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('status', 'accepted')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

    if (error) throw error;

    console.log('✅ Found friend requests:', data);

    // Get unique user IDs (friend_requests uses sender_id and receiver_id)
    const userIds = new Set();
    data?.forEach(request => {
      userIds.add(request.sender_id);
      userIds.add(request.receiver_id);
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
    // friend_requests uses sender_id and receiver_id (not from_user_id/to_user_id)
    const buddies = (data || []).map(request => {
      const isSender = request.sender_id === userId;
      const otherUserId = isSender ? request.receiver_id : request.sender_id;
      const buddy = usersMap[otherUserId] || { id: otherUserId, email: 'Unknown' };
      
      console.log('🎴 Processing buddy/friend:', { 
        requestId: request.id, 
        isSender, 
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

