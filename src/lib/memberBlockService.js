import { supabase } from './supabase';

export const MEMBER_BLOCKING_ENABLED = import.meta.env.VITE_MEMBER_BLOCKING_ENABLED === 'true';

const requireEnabled = () => {
  if (!MEMBER_BLOCKING_ENABLED) throw new Error('Member blocking is not enabled yet.');
};

const invokeBlock = async (body) => {
  requireEnabled();
  const { data, error } = await supabase.functions.invoke('member-block', { body });
  if (error) throw new Error(error?.message || 'Unable to update member block.');
  if (!data?.success) throw new Error('Unable to update member block.');
  return data;
};

export const blockMember = async (memberId) => {
  const data = await invokeBlock({ action: 'block', blocked_user_id: memberId });
  return Boolean(data.blocked);
};

export const unblockMember = async (memberId) => {
  const data = await invokeBlock({ action: 'unblock', blocked_user_id: memberId });
  return Boolean(data.blocked);
};

export const listBlockedMemberIds = async () => {
  if (!MEMBER_BLOCKING_ENABLED) return [];
  const data = await invokeBlock({ action: 'list' });
  return data.blocked_ids || [];
};

export const listBlockedMembers = async () => {
  if (!MEMBER_BLOCKING_ENABLED) return [];
  const { data, error } = await supabase.functions.invoke('list-blocked-members', { body: {} });
  if (error) throw new Error(error?.message || 'Unable to load blocked members.');
  if (!data?.success) throw new Error('Unable to load blocked members.');
  return data.members || [];
};
