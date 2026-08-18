import { supabase } from './supabase';

const cleanId = (value) => typeof value === 'string' ? value.trim() : '';

const getSignedInUser = async (message) => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error(message);
  return user;
};

export async function getSavedLoveNotes() {
  await getSignedInUser('Sign in is required to view saved Love Notes.');

  // Query the privacy-safe recipient projection rather than joining the private
  // love_note_invitations delivery table from the browser.
  const { data, error } = await supabase
    .from('saved_love_notes')
    .select('id, invitation_id, created_at, sender_name, recipient_name, note_content, revealed_at')
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Preserve the historical UI shape while sourcing it from the safe projection.
  return (data || []).map((item) => ({
    id: item.id,
    invitation_id: item.invitation_id,
    created_at: item.created_at,
    love_note_invitations: {
      sender_name: item.sender_name,
      recipient_name: item.recipient_name,
      note_content: item.note_content,
      revealed_at: item.revealed_at,
    },
  }));
}

export async function isLoveNoteSaved(invitationId) {
  const id = cleanId(invitationId);
  if (!id) return false;

  const user = await getSignedInUser('Sign in is required to view saved Love Notes.');

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

  const user = await getSignedInUser('Sign in is required to save a Love Note.');

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

  const user = await getSignedInUser('Sign in is required to update saved Love Notes.');

  const { error } = await supabase
    .from('love_note_saves')
    .delete()
    .eq('user_id', user.id)
    .eq('invitation_id', id);

  if (error) throw error;
  return true;
}
