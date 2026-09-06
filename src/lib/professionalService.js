import { specialistProfileApi } from './one2oneApi';

export const createProfessionalProfile = async (_userId, professionalData) => {
  try {
    const profile = await specialistProfileApi.save('professional', professionalData);
    return { success: true, profile };
  } catch (error) {
    console.error('Error creating professional profile:', error);
    return { success: false, error: error.message || 'Unable to create professional profile' };
  }
};

export const getProfessionalProfile = async (_userId) => {
  try {
    const profile = await specialistProfileApi.get('professional');
    return { success: true, profile };
  } catch (error) {
    console.error('Error fetching professional profile:', error);
    return { success: false, error: error.message || 'Unable to fetch professional profile' };
  }
};

export const updateProfessionalProfile = async (_userId, updates) => {
  try {
    const profile = await specialistProfileApi.update('professional', updates);
    return { success: true, profile };
  } catch (error) {
    console.error('Error updating professional profile:', error);
    return { success: false, error: error.message || 'Unable to update professional profile' };
  }
};
