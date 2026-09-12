import { specialistProfileApi } from './one2oneApi';

export const createTherapistProfile = async (_userId, therapistData) => {
  try {
    const profile = await specialistProfileApi.save('therapist', therapistData);
    return { success: true, profile };
  } catch (error) {
    console.error('Error creating therapist profile:', error);
    return { success: false, error: error.message || 'Unable to create therapist profile' };
  }
};

export const getTherapistProfile = async (_userId) => {
  try {
    const profile = await specialistProfileApi.get('therapist');
    return { success: true, profile };
  } catch (error) {
    console.error('Error fetching therapist profile:', error);
    return { success: false, error: error.message || 'Unable to fetch therapist profile' };
  }
};

export const updateTherapistProfile = async (_userId, updates) => {
  try {
    const profile = await specialistProfileApi.update('therapist', updates);
    return { success: true, profile };
  } catch (error) {
    console.error('Error updating therapist profile:', error);
    return { success: false, error: error.message || 'Unable to update therapist profile' };
  }
};
