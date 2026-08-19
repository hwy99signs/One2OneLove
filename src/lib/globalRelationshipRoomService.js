import { supabase, handleSupabaseError } from './supabase';

const ACTIVE_SLOT_STATUSES = ['pending', 'approved', 'scheduled', 'live'];

export const getRoomSchedule = async (startIso, endIso) => {
  try {
    let query = supabase
      .from('relationship_room_slots')
      .select('*')
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
    const { data, error } = await supabase
      .from('room_creator_profiles')
      .insert({
        user_id: userId,
        display_name: profile.displayName,
        bio: profile.bio || null,
        plan: 'free',
        daily_slot_limit: 2,
        status: 'pending',
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

export const submitRoomSlot = async ({ userId, creatorProfile, title, description, scheduledStart, scheduledEnd, programType = 'creator', sourceSlotId = null }) => {
  try {
    if (!userId || !creatorProfile?.id) {
      return { success: false, error: 'Approved creator profile required.' };
    }

    if (creatorProfile.status !== 'approved') {
      return { success: false, error: 'Creator profile must be approved before booking.' };
    }

    const start = new Date(scheduledStart);
    const end = new Date(scheduledEnd);
    if (!(start < end)) return { success: false, error: 'End time must be after start time.' };

    const dayStart = new Date(start);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const dailyResult = await getCreatorSlotsForDay(
      creatorProfile.id,
      dayStart.toISOString(),
      dayEnd.toISOString()
    );
    if (!dailyResult.success) return dailyResult;

    const limit = creatorProfile.daily_slot_limit ?? 2;
    if (creatorProfile.plan === 'free' && dailyResult.slots.length >= limit) {
      return { success: false, error: `Free creator accounts are limited to ${limit} programming slots per day.` };
    }

    const availability = await checkRoomSlotAvailability(start.toISOString(), end.toISOString());
    if (!availability.success) return availability;
    if (!availability.available) {
      return { success: false, error: 'That programming time is already booked.', conflict: availability.conflict };
    }

    const { data, error } = await supabase
      .from('relationship_room_slots')
      .insert({
        creator_id: creatorProfile.id,
        owner_user_id: userId,
        title,
        description: description || null,
        program_type: programType,
        scheduled_start: start.toISOString(),
        scheduled_end: end.toISOString(),
        source_slot_id: sourceSlotId,
        status: 'pending',
        moderation_status: 'unreviewed',
        disclaimer_required: true,
      })
      .select()
      .single();

    if (error) throw error;
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
