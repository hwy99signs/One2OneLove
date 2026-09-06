import { createClient } from '@supabase/supabase-js';

// Legacy Supabase compatibility remains temporarily while the migration branch
// moves each feature behind the Cloudflare Worker + Neon boundary.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== '' && supabaseAnonKey !== '');
};

if (!isSupabaseConfigured()) {
  console.info('One2OneLove migration preview: legacy Supabase credentials are intentionally not configured.');
}

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
      debug: import.meta.env.DEV,
    },
    global: {
      headers: {
        'X-Client-Info': 'one2one-love-app',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  },
);

// Do not let legacy realtime code attempt to connect to the placeholder host.
// Migrated features (chat, presence, etc.) provide their own Worker-backed
// compatibility polling until Cloudflare realtime transport is introduced.
if (!isSupabaseConfigured()) {
  const createNoopChannel = () => {
    const channel = {
      on() { return channel; },
      subscribe() { return channel; },
      async unsubscribe() { return 'ok'; },
    };
    return channel;
  };
  supabase.channel = createNoopChannel;
  supabase.removeChannel = async () => 'ok';
}

export const recoverSession = async () => {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error recovering legacy Supabase session:', error);
      return null;
    }
    return session;
  } catch (error) {
    console.error('Failed to recover legacy Supabase session:', error);
    return null;
  }
};

export const handleSupabaseError = (error) => {
  if (!error) return 'An unknown error occurred';

  if (error.message) return error.message;

  if (error.code) {
    switch (error.code) {
      case '23505':
        return 'This email is already registered';
      case '23503':
        return 'Invalid reference data';
      case 'PGRST116':
        return 'Resource not found';
      case 'invalid_credentials':
        return 'Invalid email or password';
      case 'email_not_confirmed':
        return null;
      case 'too_many_requests':
        return 'Too many login attempts. Please try again later';
      default:
        return error.message || 'An error occurred';
    }
  }

  return 'An error occurred';
};
