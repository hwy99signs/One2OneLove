import { supabase, handleSupabaseError } from './supabase';

export const getMutualPartnerDirectoryProfile = async () => {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) return null;

    const { data, error } = await supabase.rpc('get_mutual_partner_directory_profile');
    if (error) throw error;

    const profile = Array.isArray(data) ? data[0] : data;
    if (!profile) return null;

    return {
      id: profile.id,
      full_name: profile.name || '',
      avatar_url: profile.avatar_url || null,
      bio: profile.bio || null,
      relationship_status: profile.relationship_status || null,
      location: profile.location || null,
      interests: Array.isArray(profile.interests) ? profile.interests : [],
      created_date: profile.created_at || null,
      email: null,
    };
  } catch (error) {
    throw new Error(handleSupabaseError(error));
  }
};
