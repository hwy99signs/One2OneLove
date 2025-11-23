import { supabase, handleSupabaseError } from './supabase';

/**
 * Ensure the current user is allowed to use the profile backend
 * Only regular users (or legacy users without a user_type) are permitted
 * @param {string} userId
 * @param {string} [columns='user_type']
 * @returns {Promise<Object>} Selected user columns
 */
const ensureRegularUserAccess = async (userId, columns = 'user_type') => {
  try {
    let selection = columns || 'user_type';

    if (selection !== '*' && !selection.split(',').map((col) => col.trim()).includes('user_type')) {
      selection = `user_type,${selection}`;
    }

    const { data, error } = await supabase
      .from('users')
      .select(selection)
      .eq('id', userId)
      .single();

    if (error) {
      throw error;
    }

    if (data?.user_type && data.user_type !== 'regular') {
      throw new Error('Profile management is currently available for regular users only.');
    }

    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Upload profile picture to Supabase Storage
 * @param {File} file - The image file to upload
 * @param {string} userId - The user's ID
 * @returns {Promise<string>} Public URL of the uploaded image
 */
export const uploadProfilePicture = async (file, userId) => {
  try {
    await ensureRegularUserAccess(userId);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Image size must be less than 5MB');
    }

    // Get file extension
    const fileExt = file.name.split('.').pop();
    const fileName = `profile.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // Delete old profile picture if exists
    const { data: existingFiles } = await supabase.storage
      .from('profile-pictures')
      .list(userId, {
        search: 'profile'
      });

    if (existingFiles && existingFiles.length > 0) {
      const oldFiles = existingFiles
        .filter(f => f.name.startsWith('profile.'))
        .map(f => `${userId}/${f.name}`);
      
      if (oldFiles.length > 0) {
        await supabase.storage
          .from('profile-pictures')
          .remove(oldFiles);
      }
    }

    // Upload new profile picture
    const { data, error } = await supabase.storage
      .from('profile-pictures')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true // Replace if exists
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw new Error(handleSupabaseError(error));
  }
};

/**
 * Get user profile
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} User profile data
 */
export const getUserProfile = async (userId) => {
  try {
    const profile = await ensureRegularUserAccess(userId, '*');
    return profile;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw new Error(handleSupabaseError(error));
  }
};

/**
 * Update user profile
 * @param {string} userId - The user's ID
 * @param {Object} updates - Profile fields to update
 * @returns {Promise<Object>} Updated user profile
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    await ensureRegularUserAccess(userId);

    // Prepare update data
    const updateData = {
      updated_at: new Date().toISOString(),
      ...updates
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error(handleSupabaseError(error));
  }
};

/**
 * Delete profile picture
 * @param {string} userId - The user's ID
 * @returns {Promise<void>}
 */
export const deleteProfilePicture = async (userId) => {
  try {
    await ensureRegularUserAccess(userId);

    // List all files for this user
    const { data: files, error: listError } = await supabase.storage
      .from('profile-pictures')
      .list(userId);

    if (listError) throw listError;

    if (files && files.length > 0) {
      const filePaths = files
        .filter(f => f.name.startsWith('profile.'))
        .map(f => `${userId}/${f.name}`);

      if (filePaths.length > 0) {
        const { error: deleteError } = await supabase.storage
          .from('profile-pictures')
          .remove(filePaths);

        if (deleteError) throw deleteError;
      }
    }
  } catch (error) {
    console.error('Error deleting profile picture:', error);
    throw new Error(handleSupabaseError(error));
  }
};

