import { supabase, handleSupabaseError } from './supabase';

export const isGlobalRoomModerator = async () => {
  try {
    const { data, error } = await supabase.rpc('is_global_room_moderator');
    if (error) throw error;
    return { success: true, isModerator: Boolean(data) };
  } catch (error) {
    return { success: false, isModerator: false, error: handleSupabaseError(error) };
  }
};

export const getGlobalRoomModerationQueue = async () => {
  try {
    const { data, error } = await supabase.rpc('get_global_room_moderation_queue');
    if (error) throw error;
    return {
      success: true,
      creators: Array.isArray(data?.creators) ? data.creators : [],
      slots: Array.isArray(data?.slots) ? data.slots : [],
    };
  } catch (error) {
    return { success: false, creators: [], slots: [], error: handleSupabaseError(error) };
  }
};

export const reviewGlobalRoomCreator = async (creatorId, decision) => {
  try {
    const { data, error } = await supabase.rpc('review_global_room_creator', {
      p_creator_id: creatorId,
      p_decision: decision,
    });
    if (error) throw error;
    return { success: true, creator: data };
  } catch (error) {
    return { success: false, error: handleSupabaseError(error) };
  }
};

export const reviewGlobalRoomSlot = async (slotId, decision) => {
  try {
    const { data, error } = await supabase.rpc('review_global_room_slot', {
      p_slot_id: slotId,
      p_decision: decision,
    });
    if (error) throw error;
    return { success: true, slot: data };
  } catch (error) {
    return { success: false, error: handleSupabaseError(error) };
  }
};
