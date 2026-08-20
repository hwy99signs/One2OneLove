import { supabase } from './supabase';

export const SMS_CONSENT_LANGUAGES = ['en', 'es', 'fr', 'it', 'de'];
const E164_PATTERN = /^\+[1-9]\d{7,14}$/;

const clean = (value, max = 200) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

export const normalizeSmsConsentLanguage = (value) => {
  const requested = clean(value, 8).toLowerCase();
  return SMS_CONSENT_LANGUAGES.includes(requested) ? requested : 'en';
};

export const preferredSmsConsentLanguage = () => {
  if (typeof window === 'undefined') return 'en';
  try {
    return normalizeSmsConsentLanguage(window.localStorage.getItem('preferredLanguage'));
  } catch {
    return 'en';
  }
};

export const normalizeSmsConsentPhone = (value) => {
  const normalized = clean(value, 32).replace(/[\s().-]/g, '');
  return E164_PATTERN.test(normalized) ? normalized : null;
};

export async function submitSmsConsent({
  phone,
  language = preferredSmsConsentLanguage(),
  consentChecked = false,
  ownsNumber = false,
} = {}) {
  const normalizedPhone = normalizeSmsConsentPhone(phone);
  if (!normalizedPhone) {
    const error = new Error('SMS_PHONE_E164_REQUIRED');
    error.code = 'SMS_PHONE_E164_REQUIRED';
    throw error;
  }

  if (consentChecked !== true || ownsNumber !== true) {
    const error = new Error('EXPLICIT_RECIPIENT_CONSENT_REQUIRED');
    error.code = 'EXPLICIT_RECIPIENT_CONSENT_REQUIRED';
    throw error;
  }

  const payload = {
    phone: normalizedPhone,
    language: normalizeSmsConsentLanguage(language),
    consent_checked: true,
    owns_number: true,
  };

  const { data, error } = await supabase.functions.invoke('manage-love-note-sms-consent', {
    body: payload,
  });

  if (error || data?.error) {
    const code = data?.error || error?.message || 'SMS_CONSENT_UNAVAILABLE';
    const enriched = new Error(code);
    enriched.code = code;
    throw enriched;
  }

  return data;
}
