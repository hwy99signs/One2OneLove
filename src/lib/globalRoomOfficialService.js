import { supabase, handleSupabaseError } from './supabase';

export const scheduleGlobalRoomOfficialProgram = async ({
  title,
  description,
  scheduledStart,
  scheduledEnd,
}) => {
  try {
    const cleanTitle = title?.trim() || '';
    const cleanDescription = description?.trim() || null;
    const start = new Date(scheduledStart);
    const end = new Date(scheduledEnd);

    if (!cleanTitle) return { success: false, error: 'Program title is required.' };
    if (cleanTitle.length > 160) return { success: false, error: 'Program title must be 160 characters or fewer.' };
    if (cleanDescription && cleanDescription.length > 2000) return { success: false, error: 'Program description must be 2000 characters or fewer.' };
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return { success: false, error: 'Choose a valid start and end time.' };
    if (start.getTime() <= Date.now()) return { success: false, error: 'Programming must be scheduled in the future.' };
    if (end <= start) return { success: false, error: 'End time must be after start time.' };

    const { data, error } = await supabase.rpc('schedule_global_room_official_program', {
      p_title: cleanTitle,
      p_description: cleanDescription,
      p_scheduled_start: start.toISOString(),
      p_scheduled_end: end.toISOString(),
    });

    if (error) {
      if (error.code === '23P01') return { success: false, error: 'That programming time is no longer available.' };
      throw error;
    }

    return { success: true, program: data };
  } catch (error) {
    return { success: false, error: handleSupabaseError(error) };
  }
};
