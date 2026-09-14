import { apiRequest } from './apiClient';

export async function registerLaunchUser({
  name,
  email,
  password,
  country,
  preferredLanguage,
  termsAcceptedAt,
  termsVersion,
  privacyPolicyAcknowledged,
  age18Confirmed,
}) {
  try {
    const payload = await apiRequest('/api/launch-signup', {
      method: 'POST',
      body: {
        name,
        email,
        password,
        country,
        preferredLanguage,
        termsAcceptedAt,
        termsVersion,
        privacyPolicyAcknowledged,
        age18Confirmed,
      },
    });

    return {
      success: true,
      user: payload?.user || null,
      emailVerificationRequired: payload?.emailVerificationRequired !== false,
      verificationEmailExpected: payload?.verificationEmailExpected !== false,
    };
  } catch (error) {
    return { success: false, error: error?.message || 'Account creation failed.' };
  }
}

export async function resendLaunchVerification(email) {
  try {
    await apiRequest('/api/launch-signup/resend', {
      method: 'POST',
      body: { email },
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error?.message || 'Verification email could not be sent.' };
  }
}
