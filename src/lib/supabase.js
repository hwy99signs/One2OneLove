import { createClient, SupabaseAuthAdapter } from '@neondatabase/neon-js';

/**
 * One2OneLove backend compatibility client.
 *
 * The application was originally written against Supabase's client API. Neon
 * provides a Supabase-compatible auth adapter and a PostgREST-compatible Data
 * API, so we keep the existing `supabase` export name while routing runtime
 * authentication and database traffic to Neon. This avoids redesigning the
 * approved O2OL user experience while the infrastructure moves to Neon +
 * Cloudflare.
 */

const neonAuthUrl = import.meta.env.VITE_NEON_AUTH_URL || '';
const neonDataApiUrl = import.meta.env.VITE_NEON_DATA_API_URL || '';

export const isNeonConfigured = () => Boolean(neonAuthUrl && neonDataApiUrl);

// Backward-compatible function name used by existing screens/context.
export const isSupabaseConfigured = isNeonConfigured;

if (!isNeonConfigured()) {
  console.error('❌ Neon configuration missing.');
  console.error('Required: VITE_NEON_AUTH_URL and VITE_NEON_DATA_API_URL');
}

const neonClient = createClient({
  auth: {
    adapter: SupabaseAuthAdapter(),
    url: neonAuthUrl,
    // O2OL has public contact/waitlist surfaces. Anonymous tokens are still
    // constrained by Postgres RLS on the Neon Data API.
    allowAnonymous: true,
  },
  dataApi: {
    url: neonDataApiUrl,
  },
});

const getAccessToken = async () => {
  try {
    const { data } = await neonClient.auth.getSession();
    const session = data?.session || data || null;
    return (
      session?.access_token ||
      session?.accessToken ||
      session?.token ||
      session?.jwt ||
      null
    );
  } catch (error) {
    console.warn('Unable to read Neon Auth session token:', error);
    return null;
  }
};

/**
 * Cloudflare R2 storage compatibility bridge.
 * The matching Worker endpoints live in worker/index.js. Existing historical
 * Supabase-hosted media remains readable while assets are copied to R2, but all
 * new uploads use the Cloudflare endpoint once deployed.
 */
