import { apiRequest } from './apiClient';

const MODES = new Set(['licensed', 'coach', 'contributor', 'organization']);

function selectedSignupPlan(explicitPlan) {
  const raw = String(explicitPlan || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('plan') : '') || '').trim().toLowerCase();
  if (raw === 'exclusive') return 'Exclusive';
  if (raw === 'premiere' || raw === 'premier') return 'Premiere';
  return null;
}

export async function uploadProfessionalProfilePhoto(file, mode) {
  if (!file) return null;
  if (!MODES.has(mode)) throw new Error('Invalid professional application type');
  if (!file.type?.startsWith('image/')) throw new Error('Profile photo must be an image.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Profile photo must be 5MB or smaller.');

  // Existing signed-in professionals can upload directly to the private R2-backed
  // profile-media route. New applicants may not have a session until email
  // verification; their form already continues safely without a photo.
  const payload = await apiRequest('/api/profile/photo', {
    method: 'PUT',
    headers: { 'content-type': file.type },
    rawBody: file,
  });
  return payload?.avatar_url || null;
}

export async function submitProfessionalApplication(mode, account, application, selectedPlan = null) {
  if (!MODES.has(mode)) return { success: false, error: 'Invalid professional application type' };
  const plan = selectedSignupPlan(selectedPlan);
  if (!plan) return { success: false, error: 'Choose Premiere or Exclusive before applying.' };
  try {
    const payload = await apiRequest('/api/professional-signup', {
      method: 'POST',
      body: { mode, account, application, selectedPlan: plan },
    });
    return {
      success: true,
      user: payload?.user || null,
      profile: payload?.profile || null,
      requiresEmailVerification: payload?.requiresEmailVerification !== false,
      status: payload?.status || 'pending',
    };
  } catch (error) {
    return { success: false, error: error?.message || 'Professional registration failed.' };
  }
}
