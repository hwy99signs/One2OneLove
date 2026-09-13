import { apiRequest } from './apiClient';

export const createProfessionalProfile = async (_userId, professionalData) => {
  try {
    const payload = await apiRequest('/api/profiles/professional', { method: 'POST', body: professionalData });
    return { success: true, profile: payload?.profile || null };
  } catch (error) {
    return { success: false, error: error?.message || 'Unable to create professional profile.' };
  }
};

export const getProfessionalProfile = async () => {
  try {
    const payload = await apiRequest('/api/profiles/professional');
    return { success: true, profile: payload?.profile || null };
  } catch (error) {
    return { success: false, error: error?.message || 'Unable to fetch professional profile.' };
  }
};

export const updateProfessionalProfile = async (_userId, updates) => {
  try {
    const payload = await apiRequest('/api/profiles/professional', { method: 'PATCH', body: updates });
    return { success: true, profile: payload?.profile || null };
  } catch (error) {
    return { success: false, error: error?.message || 'Unable to update professional profile.' };
  }
};
