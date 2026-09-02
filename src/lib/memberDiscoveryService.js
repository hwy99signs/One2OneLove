import { supabase } from './supabase';
import { MEMBER_BLOCKING_ENABLED } from './memberBlockService';

const discoveryError = (code) => {
  const error = new Error(code);
  error.code = code;
  return error;
};

export const discoverMembers = async ({ search = '', limit = 25 } = {}) => {
  if (!MEMBER_BLOCKING_ENABLED) return [];

  const { data, error } = await supabase.functions.invoke('discover-members', {
    body: {
      search: String(search || '').trim().slice(0, 80),
      limit: Math.max(1, Math.min(Number(limit) || 25, 50)),
    },
  });

  if (error || !data?.success) {
    throw discoveryError(data?.error || 'O2OL_MEMBER_DISCOVERY_FAILED');
  }
  return data.members || [];
};
