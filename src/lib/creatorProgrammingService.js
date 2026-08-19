import { supabase } from './supabase';

export const CREATOR_PROGRAMMING_ENABLED = import.meta.env.VITE_CREATOR_PROGRAMMING_ENABLED === 'true';

const SLOT_FIELDS = 'id,creator_user_id,room_slug,title,description,starts_at,ends_at,creator_timezone,creator_local_date,content_mode,replay_url,booking_tier,price_cents,payment_status,status,created_at,updated_at';

const requireEnabled = () => {
  if (!CREATOR_PROGRAMMING_ENABLED) throw new Error('Creator programming is not enabled yet.');
};

const getAuthenticatedCreator = async () => {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user?.id) throw new Error('Sign in to manage creator programming.');

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id,user_type,name')
    .eq('id', authData.user.id)
    .single();
  if (profileError) throw profileError;
  if (profile?.user_type !== 'influencer') throw new Error('Creator programming is available only to approved creator accounts.');

  return profile;
};

export const getCreatorProgrammingAccess = async () => {
  if (!CREATOR_PROGRAMMING_ENABLED) return { enabled: false, eligible: false, profile: null };
  try {
    const profile = await getAuthenticatedCreator();
    return { enabled: true, eligible: true, profile };
  } catch (error) {
    return { enabled: true, eligible: false, profile: null, reason: error?.message || 'Creator access unavailable.' };
  }
};

export const listPublishedProgramming = async ({ from, to, roomSlug = 'global-relationship-room' } = {}) => {
  requireEnabled();
  let query = supabase
    .from('creator_programming_slots')
    .select('id,room_slug,title,description,starts_at,ends_at,content_mode,status')
    .eq('room_slug', roomSlug)
    .eq('status', 'booked')
    .order('starts_at', { ascending: true });

  if (from) query = query.gte('starts_at', from);
  if (to) query = query.lt('starts_at', to);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const listMyProgramming = async ({ from, to } = {}) => {
  requireEnabled();
  const creator = await getAuthenticatedCreator();
  let query = supabase
    .from('creator_programming_slots')
    .select(SLOT_FIELDS)
    .eq('creator_user_id', creator.id)
    .order('starts_at', { ascending: true });

  if (from) query = query.gte('starts_at', from);
  if (to) query = query.lt('starts_at', to);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const bookCreatorProgrammingSlot = async ({
  title,
  description = '',
  startsAt,
  endsAt,
  timezone,
  contentMode = 'live',
  replayUrl = '',
  roomSlug = 'global-relationship-room',
} = {}) => {
  requireEnabled();
  await getAuthenticatedCreator();

  const { data, error } = await supabase.functions.invoke('book-creator-programming-slot', {
    body: {
      title: String(title || '').trim().slice(0, 120),
      description: String(description || '').trim().slice(0, 1000),
      starts_at: startsAt,
      ends_at: endsAt,
      timezone: String(timezone || '').trim().slice(0, 80),
      content_mode: contentMode === 'replay' ? 'replay' : 'live',
      replay_url: contentMode === 'replay' ? String(replayUrl || '').trim().slice(0, 1000) : '',
      room_slug: roomSlug,
      booking_tier: 'free',
    },
  });

  if (error) throw new Error(error?.message || 'Unable to book this programming slot.');
  if (!data?.success) {
    const code = data?.error || 'BOOKING_FAILED';
    const messages = {
      CREATOR_NOT_APPROVED: 'Creator programming is available only to approved creator accounts.',
      DAILY_FREE_LIMIT_REACHED: 'You have already booked the two free creator slots allowed for this day.',
      SLOT_CONFLICT: 'That programming time is no longer available.',
      INVALID_TIME: 'Choose a valid future programming time.',
      PAID_SLOTS_NOT_ENABLED: 'Paid creator slots are not enabled yet.',
      FEATURE_DISABLED: 'Creator programming is not enabled yet.',
    };
    throw new Error(messages[code] || 'Unable to book this programming slot.');
  }

  return data.slot;
};

export const cancelCreatorProgrammingSlot = async (slotId) => {
  requireEnabled();
  const creator = await getAuthenticatedCreator();
  const { data, error } = await supabase
    .from('creator_programming_slots')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', slotId)
    .eq('creator_user_id', creator.id)
    .eq('status', 'booked')
    .select(SLOT_FIELDS)
    .single();

  if (error) throw error;
  return data;
};
