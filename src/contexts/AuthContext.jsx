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
      name: safeProfile?.name || authUser.user_metadata?.name || authUser.email?.split('@')[0],
      user_type: safeProfile?.user_type || authUser.user_metadata?.user_type || 'regular',
      email_verified: true,
    };
  };

  const ensureUserProfile = async (authUser) => {
    if (!authUser || !emailIsConfirmed(authUser)) return null;

    try {
      const profileQuery = supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timeout after 5 seconds')), 5000)
      );

      let result;
      try {
        result = await Promise.race([profileQuery, timeoutPromise]);
      } catch (timeoutError) {
        console.warn('Profile fetch timed out; using confirmed auth data.', timeoutError);
        return buildUserData(authUser);
      }

      const profile = result?.data;
      const profileError = result?.error;

      if (profileError?.code === 'PGRST116') {
        const metadata = authUser.user_metadata || {};
        const userType = metadata.user_type || 'regular';
        const profilePayload = {
          id: authUser.id,
          email: authUser.email,
          name: metadata.name || authUser.email?.split('@')[0],
          user_type: userType,
          email_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Regular-user signup details are preserved in Supabase Auth metadata while
        // the account waits for email confirmation. Once the confirmed session is
        // established, create the profile with those values instead of attempting
        // an unauthenticated pre-confirmation table insert.
        if (userType === 'regular') {
          Object.assign(profilePayload, {
            relationship_status: metadata.relationship_status || null,
            anniversary_date: metadata.anniversary_date || null,
            partner_email: metadata.partner_email || null,
            subscription_plan: metadata.subscription_plan || 'Basic',
            subscription_price: metadata.subscription_price !== undefined ? metadata.subscription_price : 0,
            subscription_status: 'active',
          });
        }

        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .insert(profilePayload)
          .select()
          .single();

        if (createError) {
          console.warn('Unable to create missing profile; using confirmed auth data.', createError);
          return buildUserData(authUser);
        }

        return buildUserData(authUser, newProfile);
      }

      if (profileError) {
        console.warn('Unable to fetch profile; using confirmed auth data.', profileError);
        return buildUserData(authUser);
      }

      if (profile && profile.email_verified !== true) {
        // Auth is the source of truth for email confirmation. Keep the profile flag
        // synchronized when possible, without blocking a confirmed account on a
        // profile-table write failure.
        supabase
          .from('users')
          .update({ email_verified: true, updated_at: new Date().toISOString() })
          .eq('id', authUser.id)
          .then(({ error }) => {
            if (error) console.warn('Unable to sync email_verified profile flag:', error);
          });
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

  const createBaseProfile = async ({ authUser, email, name, userType, extra = {} }) => {
    const confirmed = emailIsConfirmed(authUser);
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authUser.id,
        email,
        name,
        user_type: userType,
        email_verified: confirmed,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...extra,
      })
      .select()
      .single();

    return { profile, profileError, confirmed };
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
        subscriptionPlan,
        subscriptionPrice,
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
            relationship_status: relationshipStatus,
            anniversary_date: anniversaryDate,
            partner_email: partnerEmail,
            subscription_plan: subscriptionPlan || 'Basic',
            subscription_price: subscriptionPrice !== undefined ? subscriptionPrice : 0,
          },
        },
      });

      if (authError) return { success: false, error: handleSupabaseError(authError) };
      if (!authData?.user) return { success: false, error: 'Registration failed.' };

      const confirmed = emailIsConfirmed(authData.user);
      let profile = null;

      if (confirmed && authData.session) {
        const profileResult = await createBaseProfile({
          authUser: authData.user,
          email,
          name,
          userType: 'regular',
          extra: {
            relationship_status: relationshipStatus || null,
            anniversary_date: anniversaryDate || null,
            partner_email: partnerEmail || null,
            subscription_plan: subscriptionPlan || 'Basic',
            subscription_price: subscriptionPrice !== undefined ? subscriptionPrice : 0,
            subscription_status: 'active',
          },
        });

        if (profileResult.profileError) {
          return {
            success: false,
            error: `Account created but profile setup failed: ${handleSupabaseError(profileResult.profileError)}. Please contact support.`,
          };
        }
        profile = profileResult.profile;
      }

      const newUser = {
        id: authData.user.id,
        email: authData.user.email,
        name,
        relationship_status: relationshipStatus,
        anniversary_date: anniversaryDate,
        partner_email: partnerEmail,
        email_verified: confirmed,
        ...(profile || {}),
      };

      return finalizeRegistration({ authData, userData: newUser });
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  };

  const registerTherapist = async (userData, therapistData) => {
    try {
      const { email, password, firstName, lastName } = userData;
      const fullName = `${firstName} ${lastName}`.trim();

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: authRedirectUrl(),
          data: { name: fullName, user_type: 'therapist' },
        },
      });

      if (authError) return { success: false, error: handleSupabaseError(authError) };
      if (!authData?.user) return { success: false, error: 'Registration failed.' };

      const { profile: userProfile, profileError } = await createBaseProfile({
        authUser: authData.user,
        email,
        name: fullName,
        userType: 'therapist',
      });
      if (profileError) console.warn('Therapist base profile creation failed:', profileError);

      const { createTherapistProfile } = await import('@/lib/therapistService');
      const therapistResult = await createTherapistProfile(authData.user.id, {
        ...therapistData,
        firstName,
        lastName,
        email,
        emailVerified: emailIsConfirmed(authData.user),
        phoneVerified: therapistData.phoneVerified || false,
      });
      if (!therapistResult.success) console.warn('Therapist profile creation failed:', therapistResult.error);

      const newUser = {
        id: authData.user.id,
        email: authData.user.email,
        name: fullName,
        user_type: 'therapist',
        email_verified: emailIsConfirmed(authData.user),
        ...userProfile,
      };

      return finalizeRegistration({ authData, userData: newUser });
    } catch (error) {
      console.error('Therapist registration error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  };

  const registerInfluencer = async (userData, influencerData) => {
    try {
      const { email, password, firstName, lastName } = userData;
      const fullName = `${firstName} ${lastName}`.trim();

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: authRedirectUrl(),
          data: { name: fullName, user_type: 'influencer' },
        },
      });

      if (authError) return { success: false, error: handleSupabaseError(authError) };
      if (!authData?.user) return { success: false, error: 'Registration failed.' };

      const { profile: userProfile, profileError } = await createBaseProfile({
        authUser: authData.user,
        email,
        name: fullName,
        userType: 'influencer',
      });
      if (profileError) console.warn('Influencer base profile creation failed:', profileError);

      const { createInfluencerProfile } = await import('@/lib/influencerService');
      const influencerResult = await createInfluencerProfile(authData.user.id, {
        ...influencerData,
        firstName,
        lastName,
        email,
        emailVerified: emailIsConfirmed(authData.user),
        phoneVerified: influencerData.phoneVerified || false,
      });
      if (!influencerResult.success) console.warn('Influencer profile creation failed:', influencerResult.error);

      const newUser = {
        id: authData.user.id,
        email: authData.user.email,
        name: fullName,
        user_type: 'influencer',
        email_verified: emailIsConfirmed(authData.user),
        ...userProfile,
      };

      return finalizeRegistration({ authData, userData: newUser });
    } catch (error) {
      console.error('Influencer registration error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  };

  const registerProfessional = async (userData, professionalData) => {
    try {
      const { email, password, firstName, lastName } = userData;
      const fullName = `${firstName} ${lastName}`.trim();

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: authRedirectUrl(),
          data: { name: fullName, user_type: 'professional' },
        },
      });

      if (authError) return { success: false, error: handleSupabaseError(authError) };
      if (!authData?.user) return { success: false, error: 'Registration failed.' };

      const { profile: userProfile, profileError } = await createBaseProfile({
        authUser: authData.user,
        email,
        name: fullName,
        userType: 'professional',
      });
      if (profileError) console.warn('Professional base profile creation failed:', profileError);

      const { createProfessionalProfile } = await import('@/lib/professionalService');
      const professionalResult = await createProfessionalProfile(authData.user.id, {
        ...professionalData,
        firstName,
        lastName,
        email,
        emailVerified: emailIsConfirmed(authData.user),
        phoneVerified: professionalData.phoneVerified || false,
      });
      if (!professionalResult.success) console.warn('Professional profile creation failed:', professionalResult.error);

      const newUser = {
        id: authData.user.id,
        email: authData.user.email,
        name: fullName,
        user_type: 'professional',
        email_verified: emailIsConfirmed(authData.user),
        ...userProfile,
      };

      return finalizeRegistration({ authData, userData: newUser });
    } catch (error) {
      console.error('Professional registration error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  };

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
