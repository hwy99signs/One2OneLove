import { supabase } from './supabase';

export const SUPPORT_REQUESTS_ENABLED = import.meta.env.VITE_SUPPORT_REQUESTS_ENABLED === 'true';

export const SUPPORT_CATEGORIES = ['account','technical','billing','safety','feedback','other'];

const requireEnabled = () => {
  if (!SUPPORT_REQUESTS_ENABLED) throw new Error('Support requests are not enabled yet.');
};

const invokeMemberSupport = async (body) => {
  requireEnabled();
  const { data, error } = await supabase.functions.invoke('support-request', { body });
  if (error) throw new Error(error?.message || 'Unable to update support request.');
  if (!data?.success) throw new Error('Unable to update support request.');
  return data;
};

export const listMySupportRequests = async () => {
  if (!SUPPORT_REQUESTS_ENABLED) return [];
  const data = await invokeMemberSupport({ action: 'list' });
  return data.requests || [];
};

export const createSupportRequest = async ({ category, subject, message } = {}) => {
  if (!SUPPORT_CATEGORIES.includes(category)) throw new Error('Choose a support category.');
  const data = await invokeMemberSupport({ action: 'create', category, subject, message });
  return data.request || null;
};

export const closeSupportRequest = async (requestId) => {
  const data = await invokeMemberSupport({ action: 'close', request_id: requestId });
  return data.request || null;
};

const invokeSupportAdmin = async (body) => {
  requireEnabled();
  const { data, error } = await supabase.functions.invoke('manage-support-requests', { body });
  if (error) throw new Error(error?.message || 'Unable to manage support requests.');
  return data;
};

export const getSupportAdminAccess = async () => {
  if (!SUPPORT_REQUESTS_ENABLED) return { enabled: false, eligible: false };
  try {
    const data = await invokeSupportAdmin({ action: 'access' });
    return { enabled: Boolean(data?.enabled), eligible: Boolean(data?.eligible) };
  } catch {
    return { enabled: true, eligible: false };
  }
};

export const listSupportQueue = async (status = '') => {
  const data = await invokeSupportAdmin({ action: 'list', status });
  if (!data?.success || !data?.eligible) throw new Error('Support admin access is required.');
  return data.requests || [];
};

export const startSupportRequest = async (requestId) => {
  const data = await invokeSupportAdmin({ action: 'start', request_id: requestId });
  return data.request || null;
};

export const respondToSupportRequest = async (requestId, response) => {
  const data = await invokeSupportAdmin({ action: 'respond', request_id: requestId, response });
  return data.request || null;
};

export const closeSupportRequestAsStaff = async (requestId) => {
  const data = await invokeSupportAdmin({ action: 'close', request_id: requestId });
  return data.request || null;
};

export const reopenSupportRequest = async (requestId) => {
  const data = await invokeSupportAdmin({ action: 'reopen', request_id: requestId });
  return data.request || null;
};
