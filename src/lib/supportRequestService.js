import { supabase } from './supabase';

export const SUPPORT_REQUESTS_ENABLED = import.meta.env.VITE_SUPPORT_REQUESTS_ENABLED === 'true';

export const SUPPORT_CATEGORIES = ['account','technical','billing','safety','feedback','other'];

const requireEnabled = () => {
  if (!SUPPORT_REQUESTS_ENABLED) throw new Error('SUPPORT_REQUESTS_DISABLED');
};

const functionErrorCode = (data, error, fallback) => {
  if (data?.error) return String(data.error);
  const context = error?.context;
  if (context && typeof context === 'object') {
    if (context.error) return String(context.error);
    if (context.body?.error) return String(context.body.error);
  }
  return error?.message || fallback;
};

const invokeMemberSupport = async (body) => {
  requireEnabled();
  const { data, error } = await supabase.functions.invoke('support-request', { body });
  if (error || !data?.success) throw new Error(functionErrorCode(data, error, 'SUPPORT_REQUEST_FAILED'));
  return data;
};

export const listMySupportRequests = async () => {
  if (!SUPPORT_REQUESTS_ENABLED) return [];
  const data = await invokeMemberSupport({ action: 'list' });
  return data.requests || [];
};

export const createSupportRequest = async ({ category, subject, message } = {}) => {
  if (!SUPPORT_CATEGORIES.includes(category)) throw new Error('INVALID_CATEGORY');
  const data = await invokeMemberSupport({ action: 'create', category, subject, message });
  return data.request || null;
};

export const closeSupportRequest = async (requestId) => {
  const data = await invokeMemberSupport({ action: 'close', request_id: requestId });
  return data.request || null;
};

export const markSupportResponseRead = async (requestId) => {
  const data = await invokeMemberSupport({ action: 'mark_response_read', request_id: requestId });
  return data.request || null;
};

const invokeSupportAdmin = async (body) => {
  requireEnabled();
  const { data, error } = await supabase.functions.invoke('manage-support-requests', { body });
  if (error || !data?.success) throw new Error(functionErrorCode(data, error, 'SUPPORT_ADMIN_FAILED'));
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
  if (!data?.eligible) throw new Error('O2OL_SUPPORT_ADMIN_REQUIRED');
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
