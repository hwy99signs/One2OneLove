import { apiRequest } from './apiClient';

const MODES = new Set(['licensed', 'coach', 'contributor', 'organization']);

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

export async function submitProfessionalApplication(mode, account, application) {
  if (!MODES.has(mode)) return { success: false, error: 'Invalid professional application type' };
  try {
    const payload = await apiRequest('/api/professional-signup', {
      method: 'POST',
      body: { mode, account, application },
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
