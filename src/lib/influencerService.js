import { specialistProfileApi } from './one2oneApi';

export const createInfluencerProfile = async (_userId, influencerData) => {
  try {
    const profile = await specialistProfileApi.save('influencer', influencerData);
    return { success: true, profile };
  } catch (error) {
    console.error('Error creating influencer profile:', error);
    return { success: false, error: error.message || 'Unable to create influencer profile' };
  }
};

export const getInfluencerProfile = async (_userId) => {
  try {
    const profile = await specialistProfileApi.get('influencer');
    return { success: true, profile };
  } catch (error) {
    console.error('Error fetching influencer profile:', error);
    return { success: false, error: error.message || 'Unable to fetch influencer profile' };
  }
};

export const updateInfluencerProfile = async (_userId, updates) => {
  try {
    const profile = await specialistProfileApi.update('influencer', updates);
    return { success: true, profile };
  } catch (error) {
    console.error('Error updating influencer profile:', error);
    return { success: false, error: error.message || 'Unable to update influencer profile' };
  }
};
