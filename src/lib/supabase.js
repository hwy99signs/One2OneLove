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

// Create Supabase client (even if not configured, to avoid errors)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key', 
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      storageKey: 'sb-one2one-auth-token',
      flowType: 'pkce',
      debug: true // Enable debug mode
    },
    global: {
      headers: {
        'X-Client-Info': 'one2one-love'
      }
    }
  }
);

// Force session restoration on page load
window.addEventListener('load', () => {
  supabase.auth.getSession().then(({ data, error }) => {
    if (data.session) {
      console.log('🔄 Session restored on page load:', data.session.user.email);
    }
  });
});

// Log session status for debugging
if (isSupabaseConfigured()) {
  supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.error('🔐 Session check error:', error);
    } else if (data.session) {
      console.log('✅ Active session found:', data.session.user.email);
    } else {
      console.log('⚠️ No active session');
    }
  });
}

// Helper function to handle Supabase errors
export const handleSupabaseError = (error) => {
  if (!error) return 'An unknown error occurred';
  
  // Common Supabase error messages
  if (error.message) {
    return error.message;
  }
  
  if (error.code) {
    switch (error.code) {
      case '23505': // Unique violation
        return 'This email is already registered';
      case '23503': // Foreign key violation
        return 'Invalid reference data';
      case 'PGRST116': // Not found
        return 'Resource not found';
      case 'invalid_credentials':
        return 'Invalid email or password';
      case 'email_not_confirmed':
        return 'Please verify your email address before signing in';
      case 'too_many_requests':
        return 'Too many login attempts. Please try again later';
      default:
        return error.message || 'An error occurred';
    }
  }
  
  // Handle common Supabase auth error messages
  if (error.message) {
    const lowerMessage = error.message.toLowerCase();
    if (lowerMessage.includes('invalid login credentials') || lowerMessage.includes('invalid password')) {
      return 'Invalid email or password';
    }
    if (lowerMessage.includes('email not confirmed')) {
      return 'Please verify your email address before signing in';
    }
  }
  
  return 'An error occurred';
};

