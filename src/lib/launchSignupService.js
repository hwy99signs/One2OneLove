import { launchAuthApi } from '@/lib/launchAuthApi';

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
  if (!country || !preferredLanguage) {
    return { success: false, error: 'Please select your country and preferred language.' };
  }

  if (!termsAcceptedAt || !termsVersion || !age18Confirmed || !privacyPolicyAcknowledged) {
    return { success: false, error: 'Terms, privacy acknowledgement, and 18+ confirmation are required before account creation.' };
  }

  try {
    const result = await launchAuthApi.register({
      name,
      email,
      password,
      country,
      preferredLanguage,
      termsAcceptedAt,
      termsVersion,
      privacyPolicyAcknowledged: Boolean(privacyPolicyAcknowledged),
      age18Confirmed: Boolean(age18Confirmed),
    });

    if (!result?.success || !result?.user) {
      return { success: false, error: result?.error?.message || 'Account creation failed.' };
    }

    if (result.user.emailVerified) {
      return {
        success: false,
        configurationError: true,
        error: 'Email verification is not being enforced by the authentication service.',
      };
    }

    return {
      success: true,
      user: result.user,
      emailVerificationRequired: true,
      verificationEmailExpected: result.verificationEmailExpected !== false,
    };
  } catch (error) {
    console.error('Launch registration error:', error);
    return { success: false, error: error?.message || 'Account creation failed.' };
  }
}

export async function resendLaunchVerification(email) {
  try {
    const result = await launchAuthApi.resendVerification(email);
    return result?.success
      ? { success: true }
      : { success: false, error: result?.error?.message || 'Verification email could not be sent.' };
  } catch (error) {
    return { success: false, error: error?.message || 'Verification email could not be sent.' };
  }
}
