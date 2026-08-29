import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, handleSupabaseError, isSupabaseConfigured } from '@/lib/supabase';
import { initializePresence, cleanupPresence } from '@/lib/presenceService';

const AuthContext = createContext(null);
const PROFILE_TIMEOUT_MS = 5000;
const LOGIN_TIMEOUT_MS = 10000;

function withTimeout(promise, milliseconds, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      const timeoutId = setTimeout(() => reject(new Error(message)), milliseconds);
      promise.finally(() => clearTimeout(timeoutId)).catch(() => {});
    }),
  ]);
}

function buildUserData(authUser, profileData = null) {
  if (!authUser) return null;
  const profile = profileData && typeof profileData === 'object' ? profileData : {};
  return {
    id: authUser.id,
    email: authUser.email,
    ...profile,
    name: profile.name || authUser.user_metadata?.name || authUser.email?.split('@')[0],
    user_type: profile.user_type || authUser.user_metadata?.user_type || 'regular',
  };
}

async function createSpecialistProfile(type, userId, profileData) {
  if (type === 'therapist') {
    const { createTherapistProfile } = await import('@/lib/therapistService');
    return createTherapistProfile(userId, profileData);
  }
  if (type === 'influencer') {
    const { createInfluencerProfile } = await import('@/lib/influencerService');
    return createInfluencerProfile(userId, profileData);
  }
  if (type === 'professional') {
    const { createProfessionalProfile } = await import('@/lib/professionalService');
    return createProfessionalProfile(userId, profileData);
  }
  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const ensureUserProfile = async (authUser) => {
    if (!authUser) return null;

    try {
      const result = await withTimeout(
        supabase.from('users').select('*').eq('id', authUser.id).maybeSingle(),
        PROFILE_TIMEOUT_MS,
        'Profile request timed out.'
      );

      if (result?.error) return buildUserData(authUser);
      if (result?.data) return buildUserData(authUser, result.data);

      const fallbackProfile = {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0],
        user_type: authUser.user_metadata?.user_type || 'regular',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('users')
        .upsert(fallbackProfile, { onConflict: 'id' })
        .select()
        .single();

      return error ? buildUserData(authUser) : buildUserData(authUser, data);
    } catch {
      return buildUserData(authUser);
    }
  };

  const hydrateUser = async (authUser, { presence = true } = {}) => {
    const hydrated = await ensureUserProfile(authUser);
    setUser(hydrated || buildUserData(authUser));
    if (presence) {
      try {
        await initializePresence();
      } catch {
        // Presence is non-critical and must never block authentication.
      }
    }
    return hydrated;
  };

  const refreshUserProfile = async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        setUser(null);
        return null;
      }
      return await hydrateUser(data.user, { presence: false });
    } catch {
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const applySessionUser = (authUser, presence = true) => {
      if (!mounted || !authUser) return;
      setUser(buildUserData(authUser));
      setIsLoading(false);
      setTimeout(() => {
        if (!mounted) return;
        void hydrateUser(authUser, { presence }).then((hydrated) => {
          if (mounted && hydrated) setUser(hydrated);
        });
      }, 0);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsLoading(false);
        void cleanupPresence().catch(() => {});
        return;
      }

      if (session?.user && ['INITIAL_SESSION', 'SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) {
        applySessionUser(session.user, true);
      } else if (event === 'INITIAL_SESSION') {
        setUser(null);
        setIsLoading(false);
      }
    });

    void supabase.auth.getSession()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (!error && data?.session?.user) applySessionUser(data.session.user, true);
        else setIsLoading(false);
      })
      .catch(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Application is not properly configured. Please contact support.' };
    }

    try {
      const result = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        LOGIN_TIMEOUT_MS,
        'Sign in timed out. Please try again.'
      );

      if (result?.error) return { success: false, error: handleSupabaseError(result.error) };
      if (!result?.data?.user) return { success: false, error: 'Login failed: no user data received.' };

      const basicUser = buildUserData(result.data.user);
      setUser(basicUser);
      setIsLoading(false);

      setTimeout(() => {
        void hydrateUser(result.data.user, { presence: true });
      }, 0);

      return { success: true, user: basicUser };
    } catch (error) {
      return { success: false, error: error?.message || handleSupabaseError(error) };
    }
  };

  const logout = async () => {
    setUser(null);
    setIsLoading(false);

    try {
      await cleanupPresence();
    } catch {
      // Presence cleanup is best-effort.
    }

    try {
      await supabase.auth.signOut();
    } catch {
      // Local state is already cleared; do not expose auth internals in the browser.
    }

    try {
      localStorage.removeItem('sb-one2one-love-auth-token');
      sessionStorage.clear();
    } catch {
      // Storage cleanup is best-effort.
    }
  };

  const register = async (userData) => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Application is not properly configured. Please contact support.' };
    }

    const {
      email,
      password,
      name,
      relationshipStatus,
      anniversaryDate,
      partnerEmail,
      subscriptionPlan,
      subscriptionPrice,
    } = userData;

    try {
      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : 'https://one2-one-love.vercel.app/auth/callback';

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name,
            relationship_status: relationshipStatus,
            anniversary_date: anniversaryDate,
            partner_email: partnerEmail,
            subscription_plan: subscriptionPlan || 'Basic',
            subscription_price: subscriptionPrice ?? 0,
          },
        },
      });

      if (authError) return { success: false, error: handleSupabaseError(authError) };
      if (!authData?.user) return { success: false, error: 'Registration failed.' };

      const now = new Date().toISOString();
      const profilePayload = {
        id: authData.user.id,
        email,
        name,
        user_type: 'regular',
        relationship_status: relationshipStatus || null,
        anniversary_date: anniversaryDate || null,
        partner_email: partnerEmail || null,
        subscription_plan: subscriptionPlan || 'Basic',
        subscription_price: subscriptionPrice ?? 0,
        subscription_status: 'active',
        email_verified: Boolean(authData.user.email_confirmed_at),
        created_at: now,
        updated_at: now,
      };

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .upsert(profilePayload, { onConflict: 'id' })
        .select()
        .single();

      if (profileError) {
        return {
          success: false,
          error: `Account created but profile setup failed: ${handleSupabaseError(profileError)}. Please contact support.`,
        };
      }

      const newUser = buildUserData(authData.user, profile);
      setUser(newUser);
      setIsLoading(false);
      return { success: true, user: newUser };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  };

  const registerSpecialist = async (userData, profileData, type) => {
    const { email, password, firstName, lastName } = userData;
    const fullName = `${firstName} ${lastName}`.trim();

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name: fullName, user_type: type } },
      });

      if (authError) return { success: false, error: handleSupabaseError(authError) };
      if (!authData?.user) return { success: false, error: 'Registration failed.' };

      const now = new Date().toISOString();
      const { data: userProfile } = await supabase
        .from('users')
        .upsert({
          id: authData.user.id,
          email,
          name: fullName,
          user_type: type,
          created_at: now,
          updated_at: now,
        }, { onConflict: 'id' })
        .select()
        .single();

      try {
        await createSpecialistProfile(type, authData.user.id, {
          ...profileData,
          firstName,
          lastName,
          email,
          emailVerified: Boolean(profileData?.emailVerified),
          phoneVerified: Boolean(profileData?.phoneVerified),
        });
      } catch {
        // The account remains usable even if optional specialist profile setup fails.
      }

      const newUser = buildUserData(authData.user, userProfile || { name: fullName, user_type: type });
      setUser(newUser);
      setIsLoading(false);
      return { success: true, user: newUser };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  };

  const registerTherapist = (userData, therapistData) => registerSpecialist(userData, therapistData, 'therapist');
  const registerInfluencer = (userData, influencerData) => registerSpecialist(userData, influencerData, 'influencer');
  const registerProfessional = (userData, professionalData) => registerSpecialist(userData, professionalData, 'professional');

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    logout,
    register,
    registerTherapist,
    registerInfluencer,
    registerProfessional,
    refreshUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
