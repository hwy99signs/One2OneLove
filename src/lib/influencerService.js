import { apiRequest } from './apiClient';

export const createInfluencerProfile = async (_userId, influencerData) => {
  try {
    const payload = await apiRequest('/api/profiles/influencer', { method: 'POST', body: influencerData });
    return { success: true, profile: payload?.profile || null };
  } catch (error) {
    return { success: false, error: error?.message || 'Unable to create contributor profile.' };
  }
};

export const getInfluencerProfile = async () => {
  try {
    const payload = await apiRequest('/api/profiles/influencer');
    return { success: true, profile: payload?.profile || null };
  } catch (error) {
    return { success: false, error: error?.message || 'Unable to fetch contributor profile.' };
  }
};

export const updateInfluencerProfile = async (_userId, updates) => {
  try {
    const payload = await apiRequest('/api/profiles/influencer', { method: 'PATCH', body: updates });
    return { success: true, profile: payload?.profile || null };
  } catch (error) {
    return { success: false, error: error?.message || 'Unable to update contributor profile.' };
  }
};
