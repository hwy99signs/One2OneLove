import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, handleSupabaseError, isSupabaseConfigured } from '@/lib/supabase';
import { initializePresence, cleanupPresence } from '@/lib/presenceService';

const AuthContext = createContext(null);

const emailIsConfirmed = (authUser) =>
  Boolean(authUser?.email_confirmed_at || authUser?.confirmed_at);

const authRedirectUrl = () =>
  typeof window !== 'undefined'
    ? `${window.location.origin}/auth/callback`
    : 'https://one2onelove.com/auth/callback';

const PROFESSIONAL_APPLICATION_MESSAGE =
  'Professional accounts are created only after application review. Please use the appropriate One2OneLove application page.';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const buildUserData = (authUser, profileData = null) => {
    if (!authUser) return null;
    const safeProfile = profileData && typeof profileData === 'object' ? profileData : {};

    return {
      id: authUser.id,
      email: authUser.email,
      ...safeProfile,
      name: safeProfile?.name || authUser.user_metadata?.name || 'Member',
      // Account role comes only from the trusted profile row. Auth metadata is user-
      // supplied at signup and must never grant therapist/influencer/professional access.
      user_type: safeProfile?.user_type || 'regular',
      // Supabase Auth is the source of truth for confirmation; do not trust or require a
      // writable duplicate profile flag for access decisions.
      email_verified: emailIsConfirmed(authUser),
    };
  };

  const fetchOwnProfile = async (authUser) => {
    const profileQuery = supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Profile fetch timeout after 5 seconds')), 5000)
    );

    return Promise.race([profileQuery, timeoutPromise]);
  };

  const bootstrapRegularProfile = async (authUser) => {
    const metadata = authUser?.user_metadata || {};

    // Legacy professional accounts must be repaired/reviewed by a trusted admin path;
    // never let user-controlled metadata self-create a privileged profile.
    if (metadata.user_type && metadata.user_type !== 'regular') {
      console.warn('Missing non-regular profile requires trusted administrative review.');
      return null;
    }

    const { error } = await supabase.rpc('ensure_own_regular_profile', {
      p_name: metadata.name || null,
      p_relationship_status: metadata.relationship_status || null,
      p_anniversary_date: metadata.anniversary_date || null,
      p_partner_email: metadata.partner_email || null,
    });

    if (error) throw error;

    const refreshed = await fetchOwnProfile(authUser);
    if (refreshed?.error) throw refreshed.error;
    return refreshed?.data || null;
  };

  const ensureUserProfile = async (authUser) => {
    if (!authUser || !emailIsConfirmed(authUser)) return null;

    try {
      const result = await fetchOwnProfile(authUser);
      const profile = result?.data;
      const profileError = result?.error;

      if (profileError) {
        console.warn('Unable to fetch own profile; using confirmed auth data.', profileError);
        return buildUserData(authUser);
      }

      if (!profile) {
        try {
          const bootstrappedProfile = await bootstrapRegularProfile(authUser);
          if (bootstrappedProfile) return buildUserData(authUser, bootstrappedProfile);
        } catch (createError) {
          // Before the staged migration is applied, the preview may not yet have this
          // RPC. Fail closed on profile creation rather than falling back to a direct
          // browser INSERT that could set privileged account fields.
          console.warn('Unable to bootstrap missing regular profile through trusted RPC.', createError);
        }
        return buildUserData(authUser);
      }

      return buildUserData(authUser, profile);
    } catch (error) {
      console.warn('Unexpected profile lookup error; using confirmed auth data.', error);
      return buildUserData(authUser);
    }
  };

  const establishConfirmedSession = async (authUser) => {
    if (!authUser || !emailIsConfirmed(authUser)) {
      setUser(null);
      return null;
    }

    const userData = await ensureUserProfile(authUser);
    if (!userData) {
      setUser(null);
      return null;
    }

    setUser(userData);
    initializePresence().catch((error) => {
      console.warn('Presence initialization failed:', error);
    });
    return userData;
  };

  const rejectUnconfirmedSession = async () => {
    setUser(null);
    try {
      await cleanupPresence();
    } catch (error) {
      console.warn('Presence cleanup failed while rejecting unconfirmed session:', error);
    }
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('Unable to clear unconfirmed Supabase session:', error);
    }
  };

  const refreshUserProfile = async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        setUser(null);
        return null;
      }

      if (!emailIsConfirmed(data.user)) {
        await rejectUnconfirmedSession();
        return null;
      }

      return await establishConfirmedSession(data.user);
    } catch (error) {
      console.error('refreshUserProfile error:', error);
      setUser(null);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const syncSession = async (session) => {
      if (!mounted) return;

      const authUser = session?.user;
      if (!authUser) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      if (!emailIsConfirmed(authUser)) {
        await rejectUnconfirmedSession();
        if (mounted) setIsLoading(false);
        return;
      }

      const userData = await ensureUserProfile(authUser);
      if (!mounted) return;
      setUser(userData);
      setIsLoading(false);
      initializePresence().catch((error) => console.warn('Presence initialization failed:', error));
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsLoading(false);
        cleanupPresence().catch((error) => console.warn('Presence cleanup failed:', error));
        return;
      }

      if (['INITIAL_SESSION', 'SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) {
        void syncSession(session);
      }
    });

    // Fallback for environments where INITIAL_SESSION is delayed or omitted.
    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          console.warn('Unable to restore auth session:', error);
          setIsLoading(false);
          return;
        }
        void syncSession(data?.session || null);
      })
      .catch((error) => {
        console.warn('Auth session restore failed:', error);
        if (mounted) setIsLoading(false);
      });

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible' || !mounted) return;
      supabase.auth.getSession()
        .then(({ data }) => syncSession(data?.session || null))
        .catch((error) => console.warn('Visible-session check failed:', error));
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const login = async (email, password) => {
    try {
      if (!isSupabaseConfigured()) {
        return {
          success: false,
          error: 'Application is not properly configured. Please contact support.',
        };
      }

      // Prevent a stale authenticated account from leaking into a different login attempt.
      const { data: currentSession } = await supabase.auth.getSession();
      if (currentSession?.session) {
        await supabase.auth.signOut();
        setUser(null);
      }

      const signInPromise = supabase.auth.signInWithPassword({ email, password });
      const timeoutPromise = new Promise((resolve) =>
        setTimeout(() => resolve({ timedOut: true }), 10000)
      );
      const result = await Promise.race([signInPromise, timeoutPromise]);

      if (result?.timedOut) {
        return { success: false, error: 'Sign in timed out. Please try again.' };
      }

      const { data, error } = result;
      if (error) {
        setUser(null);
        return { success: false, error: handleSupabaseError(error) };
      }

      if (!data?.user) {
        setUser(null);
        return { success: false, error: 'Login failed: No user data received.' };
      }

      if (!emailIsConfirmed(data.user)) {
        await rejectUnconfirmedSession();
        return { success: false, error: 'Please confirm your email before signing in.' };
      }

      const basicUserData = buildUserData(data.user);
      setUser(basicUserData);

      ensureUserProfile(data.user)
        .then((profileData) => {
          if (profileData) setUser(profileData);
        })
        .catch((error) => console.warn('Profile fetch failed after login:', error));

      initializePresence().catch((error) => console.warn('Presence initialization failed:', error));
      return { success: true, user: basicUserData };
    } catch (error) {
      console.error('Login error:', error);
      setUser(null);
      return { success: false, error: error?.message || handleSupabaseError(error) };
    }
  };

  const logout = async () => {
    setUser(null);
    setIsLoading(false);

    try {
      await cleanupPresence();
    } catch (error) {
      console.warn('Presence cleanup failed during logout:', error);
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) console.warn('Supabase signOut returned an error:', error);
    } catch (error) {
      console.warn('Supabase signOut failed:', error);
    }
  };

  const finalizeRegistration = async ({ authData, userData }) => {
    const confirmed = emailIsConfirmed(authData?.user);
    const hasConfirmedSession = Boolean(authData?.session && confirmed);

    if (hasConfirmedSession) {
      setUser(userData);
      initializePresence().catch((error) => console.warn('Presence initialization failed:', error));
    } else {
      setUser(null);
    }

    return {
      success: true,
      user: userData,
      requiresEmailConfirmation: !confirmed,
    };
  };

  const register = async (userData) => {
    try {
      const {
        email,
        password,
        name,
        relationshipStatus,
        anniversaryDate,
        partnerEmail,
      } = userData;

      if (!isSupabaseConfigured()) {
        return { success: false, error: 'Application is not properly configured. Please contact support.' };
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: authRedirectUrl(),
          data: {
            name,
            user_type: 'regular',
            relationship_status: relationshipStatus || null,
            anniversary_date: anniversaryDate || null,
            partner_email: partnerEmail || null,
          },
        },
      });

      if (authError) return { success: false, error: handleSupabaseError(authError) };
      if (!authData?.user) return { success: false, error: 'Registration failed.' };

      const confirmed = emailIsConfirmed(authData.user);
      let profile = null;

      if (confirmed && authData.session) {
        // The trusted RPC derives id/email/regular role from Supabase Auth and accepts
        // only ordinary profile fields. It replaces the former direct users-table INSERT.
        try {
          const profileData = await ensureUserProfile(authData.user);
          profile = profileData;
        } catch (profileError) {
          console.warn('Confirmed account created; profile bootstrap is pending.', profileError);
        }
      }

      const newUser = profile || buildUserData(authData.user, {
        name,
        relationship_status: relationshipStatus || null,
        anniversary_date: anniversaryDate || null,
        partner_email: partnerEmail || null,
        user_type: 'regular',
      });

      return finalizeRegistration({ authData, userData: newUser });
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  };

  // Public professional flows are now review-first applications. Preserve these API
  // keys temporarily for any legacy caller, but fail closed instead of creating an Auth
  // account or trusting browser-supplied verification/role data.
  const registerTherapist = async () => ({ success: false, error: PROFESSIONAL_APPLICATION_MESSAGE });
  const registerInfluencer = async () => ({ success: false, error: PROFESSIONAL_APPLICATION_MESSAGE });
  const registerProfessional = async () => ({ success: false, error: PROFESSIONAL_APPLICATION_MESSAGE });

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
