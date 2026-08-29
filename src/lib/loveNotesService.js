import { supabase, handleSupabaseError } from './supabase';

const LOVE_NOTE_FIELDS = 'id,user_id,recipient_user_id,content,background_color,text_color,font_family,font_size,alignment,is_sent,sent_at,is_read,created_at,updated_at';

const requireUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error('Authentication required');
  return data.user;
};

export const getMyLoveNotes = async () => {
  try {
    const user = await requireUser();
    const { data, error } = await supabase
      .from('love_notes')
      .select(LOVE_NOTE_FIELDS)
      .or(`user_id.eq.${user.id},recipient_user_id.eq.${user.id}`)
      .eq('is_sent', true)
      .order('sent_at', { ascending: false, nullsFirst: false });

    if (error) throw error;
    return (data || []).map((note) => ({
      ...note,
      direction: note.user_id === user.id ? 'sent' : 'received',
      isOwn: note.user_id === user.id,
    }));
  } catch (error) {
    throw new Error(handleSupabaseError(error));
  }
};

export const sendLoveNoteToMutualPartner = async ({ content, backgroundColor, textColor, fontFamily, fontSize, alignment }) => {
  try {
    await requireUser();
    const cleanContent = String(content || '').trim();
    if (!cleanContent || cleanContent.length > 5000) throw new Error('Love note must be between 1 and 5000 characters');

    const { data, error } = await supabase.rpc('send_love_note_to_mutual_partner', {
      p_content: cleanContent,
      p_background_color: backgroundColor || '#FFF7ED',
      p_text_color: textColor || '#1F2937',
      p_font_family: fontFamily || 'Georgia',
      p_font_size: Math.min(Math.max(Number(fontSize) || 18, 12), 32),
      p_alignment: ['left', 'center', 'right'].includes(alignment) ? alignment : 'center',
    });

    if (error) throw error;
    return data;
  } catch (error) {
    throw new Error(handleSupabaseError(error));
  }
};

export const markLoveNoteRead = async (noteId) => {
  try {
    await requireUser();
    const { data, error } = await supabase.rpc('mark_received_love_note_read', { p_note_id: noteId });
    if (error) throw error;
    return Boolean(data);
  } catch (error) {
    throw new Error(handleSupabaseError(error));
  }
};

export const deleteSentLoveNote = async (noteId) => {
  try {
    const user = await requireUser();
    const { error } = await supabase.from('love_notes').delete().eq('id', noteId).eq('user_id', user.id);
    if (error) throw error;
  } catch (error) {
    throw new Error(handleSupabaseError(error));
  }
};
