import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  apiRequest,
  getAuthSessionWithRetry,
  getProfile,
  signInWithEmail,
  signOutAuth,
} from '@/lib/apiClient';
import {
  isDocumentHidden,
  isIdleFor,
  onResumeFromIdle,
  USER_IDLE_LIMIT_MS,
} from '@/lib/activityGuard';
import { setAnalyticsIdentity } from '@/lib/interactionAnalytics';

const AuthContext = createContext(null);

function mergeUser(authUser, profile) {
  if (!authUser) return null;
  const safeProfile = profile && typeof profile === 'object' ? profile : {};
  return {
    id: authUser.id,
    email: authUser.email,
    role: authUser.role || 'user',
    ...safeProfile,
    name: safeProfile.name || authUser.name || authUser.email?.split('@')[0] || 'Member',
    user_type: safeProfile.user_type || 'regular',
    emailVerified: authUser.emailVerified === true,
    phoneNumber: authUser.phoneNumber || safeProfile.phone_number || null,
    phoneNumberVerified: authUser.phoneNumberVerified === true || safeProfile.phone_number_verified === true,
    phone_verification_required: safeProfile.phone_verification_required === true,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUserProfile = async ({ preserveOnNull = false } = {}) => {
    try {
      const auth = await getAuthSessionWithRetry(3, 250);
      if (!auth?.user) {
        if (preserveOnNull) return undefined;
        setUser(null);
        return null;
      }

      let profile = null;
      try {
        profile = await getProfile();
      } catch (error) {
        if (error?.status !== 401) console.warn('Profile refresh failed:', error);
      }

      const merged = mergeUser(auth.user, profile);
      setUser(merged);
      return merged;
    } catch (error) {
      if (error?.status === 401) {
        setUser(null);
        return null;
      }

      // A temporary network/Worker/Neon error must not silently sign out a user.
      console.warn('Session refresh failed; preserving current sign-in state:', error);
      return undefined;
    }
  };

  // Click identity (2026-10-10): publish the signed-in member to the click
  // tracker so member clicks carry their username into the admin feeds;
  // signing out clears it, and guests publish nothing. The profile spread
  // in mergeUser carries username when /api/profile provides one; when it
  // does not, the id alone is published and the server fills the username
  // from the account record.
  useEffect(() => {
    setAnalyticsIdentity(user ? { userId: user.id, username: user.username || null } : null);
  }, [user]);

  useEffect(() => {
    let mounted = true;

    const refresh = async () => {
      setIsLoading(true);
      try {
        const current = await refreshUserProfile({ preserveOnNull: false });
        if (!mounted) return;
        if (current !== undefined) setUser(current);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    refresh();

    // Session/profile keep-alive discipline (2026-10-08): never poll a
    // hidden tab, and stop entirely once the page has seen no interaction
    // for USER_IDLE_LIMIT_MS (5 min). A returning user's first interaction
    // after an idle stop triggers one refresh via onResumeFromIdle below.
    const interval = window.setInterval(() => {
      if (!mounted || isDocumentHidden() || isIdleFor(USER_IDLE_LIMIT_MS)) return;
      refreshUserProfile({ preserveOnNull: true });
    }, 5 * 60 * 1000);

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && mounted && !isIdleFor(USER_IDLE_LIMIT_MS)) {
        refreshUserProfile({ preserveOnNull: true });
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    const unsubscribeResume = onResumeFromIdle(USER_IDLE_LIMIT_MS, () => {
      if (mounted && !isDocumentHidden()) refreshUserProfile({ preserveOnNull: true });
    });

    return () => {
      mounted = false;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
      unsubscribeResume();
    };
  }, []);

  const login = async (email, password) => {
    try {
      const auth = await signInWithEmail(email, password);
      if (!auth?.user) return { success: false, error: 'Sign in failed. Please try again.' };
      const profile = await getProfile().catch(() => null);
      const merged = mergeUser(auth.user, profile);
      setUser(merged);
      return { success: true, user: merged };
    } catch (error) {
      return { success: false, error: error?.message || 'Sign in failed. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      await signOutAuth();
    } catch (error) {
      console.warn('Sign out request failed:', error);
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      const result = await apiRequest('/api/launch-signup', {
        method: 'POST',
        body: {
          name: userData.name,
          email: userData.email,
          password: userData.password,
          country: userData.country || 'US',
          preferredLanguage: userData.preferredLanguage || 'en',
          termsAcceptedAt: userData.termsAcceptedAt || new Date().toISOString(),
          termsVersion: userData.termsVersion || '2026-10-02',
          privacyPolicyAcknowledged: userData.privacyPolicyAcknowledged !== false,
          age18Confirmed: userData.age18Confirmed !== false,
        },
      });
      return { success: true, ...result };
    } catch (error) {
      return { success: false, error: error?.message || 'Registration failed.' };
    }
  };

  const registerTherapist = async (account, application) => {
    const { submitProfessionalApplication } = await import('@/lib/professionalOnboardingService');
    return submitProfessionalApplication('licensed', account, application);
  };

  const registerInfluencer = async (account, application) => {
    const { submitProfessionalApplication } = await import('@/lib/professionalOnboardingService');
    return submitProfessionalApplication('contributor', account, application);
  };

  const registerProfessional = async (account, application) => {
    const { submitProfessionalApplication } = await import('@/lib/professionalOnboardingService');
    return submitProfessionalApplication('coach', account, application);
  };

  const value = useMemo(() => ({
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
  }), [user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
