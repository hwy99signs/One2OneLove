import { supabase, handleSupabaseError } from './supabase';

/**
 * Buddy/Friend System Service
 * Handles finding users and managing buddy requests.
 *
 * Privacy rule: member discovery reads only from public.member_directory, a
 * server-side projection that intentionally excludes email, partner_email, and
 * other account-private fields.
 */

const PUBLIC_MEMBER_FIELDS = [
  'id',
  'name',
  'avatar_url',
  'bio',
  'relationship_status',
  'user_type',
  'location',
  'interests',
  'created_at',
].join(',');

const BASIC_MEMBER_FIELDS = 'id,name,avatar_url,bio';

export const getAllUsers = async (currentUserId, options = {}) => {
  try {
    let query = supabase
      .from('member_directory')
      .select(PUBLIC_MEMBER_FIELDS)
      .neq('id', currentUserId);

    if (options.userType) query = query.eq('user_type', options.userType);

    const allowedSortFields = new Set(['created_at', 'name']);
    const sortBy = allowedSortFields.has(options.sortBy) ? options.sortBy : 'created_at';
    const sortOrder = options.sortOrder === 'asc' ? 'asc' : 'desc';
    const limit = Math.min(Math.max(Number(options.limit) || 100, 1), 100);

    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .limit(limit);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching buddy directory:', error);
    throw new Error(handleSupabaseError(error));
  }
};

export const searchUsers = async (currentUserId, searchQuery) => {
  try {
    const term = String(searchQuery || '').trim().slice(0, 80);
    if (!term) return getAllUsers(currentUserId, { limit: 100, sortBy: 'name', sortOrder: 'asc' });

    const { data, error } = await supabase
      .from('member_directory')
      .select(PUBLIC_MEMBER_FIELDS)
      .neq('id', currentUserId)
      .eq('user_type', 'regular')
      .or(`name.ilike.%${term}%,location.ilike.%${term}%,bio.ilike.%${term}%,relationship_status.ilike.%${term}%`)
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
      .from('member_directory')
      .select(PUBLIC_MEMBER_FIELDS)
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
      .or(`and(from_user_id.eq.${fromUserId},to_user_id.eq.${toUserId}),and(from_user_id.eq.${toUserId},to_user_id.eq.${fromUserId})`)
      .maybeSingle();

    if (existing?.status === 'pending') throw new Error('A buddy request already exists');
    if (existing?.status === 'accepted') throw new Error('You are already buddies');

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

export const getSentBuddyRequests = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('buddy_requests')
      .select('*')
      .eq('from_user_id', userId)
      .eq('status', 'pending');

    if (error) throw error;
    const userIds = data?.map((req) => req.to_user_id) || [];
    if (!userIds.length) return [];

    const { data: users, error: usersError } = await supabase
      .from('member_directory')
      .select(BASIC_MEMBER_FIELDS)
      .in('id', userIds);

    if (usersError) throw usersError;
    const usersMap = Object.fromEntries((users || []).map((u) => [u.id, u]));

    return (data || []).map((req) => ({
      ...req,
      to_user: usersMap[req.to_user_id] || { id: req.to_user_id, name: 'Member' },
    }));
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
    const userIds = data?.map((req) => req.from_user_id) || [];
    if (!userIds.length) return [];

    const { data: users, error: usersError } = await supabase
      .from('member_directory')
      .select(BASIC_MEMBER_FIELDS)
      .in('id', userIds);

    if (usersError) throw usersError;
    const usersMap = Object.fromEntries((users || []).map((u) => [u.id, u]));

    return (data || []).map((req) => ({
      ...req,
      from_user: usersMap[req.from_user_id] || { id: req.from_user_id, name: 'Member' },
    }));
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

    const otherUserIds = [...new Set((data || []).map((request) =>
      request.from_user_id === userId ? request.to_user_id : request.from_user_id
    ))];

    let usersMap = {};
    if (otherUserIds.length) {
      const { data: users, error: usersError } = await supabase
        .from('member_directory')
        .select('id,name,avatar_url,bio,relationship_status,location')
        .in('id', otherUserIds);

      if (usersError) throw usersError;
      usersMap = Object.fromEntries((users || []).map((u) => [u.id, u]));
    }

    return (data || []).map((request) => {
      const otherUserId = request.from_user_id === userId ? request.to_user_id : request.from_user_id;
      const buddy = usersMap[otherUserId] || { id: otherUserId, name: 'Member' };
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
