import { getProfile, signInWithEmail } from './apiClient';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getProfileAfterLogin() {
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const profile = await getProfile();
      if (profile) return profile;
      lastError = null;
    } catch (error) {
      lastError = error;
    }
    if (attempt < 2) await wait(250 * (attempt + 1));
  }
  if (lastError?.status && ![401, 429].includes(lastError.status)) throw lastError;
  return null;
}

export async function verifiedEmailLogin(email, password) {
  try {
    const auth = await signInWithEmail(email, password);

    if (!auth?.user) {
      return {
        success: false,
        emailVerificationRequired: true,
        error: 'Email verification required. Enter the 6-digit code sent to your email.',
      };
    }

    const profile = await getProfileAfterLogin();
    return {
      success: true,
      user: {
        ...auth.user,
        ...(profile || {}),
      },
      session: auth.session,
      profileLoaded: !!profile,
    };
  } catch (error) {
    const message = error?.message || 'Sign in failed. Please try again.';
    return {
      success: false,
      status: error?.status || null,
      retryAfterMs: error?.retryAfterMs || null,
      emailVerificationRequired: /verif|otp|code/i.test(message),
      error: message,
    };
  }
}
