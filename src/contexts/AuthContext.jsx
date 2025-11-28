import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase, handleSupabaseError, isSupabaseConfigured } from '@/lib/supabase';
import { initializePresence, cleanupPresence } from '@/lib/presenceService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const isManualLoginRef = useRef(false);

  const buildUserData = (authUser, profileData = null) => {
    if (!authUser) return null;

    const safeProfile =
      profileData && typeof profileData === 'object' ? profileData : {};

    return {
      id: authUser.id,
      email: authUser.email,
      ...safeProfile,
      name:
        safeProfile?.name ||
        authUser.user_metadata?.name ||
        authUser.email?.split('@')[0],
      user_type:
        safeProfile?.user_type ||
        authUser.user_metadata?.user_type ||
        'regular',
    };
  };

  const ensureUserProfile = async (authUser) => {
    if (!authUser) {
      console.log('ensureUserProfile: No authUser provided');
      return null;
    }

    console.log('ensureUserProfile: Starting for user:', authUser.id);

    try {
      console.log('ensureUserProfile: Fetching profile from database...');
      
      // Add timeout to prevent hanging - wrap Supabase query properly
      const profileQuery = supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout after 5 seconds')), 5000)
      );
      
      // Race the query against timeout
      let profile, profileError;
      try {
        const result = await Promise.race([
          profileQuery,
          timeoutPromise
        ]);
        profile = result?.data;
        profileError = result?.error;
      } catch (timeoutError) {
        console.warn('⚠️ Profile fetch timed out, using basic user data');
        return buildUserData(authUser);
      }

      console.log('ensureUserProfile: Profile query result:', { profile, profileError });

      if (profileError && profileError.code === 'PGRST116') {
        console.log('ensureUserProfile: Profile not found, creating new profile...');
        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .insert({
            id: authUser.id,
            email: authUser.email,
            name: authUser.user_metadata?.name || authUser.email?.split('@')[0],
            user_type: authUser.user_metadata?.user_type || 'regular',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating missing profile:', createError);
          console.log('ensureUserProfile: Returning user data without profile');
          return buildUserData(authUser);
        }

        console.log('ensureUserProfile: New profile created successfully');
        return buildUserData(authUser, newProfile);
      }

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        console.log('ensureUserProfile: Returning user data without profile due to error');
        return buildUserData(authUser);
      }

      console.log('ensureUserProfile: Profile found successfully');
      return buildUserData(authUser, profile);
    } catch (error) {
      console.error('ensureUserProfile unexpected error:', error);
      console.log('ensureUserProfile: Returning user data after catch');
      return buildUserData(authUser);
    }
  };

  const refreshUserProfile = async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error refreshing user profile:', error);
        return null;
      }

      if (!data?.user) {
        setUser(null);
        return null;
      }

      const userData = await ensureUserProfile(data.user);
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('refreshUserProfile error:', error);
      return null;
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    console.log('🚀 AuthContext: Initializing...');
    let mounted = true;
    let refreshInterval;
    let retryTimeout;
    let initTimeout;
    let sessionRestored = false;
    let isManualLogin = false; // Track if login is being done manually
    
    // IMPORTANT: Set up listener FIRST to catch INITIAL_SESSION event immediately
    // Listen for auth state changes with improved handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth state changed:', event, session?.user?.email);
      
      if (!mounted) return;
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ User signed in (via listener):', session.user.email);
        // If manual login is in progress, let it handle state setting
        if (isManualLoginRef.current) {
          console.log('🔄 Listener: Manual login in progress, skipping listener update');
          return;
        }
        // Only update if user state is not already set (avoid race conditions)
        if (mounted) {
          // Set basic user data immediately
          const basicUserData = buildUserData(session.user);
          setUser(basicUserData);
          setIsLoading(false); // Clear loading immediately
          
          // Fetch full profile asynchronously (non-blocking)
          ensureUserProfile(session.user)
            .then(profileData => {
              if (profileData && mounted) {
                console.log('✅ Profile fetched, updating user state');
                setUser(profileData);
              }
            })
            .catch(err => {
              console.warn('⚠️ Profile fetch failed in listener (non-critical):', err);
              // User already has basic data, so continue
            });
          
          initializePresence().catch(err => {
            console.warn('⚠️ Presence init failed in listener:', err);
          });
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out');
        if (mounted) {
          setUser(null);
          setIsLoading(false);
          await cleanupPresence();
        }
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Token refreshed for:', session?.user?.email);
        // Ensure user state is set if session exists (safety check)
        if (session?.user && mounted) {
          const userData = await ensureUserProfile(session.user);
          if (mounted) {
            setUser(userData);
            // Presence should already be initialized, but ensure it's active
            await initializePresence();
          }
        }
      } else if (event === 'USER_UPDATED') {
        console.log('📝 User updated:', session?.user?.email);
        if (session?.user && mounted) {
          const userData = await ensureUserProfile(session.user);
          if (mounted) {
            setUser(userData);
            setIsLoading(false);
          }
        }
      } else if (event === 'INITIAL_SESSION') {
        // This event fires when Supabase restores session from localStorage
        if (session?.user) {
          console.log('🔵 Initial session loaded from storage:', session.user.email);
          sessionRestored = true;
          const userData = await ensureUserProfile(session.user);
          if (mounted) {
            setUser(userData);
            setIsLoading(false);
            await initializePresence();
          }
        } else {
          console.log('🔵 Initial session check: No session in storage');
          if (mounted) setIsLoading(false);
        }
      }
    });
    
    const checkAuth = async (retryCount = 0) => {
      try {
        console.log('🔍 Checking for existing session...', retryCount > 0 ? `(retry ${retryCount})` : '');
        // Get current session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
          if (mounted && !sessionRestored) setIsLoading(false);
          return;
        }

        if (session?.user && mounted) {
          // Only set user if it hasn't been set by INITIAL_SESSION event
          if (!sessionRestored) {
            console.log('✅ Session found for:', session.user.email);
            const userData = await ensureUserProfile(session.user);
            if (mounted) {
              setUser(userData);
              // Initialize presence for existing session
              console.log('🟢 Initializing presence for existing session...');
              await initializePresence();
              setIsLoading(false);
            }
          } else {
            console.log('✅ Session already restored via INITIAL_SESSION event');
            if (mounted) setIsLoading(false);
          }
        } else {
          // If no session found and we haven't retried yet, wait a bit and retry
          // This handles the case where Supabase hasn't finished restoring from localStorage
          if (retryCount === 0 && mounted && !sessionRestored) {
            console.log('⚠️ No active session found, retrying after short delay...');
            retryTimeout = setTimeout(() => {
              if (mounted) checkAuth(1);
            }, 100);
          } else {
            console.log('⚠️ No active session found');
            if (mounted && !sessionRestored) setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('💥 Error checking auth:', error);
        if (mounted && !sessionRestored) setIsLoading(false);
      }
    };

    // Small delay to ensure Supabase has initialized and restored session from localStorage
    // But the listener above should catch INITIAL_SESSION event first
    initTimeout = setTimeout(() => {
      if (!sessionRestored) {
        checkAuth();
      }
    }, 100);

    // Set up periodic session check (every 5 minutes) to ensure session is valid
    refreshInterval = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session && mounted) {
          console.log('⚠️ Session expired, clearing user state');
          setUser(null);
        }
        // Note: We don't need to restore user state here as the auth state change listener handles it
      } catch (error) {
        console.error('Error checking session:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Handle page visibility changes to maintain session
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && mounted) {
        console.log('👀 Page became visible, checking session...');
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && mounted) {
            // Always ensure user state is set when page becomes visible and session exists
            const userData = await ensureUserProfile(session.user);
            if (mounted) {
              setUser(userData);
              await initializePresence();
            }
          }
        } catch (error) {
          console.error('Error restoring session:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      console.log('🧹 Cleaning up auth listener');
      mounted = false;
      subscription.unsubscribe();
      if (refreshInterval) clearInterval(refreshInterval);
      if (retryTimeout) clearTimeout(retryTimeout);
      if (initTimeout) clearTimeout(initTimeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const login = async (email, password) => {
    // Set flag to prevent listener from interfering
    isManualLoginRef.current = true;
    
    try {
      console.log('🔵 Attempting login for:', email);
      
      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        const errorMsg = 'Application is not properly configured. Please contact support or configure Supabase credentials in your .env file.';
        console.error('❌ Supabase not configured');
        return { success: false, error: errorMsg };
      }
      
      // IMPORTANT: Clear any stale session data before attempting new login
      // This prevents conflicts with cached sessions that might interfere
      console.log('🧹 Clearing any existing session before login...');
      try {
        // Get current session to check if it exists (with timeout)
        const getSessionPromise = supabase.auth.getSession();
        const sessionTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 2000)
        );
        
        let existingSession;
        try {
          const sessionResult = await Promise.race([
            getSessionPromise.then(r => ({ type: 'success', ...r })),
            sessionTimeout.then(() => ({ type: 'timeout' }))
          ]);
          
          if (sessionResult.type === 'timeout') {
            console.warn('⚠️ Session check timed out (continuing)');
            existingSession = null;
          } else {
            existingSession = sessionResult.data?.session;
          }
        } catch (sessionError) {
          console.warn('⚠️ Session check failed (continuing):', sessionError);
          existingSession = null;
        }
        
        if (existingSession) {
          console.log('⚠️ Found existing session, signing out first...');
          // Sign out to clear stale session (with timeout)
          const signOutPromise = supabase.auth.signOut();
          const signOutTimeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Sign out timeout')), 2000)
          );
          
          try {
            await Promise.race([
              signOutPromise.then(() => ({ type: 'success' })),
              signOutTimeout.then(() => ({ type: 'timeout' }))
            ]);
            // Small delay to ensure session is cleared
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (signOutError) {
            console.warn('⚠️ Sign out failed (continuing with login):', signOutError);
          }
        }
      } catch (clearError) {
        console.warn('⚠️ Error clearing existing session (continuing with login):', clearError);
        // Continue with login even if clearing fails
      }
      
      console.log('🔐 Attempting sign in with password...');
      
      // Add timeout to prevent hanging on signInWithPassword
      const signInPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      const signInTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sign in timeout after 10 seconds')), 10000)
      );
      
      let data, error;
      try {
        const result = await Promise.race([
          signInPromise.then(r => ({ type: 'success', ...r })),
          signInTimeout.then(() => ({ type: 'timeout' }))
        ]);
        
        if (result.type === 'timeout') {
          console.error('❌ Sign in timed out');
          return { success: false, error: 'Sign in timed out. Please try again.' };
        }
        
        data = result.data;
        error = result.error;
      } catch (timeoutError) {
        console.error('❌ Sign in error:', timeoutError);
        return { success: false, error: timeoutError.message || 'Sign in failed. Please try again.' };
      }

      if (error) {
        console.error('❌ Supabase auth error:', error);
        
        
        return { success: false, error: handleSupabaseError(error) };
      }

      if (!data?.user) {
        console.error('❌ No user data returned from Supabase');
        return { success: false, error: 'Login failed: No user data received' };
      }

      console.log('✅ Auth successful, fetching profile for user:', data.user.id);

      // Set basic user data immediately (don't wait for profile)
      const basicUserData = buildUserData(data.user);
      setUser(basicUserData);
      
      // CRITICAL: Return immediately, don't wait for profile fetch
      // Profile fetch happens asynchronously and won't block login
      console.log('✅ Login successful - returning immediately with basic user data');
      
      // Fetch profile asynchronously (non-blocking) - don't await
      ensureUserProfile(data.user)
        .then(profileData => {
          if (profileData && isManualLoginRef.current) {
            console.log('✅ Profile fetched, updating user state');
            setUser(profileData);
          }
        })
        .catch(err => {
          console.warn('⚠️ Profile fetch failed (non-critical):', err);
          // User is already set with basic data, so login can continue
        });
      
      // Initialize presence tracking asynchronously (don't block login)
      console.log('🟢 Initializing presence tracking (non-blocking)...');
      initializePresence().catch(err => {
        console.warn('⚠️ Presence initialization failed (non-critical):', err);
      });
      
      // Clear manual login flag after a short delay
      setTimeout(() => {
        isManualLoginRef.current = false;
      }, 2000);
      
      // Return immediately - don't wait for async operations
      return { success: true, user: basicUserData };
    } catch (error) {
      console.error('❌ Login error:', error);
      isManualLoginRef.current = false;
      return { success: false, error: error.message || handleSupabaseError(error) };
    }
  };

  const logout = async () => {
    try {
      console.log('🔴 Starting logout process...');
      
      // Clean up presence before logging out (don't let errors block logout)
      try {
        console.log('🔴 Cleaning up presence tracking...');
        await cleanupPresence();
      } catch (presenceError) {
        console.error('⚠️ Error cleaning up presence (continuing logout):', presenceError);
        // Continue with logout even if presence cleanup fails
      }
      
      // Clear user state first to prevent race conditions
      setUser(null);
      setIsLoading(false);
      
      // Sign out from Supabase
      console.log('🔴 Signing out from Supabase...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Supabase signOut error:', error);
      } else {
        console.log('✅ Successfully signed out from Supabase');
      }
      
      // Clear localStorage auth token to prevent stale sessions
      try {
        const storageKey = 'sb-one2one-love-auth-token';
        localStorage.removeItem(storageKey);
        console.log('🧹 Cleared auth token from localStorage');
      } catch (storageError) {
        console.warn('⚠️ Error clearing localStorage:', storageError);
      }
      
      // Clear sessionStorage as well
      try {
        sessionStorage.clear();
        console.log('🧹 Cleared sessionStorage');
      } catch (storageError) {
        console.warn('⚠️ Error clearing sessionStorage:', storageError);
      }
      
      // Ensure user state is cleared (redundant but safe)
      setUser(null);
      setIsLoading(false);
      
      console.log('✅ Logout completed');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Ensure user state is cleared even on error
      setUser(null);
      setIsLoading(false);
      
      // Try to clear storage as fallback
      try {
        const storageKey = 'sb-one2one-love-auth-token';
        localStorage.removeItem(storageKey);
        sessionStorage.clear();
      } catch (storageError) {
        console.warn('⚠️ Error clearing storage in catch:', storageError);
      }
    }
  };

  const register = async (userData) => {
    // Prevent auth listener from interfering during registration
    isManualLoginRef.current = true;
    
    try {
      console.log('🚀 AuthContext.register: Starting registration...', { email: userData.email, name: userData.name });
      const { email, password, name, relationshipStatus, anniversaryDate, partnerEmail, subscriptionPlan, subscriptionPrice } = userData;

      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        const errorMsg = 'Application is not properly configured. Please contact support or configure Supabase credentials.';
        console.error('❌ Supabase not configured');
        isManualLoginRef.current = false;
        return { success: false, error: errorMsg };
      }

      // Sign up with Supabase Auth
      console.log('Calling supabase.auth.signUp...');
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            relationship_status: relationshipStatus,
            anniversary_date: anniversaryDate,
            partner_email: partnerEmail,
            subscription_plan: subscriptionPlan || 'Basic',
            subscription_price: subscriptionPrice !== undefined ? subscriptionPrice : 0,
          },
        },
      });

      console.log('SignUp auth response:', { authData, authError });

      if (authError) {
        console.error('Auth error:', authError);
        return { success: false, error: handleSupabaseError(authError) };
      }

      if (authData?.user) {
        console.log('User created in auth, creating profile in database...');
        
        // Create user profile in database
        // user_type defaults to 'regular' for regular user signups
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: email,
            name: name,
            user_type: 'regular', // Set user type for regular users
            relationship_status: relationshipStatus || null,
            anniversary_date: anniversaryDate || null,
            partner_email: partnerEmail || null,
            subscription_plan: subscriptionPlan || 'Basic',
            subscription_price: subscriptionPrice !== undefined ? subscriptionPrice : 0, // Basic is now free
            subscription_status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        console.log('Profile creation response:', { profile, profileError });

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          // User is created in auth but profile creation failed
          // Return error so user knows something went wrong
          return { 
            success: false, 
            error: `Account created but profile setup failed: ${handleSupabaseError(profileError)}. Please contact support.` 
          };
        }

        const newUser = {
          id: authData.user.id,
          email: authData.user.email,
          name: name,
          relationship_status: relationshipStatus,
          anniversary_date: anniversaryDate,
          partner_email: partnerEmail,
          ...profile,
        };

        console.log('Setting user state and returning success');
        setUser(newUser);
        
        console.log('🎉 REGISTRATION COMPLETE - Returning success to form');
        
        // Clear the manual login flag after a short delay
        setTimeout(() => {
          isManualLoginRef.current = false;
        }, 2000);
        
        return { success: true, user: newUser };
      }

      console.error('❌ No user data in authData');
      isManualLoginRef.current = false;
      return { success: false, error: 'Registration failed' };
    } catch (error) {
      console.error('❌ Registration error (caught):', error);
      isManualLoginRef.current = false;
      return { success: false, error: handleSupabaseError(error) };
    } finally {
      console.log('🏁 Register function completed');
    }
  };

  const registerTherapist = async (userData, therapistData) => {
    try {
      const { email, password, firstName, lastName } = userData;
      const fullName = `${firstName} ${lastName}`;

      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: fullName,
            user_type: 'therapist',
          },
        },
      });

      if (authError) {
        return { success: false, error: handleSupabaseError(authError) };
      }

      if (authData?.user) {
        // Create user profile in database with therapist type
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: email,
            name: fullName,
            user_type: 'therapist',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          // Continue anyway - therapist profile can still be created
        }

        // Create therapist profile
        const { createTherapistProfile } = await import('@/lib/therapistService');
        const therapistResult = await createTherapistProfile(authData.user.id, {
          ...therapistData,
          firstName,
          lastName,
          email,
          emailVerified: therapistData.emailVerified || false,
          phoneVerified: therapistData.phoneVerified || false,
        });

        if (!therapistResult.success) {
          console.error('Error creating therapist profile:', therapistResult.error);
          // User account is created but therapist profile failed
          // They can log in but profile will be incomplete
        }

        const newUser = {
          id: authData.user.id,
          email: authData.user.email,
          name: fullName,
          user_type: 'therapist',
          ...userProfile,
        };

        setUser(newUser);
        return { success: true, user: newUser };
      }

      return { success: false, error: 'Registration failed' };
    } catch (error) {
      console.error('Therapist registration error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  };

  const registerInfluencer = async (userData, influencerData) => {
    try {
      const { email, password, firstName, lastName } = userData;
      const fullName = `${firstName} ${lastName}`;

      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: fullName,
            user_type: 'influencer',
          },
        },
      });

      if (authError) {
        return { success: false, error: handleSupabaseError(authError) };
      }

      if (authData?.user) {
        // Create user profile in database with influencer type
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: email,
            name: fullName,
            user_type: 'influencer',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          // Continue anyway - influencer profile can still be created
        }

        // Create influencer profile
        const { createInfluencerProfile } = await import('@/lib/influencerService');
        const influencerResult = await createInfluencerProfile(authData.user.id, {
          ...influencerData,
          firstName,
          lastName,
          email,
          emailVerified: influencerData.emailVerified || false,
          phoneVerified: influencerData.phoneVerified || false,
        });

        if (!influencerResult.success) {
          console.error('Error creating influencer profile:', influencerResult.error);
          // User account is created but influencer profile failed
          // They can log in but profile will be incomplete
        }

        const newUser = {
          id: authData.user.id,
          email: authData.user.email,
          name: fullName,
          user_type: 'influencer',
          ...userProfile,
        };

        setUser(newUser);
        return { success: true, user: newUser };
      }

      return { success: false, error: 'Registration failed' };
    } catch (error) {
      console.error('Influencer registration error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  };

  const registerProfessional = async (userData, professionalData) => {
    try {
      const { email, password, firstName, lastName } = userData;
      const fullName = `${firstName} ${lastName}`;

      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: fullName,
            user_type: 'professional',
          },
        },
      });

      if (authError) {
        return { success: false, error: handleSupabaseError(authError) };
      }

      if (authData?.user) {
        // Create user profile in database with professional type
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: email,
            name: fullName,
            user_type: 'professional',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          // Continue anyway - professional profile can still be created
        }

        // Create professional profile
        const { createProfessionalProfile } = await import('@/lib/professionalService');
        const professionalResult = await createProfessionalProfile(authData.user.id, {
          ...professionalData,
          firstName,
          lastName,
          email,
          emailVerified: professionalData.emailVerified || false,
          phoneVerified: professionalData.phoneVerified || false,
        });

        if (!professionalResult.success) {
          console.error('Error creating professional profile:', professionalResult.error);
          // User account is created but professional profile failed
          // They can log in but profile will be incomplete
        }

        const newUser = {
          id: authData.user.id,
          email: authData.user.email,
          name: fullName,
          user_type: 'professional',
          ...userProfile,
        };

        setUser(newUser);
        return { success: true, user: newUser };
      }

      return { success: false, error: 'Registration failed' };
    } catch (error) {
      console.error('Professional registration error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  };

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
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

