import { supabase } from './supabase';
import { CREATOR_PROGRAMMING_ENABLED } from './creatorProgrammingService';

const ERROR = {
  disabled: 'O2OL_PROGRAMMING_DISABLED',
  manage: 'O2OL_PROGRAMMING_MANAGE_FAILED',
  book: 'O2OL_PROGRAMMING_BOOK_FAILED',
  cancel: 'O2OL_PROGRAMMING_CANCEL_FAILED',
};

const requireEnabled = () => {
  if (!CREATOR_PROGRAMMING_ENABLED) throw new Error(ERROR.disabled);
};

const invokeAdmin = async (body) => {
  requireEnabled();
  const { data, error } = await supabase.functions.invoke('manage-o2ol-programming', { body });
  if (error) throw new Error(ERROR.manage);
  return data;
};

export const getO2OLProgrammingAdminAccess = async () => {
  if (!CREATOR_PROGRAMMING_ENABLED) return { enabled: false, eligible: false };
  try {
    const data = await invokeAdmin({ action: 'access' });
    return {
      enabled: Boolean(data?.enabled),
      eligible: Boolean(data?.eligible),
    };
  } catch {
    return { enabled: true, eligible: false };
  }
};

export const bookO2OLProgrammingSlot = async ({
  title,
  description = '',
  startsAt,
  endsAt,
  timezone,
  contentMode = 'live',
  replayUrl = '',
  roomSlug = 'global-relationship-room',
} = {}) => {
  const data = await invokeAdmin({
    action: 'book',
    title: String(title || '').trim().slice(0, 120),
    description: String(description || '').trim().slice(0, 1000),
    starts_at: startsAt,
    ends_at: endsAt,
    timezone: String(timezone || '').trim().slice(0, 80),
    content_mode: contentMode === 'replay' ? 'replay' : 'live',
    replay_url: contentMode === 'replay' ? String(replayUrl || '').trim().slice(0, 1000) : '',
    room_slug: roomSlug,
  });

  if (!data?.success) throw new Error(ERROR.book);
  return data.slot;
};

export const cancelO2OLProgrammingSlot = async (slotId) => {
  const data = await invokeAdmin({ action: 'cancel', slot_id: slotId });
  if (!data?.success) throw new Error(ERROR.cancel);
  return data.slot;
};
