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

export const getGlobalRoomReplaySources = async () => {
  try {
    const { data, error } = await supabase.rpc('get_global_room_replay_sources');
    if (error) throw error;
    return { success: true, sources: Array.isArray(data) ? data : [] };
  } catch (error) {
    return { success: false, sources: [], error: handleSupabaseError(error) };
  }
};

export const scheduleGlobalRoomReplay = async ({ sourceSlotId, scheduledStart, scheduledEnd, title }) => {
  try {
    const start = new Date(scheduledStart);
    const end = new Date(scheduledEnd);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return { success: false, error: 'Choose a valid replay start and end time.' };
    }

    const { data, error } = await supabase.rpc('schedule_global_room_replay', {
      p_source_slot_id: sourceSlotId,
      p_scheduled_start: start.toISOString(),
      p_scheduled_end: end.toISOString(),
      p_title: title?.trim() || null,
    });

    if (error) {
      if (error.code === '23P01') {
        return { success: false, error: 'That programming time is no longer available.' };
      }
      throw error;
    }
    return { success: true, replay: data };
  } catch (error) {
    return { success: false, error: handleSupabaseError(error) };
  }
};
