import { supabase } from './supabase';

export async function revealLoveNote(token) {
  const safeToken = typeof token === 'string' ? token.trim().slice(0, 128) : '';
  if (!safeToken) throw new Error('This Love Note link is missing its private reveal token.');

  const { data, error } = await supabase.functions.invoke('reveal-love-note', {
    body: { token: safeToken },
  });

  if (error) throw error;
  if (!data?.note_content) throw new Error(data?.error || 'Unable to reveal this Love Note.');
  return data;
}
