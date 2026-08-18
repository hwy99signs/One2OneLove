import { supabase, handleSupabaseError } from './supabase';

/**
 * Buddy/Friend System Service
 * Handles member discovery and buddy requests.
 *
 * Relaunch privacy rule: ordinary member discovery is intentionally minimal. Other
 * authenticated members receive only name, optional avatar, short bio and member-since
 * date. Account email, location, relationship status, partner data, interests, role,
 * verification and billing data are not requested here.
 *
 * Mutation rule: the acting user is always derived from Supabase Auth, never trusted
 * from a caller-supplied user ID.
 */

const PUBLIC_MEMBER_FIELDS = 'id,name,avatar_url,bio,created_at';
const BASIC_MEMBER_FIELDS = 'id,name,avatar_url,bio';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const requireAuthenticatedUser = async (expectedUserId = null) => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('User not authenticated');
  if (expectedUserId && expectedUserId !== user.id) {
    throw new Error('You may manage only your own buddy requests.');
  }
  return user;
};

const requireMemberId = (value, label = 'member') => {
  const id = String(value || '').trim();
  if (!UUID_PATTERN.test(id)) throw new Error(`Invalid ${label} ID.`);
  return id;
};

export const getAllUsers = async (currentUserId, options = {}) => {
  try {
    const user = await requireAuthenticatedUser(currentUserId || null);
    const query = supabase
      .from('member_directory')
      .select(PUBLIC_MEMBER_FIELDS)
      .neq('id', user.id);

    const allowedSortFields = new Set(['created_at', 'name']);
    const sortBy = allowedSortFields.has(options.sortBy) ? options.sortBy : 'created_at';
    const sortOrder = options.sortOrder === 'asc' ? 'asc' : 'desc';
    const limit = Math.min(Math.max(Number(options.limit) || 100, 1), 100);

    const { data, error } = await query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching buddy directory:', error);
    throw new Error(handleSupabaseError(error));
  }
};

export const searchUsers = async (currentUserId, searchQuery) => {
  try {
    const user = await requireAuthenticatedUser(currentUserId || null);
    const term = String(searchQuery || '').trim().slice(0, 80);
    if (!term) return getAllUsers(user.id, { limit: 100, sortBy: 'name', sortOrder: 'asc' });

    // Escape PostgREST OR-filter wildcard/control characters so member search is text,
    // not a caller-controlled filter expression.
    const safeTerm = term.replace(/[,%()]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!safeTerm) return [];

    const { data, error } = await supabase
      .from('member_directory')
      .select(PUBLIC_MEMBER_FIELDS)
      .neq('id', user.id)
      .or(`name.ilike.%${safeTerm}%,bio.ilike.%${safeTerm}%`)
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
    await requireAuthenticatedUser();
    const memberId = requireMemberId(userId);

    const { data, error } = await supabase
      .from('member_directory')
      .select(PUBLIC_MEMBER_FIELDS)
      .eq('id', memberId)
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
    const user = await requireAuthenticatedUser(fromUserId || null);
    const targetId = requireMemberId(toUserId, 'target member');
    if (targetId === user.id) throw new Error('You cannot send a buddy request to yourself.');

    const { data: existing, error: existingError } = await supabase
      .from('buddy_requests')
      .select('id, status, from_user_id, to_user_id')
      .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${targetId}),and(from_user_id.eq.${targetId},to_user_id.eq.${user.id})`)
      .limit(1)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existing?.status === 'pending') throw new Error('A buddy request already exists');
    if (existing?.status === 'accepted') throw new Error('You are already buddies');

    const { data, error } = await supabase
      .from('buddy_requests')
      .insert({
        from_user_id: user.id,
        to_user_id: targetId,
        status: 'pending',
      })
      .select('id, status, from_user_id, to_user_id, created_at, updated_at')
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
    const user = await requireAuthenticatedUser(userId || null);
    const id = requireMemberId(requestId, 'request');

    const { error } = await supabase
      .from('buddy_requests')
      .delete()
      .eq('id', id)
      .eq('from_user_id', user.id)
      .eq('status', 'pending');

    if (error) throw error;
  } catch (error) {
    console.error('Error cancelling buddy request:', error);
    throw new Error(handleSupabaseError(error));
  }
};

export const getSentBuddyRequests = async (userId) => {
  try {
    const user = await requireAuthenticatedUser(userId || null);
    const { data, error } = await supabase
      .from('buddy_requests')
      .select('id, status, from_user_id, to_user_id, created_at, updated_at')
      .eq('from_user_id', user.id)
      .eq('status', 'pending');

    if (error) throw error;
    const userIds = data?.map((req) => req.to_user_id) || [];
    if (!userIds.length) return [];

    const { data: users, error: usersError } = await supabase
      .from('member_directory')
      .select(BASIC_MEMBER_FIELDS)
      .in('id', userIds);

    if (usersError) throw usersError;
    const usersMap = Object.fromEntries((users || []).map((member) => [member.id, member]));

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
    const user = await requireAuthenticatedUser(userId || null);
    const { data, error } = await supabase
      .from('buddy_requests')
      .select('id, status, from_user_id, to_user_id, created_at, updated_at')
      .eq('to_user_id', user.id)
      .eq('status', 'pending');

    if (error) throw error;
    const userIds = data?.map((req) => req.from_user_id) || [];
    if (!userIds.length) return [];

    const { data: users, error: usersError } = await supabase
      .from('member_directory')
      .select(BASIC_MEMBER_FIELDS)
      .in('id', userIds);

    if (usersError) throw usersError;
    const usersMap = Object.fromEntries((users || []).map((member) => [member.id, member]));

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
    const user = await requireAuthenticatedUser(userId || null);
    const id = requireMemberId(requestId, 'request');

    const { data, error } = await supabase
      .from('buddy_requests')
      .update({ status: 'accepted' })
      .eq('id', id)
      .eq('to_user_id', user.id)
      .eq('status', 'pending')
      .select('id, status, from_user_id, to_user_id, created_at, updated_at')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error accepting request:', error);
    throw new Error(handleSupabaseError(error));
  }
};

export const rejectBuddyRequest = async (requestId, userId) => {
  try {
    const user = await requireAuthenticatedUser(userId || null);
    const id = requireMemberId(requestId, 'request');

    const { error } = await supabase
      .from('buddy_requests')
      .update({ status: 'rejected' })
      .eq('id', id)
      .eq('to_user_id', user.id)
      .eq('status', 'pending');

    if (error) throw error;
  } catch (error) {
    console.error('Error rejecting request:', error);
    throw new Error(handleSupabaseError(error));
  }
};

export const getMyBuddies = async (userId) => {
  try {
    const user = await requireAuthenticatedUser(userId || null);
    const { data, error } = await supabase
      .from('buddy_requests')
      .select('id, status, from_user_id, to_user_id, created_at, updated_at')
      .eq('status', 'accepted')
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`);

    if (error) throw error;

    const otherUserIds = [...new Set((data || []).map((request) =>
      request.from_user_id === user.id ? request.to_user_id : request.from_user_id
    ))];

    let usersMap = {};
    if (otherUserIds.length) {
      const { data: users, error: usersError } = await supabase
        .from('member_directory')
        .select(BASIC_MEMBER_FIELDS)
        .in('id', otherUserIds);

      if (usersError) throw usersError;
      usersMap = Object.fromEntries((users || []).map((member) => [member.id, member]));
    }

    return (data || []).map((request) => {
      const otherUserId = request.from_user_id === user.id ? request.to_user_id : request.from_user_id;
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