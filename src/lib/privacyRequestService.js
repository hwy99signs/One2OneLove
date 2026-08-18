import { supabase } from './supabase';

const PRIVACY_REQUESTS_ENABLED = import.meta.env.VITE_PRIVACY_REQUESTS_ENABLED === 'true';
const ALLOWED_TYPES = new Set(['data_export', 'account_deletion']);

export const privacyRequestsEnabled = () => PRIVACY_REQUESTS_ENABLED;

const requireConfirmedUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Please sign in to manage account privacy requests.');
  if (!user.email_confirmed_at && !user.confirmed_at) throw new Error('Please confirm your email first.');
  return user;
};

const invoke = async (body) => {
  await requireConfirmedUser();
  const { data, error } = await supabase.functions.invoke('privacy-request', { body });
  if (error) throw new Error(error?.message || 'Privacy request service is unavailable right now.');
  if (!data?.success) {
    if (data?.error === 'REQUESTS_NOT_ENABLED') throw new Error('Privacy request intake is not active yet.');
    if (data?.error === 'EMAIL_CONFIRMATION_REQUIRED') throw new Error('Please confirm your email first.');
    throw new Error('Privacy request could not be completed right now.');
  }
  return data;
};

export const listPrivacyRequests = async () => {
  if (!PRIVACY_REQUESTS_ENABLED) return [];
  const data = await invoke({ action: 'list' });
  return data.requests || [];
};

export const createPrivacyRequest = async (requestType, memberNote = '') => {
  if (!PRIVACY_REQUESTS_ENABLED) throw new Error('Privacy request intake is not active yet.');
  const type = String(requestType || '').trim().toLowerCase();
  if (!ALLOWED_TYPES.has(type)) throw new Error('Invalid privacy request type.');
  const data = await invoke({ action: 'create', requestType: type, memberNote: String(memberNote || '').trim().slice(0, 500) });
  return data.request;
};
