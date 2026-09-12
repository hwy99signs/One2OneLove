import { supabase, handleSupabaseError, isSupabaseConfigured } from "@/lib/supabase";

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
  if (!isSupabaseConfigured()) {
    return { success: false, error: "One2OneLove account services are not configured." };
  }

  if (!country || !preferredLanguage) {
    return { success: false, error: "Please select your country and preferred language." };
  }

  if (!termsAcceptedAt || !termsVersion || !age18Confirmed) {
    return { success: false, error: "Terms acceptance is required before account creation." };
  }

  const emailRedirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/SignIn?verified=1`
      : "https://one2-one-love.vercel.app/SignIn?verified=1";

  const metadata = {
    name,
    user_type: "regular",
    country,
    preferred_language: preferredLanguage,
    terms_accepted_at: termsAcceptedAt,
    terms_version: termsVersion,
    privacy_policy_acknowledged: Boolean(privacyPolicyAcknowledged),
    age_18_confirmed: Boolean(age18Confirmed),
    signup_source: "one2onelove_prelaunch",
  };

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: metadata,
      },
    });

    if (error) {
      return { success: false, error: handleSupabaseError(error) || error.message };
    }

    if (!data?.user) {
      return { success: false, error: "Account creation did not return a user record." };
    }

    const emailAlreadyConfirmed = Boolean(data.user.email_confirmed_at);

    // One2OneLove launch policy requires email verification before access.
    // With Supabase email confirmation enabled, a new signup is unconfirmed and
    // receives a verification email. If Supabase ever returns an immediate session
    // or an already-confirmed new user, sign out and fail closed so launch QA catches
    // a misconfigured authentication setting rather than silently bypassing verification.
    if (data.session) {
      await supabase.auth.signOut().catch(() => {});
    }

    if (emailAlreadyConfirmed) {
      return {
        success: false,
        configurationError: true,
        error: "Email verification is not being enforced by the authentication service. Enable email confirmation before launch.",
      };
    }

    return {
      success: true,
      user: data.user,
      emailVerificationRequired: true,
      metadata,
    };
  } catch (error) {
    console.error("Launch registration error:", error);
    return { success: false, error: error?.message || handleSupabaseError(error) };
  }
}

export async function resendLaunchVerification(email) {
  const emailRedirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/SignIn?verified=1`
      : "https://one2-one-love.vercel.app/SignIn?verified=1";

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo },
  });

  if (error) {
    return { success: false, error: handleSupabaseError(error) || error.message };
  }

  return { success: true };
}
