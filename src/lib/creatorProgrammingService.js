import { supabase } from './supabase';

export const CREATOR_PROGRAMMING_ENABLED = import.meta.env.VITE_CREATOR_PROGRAMMING_ENABLED === 'true';

const SLOT_FIELDS = 'id,creator_user_id,program_source,room_slug,title,description,starts_at,ends_at,creator_timezone,creator_local_date,content_mode,replay_url,booking_tier,price_cents,payment_status,status,created_at,updated_at';
const ERROR = {
  disabled: 'O2OL_CREATOR_PROGRAMMING_DISABLED',
  auth: 'O2OL_CREATOR_PROGRAMMING_AUTH_REQUIRED',
  access: 'O2OL_CREATOR_PROGRAMMING_ACCESS_DENIED',
  load: 'O2OL_CREATOR_PROGRAMMING_LOAD_FAILED',
  book: 'O2OL_CREATOR_PROGRAMMING_BOOK_FAILED',
  cancel: 'O2OL_CREATOR_PROGRAMMING_CANCEL_FAILED',
};

const requireEnabled = () => {
  if (!CREATOR_PROGRAMMING_ENABLED) throw new Error(ERROR.disabled);
};

const getAuthenticatedCreator = async () => {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user?.id) throw new Error(ERROR.auth);

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id,user_type,name')
    .eq('id', authData.user.id)
    .single();
  if (profileError) throw new Error(ERROR.access);
  if (profile?.user_type !== 'influencer') throw new Error(ERROR.access);

  return profile;
};

export const getCreatorProgrammingAccess = async () => {
  if (!CREATOR_PROGRAMMING_ENABLED) return { enabled: false, eligible: false, profile: null };
  try {
    const profile = await getAuthenticatedCreator();
    return { enabled: true, eligible: true, profile };
  } catch (error) {
    return { enabled: true, eligible: false, profile: null, reason: error?.message || ERROR.access };
  }
};

export const getGlobalProgrammingStatus = async () => {
  if (!CREATOR_PROGRAMMING_ENABLED) {
    return { enabled: false, current: null, next: null };
  }

  const { data, error } = await supabase.functions.invoke('current-creator-programming', { body: {} });
  if (error) throw new Error(ERROR.load);
  if (!data?.success) throw new Error(ERROR.load);

  return {
    enabled: Boolean(data.enabled),
    current: data.current || null,
    next: data.next || null,
  };
};

export const listPublishedProgramming = async ({ from, to, roomSlug = 'global-relationship-room' } = {}) => {
  requireEnabled();
  const { data, error } = await supabase.functions.invoke('list-creator-programming', {
    body: { from, to, room_slug: roomSlug },
  });
  if (error) throw new Error(ERROR.load);
  if (!data?.success) throw new Error(ERROR.load);
  return data.slots || [];
};

export const listMyProgramming = async ({ from, to } = {}) => {
  requireEnabled();
  const creator = await getAuthenticatedCreator();
  let query = supabase
    .from('creator_programming_slots')
    .select(SLOT_FIELDS)
    .eq('program_source', 'creator')
    .eq('creator_user_id', creator.id)
    .order('starts_at', { ascending: true });

  // Use overlap semantics so a creator can see/cancel a program that began before
  // midnight but is still active on the selected calendar day.
  if (to) query = query.lt('starts_at', to);
  if (from) query = query.gt('ends_at', from);

  const { data, error } = await query;
  if (error) throw new Error(ERROR.load);
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
  policyAcknowledged = false,
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
      policy_acknowledged: policyAcknowledged === true,
    },
  });

  if (error) throw new Error(ERROR.book);
  if (!data?.success) {
    const providerCode = String(data?.error || 'BOOKING_FAILED').replace(/[^A-Z0-9_]/g, '').slice(0, 80) || 'BOOKING_FAILED';
    throw new Error(`O2OL_CREATOR_PROGRAMMING_${providerCode}`);
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
    .eq('program_source', 'creator')
    .eq('creator_user_id', creator.id)
    .eq('status', 'booked')
    .select(SLOT_FIELDS)
    .single();

  if (error) throw new Error(ERROR.cancel);
  return data;
};
