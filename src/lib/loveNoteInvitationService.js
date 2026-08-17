import { supabase } from './supabase';

const clean = (value, max = 500) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

export function buildLoveNoteInvitationCopy({ senderName, revealUrl = '[secure reveal link]' } = {}) {
  const sender = clean(senderName, 80) || 'Someone special';
  const link = clean(revealUrl, 500) || '[secure reveal link]';

  return {
    sms: `💕 ${sender} sent you a private Love Note on One2OneLove. Tap to reveal it: ${link}`,
    emailSubject: `${sender} sent you a private Love Note 💕`,
    emailBody: `${sender} sent you a private Love Note on One2OneLove.\n\nYour message is being kept private until you open it.\n\nReveal your Love Note: ${link}`,
  };
}

export function prepareLoveNoteInvitationPayload({
  senderName,
  recipientName,
  deliveryMethod,
  recipientContact,
  noteContent,
  deliveryTime = 'now',
  scheduleDate = '',
  scheduleTime = '',
} = {}) {
  const payload = {
    sender_name: clean(senderName, 80),
    recipient_name: clean(recipientName, 80),
    delivery_method: deliveryMethod === 'email' ? 'email' : 'sms',
    recipient_contact: clean(recipientContact, 160),
    note_content: clean(noteContent, 500),
    delivery_time: deliveryTime === 'schedule' ? 'schedule' : 'now',
    schedule_date: clean(scheduleDate, 20),
    schedule_time: clean(scheduleTime, 20),
  };

  if (!payload.sender_name) throw new Error('Sender name is required.');
  if (!payload.recipient_contact) throw new Error('Recipient contact is required.');
  if (!payload.note_content) throw new Error('Love Note content is required.');
  if (payload.delivery_time === 'schedule' && (!payload.schedule_date || !payload.schedule_time)) {
    throw new Error('Scheduled delivery requires a date and time.');
  }

  return payload;
}

// This function is intentionally not called by the development preview yet.
// It becomes the single client entry point once the Love Notes backend migration
// and delivery provider are explicitly approved and deployed.
export async function sendLoveNoteInvitation(input) {
  const body = prepareLoveNoteInvitationPayload(input);
  const { data, error } = await supabase.functions.invoke('send-love-note-invitation', { body });

  if (error) throw error;
  return data;
}
