import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// These should be set in your environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if Supabase credentials are configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== '' && supabaseAnonKey !== '');
};

if (!isSupabaseConfigured()) {
  console.error('❌ Supabase Configuration Missing!');
  console.error('Please create a .env file with:');
  console.error('VITE_SUPABASE_URL=your-supabase-project-url');
  console.error('VITE_SUPABASE_ANON_KEY=your-supabase-anon-key');
}

// Create Supabase client with enhanced session persistence
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key', 
  {
    auth: {
      // Enable automatic token refresh before expiry (refresh 60 seconds before expiry)
      autoRefreshToken: true,
      // Persist session across browser refreshes and tabs
      persistSession: true,
      // Detect OAuth callbacks
      detectSessionInUrl: true,
      // Use localStorage for persistence (survives tab/window close)
      storage: window.localStorage,
      // Consistent storage key for this app (DO NOT CHANGE THIS - it will log users out)
      storageKey: 'sb-one2one-love-auth-token',
      // Use implicit flow for better compatibility
      flowType: 'implicit',
      // Enable debug logging in development
      debug: import.meta.env.DEV
    },
    global: {
      headers: {
        'X-Client-Info': 'one2one-love-app',
        // Prevent caching of API responses
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    },
    // Configure realtime options
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);

// Add session recovery helper
export const recoverSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error recovering session:', error);
      return null;
    }
    return session;
  } catch (error) {
    console.error('Failed to recover session:', error);
    return null;
  }
};

// Helper function to handle Supabase errors
export const handleSupabaseError = (error) => {
  if (!error) return 'An unknown error occurred';
  
  // Handle error message strings
  if (error.message) {
    const lowerMessage = error.message.toLowerCase();
    
    // Check for specific error patterns in message
    if (lowerMessage.includes('user already registered') || 
        lowerMessage.includes('email already exists') ||
        lowerMessage.includes('duplicate key value') ||
        lowerMessage.includes('unique constraint')) {
      return 'This email is already registered. Please use a different email or try signing in.';
    }
    
    if (lowerMessage.includes('invalid login credentials') || 
        lowerMessage.includes('invalid password') ||
        lowerMessage.includes('invalid email or password')) {
      return 'Invalid email or password';
    }
    
    if (lowerMessage.includes('email not confirmed')) {
      // Don't block sign in - allow users to use app without email confirmation
      return null; // Return null to allow the sign in to proceed
    }
    
    if (lowerMessage.includes('weak password') || 
        lowerMessage.includes('password is too short')) {
      return 'Password is too weak. Please use at least 8 characters.';
    }
    
    if (lowerMessage.includes('invalid email')) {
      return 'Please enter a valid email address';
    }
    
    if (lowerMessage.includes('rate limit')) {
      return 'Too many attempts. Please try again later.';
    }
    
    // Return the actual message if no pattern matches
    return error.message;
  }
  
  // Handle error codes
  if (error.code) {
    switch (error.code) {
      case '23505': // Unique violation (PostgreSQL)
        return 'This email is already registered. Please use a different email or try signing in.';
      case '23503': // Foreign key violation
        return 'Invalid reference data';
      case 'PGRST116': // Not found
        return 'Resource not found';
      case 'invalid_credentials':
        return 'Invalid email or password';
      case 'email_not_confirmed':
        // Don't show error - allow sign in even without email confirmation
        return null; // Return null to allow the sign in to proceed
      case 'too_many_requests':
      case 'over_request_rate_limit':
        return 'Too many attempts. Please try again later';
      case 'weak_password':
        return 'Password is too weak. Please use at least 8 characters.';
      case 'invalid_email':
        return 'Please enter a valid email address';
      case 'user_already_exists':
        return 'This email is already registered. Please use a different email or try signing in.';
      default:
        return error.message || 'An error occurred';
    }
  }
  
  return 'An error occurred. Please try again.';
};

