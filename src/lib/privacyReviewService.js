import { supabase } from './supabase';

export const PRIVACY_REVIEW_ENABLED = import.meta.env.VITE_PRIVACY_REQUESTS_ENABLED === 'true';

const codedError = (code = 'PRIVACY_REVIEW_FAILED') => {
  const error = new Error('');
  error.code = code;
  return error;
};

const functionErrorCode = (data, error, fallback = 'PRIVACY_REVIEW_FAILED') => {
  if (data?.error) return String(data.error);
  const context = error?.context;
  if (context && typeof context === 'object') {
    if (context.error) return String(context.error);
    if (context.body?.error) return String(context.body.error);
  }
  return fallback;
};

const invoke = async (body) => {
  if (!PRIVACY_REVIEW_ENABLED) throw codedError('REQUESTS_NOT_ENABLED');

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw codedError('AUTH_REQUIRED');
  if (!user.email_confirmed_at && !user.confirmed_at) throw codedError('EMAIL_CONFIRMATION_REQUIRED');

  const { data, error } = await supabase.functions.invoke('manage-privacy-requests', { body });
  if (error || data?.error) throw codedError(functionErrorCode(data, error));
  return data || {};
};

export const getPrivacyReviewAccess = async () => {
  if (!PRIVACY_REVIEW_ENABLED) return { enabled: false, eligible: false };
  const data = await invoke({ action: 'access' });
  return { enabled: data.enabled === true, eligible: data.eligible === true };
};

export const listPrivacyReviewQueue = async (status = '') => {
  const data = await invoke({ action: 'list', status: String(status || '').trim() });
  return data.requests || [];
};

export const startPrivacyReview = async (requestId) => {
  const data = await invoke({ action: 'start', request_id: requestId });
  return data.request;
};

export const acceptPrivacyRequestForFulfillment = async (requestId, response) => {
  const data = await invoke({
    action: 'accept',
    request_id: requestId,
    response: String(response || '').trim().slice(0, 4000),
  });
  return data.request;
};

export const declinePrivacyRequest = async (requestId, response) => {
  const data = await invoke({
    action: 'decline',
    request_id: requestId,
    response: String(response || '').trim().slice(0, 4000),
  });
  return data.request;
};

export const reopenPrivacyRequest = async (requestId) => {
  const data = await invoke({ action: 'reopen', request_id: requestId });
  return data.request;
};
