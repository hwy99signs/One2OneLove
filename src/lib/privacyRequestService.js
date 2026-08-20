import { supabase } from './supabase';

const PRIVACY_REQUESTS_ENABLED = import.meta.env.VITE_PRIVACY_REQUESTS_ENABLED === 'true';
const ALLOWED_TYPES = new Set(['data_export', 'account_deletion']);

export const privacyRequestsEnabled = () => PRIVACY_REQUESTS_ENABLED;

const codedError = (code = 'PRIVACY_REQUEST_FAILED') => {
  const error = new Error('');
  error.code = code;
  return error;
};

const functionErrorCode = (data, error, fallback = 'PRIVACY_REQUEST_FAILED') => {
  if (data?.error) return String(data.error);
  const context = error?.context;
  if (context && typeof context === 'object') {
    if (context.error) return String(context.error);
    if (context.body?.error) return String(context.body.error);
  }
  return fallback;
};

const requireConfirmedUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw codedError('AUTH_REQUIRED');
  if (!user.email_confirmed_at && !user.confirmed_at) throw codedError('EMAIL_CONFIRMATION_REQUIRED');
  return user;
};

const invoke = async (body) => {
  await requireConfirmedUser();
  const { data, error } = await supabase.functions.invoke('privacy-request', { body });
  if (error || !data?.success) {
    throw codedError(functionErrorCode(data, error));
  }
  return data;
};

export const listPrivacyRequests = async () => {
  if (!PRIVACY_REQUESTS_ENABLED) return [];
  const data = await invoke({ action: 'list' });
  return data.requests || [];
};

export const createPrivacyRequest = async (requestType, memberNote = '') => {
  if (!PRIVACY_REQUESTS_ENABLED) throw codedError('REQUESTS_NOT_ENABLED');
  const type = String(requestType || '').trim().toLowerCase();
  if (!ALLOWED_TYPES.has(type)) throw codedError('INVALID_REQUEST_TYPE');
  const data = await invoke({ action: 'create', requestType: type, memberNote: String(memberNote || '').trim().slice(0, 500) });
  return data.request;
};
