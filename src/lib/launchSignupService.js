import { apiRequest } from './apiClient';

export async function getLaunchSignupReadiness() {
  try {
    const payload = await apiRequest('/api/launch-signup/readiness');
    const readiness = payload?.readiness || {};
    return {
      success: readiness.publicLaunchIdentityGateReady === true,
      readiness,
      error: readiness.publicLaunchIdentityGateReady === true
        ? null
        : 'Verified registration is temporarily unavailable. Please try again shortly.',
    };
  } catch (error) {
    return { success: false, readiness: null, error: error?.message || 'Verified registration is temporarily unavailable. Please try again shortly.' };
  }
}

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
  selectedPlan = 'Free',
  freeAccount = false,
  username = null,
  quickAccount = false,
  marketingEmailOptIn = false,
  visitorId = null,
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
        freeAccount,
        username,
        quickAccount,
        marketingEmailOptIn,
        visitorId,
      },
    });

    return {
      success: true,
      user: payload?.user || null,
      emailVerificationRequired: payload?.emailVerificationRequired !== false,
      verificationMethod: payload?.verificationMethod || 'otp',
      verificationEmailExpected: payload?.verificationEmailExpected !== false,
      profileReady: payload?.profileReady !== false,
      recoveryPending: payload?.recoveryPending === true,
      resumed: payload?.resumed === true,
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

export async function verifyLaunchEmail(email, otp, signupContext = null) {
  try {
    const payload = await apiRequest('/api/launch-signup/verify', {
      method: 'POST',
      body: { email, otp, ...(signupContext ? { signupContext } : {}) },
    });
    return {
      success: payload?.verified === true,
      profileReady: payload?.profileReady !== false,
      recoveryPending: payload?.recoveryPending === true,
    };
  } catch (error) {
    return { success: false, error: error?.message || 'The verification code is invalid or expired.' };
  }
}


export async function registerQuickUser({
  username,
  email,
  password,
  marketingEmailOptIn = false,
  visitorId = null,
  preferredLanguage = 'en',
}) {
  return registerLaunchUser({
    name: username,
    username,
    email,
    password,
    country: null,
    preferredLanguage,
    termsAcceptedAt: new Date().toISOString(),
    termsVersion: '2026-10-09-quick',
    privacyPolicyAcknowledged: true,
    age18Confirmed: true,
    selectedPlan: 'Free',
    freeAccount: true,
    quickAccount: true,
    marketingEmailOptIn,
    visitorId,
  });
}
