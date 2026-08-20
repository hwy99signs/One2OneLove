import { supabase } from './supabase';

export const MEMBER_BLOCKING_ENABLED = import.meta.env.VITE_MEMBER_BLOCKING_ENABLED === 'true';

const serviceError = (code) => {
  const error = new Error(code);
  error.code = code;
  return error;
};

const requireEnabled = () => {
  if (!MEMBER_BLOCKING_ENABLED) throw serviceError('O2OL_MEMBER_BLOCKING_DISABLED');
};

const invokeBlock = async (body) => {
  requireEnabled();
  const { data, error } = await supabase.functions.invoke('member-block', { body });
  if (error || !data?.success) {
    throw serviceError(data?.error || 'O2OL_MEMBER_BLOCK_UPDATE_FAILED');
  }
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
  if (error || !data?.success) {
    throw serviceError(data?.error || 'O2OL_MEMBER_BLOCK_LIST_FAILED');
  }
  return data.members || [];
};
