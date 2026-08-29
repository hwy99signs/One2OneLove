import { supabase, handleSupabaseError } from './supabase';

const DIRECTORY_FIELDS = 'id, name, avatar_url, bio, relationship_status, user_type, location, interests, created_at';

const getCurrentUserId = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error('Authentication required');
  return data.user.id;
};

const getDirectoryProfiles = async (userIds) => {
  const ids = [...new Set((userIds || []).filter(Boolean))];
  if (ids.length === 0) return new Map();

  const { data, error } = await supabase
    .from('user_directory_profiles')
    .select(DIRECTORY_FIELDS)
    .in('id', ids);

  if (error) throw error;
  return new Map((data || []).map((profile) => [profile.id, profile]));
};

export const getAllUsers = async (currentUserId, options = {}) => {
  try {
    const actorId = await getCurrentUserId();
    if (currentUserId && currentUserId !== actorId) throw new Error('Not authorized');

    let query = supabase
      .from('user_directory_profiles')
      .select(DIRECTORY_FIELDS)
      .neq('id', actorId);

    if (options.userType) query = query.eq('user_type', options.userType);

    const allowedSorts = new Set(['created_at', 'name', 'updated_at']);
    const sortBy = allowedSorts.has(options.sortBy) ? options.sortBy : 'created_at';
    const ascending = options.sortOrder === 'asc';
    const limit = Math.min(Math.max(Number(options.limit) || 100, 1), 100);

    const { data, error } = await query.order(sortBy, { ascending }).limit(limit);
    if (error) throw error;
    return data || [];
  } catch (error) {
    throw new Error(handleSupabaseError(error));
  }
};

export const searchUsers = async (currentUserId, searchQuery) => {
  try {
    const actorId = await getCurrentUserId();
    if (currentUserId && currentUserId !== actorId) throw new Error('Not authorized');

    const query = String(searchQuery || '').trim().replace(/[,%()]/g, ' ').slice(0, 80);
    if (!query) return getAllUsers(actorId, { limit: 100, sortBy: 'name', sortOrder: 'asc' });

    const { data, error } = await supabase
      .from('user_directory_profiles')
      .select(DIRECTORY_FIELDS)
      .neq('id', actorId)
      .or(`name.ilike.%${query}%,location.ilike.%${query}%,bio.ilike.%${query}%`)
      .order('name', { ascending: true })
      .limit(100);

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw new Error(handleSupabaseError(error));
  }
};

export const getUserProfile = async (userId) => {
  try {
    await getCurrentUserId();
    const { data, error } = await supabase
      .from('user_directory_profiles')
      .select(DIRECTORY_FIELDS)
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw new Error(handleSupabaseError(error));
  }
};

export const sendBuddyRequest = async (_fromUserId, toUserId) => {
  void _fromUserId;
  try {
    const actorId = await getCurrentUserId();
    if (!toUserId || toUserId === actorId) throw new Error('Invalid buddy request');

    const { data: existing, error: checkError } = await supabase
      .from('buddy_requests')
      .select('id, status')
      .or(`and(from_user_id.eq.${actorId},to_user_id.eq.${toUserId}),and(from_user_id.eq.${toUserId},to_user_id.eq.${actorId})`)
      .maybeSingle();

    if (checkError) throw checkError;
    if (existing?.status === 'pending') throw new Error('A buddy request already exists');
    if (existing?.status === 'accepted') throw new Error('You are already buddies');

    const { data, error } = await supabase
      .from('buddy_requests')
      .insert({ from_user_id: actorId, to_user_id: toUserId, status: 'pending' })
      .select('id, from_user_id, to_user_id, status, created_at, updated_at')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw new Error(handleSupabaseError(error));
  }
};

export const cancelBuddyRequest = async (requestId, _userId) => {
  void _userId;
  try {
    const actorId = await getCurrentUserId();
    const { error } = await supabase
      .from('buddy_requests')
      .delete()
      .eq('id', requestId)
      .eq('from_user_id', actorId)
      .eq('status', 'pending');

    if (error) throw error;
  } catch (error) {
    throw new Error(handleSupabaseError(error));
  }
};

export const getSentBuddyRequests = async (_userId) => {
  void _userId;
  try {
    const actorId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('buddy_requests')
      .select('id, from_user_id, to_user_id, status, created_at, updated_at')
      .eq('from_user_id', actorId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    const profiles = await getDirectoryProfiles((data || []).map((request) => request.to_user_id));
    return (data || []).map((request) => ({
      ...request,
      to_user: profiles.get(request.to_user_id) || { id: request.to_user_id },
    }));
  } catch (error) {
    throw new Error(handleSupabaseError(error));
  }
};

export const getReceivedBuddyRequests = async (_userId) => {
  void _userId;
  try {
    const actorId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('buddy_requests')
      .select('id, from_user_id, to_user_id, status, created_at, updated_at')
      .eq('to_user_id', actorId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    const profiles = await getDirectoryProfiles((data || []).map((request) => request.from_user_id));
    return (data || []).map((request) => ({
      ...request,
      from_user: profiles.get(request.from_user_id) || { id: request.from_user_id },
    }));
  } catch (error) {
    throw new Error(handleSupabaseError(error));
  }
};

export const acceptBuddyRequest = async (requestId, _userId) => {
  void _userId;
  try {
    const actorId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('buddy_requests')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .eq('to_user_id', actorId)
      .eq('status', 'pending')
      .select('id, from_user_id, to_user_id, status, created_at, updated_at')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw new Error(handleSupabaseError(error));
  }
};

export const rejectBuddyRequest = async (requestId, _userId) => {
  void _userId;
  try {
    const actorId = await getCurrentUserId();
    const { error } = await supabase
      .from('buddy_requests')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .eq('to_user_id', actorId)
      .eq('status', 'pending');

    if (error) throw error;
  } catch (error) {
    throw new Error(handleSupabaseError(error));
  }
};

export const getMyBuddies = async (_userId) => {
  void _userId;
  try {
    const actorId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('buddy_requests')
      .select('id, from_user_id, to_user_id, status, created_at, updated_at')
      .eq('status', 'accepted')
      .or(`from_user_id.eq.${actorId},to_user_id.eq.${actorId}`);

    if (error) throw error;

    const otherIds = (data || []).map((request) => request.from_user_id === actorId ? request.to_user_id : request.from_user_id);
    const profiles = await getDirectoryProfiles(otherIds);

    return (data || []).map((request) => {
      const otherUserId = request.from_user_id === actorId ? request.to_user_id : request.from_user_id;
      return {
        ...(profiles.get(otherUserId) || { id: otherUserId }),
        request_id: request.id,
        connected_since: request.updated_at || request.created_at,
        status: 'active',
      };
    });
  } catch (error) {
    throw new Error(handleSupabaseError(error));
  }
};