import { apiRequest } from './apiClient';

export const createTherapistProfile = async (_userId, therapistData) => {
  try {
    const payload = await apiRequest('/api/profiles/therapist', { method: 'POST', body: therapistData });
    return { success: true, profile: payload?.profile || null };
  } catch (error) {
    return { success: false, error: error?.message || 'Unable to create therapist profile.' };
  }
};

export const getTherapistProfile = async () => {
  try {
    const payload = await apiRequest('/api/profiles/therapist');
    return { success: true, profile: payload?.profile || null };
  } catch (error) {
    return { success: false, error: error?.message || 'Unable to fetch therapist profile.' };
  }
};

export const updateTherapistProfile = async (_userId, updates) => {
  try {
    const payload = await apiRequest('/api/profiles/therapist', { method: 'PATCH', body: updates });
    return { success: true, profile: payload?.profile || null };
  } catch (error) {
    return { success: false, error: error?.message || 'Unable to update therapist profile.' };
  }
};
