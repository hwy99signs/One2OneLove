import { supabase } from './supabase';

const ALLOWED_TYPES = new Set(['therapist', 'influencer', 'professional']);

const clean = (value, max = 500) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

const normalizeEmail = (value) => clean(value, 320).toLowerCase();

export const submitProfessionalApplication = async ({
  applicationType,
  firstName,
  lastName,
  email,
  phone,
  details = {},
  turnstileToken = '',
}) => {
  const type = clean(applicationType, 30).toLowerCase();
  const normalizedEmail = normalizeEmail(email);

  if (!ALLOWED_TYPES.has(type)) throw new Error('Invalid application type.');
  if (!clean(firstName, 80) || !clean(lastName, 80)) throw new Error('First and last name are required.');
  if (!normalizedEmail.includes('@')) throw new Error('A valid email address is required.');
  if (clean(phone, 40).length < 7) throw new Error('A valid phone number is required.');

  const { data, error } = await supabase.functions.invoke('submit-professional-application', {
    body: {
      applicationType: type,
      firstName: clean(firstName, 80),
      lastName: clean(lastName, 80),
      email: normalizedEmail,
      phone: clean(phone, 40),
      details,
      turnstileToken: clean(turnstileToken, 2048),
    },
  });

  if (error) {
    const message = error?.message || 'Application submission is not available right now.';
    throw new Error(message);
  }

  if (!data?.success) {
    const code = data?.error || 'APPLICATION_FAILED';
    if (code === 'ACTIVE_APPLICATION_EXISTS') {
      throw new Error('An active application already exists for this email and role.');
    }
    if (code === 'APPLICATIONS_NOT_ENABLED') {
      throw new Error('Professional applications are not open yet. Please check back soon.');
    }
    if (code === 'ANTI_ABUSE_CHECK_FAILED') {
      throw new Error('We could not verify this submission. Please try again.');
    }
    throw new Error('Application submission could not be completed. Please try again.');
  }

  return data.application;
};
