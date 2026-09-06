import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi, onboardingApi, profileApi, specialistProfileApi } from '@/lib/one2oneApi';

const AuthContext = createContext(null);

function authUserFromPayload(payload) {
  return payload?.user || payload?.data?.user || null;
}

function buildUser(authUser, profile = null) {
  if (!authUser && !profile) return null;
  const base = authUser || {};
  const safeProfile = profile && typeof profile === 'object' ? profile : {};
  return {
    id: safeProfile.id || base.id,
    email: safeProfile.email || base.email,
    ...safeProfile,
    name: safeProfile.name || base.name || base.email?.split('@')?.[0] || 'Member',
    user_type: safeProfile.user_type || 'regular',
  };
}

function friendlyAuthError(error) {
  const message = String(error?.message || '').toLowerCase();
  if (message.includes('invalid') && (message.includes('password') || message.includes('credential'))) {
    return 'Invalid email or password';
  }
  if (message.includes('user not found')) return 'Invalid email or password';
  if (message.includes('already') && message.includes('exist')) return 'This email is already registered';
  if (error?.status === 429) return 'Too many attempts. Please try again later.';
  return error?.message || 'An unexpected authentication error occurred';
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUserProfile = useCallback(async () => {
    try {
      const sessionPayload = await authApi.getSession();
      const authUser = authUserFromPayload(sessionPayload);
      if (!authUser) {
        setUser(null);
        return null;
      }

      let profile = null;
      try {
        profile = await profileApi.get();
      } catch (profileError) {
        console.warn('Profile load failed; retaining Neon Auth session.', profileError);
      }

      const nextUser = buildUser(authUser, profile);
      setUser(nextUser);
      return nextUser;
    } catch (error) {
      if (error?.status !== 401) console.warn('Session refresh failed:', error);
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!active) return;
      await refreshUserProfile();
    };

    load();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refreshUserProfile();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      active = false;
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [refreshUserProfile]);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const signInPayload = await authApi.signIn(email, password);
      const authUser = authUserFromPayload(signInPayload);
      const refreshed = await refreshUserProfile();
      const signedInUser = refreshed || buildUser(authUser);
      if (!signedInUser) {
        return { success: false, error: 'Sign in did not create an active session.' };
      }
      setUser(signedInUser);
      return { success: true, user: signedInUser };
    } catch (error) {
      setUser(null);
      setIsLoading(false);
      return { success: false, error: friendlyAuthError(error) };
    }
  };

  const logout = async () => {
    try {
      await authApi.signOut();
    } catch (error) {
      console.warn('Remote sign out failed; clearing local user state.', error);
    } finally {
      setUser(null);
      setIsLoading(false);
      try {
        localStorage.removeItem('sb-one2-one-love-auth-token');
        localStorage.removeItem('sb-one2one-love-auth-token');
      } catch {
        // Legacy Supabase storage cleanup is best-effort only.
      }
    }
  };

  const establishSessionAfterSignup = async (email, password, signupPayload) => {
    let authUser = authUserFromPayload(signupPayload);
    let refreshed = await refreshUserProfile();
    if (refreshed) return refreshed;

    // Neon Auth is configured to auto sign-in, but keep a safe fallback in case
    // that setting changes later.
    const signInPayload = await authApi.signIn(email, password);
    authUser = authUserFromPayload(signInPayload) || authUser;
    refreshed = await refreshUserProfile();
    return refreshed || buildUser(authUser);
  };

  const register = async (userData) => {
    setIsLoading(true);
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

      const signupPayload = await authApi.signUp(email, password, name);
      const signedInUser = await establishSessionAfterSignup(email, password, signupPayload);
      if (!signedInUser) throw new Error('Account created but an authenticated session could not be established.');

      const profile = await onboardingApi.saveMember({
        name,
        relationshipStatus,
        anniversaryDate,
        partnerEmail,
        subscriptionPlan,
        subscriptionPrice,
      });

      const nextUser = buildUser(signedInUser, profile);
      setUser(nextUser);
      setIsLoading(false);
      return { success: true, user: nextUser };
    } catch (error) {
      setIsLoading(false);
      return { success: false, error: friendlyAuthError(error) };
    }
  };

  const registerSpecialist = async (type, userData, specialistData) => {
    setIsLoading(true);
    try {
      const { email, password, firstName, lastName } = userData;
      const name = `${firstName || ''} ${lastName || ''}`.trim() || email.split('@')[0];
      const signupPayload = await authApi.signUp(email, password, name);
      const signedInUser = await establishSessionAfterSignup(email, password, signupPayload);
      if (!signedInUser) throw new Error('Account created but an authenticated session could not be established.');

      const specialistProfile = await specialistProfileApi.save(type, {
        ...specialistData,
        firstName,
        lastName,
        email,
      });
      const refreshed = await refreshUserProfile();
      const nextUser = {
        ...(refreshed || signedInUser),
        user_type: type,
        specialist_profile: specialistProfile,
      };
      setUser(nextUser);
      setIsLoading(false);
      return { success: true, user: nextUser };
    } catch (error) {
      setIsLoading(false);
      return { success: false, error: friendlyAuthError(error) };
    }
  };

  const registerTherapist = (userData, therapistData) => registerSpecialist('therapist', userData, therapistData);
  const registerInfluencer = (userData, influencerData) => registerSpecialist('influencer', userData, influencerData);
  const registerProfessional = (userData, professionalData) => registerSpecialist('professional', userData, professionalData);

  const value = {
    user,
    isAuthenticated: !!user,
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
