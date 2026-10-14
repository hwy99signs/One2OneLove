import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  apiRequest,
  getAuthSessionState,
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

// Remembers, on this device only, that a member was signed in here.
// It records no identity — just "signed in once" — so a page load that
// cannot reach the session checker can hold a reconnecting state
// instead of presenting a false sign-out (2026-10-12 repair).
const SESSION_MARKER_KEY = 'o2ol:session-known';
function markSessionKnown(on) {
  try {
    if (on) window.localStorage.setItem(SESSION_MARKER_KEY, '1');
    else window.localStorage.removeItem(SESSION_MARKER_KEY);
  } catch { /* storage unavailable — the hold simply will not arm */ }
}
function sessionWasKnown() {
  try { return window.localStorage.getItem(SESSION_MARKER_KEY) === '1'; } catch { return false; }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshInFlightRef = useRef(null);
  const lastProfileRef = useRef(null);

  // Publish the signed-in identity to the interaction tracker so an
  // admin sign-in permanently excludes this browser from visitor
  // recording (owner-directed, 2026-10-12). Signing out does not clear
  // the exclusion — see setAnalyticsIdentity in interactionAnalytics.js.
  useEffect(() => {
    setAnalyticsIdentity(user ? { role: user.role, email: user.email } : null);
  }, [user]);

  // Stable identity + in-flight dedupe: Profile's mount effect depends
  // on this function, and an unstable one re-fired the effect after
  // every refresh (each refresh mints a new merged user object),
  // multiplying session reads — fuel for the rate limiter whose 429s
  // then read as logouts (2026-10-12 audit).
  const refreshUserProfile = useCallback(async ({ preserveOnNull = false } = {}) => {
    if (refreshInFlightRef.current) return refreshInFlightRef.current;
    const run = (async () => {
      try {
        const result = await getAuthSessionState(3, 250);
        if (result.state === 'authenticated') {
          let profile = null;
          try {
            profile = await getProfile();
            if (profile) lastProfileRef.current = profile;
          } catch (error) {
            if (error?.status !== 401) console.warn('Profile refresh failed:', error);
          }
          // A failed profile read (the same storms that hit the session
          // checker) must not shrink the member: fall back to the last
          // good profile so completion %, member-since, and account
          // flags hold steady instead of flip-flopping between
          // refreshes (click-pass defect, 2026-10-12).
          const merged = mergeUser(result.auth.user, profile || lastProfileRef.current);
          setUser(merged);
          markSessionKnown(true);
          return merged;
        }
        if (result.state === 'signed_out') {
          if (preserveOnNull) return undefined;
          setUser(null);
          markSessionKnown(false);
          return null;
        }
        // Unknown (429 / 5xx / network): the checker never said the
        // member is out, so neither do we — at boot, mid-session,
        // anywhere. This is the phantom-logout fix.
        console.warn('Session check inconclusive; preserving current sign-in state.');
        return undefined;
      } finally {
        refreshInFlightRef.current = null;
      }
    })();
    refreshInFlightRef.current = run;
    return run;
  }, []);

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
        const wasKnown = sessionWasKnown();
        let current = await refreshUserProfile({ preserveOnNull: false });
        if (!mounted) return;
        // On a device that was signed in, distrust ANY non-authenticated
        // boot answer until it persists across a backoff window: a phone
        // tab returning from the background lands exactly here, and the
        // checker can answer "too busy" — or even briefly report an
        // empty session mid-refresh — while the member's session is
        // perfectly alive (the 2026-10-12 phantom logouts; a /DateIdeas
        // load still caught one transient wall after the first repair).
        // Hold the loading state and keep asking. A session found
        // resolves instantly; a genuinely ended one clears its marker
        // and presents signed-out after one window, once.
        if (!current && wasKnown) {
          for (const waitMs of [2000, 4000, 8000]) {
            await new Promise((resolve) => setTimeout(resolve, waitMs));
            if (!mounted) return;
            current = await refreshUserProfile({ preserveOnNull: false });
            if (!mounted) return;
            if (current) break;
          }
        }
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
      if (profile) lastProfileRef.current = profile;
      const merged = mergeUser(auth.user, profile);
      setUser(merged);
      markSessionKnown(true);
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
      markSessionKnown(false);
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
  }), [user, isLoading, refreshUserProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
