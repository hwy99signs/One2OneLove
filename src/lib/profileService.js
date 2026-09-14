import { apiRequest, getProfile, updateProfile } from './apiClient';

export const uploadProfilePicture = async (file) => {
  if (!file?.type?.startsWith('image/')) throw new Error('File must be an image');
  if (file.size > 5 * 1024 * 1024) throw new Error('Image size must be less than 5MB');

  const payload = await apiRequest('/api/profile/photo', {
    method: 'PUT',
    headers: { 'content-type': file.type },
    rawBody: file,
  });
  return payload?.avatar_url || null;
};

export const getUserProfile = async () => getProfile();

export const updateUserProfile = async (_userId, updates) => {
  const allowed = {
    name: updates?.name,
    relationship_status: updates?.relationship_status,
    anniversary_date: updates?.anniversary_date,
    partner_email: updates?.partner_email,
    avatar_url: updates?.avatar_url,
    bio: updates?.bio,
    location: updates?.location,
    interests: updates?.interests,
    love_language: updates?.love_language,
    date_frequency: updates?.date_frequency,
    communication_style: updates?.communication_style,
    conflict_resolution: updates?.conflict_resolution,
    partner_name: updates?.partner_name,
  };
  Object.keys(allowed).forEach((key) => allowed[key] === undefined && delete allowed[key]);
  return updateProfile(allowed);
};

export const deleteProfilePicture = async () => {
  await apiRequest('/api/profile/photo', { method: 'DELETE' });
};

export const refreshProfileCompletion = async () => {
  const profile = await getProfile();
  return {
    profile_completion_percentage: profile?.profile_completion_percentage || 0,
    profile_completed_fields: profile?.profile_completed_fields || 0,
    profile_total_fields: profile?.profile_total_fields || 14,
  };
};

export const getProfileCompletion = async () => {
  const profile = await getProfile();
  return {
    percentage: profile?.profile_completion_percentage || 0,
    completedFields: profile?.profile_completed_fields || 0,
    totalFields: profile?.profile_total_fields || 14,
  };
};

export const saveLoveLanguage = async (_userId, loveLanguageId) => {
  const languageMap = {
    words: 'words_of_affirmation',
    quality: 'quality_time',
    gifts: 'receiving_gifts',
    service: 'acts_of_service',
    touch: 'physical_touch',
  };
  const value = languageMap[loveLanguageId] || loveLanguageId;
  const validValues = new Set([
    'words_of_affirmation',
    'quality_time',
    'receiving_gifts',
    'acts_of_service',
    'physical_touch',
  ]);
  if (!validValues.has(value)) throw new Error('Invalid love language value');
  return updateProfile({ love_language: value });
};

export const getUserLoveLanguage = async () => {
  const profile = await getProfile();
  return profile?.love_language || null;
};
