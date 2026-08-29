import { supabase, handleSupabaseError } from './supabase';

export const getMyGlobalRoomCancellationRequests = async (userId) => {
  if (!userId) return { success: true, requests: [] };

  try {
    const { data, error } = await supabase
      .from('relationship_room_cancellation_requests')
      .select('id,slot_id,requester_user_id,reason,status,created_at,updated_at')
      .eq('requester_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, requests: data || [] };
  } catch (error) {
    return { success: false, requests: [], error: handleSupabaseError(error) };
  }
};

export const submitGlobalRoomCancellationRequest = async ({ userId, slotId, reason }) => {
  if (!userId || !slotId) return { success: false, error: 'User and program are required.' };

  try {
    const { data, error } = await supabase
      .from('relationship_room_cancellation_requests')
      .insert({
        slot_id: slotId,
        requester_user_id: userId,
        reason: reason?.trim() || null,
      })
      .select('id,slot_id,reason,status,created_at,updated_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, duplicate: true, error: 'A cancellation request is already open for this program.' };
      }
      if (error.code === '23514') {
        return { success: false, error: 'Cancellation reason is too long.' };
      }
      throw error;
    }

    return { success: true, request: data };
  } catch (error) {
    return { success: false, error: handleSupabaseError(error) };
  }
};

export const getGlobalRoomCancellationQueue = async () => {
  try {
    const { data, error } = await supabase.rpc('get_global_room_cancellation_queue');
    if (error) throw error;
    return { success: true, requests: Array.isArray(data) ? data : [] };
  } catch (error) {
    return { success: false, requests: [], error: handleSupabaseError(error) };
  }
};

export const reviewGlobalRoomCancellationRequest = async (requestId, decision) => {
  if (!requestId || !['approved', 'denied'].includes(decision)) {
    return { success: false, error: 'A valid cancellation decision is required.' };
  }

  try {
    const { data, error } = await supabase.rpc('review_global_room_cancellation_request', {
      p_request_id: requestId,
      p_decision: decision,
    });
    if (error) throw error;
    return { success: true, request: data };
  } catch (error) {
    return { success: false, error: handleSupabaseError(error) };
  }
};
