import { supabase, handleSupabaseError } from './supabase';

export const getGlobalRoomModerationAudit = async (limit = 100) => {
  try {
    const safeLimit = Math.max(1, Math.min(Number(limit) || 100, 250));
    const { data, error } = await supabase.rpc('get_global_room_moderation_audit', {
      p_limit: safeLimit,
    });
    if (error) throw error;
    return { success: true, entries: Array.isArray(data) ? data : [] };
  } catch (error) {
    return { success: false, entries: [], error: handleSupabaseError(error) };
  }
};
