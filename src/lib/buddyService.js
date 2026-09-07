import { supabase, handleSupabaseError } from './supabase';

/**
 * Buddy/Friend System Service
 *
 * Public member discovery now reads from the Neon-safe user_public_profiles
 * view. Private profile, subscription and Stripe columns remain protected in
 * public.users by RLS.
 */

const PUBLIC_PROFILE_FIELDS =
  'id, name, email, avatar_url, bio, relationship_status, user_type, location, interests, love_language, created_at';

export const getAllUsers = async (currentUserId, options = {}) => {
  try {
    let query = supabase
      .from('user_public_profiles')
      .select(PUBLIC_PROFILE_FIELDS)
      .neq('id', currentUserId);

    if (options.userType) {
      query = query.eq('user_type', options.userType);
    }

    const sortBy = options.sortBy || 'created_at';
    const sortOrder = options.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    query = query.limit(options.limit || 100);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    throw new Error(handleSupabaseError(error));
  }
};

export const searchUsers = async (currentUserId, searchQuery) => {
  try {
    const { data, error } = await supabase
      .from('user_public_profiles')
      .select(PUBLIC_PROFILE_FIELDS)
      .neq('id', currentUserId)
      .eq('user_type', 'regular')
      .or(
        `name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%,bio.ilike.%${searchQuery}%`,
      )
      .order('name', { ascending: true })
      .limit(100);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching users:', error);
    throw new Error(handleSupabaseError(error));
  }
};

export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_public_profiles')
      .select(PUBLIC_PROFILE_FIELDS)
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw new Error(handleSupabaseError(error));
  }
};

export const sendBuddyRequest = async (fromUserId, toUserId) => {
  try {
    const { data: existing } = await supabase
      .from('buddy_requests')
      .select('id, status')
      .or(
        `and(from_user_id.eq.${fromUserId},to_user_id.eq.${toUserId}),and(from_user_id.eq.${toUserId},to_user_id.eq.${fromUserId})`,
      )
      .maybeSingle();

    if (existing?.status === 'pending') {
      throw new Error('A buddy request already exists');
    }
    if (existing?.status === 'accepted') {
      throw new Error('You are already buddies');
    }

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

const hydrateRequests = async (requests, userIdField, resultField) => {
  const ids = requests?.map((request) => request[userIdField]).filter(Boolean) || [];
  if (!ids.length) return [];

  const { data: users, error } = await supabase
    .from('user_public_profiles')
    .select(PUBLIC_PROFILE_FIELDS)
    .in('id', ids);

  if (error) throw error;
  const usersMap = Object.fromEntries((users || []).map((user) => [user.id, user]));

  return requests.map((request) => ({
    ...request,
    [resultField]: usersMap[request[userIdField]] || {
      id: request[userIdField],
      email: 'Unknown',
    },
  }));
};

export const getSentBuddyRequests = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('buddy_requests')
      .select('*')
      .eq('from_user_id', userId)
      .eq('status', 'pending');
    if (error) throw error;
    return hydrateRequests(data || [], 'to_user_id', 'to_user');
  } catch (error) {
    console.error('Error fetching sent requests:', error);
    throw new Error(handleSupabaseError(error));
  }
};

export const getReceivedBuddyRequests = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('buddy_requests')
      .select('*')
      .eq('to_user_id', userId)
      .eq('status', 'pending');
    if (error) throw error;
    return hydrateRequests(data || [], 'from_user_id', 'from_user');
  } catch (error) {
    console.error('Error fetching received requests:', error);
    throw new Error(handleSupabaseError(error));
  }
};

export const acceptBuddyRequest = async (requestId, userId) => {
  try {
    const { data, error } = await supabase
      .from('buddy_requests')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
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

export const rejectBuddyRequest = async (requestId, userId) => {
  try {
    const { error } = await supabase
      .from('buddy_requests')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .eq('to_user_id', userId);
    if (error) throw error;
  } catch (error) {
    console.error('Error rejecting buddy request:', error);
    throw new Error(handleSupabaseError(error));
  }
};

export const getMyBuddies = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('buddy_requests')
      .select('*')
      .eq('status', 'accepted')
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`);
    if (error) throw error;

    const otherIds = Array.from(
      new Set(
        (data || []).map((request) =>
          request.from_user_id === userId ? request.to_user_id : request.from_user_id,
        ),
      ),
    );

    const { data: users, error: usersError } = otherIds.length
      ? await supabase
          .from('user_public_profiles')
          .select(PUBLIC_PROFILE_FIELDS)
          .in('id', otherIds)
      : { data: [], error: null };

    if (usersError) throw usersError;
    const usersMap = Object.fromEntries((users || []).map((user) => [user.id, user]));

    return (data || []).map((request) => {
      const otherUserId =
        request.from_user_id === userId ? request.to_user_id : request.from_user_id;
      const buddy = usersMap[otherUserId] || { id: otherUserId, email: 'Unknown' };
      return {
        ...buddy,
        request_id: request.id,
        connected_since: request.updated_at || request.created_at,
        status: 'active',
      };
    });
  } catch (error) {
    console.error('Error fetching buddies:', error);
    throw new Error(handleSupabaseError(error));
  }
};
