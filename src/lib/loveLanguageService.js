import { supabase, handleSupabaseError } from './supabase';

const VALUE_MAP = {
  words: 'words_of_affirmation',
  quality: 'quality_time',
  gifts: 'receiving_gifts',
  service: 'acts_of_service',
  touch: 'physical_touch',
};

export async function saveLoveLanguagePreference(userId, preferenceId) {
  if (!userId) throw new Error('Authentication required');
  const loveLanguage = VALUE_MAP[preferenceId];
  if (!loveLanguage) throw new Error('Invalid love language preference');

  try {
    const { data, error } = await supabase
      .from('users')
      .update({ love_language: loveLanguage, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select('love_language')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw new Error(handleSupabaseError(error));
  }
}

export default { saveLoveLanguagePreference };
