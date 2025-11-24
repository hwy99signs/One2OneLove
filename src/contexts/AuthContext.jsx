import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, handleSupabaseError, isSupabaseConfigured } from '@/lib/supabase';
import { initializePresence, cleanupPresence } from '@/lib/presenceService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

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
    
    const checkAuth = async () => {
      try {
        console.log('🔍 Checking for existing session...');
        // Get current session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
          if (mounted) setIsLoading(false);
          return;
        }

        if (session?.user && mounted) {
          console.log('✅ Session found for:', session.user.email);
          const userData = await ensureUserProfile(session.user);
          if (mounted) {
            setUser(userData);
            // Initialize presence for existing session
            console.log('🟢 Initializing presence for existing session...');
            await initializePresence();
          }
        } else {
          console.log('⚠️ No active session found');
        }
      } catch (error) {
        console.error('💥 Error checking auth:', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    checkAuth();

    // Set up periodic session check (every 5 minutes) to ensure session is valid
    refreshInterval = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session && user && mounted) {
          console.log('⚠️ Session expired, clearing user state');
          setUser(null);
        } else if (session && !user && mounted) {
          console.log('🔄 Session recovered, restoring user state');
          const userData = await ensureUserProfile(session.user);
          if (mounted) {
            setUser(userData);
            await initializePresence();
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Listen for auth state changes with improved handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth state changed:', event, session?.user?.email);
      
      if (!mounted) return;
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ User signed in:', session.user.email);
        const userData = await ensureUserProfile(session.user);
        if (mounted) {
          setUser(userData);
          await initializePresence();
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out');
        if (mounted) {
          setUser(null);
          await cleanupPresence();
        }
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Token refreshed for:', session?.user?.email);
        // Keep session alive - no action needed
      } else if (event === 'USER_UPDATED') {
        console.log('📝 User updated:', session?.user?.email);
        if (session?.user && mounted) {
          const userData = await ensureUserProfile(session.user);
          if (mounted) setUser(userData);
        }
      } else if (event === 'INITIAL_SESSION' && session?.user) {
        console.log('🔵 Initial session loaded:', session.user.email);
        // Session restored from localStorage
        const userData = await ensureUserProfile(session.user);
        if (mounted) {
          setUser(userData);
          await initializePresence();
        }
      }
    });

    // Handle page visibility changes to maintain session
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && mounted) {
        console.log('👀 Page became visible, checking session...');
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && !user) {
            console.log('🔄 Restoring session after visibility change');
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
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const login = async (email, password) => {
    try {
      console.log('Attempting login for:', email);
      
      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        const errorMsg = 'Application is not properly configured. Please contact support or configure Supabase credentials in your .env file.';
        console.error('❌ Supabase not configured');
        return { success: false, error: errorMsg };
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Supabase auth error:', error);
        return { success: false, error: handleSupabaseError(error) };
      }

      if (!data?.user) {
        console.error('No user data returned from Supabase');
        return { success: false, error: 'Login failed: No user data received' };
      }

      console.log('Auth successful, fetching profile for user:', data.user.id);

      const userData = await ensureUserProfile(data.user);
      setUser(userData);
      
      // Initialize presence tracking for online/offline status
      console.log('🟢 Initializing presence tracking...');
      await initializePresence();
      
      console.log('Login successful');
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message || handleSupabaseError(error) };
    }
  };

  const logout = async () => {
    try {
      // Clean up presence before logging out
      console.log('🔴 Cleaning up presence tracking...');
      await cleanupPresence();
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      }
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
    }
  };

  const register = async (userData) => {
    try {
      console.log('AuthContext.register: Starting registration...', { email: userData.email, name: userData.name });
      const { email, password, name, relationshipStatus, anniversaryDate, partnerEmail, subscriptionPlan, subscriptionPrice } = userData;

      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        const errorMsg = 'Application is not properly configured. Please contact support or configure Supabase credentials.';
        console.error('❌ Supabase not configured');
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
            subscription_plan: subscriptionPlan || 'Basis',
            subscription_price: subscriptionPrice || 9.99,
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
            subscription_plan: subscriptionPlan || 'Basis',
            subscription_price: subscriptionPrice || 9.99,
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
        return { success: true, user: newUser };
      }

      console.error('No user data in authData');
      return { success: false, error: 'Registration failed' };
    } catch (error) {
      console.error('Registration error (caught):', error);
      return { success: false, error: handleSupabaseError(error) };
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

