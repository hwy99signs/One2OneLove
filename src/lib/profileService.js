import { profileApi, profileMediaApi } from './one2oneApi';

const ensureRegularUserAccess = async (_userId) => {
  const profile = await profileApi.get();
  if (!profile) throw new Error('Profile not found');
  if (profile.user_type && profile.user_type !== 'regular') {
    throw new Error('Profile management is currently available for regular users only.');
  }
  return profile;
};

export const uploadProfilePicture = async (file, userId) => {
  try {
    await ensureRegularUserAccess(userId);
    if (!file?.type?.startsWith('image/')) throw new Error('File must be an image');
    if (file.size > 5 * 1024 * 1024) throw new Error('Image size must be less than 5MB');
    return await profileMediaApi.upload(file);
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw new Error(error.message || 'Unable to upload profile picture');
  }
};

export const getUserProfile = async (userId) => {
  try {
    return await ensureRegularUserAccess(userId);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw new Error(error.message || 'Unable to fetch user profile');
  }
};

export const updateUserProfile = async (userId, updates) => {
  try {
    await ensureRegularUserAccess(userId);
    const clean = { ...updates };
    delete clean.id;
    delete clean.email;
    delete clean.user_type;
    delete clean.created_at;
    delete clean.updated_at;
    Object.keys(clean).forEach((key) => {
      if (clean[key] === undefined) delete clean[key];
    });
    return await profileApi.update(clean);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error(error.message || 'Unable to update user profile');
  }
};

export const deleteProfilePicture = async (userId) => {
  try {
    await ensureRegularUserAccess(userId);
    await profileMediaApi.remove();
  } catch (error) {
    console.error('Error deleting profile picture:', error);
    throw new Error(error.message || 'Unable to delete profile picture');
  }
};

export const refreshProfileCompletion = async (userId) => {
  try {
    const profile = await ensureRegularUserAccess(userId);
    return {
      profile_completion_percentage: profile.profile_completion_percentage || 0,
      profile_completed_fields: profile.profile_completed_fields || 0,
      profile_total_fields: profile.profile_total_fields || 14,
    };
  } catch (error) {
    console.error('Error refreshing profile completion:', error);
    throw new Error(error.message || 'Unable to refresh profile completion');
  }
};

export const getProfileCompletion = async (userId) => {
  try {
    const profile = await ensureRegularUserAccess(userId);
    return {
      percentage: profile.profile_completion_percentage || 0,
      completedFields: profile.profile_completed_fields || 0,
      totalFields: profile.profile_total_fields || 14,
    };
  } catch (error) {
    console.error('Error fetching profile completion:', error);
    throw new Error(error.message || 'Unable to fetch profile completion');
  }
};

export const saveLoveLanguage = async (userId, loveLanguageId) => {
  try {
    await ensureRegularUserAccess(userId);
    const languageMap = {
      words: 'words_of_affirmation',
      quality: 'quality_time',
      gifts: 'receiving_gifts',
      service: 'acts_of_service',
      touch: 'physical_touch',
    };
    const dbValue = languageMap[loveLanguageId] || loveLanguageId;
    const validValues = [
      'words_of_affirmation',
      'quality_time',
      'receiving_gifts',
      'acts_of_service',
      'physical_touch',
    ];
    if (!validValues.includes(dbValue)) throw new Error('Invalid love language value');
    return await profileApi.update({ love_language: dbValue });
  } catch (error) {
    console.error('Error saving love language:', error);
    throw new Error(error.message || 'Unable to save love language');
  }
};

export const getUserLoveLanguage = async (userId) => {
  try {
    const profile = await ensureRegularUserAccess(userId);
    return profile.love_language || null;
  } catch (error) {
    console.error('Error fetching love language:', error);
    throw new Error(error.message || 'Unable to fetch love language');
  }
};
