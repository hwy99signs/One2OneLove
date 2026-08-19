import { supabase, handleSupabaseError } from './supabase';

export const submitGlobalRoomReport = async ({ userId, slotId, reason, details }) => {
  try {
    if (!userId || !slotId) return { success: false, error: 'Sign in and choose a program to report.' };
    if (!reason) return { success: false, error: 'Choose a report reason.' };

    const { data, error } = await supabase
      .from('relationship_room_reports')
      .insert({
        reporter_user_id: userId,
        slot_id: slotId,
        reason,
        details: details?.trim() || null,
      })
      .select('id,slot_id,reason,status,created_at')
      .single();

    if (error) {
      if (error.code === '23505') return { success: false, duplicate: true, error: 'You already reported this program.' };
      throw error;
    }

    return { success: true, report: data };
  } catch (error) {
    return { success: false, error: handleSupabaseError(error) };
  }
};

export const getMyGlobalRoomReports = async (userId) => {
  if (!userId) return { success: true, reports: [] };
  try {
    const { data, error } = await supabase
      .from('relationship_room_reports')
      .select('id,slot_id,reason,status,created_at,updated_at')
      .eq('reporter_user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { success: true, reports: data || [] };
  } catch (error) {
    return { success: false, reports: [], error: handleSupabaseError(error) };
  }
};

export const getGlobalRoomReportQueue = async () => {
  try {
    const { data, error } = await supabase.rpc('get_global_room_report_queue');
    if (error) throw error;
    return { success: true, reports: Array.isArray(data) ? data : [] };
  } catch (error) {
    return { success: false, reports: [], error: handleSupabaseError(error) };
  }
};

export const reviewGlobalRoomReport = async (reportId, decision) => {
  try {
    const { data, error } = await supabase.rpc('review_global_room_report', {
      p_report_id: reportId,
      p_decision: decision,
    });
    if (error) throw error;
    return { success: true, report: data };
  } catch (error) {
    return { success: false, error: handleSupabaseError(error) };
  }
};
