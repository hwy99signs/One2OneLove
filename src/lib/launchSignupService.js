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

    // Launch policy requires verification before access. If Supabase email
    // confirmation is enabled (the required production setting), signUp returns
    // no authenticated session until the user verifies the email.
    if (data.session && !emailAlreadyConfirmed) {
      await supabase.auth.signOut().catch(() => {});
    }

    return {
      success: true,
      user: data.user,
      emailVerificationRequired: !emailAlreadyConfirmed,
      emailAlreadyConfirmed,
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