const storage = {
  from(bucket) {
    const encodedBucket = encodeURIComponent(bucket);

    return {
      async list(prefix = '', options = {}) {
        try {
          const token = await getAccessToken();
          const params = new URLSearchParams({
            bucket,
            prefix,
          });
          if (options?.search) params.set('search', options.search);

          const response = await fetch(`/api/storage/list?${params.toString()}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          const body = await response.json().catch(() => ({}));
          if (!response.ok) {
            return { data: null, error: new Error(body?.error || 'Unable to list files') };
          }
          return { data: body?.data || [], error: null };
        } catch (error) {
          return { data: null, error };
        }
      },

      async upload(path, file, options = {}) {
        try {
          const token = await getAccessToken();
          const response = await fetch(
            `/api/storage/${encodedBucket}/${path.split('/').map(encodeURIComponent).join('/')}`,
            {
              method: 'PUT',
              headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                'Content-Type': file?.type || 'application/octet-stream',
                'X-Upsert': options?.upsert ? 'true' : 'false',
              },
              body: file,
            },
          );
          const body = await response.json().catch(() => ({}));
          if (!response.ok) {
            return { data: null, error: new Error(body?.error || 'Unable to upload file') };
          }
          return { data: body?.data || { path }, error: null };
        } catch (error) {
          return { data: null, error };
        }
      },

      async remove(paths = []) {
        try {
          const token = await getAccessToken();
          const response = await fetch('/api/storage', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ bucket, paths }),
          });
          const body = await response.json().catch(() => ({}));
          if (!response.ok) {
            return { data: null, error: new Error(body?.error || 'Unable to remove file') };
          }
          return { data: body?.data || [], error: null };
        } catch (error) {
          return { data: null, error };
        }
      },

      getPublicUrl(path) {
        const encodedPath = path.split('/').map(encodeURIComponent).join('/');
        return {
          data: {
            publicUrl: `${window.location.origin}/media/${encodedBucket}/${encodedPath}`,
          },
        };
      },
    };
  },
};

/**
 * Neon Data API is HTTP based rather than Supabase Realtime. Until the
 * Cloudflare realtime transport is enabled, preserve existing subscription
 * call sites with a small authenticated polling adapter. It only watches rows
 * visible through RLS and emits a generic change event when the visible result
 * changes. Existing handlers then refresh their normal queries.
 */
const createPollingChannel = (name) => {
  const listeners = [];
  let timer = null;
  let stopped = false;
  let previous = new Map();

  const applyFilter = (query, filter) => {
    if (!filter || typeof filter !== 'string') return query;
    const match = filter.match(/^([^=]+)=eq\.(.*)$/);
    if (!match) return query;
    return query.eq(match[1], match[2]);
  };

  const poll = async () => {
    if (stopped) return;

    for (const listener of listeners) {
      if (listener.type !== 'postgres_changes' || !listener.config?.table) continue;
      try {
        let query = neonClient.from(listener.config.table).select('*').limit(250);
        query = applyFilter(query, listener.config.filter);
        const { data, error } = await query;
        if (error) continue;

        const signature = JSON.stringify(data || []);
        const key = `${listener.config.schema || 'public'}:${listener.config.table}:${listener.config.filter || ''}`;
        const oldSignature = previous.get(key);
        previous.set(key, signature);

        if (oldSignature !== undefined && oldSignature !== signature) {
          listener.callback({
            eventType: 'UPDATE',
            schema: listener.config.schema || 'public',
            table: listener.config.table,
            new: null,
            old: null,
            source: 'neon-polling',
          });
        }
      } catch (error) {
        console.warn(`Polling channel ${name} failed:`, error);
      }
    }
  };

  const channel = {
    on(type, config, callback) {
      listeners.push({ type, config: config || {}, callback });
      return channel;
    },
    subscribe(callback) {
      stopped = false;
      if (typeof callback === 'function') callback('SUBSCRIBED');
      poll();
      timer = window.setInterval(poll, 3000);
      return channel;
    },
    unsubscribe() {
      stopped = true;
      if (timer) window.clearInterval(timer);
      timer = null;
      return Promise.resolve('ok');
    },
  };

  return channel;
};

// Keep the legacy export name so existing services do not need wholesale
// rewrites. Database/auth methods are supplied by Neon; storage/realtime are
// Cloudflare compatibility bridges during the infrastructure migration.
export const supabase = new Proxy(neonClient, {
  get(target, property, receiver) {
    if (property === 'storage') return storage;
    if (property === 'channel') return createPollingChannel;
    if (property === 'removeChannel') {
      return async (channel) => channel?.unsubscribe?.();
    }

    const value = Reflect.get(target, property, receiver);
    return typeof value === 'function' ? value.bind(target) : value;
  },
});

export const recoverSession = async () => {
  try {
    const { data, error } = await neonClient.auth.getSession();
    if (error) {
      console.error('Error recovering Neon Auth session:', error);
      return null;
    }
    return data?.session || data || null;
  } catch (error) {
    console.error('Failed to recover Neon Auth session:', error);
    return null;
  }
};

export const handleSupabaseError = (error) => {
  if (!error) return 'An unknown error occurred';

  const message = error?.message || error?.error_description || error?.error || '';
  const code = error?.code || error?.status || '';

  if (code === '23505') return 'This email is already registered';
  if (code === '23503') return 'Invalid reference data';
  if (code === 'PGRST116') return 'Resource not found';
  if (code === 'invalid_credentials') return 'Invalid email or password';
  if (code === 'too_many_requests' || code === 429) {
    return 'Too many login attempts. Please try again later';
  }

  const lowerMessage = String(message).toLowerCase();
  if (
    lowerMessage.includes('invalid login credentials') ||
    lowerMessage.includes('invalid password') ||
    lowerMessage.includes('invalid credentials')
  ) {
    return 'Invalid email or password';
  }

  if (lowerMessage.includes('email not confirmed')) {
    // O2OL currently permits sign-in before verification; Neon Auth is
    // configured the same way on this project.
    return null;
  }

  return message || 'An error occurred';
};
