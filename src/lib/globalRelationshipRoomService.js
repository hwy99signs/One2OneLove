import { supabase, handleSupabaseError } from './supabase';

const ACTIVE_SLOT_STATUSES = ['pending', 'approved', 'scheduled', 'live'];
const PUBLIC_SLOT_COLUMNS = [
  'id',
  'title',
  'description',
  'program_type',
  'creator_display_name',
  'scheduled_start',
  'scheduled_end',
  'status',
  'moderation_status',
  'disclaimer_required',
  'source_slot_id',
].join(',');

const getBrowserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

export const getRoomSchedule = async (startIso, endIso) => {
  try {
    let query = supabase
      .from('relationship_room_slots')
      .select(PUBLIC_SLOT_COLUMNS)
      .in('status', ['approved', 'scheduled', 'live', 'completed'])
      .eq('moderation_status', 'approved')
      .order('scheduled_start', { ascending: true });

    if (startIso) query = query.gte('scheduled_end', startIso);
    if (endIso) query = query.lte('scheduled_start', endIso);

    const { data, error } = await query;
    if (error) throw error;
    return { success: true, slots: data || [] };
  } catch (error) {
    return { success: false, slots: [], error: handleSupabaseError(error) };
  }
};

export const getMyRoomCreatorProfile = async (userId) => {
  if (!userId) return { success: false, profile: null, error: 'User is required' };

  try {
    const { data, error } = await supabase
      .from('room_creator_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return { success: true, profile: data || null };
  } catch (error) {
    return { success: false, profile: null, error: handleSupabaseError(error) };
  }
};

export const createRoomCreatorProfile = async (userId, profile) => {
  try {
    if (!userId || !profile?.displayName?.trim()) {
      return { success: false, error: 'Display name is required.' };
    }

    const { data, error } = await supabase
      .from('room_creator_profiles')
      .insert({
        user_id: userId,
        display_name: profile.displayName.trim(),
        bio: profile.bio?.trim() || null,
        timezone: profile.timezone || getBrowserTimezone(),
        terms_accepted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, profile: data };
  } catch (error) {
    return { success: false, error: handleSupabaseError(error) };
  }
};

export const updateMyRoomCreatorProfile = async (userId, profile) => {
  try {
    const updates = {
      display_name: profile.displayName?.trim(),
      bio: profile.bio?.trim() || null,
      timezone: profile.timezone || getBrowserTimezone(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('room_creator_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, profile: data };
  } catch (error) {
    return { success: false, error: handleSupabaseError(error) };
  }
};

export const getCreatorSlotsForDay = async (creatorId, dayStartIso, dayEndIso) => {
  try {
    const { data, error } = await supabase
      .from('relationship_room_slots')
      .select('*')
      .eq('creator_id', creatorId)
      .in('status', ACTIVE_SLOT_STATUSES)
      .gte('scheduled_start', dayStartIso)
      .lt('scheduled_start', dayEndIso)
      .order('scheduled_start', { ascending: true });

    if (error) throw error;
    return { success: true, slots: data || [] };
  } catch (error) {
    return { success: false, slots: [], error: handleSupabaseError(error) };
  }
};

export const getMyRoomSlots = async (userId) => {
  if (!userId) return { success: true, slots: [] };

  try {
    const { data, error } = await supabase
      .from('relationship_room_slots')
      .select('*')
      .eq('owner_user_id', userId)
      .order('scheduled_start', { ascending: true });

    if (error) throw error;
    return { success: true, slots: data || [] };
  } catch (error) {
    return { success: false, slots: [], error: handleSupabaseError(error) };
  }
};

export const checkRoomSlotAvailability = async (scheduledStart, scheduledEnd) => {
  try {
    const { data, error } = await supabase
      .from('relationship_room_slots')
      .select('id,title,scheduled_start,scheduled_end,status')
      .in('status', ACTIVE_SLOT_STATUSES)
      .lt('scheduled_start', scheduledEnd)
      .gt('scheduled_end', scheduledStart)
      .limit(1);

    if (error) throw error;
    return { success: true, available: !data?.length, conflict: data?.[0] || null };
  } catch (error) {
    return { success: false, available: false, error: handleSupabaseError(error) };
  }
};

export const submitRoomSlot = async ({ userId, creatorProfile, title, description, scheduledStart, scheduledEnd }) => {
  try {
    if (!userId || !creatorProfile?.id) return { success: false, error: 'Approved creator profile required.' };
    if (creatorProfile.status !== 'approved') return { success: false, error: 'Creator profile must be approved before booking.' };
    if (!title?.trim()) return { success: false, error: 'Program title is required.' };

    const start = new Date(scheduledStart);
    const end = new Date(scheduledEnd);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return { success: false, error: 'Choose a valid start and end time.' };
    if (!(start < end)) return { success: false, error: 'End time must be after start time.' };
    if (start.getTime() <= Date.now()) return { success: false, error: 'Programming must be scheduled in the future.' };

    const availability = await checkRoomSlotAvailability(start.toISOString(), end.toISOString());
    if (!availability.success) return availability;
    if (!availability.available) return { success: false, error: 'That programming time is already booked.', conflict: availability.conflict };

    const { data, error } = await supabase
      .from('relationship_room_slots')
      .insert({
        creator_id: creatorProfile.id,
        owner_user_id: userId,
        title: title.trim(),
        description: description?.trim() || null,
        program_type: 'creator',
        scheduled_start: start.toISOString(),
        scheduled_end: end.toISOString(),
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23P01') return { success: false, error: 'That programming time is no longer available.' };
      if (error.code === '23514' && error.message?.includes('programming slots per creator-local day')) {
        return { success: false, error: `Free creator accounts are limited to ${creatorProfile.daily_slot_limit ?? 2} programming slots per day.` };
      }
      throw error;
    }

    return { success: true, slot: data };
  } catch (error) {
    return { success: false, error: handleSupabaseError(error) };
  }
};

export const cancelMyRoomSlot = async (slotId, userId) => {
  try {
    const { data, error } = await supabase
      .from('relationship_room_slots')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', slotId)
      .eq('owner_user_id', userId)
      .in('status', ['draft', 'pending'])
      .select()
      .single();

    if (error) throw error;
    return { success: true, slot: data };
  } catch (error) {
    return { success: false, error: handleSupabaseError(error) };
  }
};
