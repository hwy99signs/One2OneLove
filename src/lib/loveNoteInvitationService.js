import { supabase } from './supabase';

export const LOVE_NOTE_MAX_LENGTH = 500;

const clean = (value, max = 500) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

const normalizeEmail = (value) => clean(value, 320).toLowerCase();
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const requestId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Modern browsers used by the relaunch support randomUUID. This fallback keeps older
  // preview environments functional without pretending to be cryptographic identity.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
};

export const browserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

export const scheduleToIso = (date, time) => {
  const safeDate = clean(date, 20);
  const safeTime = clean(time, 20);
  if (!safeDate || !safeTime) return null;
  const local = new Date(`${safeDate}T${safeTime}`);
  if (Number.isNaN(local.getTime())) throw new Error('Choose a valid date and time.');
  return local.toISOString();
};

export const validateLoveNoteInvitation = ({
  recipientName,
  recipientContact,
  deliveryMethod = 'email',
  noteContent,
}) => {
  const method = clean(deliveryMethod, 20).toLowerCase();
  const content = clean(noteContent, LOVE_NOTE_MAX_LENGTH);
  const contact = method === 'email' ? normalizeEmail(recipientContact) : clean(recipientContact, 160);

  if (!['email', 'sms'].includes(method)) throw new Error('Choose email or text delivery.');
  if (!contact) throw new Error('Enter the recipient contact information.');
  if (method === 'email' && !EMAIL_PATTERN.test(contact)) throw new Error('Enter a valid recipient email address.');
  if (!content) throw new Error('Write or choose a Love Note first.');
  if (String(noteContent || '').trim().length > LOVE_NOTE_MAX_LENGTH) {
    throw new Error(`Love Notes can be up to ${LOVE_NOTE_MAX_LENGTH} characters.`);
  }

  return {
    recipientName: clean(recipientName, 80),
    recipientContact: contact,
    deliveryMethod: method,
    noteContent: content,
  };
};

export const buildLoveNoteInvitationCopy = ({ senderName = 'Someone special' } = {}) => ({
  emailSubject: `${clean(senderName, 80) || 'Someone special'} sent you a private Love Note 💕`,
  preview: `💕 ${clean(senderName, 80) || 'Someone special'} sent you a private Love Note on One2OneLove. Tap to reveal it.`,
});

export const buildLoveNoteInvitationPayload = ({
  recipientName,
  recipientContact,
  deliveryMethod,
  noteContent,
  scheduledFor = null,
  scheduledDate = null,
  scheduledTime = null,
  scheduleTimezone = null,
  clientRequestId = null,
}) => {
  const validated = validateLoveNoteInvitation({ recipientName, recipientContact, deliveryMethod, noteContent });
  const scheduledIso = scheduledFor || scheduleToIso(scheduledDate, scheduledTime);

  return {
    client_request_id: clientRequestId || requestId(),
    recipient_name: validated.recipientName || null,
    recipient_contact: validated.recipientContact,
    delivery_method: validated.deliveryMethod,
    note_content: validated.noteContent,
    scheduled_for: scheduledIso || null,
    schedule_timezone: scheduleTimezone || browserTimezone(),
  };
};

/**
 * Send/schedule a Love Note invitation through the server-side delivery function.
 * A unique client_request_id belongs to this logical submission. Supabase/HTTP retries of
 * the same payload cannot create or deliver a duplicate invitation.
 */
export async function sendLoveNoteInvitation(input = {}) {
  const payload = buildLoveNoteInvitationPayload(input);

  const { data, error } = await supabase.functions.invoke('send-love-note-invitation', {
    body: payload,
  });

  if (error) {
    const message = data?.error || error?.message || 'Unable to send this Love Note right now.';
    const enriched = new Error(message);
    enriched.code = data?.code || null;
    enriched.invitationId = data?.invitation_id || null;
    throw enriched;
  }

  if (data?.error) {
    const enriched = new Error(data.error);
    enriched.code = data.code || null;
    enriched.invitationId = data.invitation_id || null;
    throw enriched;
  }

  return data;
}

// Compatibility aliases for earlier relaunch components/imports.
export const buildInvitationCopy = buildLoveNoteInvitationCopy;
export const validateInvitation = validateLoveNoteInvitation;
export const buildInvitationPayload = buildLoveNoteInvitationPayload;
export const toScheduledISOString = scheduleToIso;
