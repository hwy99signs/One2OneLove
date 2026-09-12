import { authApi } from '@/lib/one2oneApi';

function userFromPayload(payload) {
  return payload?.user || payload?.data?.user || null;
}

function isVerified(user) {
  return user?.emailVerified === true || user?.email_verified === true || Boolean(user?.email_confirmed_at);
}

export async function verifiedEmailLogin(email, password) {
  try {
    const payload = await authApi.signIn(email, password);
    const user = userFromPayload(payload);

    if (!user) {
      return {
        success: false,
        error: 'Sign in failed. Please try again.',
      };
    }

    if (!isVerified(user)) {
      await authApi.signOut().catch(() => {});
      return {
        success: false,
        emailVerificationRequired: true,
        error: 'Please verify your email address before signing in. Check your inbox for the One2OneLove verification email.',
      };
    }

    return {
      success: true,
      user,
      session: payload?.session || payload?.data?.session || null,
    };
  } catch (error) {
    console.error('Verified login error:', error);
    const message = String(error?.message || '');
    const code = String(error?.code || '');
    const verificationRequired =
      error?.status === 403 && (/verif/i.test(message) || /EMAIL_NOT_VERIFIED/i.test(code));

    if (verificationRequired) {
      return {
        success: false,
        emailVerificationRequired: true,
        error: 'Please verify your email address before signing in. Check your inbox for the One2OneLove verification email.',
      };
    }

    return {
      success: false,
      error: message || 'Sign in failed. Please try again.',
    };
  }
}
