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
  selectedPlan = 'Premiere',
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
        selectedPlan,
      },
    });

    return {
      success: true,
      user: payload?.user || null,
      emailVerificationRequired: payload?.emailVerificationRequired !== false,
      verificationMethod: payload?.verificationMethod || 'otp',
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
    return { success: false, error: error?.message || 'Verification code could not be sent.' };
  }
}

export async function verifyLaunchEmail(email, otp) {
  try {
    const payload = await apiRequest('/api/launch-signup/verify', {
      method: 'POST',
      body: { email, otp },
    });
    return { success: payload?.verified === true };
  } catch (error) {
    return { success: false, error: error?.message || 'The verification code is invalid or expired.' };
  }
}
