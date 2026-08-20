import { supabase } from './supabase';

export const LOVE_NOTE_MAX_LENGTH = 500;
export const LOVE_NOTE_DELIVERY_LANGUAGES = ['en', 'es', 'fr', 'it', 'de'];

const clean = (value, max = 500) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

const normalizeEmail = (value) => clean(value, 320).toLowerCase();
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const E164_PATTERN = /^\+[1-9]\d{7,14}$/;

export const normalizeLoveNoteDeliveryLanguage = (value) => {
  const requested = clean(value, 8).toLowerCase();
  return LOVE_NOTE_DELIVERY_LANGUAGES.includes(requested) ? requested : 'en';
};

export const preferredLoveNoteDeliveryLanguage = () => {
  if (typeof window === 'undefined') return 'en';
  try {
    return normalizeLoveNoteDeliveryLanguage(window.localStorage.getItem('preferredLanguage'));
  } catch {
    return 'en';
  }
};

export const normalizeLoveNoteSmsNumber = (value) => {
  const normalized = clean(value, 32).replace(/[\s().-]/g, '');
  return E164_PATTERN.test(normalized) ? normalized : null;
};

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
  deliveryLanguage = preferredLoveNoteDeliveryLanguage(),
  noteContent,
}) => {
  const method = clean(deliveryMethod, 20).toLowerCase();
  const content = clean(noteContent, LOVE_NOTE_MAX_LENGTH);
  const language = normalizeLoveNoteDeliveryLanguage(deliveryLanguage);

  if (!['email', 'sms'].includes(method)) throw new Error('Choose email or text delivery.');

  let contact = '';
  if (method === 'email') {
    contact = normalizeEmail(recipientContact);
    if (!contact) throw new Error('Enter the recipient contact information.');
    if (!EMAIL_PATTERN.test(contact)) throw new Error('Enter a valid recipient email address.');
  } else {
    contact = normalizeLoveNoteSmsNumber(recipientContact) || '';
    if (!contact) {
      const error = new Error('SMS phone numbers must include the country code, for example +15551234567.');
      error.code = 'SMS_PHONE_E164_REQUIRED';
      throw error;
    }
  }

  if (!content) throw new Error('Write or choose a Love Note first.');
  if (String(noteContent || '').trim().length > LOVE_NOTE_MAX_LENGTH) {
    throw new Error(`Love Notes can be up to ${LOVE_NOTE_MAX_LENGTH} characters.`);
  }

  return {
    recipientName: clean(recipientName, 80),
    recipientContact: contact,
    deliveryMethod: method,
    deliveryLanguage: language,
    noteContent: content,
  };
};

const invitationCopy = {
  en: (sender) => ({
    emailSubject: `${sender} sent you a private Love Note 💕`,
    preview: `💕 ${sender} sent you a private Love Note on One2OneLove. Tap to reveal it.`,
  }),
  es: (sender) => ({
    emailSubject: `${sender} te envió una Nota de Amor privada 💕`,
    preview: `💕 ${sender} te envió una Nota de Amor privada en One2OneLove. Toca para revelarla.`,
  }),
  fr: (sender) => ({
    emailSubject: `${sender} vous a envoyé un Mot d’Amour privé 💕`,
    preview: `💕 ${sender} vous a envoyé un Mot d’Amour privé sur One2OneLove. Touchez pour le révéler.`,
  }),
  it: (sender) => ({
    emailSubject: `${sender} ti ha inviato una Nota d’Amore privata 💕`,
    preview: `💕 ${sender} ti ha inviato una Nota d’Amore privata su One2OneLove. Tocca per rivelarla.`,
  }),
  de: (sender) => ({
    emailSubject: `${sender} hat dir eine private Liebesnotiz gesendet 💕`,
    preview: `💕 ${sender} hat dir eine private Liebesnotiz auf One2OneLove gesendet. Tippe zum Öffnen.`,
  }),
};

export const buildLoveNoteInvitationCopy = ({
  senderName = 'One2OneLove member',
  deliveryLanguage = preferredLoveNoteDeliveryLanguage(),
} = {}) => {
  const language = normalizeLoveNoteDeliveryLanguage(deliveryLanguage);
  const sender = clean(senderName, 80) || 'One2OneLove member';
  return invitationCopy[language](sender);
};

export const buildLoveNoteInvitationPayload = ({
  recipientName,
  recipientContact,
  deliveryMethod,
  deliveryLanguage = preferredLoveNoteDeliveryLanguage(),
  noteContent,
  scheduledFor = null,
  scheduledDate = null,
  scheduledTime = null,
  scheduleTimezone = null,
  clientRequestId = null,
}) => {
  const validated = validateLoveNoteInvitation({
    recipientName,
    recipientContact,
    deliveryMethod,
    deliveryLanguage,
    noteContent,
  });
  const scheduledIso = scheduledFor || scheduleToIso(scheduledDate, scheduledTime);

  return {
    client_request_id: clientRequestId || requestId(),
    recipient_name: validated.recipientName || null,
    recipient_contact: validated.recipientContact,
    delivery_method: validated.deliveryMethod,
    delivery_language: validated.deliveryLanguage,
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
