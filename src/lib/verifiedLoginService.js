import { getProfile, signInWithEmail } from './apiClient';

export async function verifiedEmailLogin(email, password) {
  try {
    const auth = await signInWithEmail(email, password);
    if (!auth?.user) {
      return { success: false, error: 'Sign in failed. Please try again.' };
    }

    const profile = await getProfile().catch(() => null);
    return {
      success: true,
      user: {
        ...auth.user,
        ...(profile || {}),
      },
      session: auth.session,
    };
  } catch (error) {
    const message = error?.message || 'Sign in failed. Please try again.';
    return {
      success: false,
      emailVerificationRequired: /verif/i.test(message),
      error: message,
    };
  }
}
