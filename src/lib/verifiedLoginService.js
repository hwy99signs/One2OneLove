import { supabase, handleSupabaseError, isSupabaseConfigured } from "@/lib/supabase";

export async function verifiedEmailLogin(email, password) {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: "One2OneLove account services are not configured.",
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        error: handleSupabaseError(error) || error.message,
      };
    }

    if (!data?.user || !data?.session) {
      return {
        success: false,
        error: "Sign in failed. Please try again.",
      };
    }

    if (!data.user.email_confirmed_at) {
      await supabase.auth.signOut().catch(() => {});
      return {
        success: false,
        emailVerificationRequired: true,
        error: "Please verify your email address before signing in. Check your inbox for the One2OneLove verification email.",
      };
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
    };
  } catch (error) {
    console.error("Verified login error:", error);
    return {
      success: false,
      error: error?.message || handleSupabaseError(error),
    };
  }
}
