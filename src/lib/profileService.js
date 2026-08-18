import { supabase, handleSupabaseError } from './supabase';

// Relaunch profile writes are intentionally narrower than the historical Base44-era
// profile schema. Partner email is not collected until a reviewed partner-linking flow
// actually needs it, and role/billing/account-email/avatar URL fields are never generic
// browser-editable profile fields.
const SAFE_PROFILE_UPDATE_FIELDS = new Set([
  'name',
  'relationship_status',
  'anniversary_date',
  'bio',
  'location',
  'love_language',
  'partner_name',
]);

const SAFE_PROFILE_RETURN_FIELDS =
  'id,name,relationship_status,anniversary_date,avatar_url,bio,location,love_language,partner_name,user_type,updated_at';

const PROFILE_PICTURE_EDITING_ENABLED = import.meta.env.VITE_PROFILE_PICTURE_EDITING_ENABLED === 'true';
export const profilePictureEditingEnabled = () => PROFILE_PICTURE_EDITING_ENABLED;

const getAuthenticatedOwnUser = async (requestedUserId) => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('User not authenticated');
  if (!requestedUserId || requestedUserId !== user.id) {
    throw new Error('You may manage only your own profile.');
  }
  return user;
};

const ensureRegularUserAccess = async (userId, columns = 'user_type') => {
  await getAuthenticatedOwnUser(userId);

  let selection = columns || 'user_type';
  if (selection !== '*' && !selection.split(',').map((col) => col.trim()).includes('user_type')) {
    selection = `user_type,${selection}`;
  }

  const { data, error } = await supabase
    .from('users')
    .select(selection)
    .eq('id', userId)
    .single();

  if (error) throw error;

  if (data?.user_type && data.user_type !== 'regular') {
    throw new Error('Profile management is currently available for regular users only.');
  }

  return data;
};

const sanitizeProfileUpdates = (updates = {}) => {
  const safe = {};
  for (const [key, value] of Object.entries(updates || {})) {
    if (!SAFE_PROFILE_UPDATE_FIELDS.has(key) || value === undefined) continue;
    safe[key] = value;
  }
  return safe;
};

const requireProfilePictureEditing = () => {
  if (!PROFILE_PICTURE_EDITING_ENABLED) {
    throw new Error('Profile picture editing is not enabled yet.');
  }
};

/**
 * Upload own regular-member profile picture object.
 * This path stays explicitly OFF until the hardened Storage migration and a dedicated
 * server-reviewed profile-avatar assignment flow have passed controlled tests. Returning
 * the uploaded URL alone does not authorize generic `users.avatar_url` mutation.
 */
export const uploadProfilePicture = async (file, userId) => {
  try {
    requireProfilePictureEditing();
    await ensureRegularUserAccess(userId);

    if (!file?.type?.startsWith('image/')) throw new Error('File must be an image');
    if (file.size > 5 * 1024 * 1024) throw new Error('Image size must be less than 5MB');

    const fileExt = String(file.name || '').split('.').pop()?.toLowerCase();
    if (!fileExt || !['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fileExt)) {
      throw new Error('Unsupported image format');
    }

    const fileName = `profile.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { data: existingFiles } = await supabase.storage
      .from('profile-pictures')
      .list(userId, { search: 'profile' });

    if (existingFiles?.length) {
      const oldFiles = existingFiles
        .filter((item) => item.name.startsWith('profile.'))
        .map((item) => `${userId}/${item.name}`);
      if (oldFiles.length) await supabase.storage.from('profile-pictures').remove(oldFiles);
    }

    const { error } = await supabase.storage
      .from('profile-pictures')
      .upload(filePath, file, { cacheControl: '3600', upsert: true });
    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw new Error(handleSupabaseError(error));
  }
};

export const getUserProfile = async (userId) => {
  try {
    return await ensureRegularUserAccess(userId, '*');
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw new Error(handleSupabaseError(error));
  }
};

export const updateUserProfile = async (userId, updates) => {
  try {
    await ensureRegularUserAccess(userId);

    const safeUpdates = sanitizeProfileUpdates(updates);
    if (!Object.keys(safeUpdates).length) {
      throw new Error('No editable profile fields were provided.');
    }

    const { data, error } = await supabase
      .from('users')
      .update({ ...safeUpdates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select(SAFE_PROFILE_RETURN_FIELDS)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error(handleSupabaseError(error));
  }
};

export const deleteProfilePicture = async (userId) => {
  try {
    requireProfilePictureEditing();
    await ensureRegularUserAccess(userId);

    const { data: files, error: listError } = await supabase.storage
      .from('profile-pictures')
      .list(userId);
    if (listError) throw listError;

    const filePaths = (files || [])
      .filter((item) => item.name.startsWith('profile.'))
      .map((item) => `${userId}/${item.name}`);

    if (filePaths.length) {
      const { error: deleteError } = await supabase.storage
        .from('profile-pictures')
        .remove(filePaths);
      if (deleteError) throw deleteError;
    }
  } catch (error) {
    console.error('Error deleting profile picture:', error);
    throw new Error(handleSupabaseError(error));
  }
};

export const refreshProfileCompletion = async (userId) => {
  try {
    await ensureRegularUserAccess(userId);

    const { data, error } = await supabase
      .from('users')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select('profile_completion_percentage, profile_completed_fields, profile_total_fields')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error refreshing profile completion:', error);
    throw new Error(handleSupabaseError(error));
  }
};

export const getProfileCompletion = async (userId) => {
  try {
    await getAuthenticatedOwnUser(userId);

    const { data, error } = await supabase
      .from('users')
      .select('profile_completion_percentage, profile_completed_fields, profile_total_fields')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return {
      percentage: data.profile_completion_percentage || 0,
      completedFields: data.profile_completed_fields || 0,
      totalFields: data.profile_total_fields || 14,
    };
  } catch (error) {
    console.error('Error fetching profile completion:', error);
    throw new Error(handleSupabaseError(error));
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
    const validValues = ['words_of_affirmation', 'quality_time', 'receiving_gifts', 'acts_of_service', 'physical_touch'];
    if (!validValues.includes(dbValue)) throw new Error('Invalid love language value');

    const { data, error } = await supabase
      .from('users')
      .update({ love_language: dbValue, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select(SAFE_PROFILE_RETURN_FIELDS)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving love language:', error);
    throw new Error(handleSupabaseError(error));
  }
};

export const getUserLoveLanguage = async (userId) => {
  try {
    await getAuthenticatedOwnUser(userId);

    const { data, error } = await supabase
      .from('users')
      .select('love_language')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data.love_language;
  } catch (error) {
    console.error('Error fetching love language:', error);
    throw new Error(handleSupabaseError(error));
  }
};