import { supabase, handleSupabaseError } from './supabase';

export const getGlobalRoomOpsSummary = async () => {
  try {
    const { data, error } = await supabase.rpc('get_global_room_ops_summary');
    if (error) throw error;
    return {
      success: true,
      summary: {
        pendingCreators: Number(data?.pending_creators || 0),
        pendingPrograms: Number(data?.pending_programs || 0),
        openReports: Number(data?.open_reports || 0),
        liveNow: Number(data?.live_now || 0),
        next24Hours: Number(data?.next_24_hours || 0),
        next7Days: Number(data?.next_7_days || 0),
        approvedCreators: Number(data?.approved_creators || 0),
      },
    };
  } catch (error) {
    return { success: false, summary: null, error: handleSupabaseError(error) };
  }
};
