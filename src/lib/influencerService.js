import { supabase, handleSupabaseError } from './supabase';

/**
 * Create a creator / contributor profile.
 * This is used by the broader Creator, Podcaster, Writer or Influencer onboarding path.
 */
export const createInfluencerProfile = async (userId, influencerData) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      totalFollowerCount,
      platformLinks,
      contentCategories,
      collaborationTypes,
      mediaKitUrl,
      bio,
      profilePhotoUrl,
      emailVerified,
      phoneVerified,
    } = influencerData;

    if (!bio || bio.length < 100) {
      return { success: false, error: 'Bio must be at least 100 characters' };
    }

    const { data, error } = await supabase
      .from('influencer_profiles')
      .insert({
        user_id: userId,
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        profile_photo_url: profilePhotoUrl || null,
        total_follower_count: parseInt(totalFollowerCount) || 0,
        platform_links: platformLinks || {},
        content_categories: contentCategories || [],
        collaboration_types: collaborationTypes || [],
        media_kit_url: mediaKitUrl || null,
        bio: bio,
        email_verified: emailVerified || false,
        phone_verified: phoneVerified || false,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { success: true, profile: data };
  } catch (error) {
    console.error('Error creating contributor profile:', error);
    return { success: false, error: handleSupabaseError(error) };
  }
};

export const getInfluencerProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('influencer_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      throw error;
    }

    return { success: true, profile: data };
  } catch (error) {
    console.error('Error fetching contributor profile:', error);
    return { success: false, error: handleSupabaseError(error) };
  }
};

export const updateInfluencerProfile = async (userId, updates) => {
  try {
    const { data, error } = await supabase
      .from('influencer_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { success: true, profile: data };
  } catch (error) {
    console.error('Error updating contributor profile:', error);
    return { success: false, error: handleSupabaseError(error) };
  }
};
