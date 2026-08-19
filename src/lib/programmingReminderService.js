import { supabase } from './supabase';

export const PROGRAMMING_REMINDERS_ENABLED = import.meta.env.VITE_PROGRAMMING_REMINDERS_ENABLED === 'true';

const requireEnabled = () => {
  if (!PROGRAMMING_REMINDERS_ENABLED) throw new Error('Programming reminders are not enabled yet.');
};

const invokeReminder = async (action, slotId) => {
  requireEnabled();
  const { data, error } = await supabase.functions.invoke('programming-reminder', {
    body: { action, slot_id: slotId },
  });
  if (error) throw new Error(error?.message || 'Unable to update programming reminder.');
  if (!data?.success) throw new Error('Unable to update programming reminder.');
  return data;
};

export const getProgrammingReminderStatus = async (slotId) => {
  if (!PROGRAMMING_REMINDERS_ENABLED || !slotId) return { enabled: false, reminder: null };
  const data = await invokeReminder('status', slotId);
  return { enabled: Boolean(data.enabled), reminder: data.reminder || null };
};

export const setProgrammingReminder = async (slotId) => {
  const data = await invokeReminder('set', slotId);
  return data.reminder || null;
};

export const cancelProgrammingReminder = async (slotId) => {
  const data = await invokeReminder('cancel', slotId);
  return data.reminder || null;
};

export const listProgrammingNotifications = async (limit = 20) => {
  if (!PROGRAMMING_REMINDERS_ENABLED) return [];
  const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 50));
  const { data, error } = await supabase
    .from('programming_notifications')
    .select('id,reminder_id,slot_id,notification_type,program_title,program_source,content_mode,starts_at,action_path,read_at,created_at')
    .order('created_at', { ascending: false })
    .limit(safeLimit);
  if (error) throw error;
  return data || [];
};

export const markProgrammingNotificationRead = async (notificationId) => {
  requireEnabled();
  const { data, error } = await supabase
    .from('programming_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .is('read_at', null)
    .select('id,read_at')
    .maybeSingle();
  if (error) throw error;
  return data || null;
};
