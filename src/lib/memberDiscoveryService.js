import { supabase } from './supabase';
import { MEMBER_BLOCKING_ENABLED } from './memberBlockService';

export const discoverMembers = async ({ search = '', limit = 25 } = {}) => {
  if (!MEMBER_BLOCKING_ENABLED) return [];

  const { data, error } = await supabase.functions.invoke('discover-members', {
    body: {
      search: String(search || '').trim().slice(0, 80),
      limit: Math.max(1, Math.min(Number(limit) || 25, 50)),
    },
  });

  if (error) throw new Error(error?.message || 'Unable to discover members.');
  if (!data?.success) throw new Error('Unable to discover members.');
  return data.members || [];
};
