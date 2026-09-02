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
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      storageKey: 'sb-one2one-love-auth-token',
      flowType: 'implicit',
      debug: import.meta.env.DEV
    },
    global: {
      headers: {
        'X-Client-Info': 'one2one-love-app',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);

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

export const handleSupabaseError = (error) => {
  if (!error) return 'An unknown error occurred';

  const code = error.code || '';
  const message = error.message || '';
  const lowerMessage = message.toLowerCase();

  switch (code) {
    case '23505':
      return 'This email is already registered';
    case '23503':
      return 'Invalid reference data';
    case 'PGRST116':
      return 'Resource not found';
    case 'invalid_credentials':
      return 'Invalid email or password';
    case 'email_not_confirmed':
      return 'Please confirm your email before signing in.';
    case 'too_many_requests':
      return 'Too many login attempts. Please try again later';
    default:
      break;
  }

  if (lowerMessage.includes('email not confirmed') || lowerMessage.includes('email_not_confirmed')) {
    return 'Please confirm your email before signing in.';
  }

  if (lowerMessage.includes('invalid login credentials') || lowerMessage.includes('invalid password')) {
    return 'Invalid email or password';
  }

  return message || 'An error occurred';
};
