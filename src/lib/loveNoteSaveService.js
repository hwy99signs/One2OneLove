import { supabase } from './supabase';

const cleanId = (value) => typeof value === 'string' ? value.trim() : '';

export async function getSavedLoveNotes() {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('Sign in is required to view saved Love Notes.');

  const { data, error } = await supabase
    .from('love_note_saves')
    .select(`
      id,
      invitation_id,
      created_at,
      love_note_invitations!inner (
        sender_name,
        recipient_name,
        note_content,
        revealed_at
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function isLoveNoteSaved(invitationId) {
  const id = cleanId(invitationId);
  if (!id) return false;

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return false;

  const { data, error } = await supabase
    .from('love_note_saves')
    .select('id')
    .eq('user_id', user.id)
    .eq('invitation_id', id)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export async function saveLoveNote(invitationId) {
  const id = cleanId(invitationId);
  if (!id) throw new Error('A Love Note invitation is required.');

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('Sign in is required to save a Love Note.');

  const { data, error } = await supabase
    .from('love_note_saves')
    .upsert(
      { user_id: user.id, invitation_id: id },
      { onConflict: 'user_id,invitation_id', ignoreDuplicates: true }
    )
    .select('id, invitation_id, created_at')
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function removeSavedLoveNote(invitationId) {
  const id = cleanId(invitationId);
  if (!id) throw new Error('A Love Note invitation is required.');

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('Sign in is required to update saved Love Notes.');

  const { error } = await supabase
    .from('love_note_saves')
    .delete()
    .eq('user_id', user.id)
    .eq('invitation_id', id);

  if (error) throw error;
  return true;
}

// Intentionally not wired into the reveal UI until the accompanying migration
// has been reviewed and explicitly approved for the live Supabase project.
