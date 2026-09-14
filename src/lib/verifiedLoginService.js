import { getProfile, signInWithEmail } from './apiClient';

export async function verifiedEmailLogin(email, password) {
  try {
    const auth = await signInWithEmail(email, password);

    // Neon Auth can accept the email/password sign-in request, send an
    // email-verification OTP, and intentionally withhold a session until the
    // email is verified. In that case there is no thrown error to inspect, so
    // treat a successful sign-in request with no session/user as verification
    // required instead of showing a generic sign-in failure.
    if (!auth?.user) {
      return {
        success: false,
        emailVerificationRequired: true,
        error: 'Email verification required. Enter the 6-digit code sent to your email.',
      };
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
      emailVerificationRequired: /verif|otp|code/i.test(message),
      error: message,
    };
  }
}
