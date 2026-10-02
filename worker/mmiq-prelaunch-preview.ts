import { handlePrelaunchCommunityChatRequest } from './prelaunch-community-chat';
import { handleStudioMediaRequest } from './studio-media';

function copyAuthResponseHeaders(upstreamHeaders: Headers) {
  const headers = new Headers(upstreamHeaders);
  headers.delete('content-length');
  headers.delete('content-encoding');
  headers.delete('transfer-encoding');

  const getSetCookie = upstreamHeaders.getSetCookie?.bind(upstreamHeaders);
  if (getSetCookie) {
    const cookies = getSetCookie();
    if (cookies.length) {
      headers.delete('set-cookie');
      for (const cookie of cookies) {
        headers.append('set-cookie', cookie.replace(/;\s*Domain=[^;]+/ig, ''));
      }
    }
  }
  return headers;
}

async function proxyAuth(request: Request, env: { NEON_AUTH_BASE_URL: string }, url: URL) {
  const suffix = url.pathname.slice('/api/auth'.length) || '/';
  const upstream = new URL(env.NEON_AUTH_BASE_URL.replace(/\/$/, '') + suffix);
  upstream.search = url.search;

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('content-length');

  const response = await fetch(upstream.toString(), {
    method: request.method,
    headers,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
    redirect: 'manual',
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: copyAuthResponseHeaders(response.headers),
  });
}

async function session(request: Request, env: { NEON_AUTH_BASE_URL: string }) {
  const cookie = request.headers.get('cookie');
  if (!cookie) return null;
  const response = await fetch(env.NEON_AUTH_BASE_URL.replace(/\/$/, '') + '/get-session', {
    headers: { cookie, accept: 'application/json' },
  });
  if (!response.ok) return null;
  const payload = await response.json().catch(() => null);
  const user = payload?.user ?? payload?.data?.user ?? null;
  const active = payload?.session ?? payload?.data?.session ?? null;
  return user?.id && user?.emailVerified === true && active ? { user, session: active } : null;
}

async function prelaunchProfile(request: Request, env: { NEON_AUTH_BASE_URL: string }) {
  if (request.method !== 'GET') {
    return Response.json({ ok:false, error:{ code:'prelaunch_read_only_profile', message:'Profile editing is disabled in prelaunch.' } }, { status:405 });
  }
  const auth = await session(request, env);
  if (!auth) {
    return Response.json({ ok:false, error:{ code:'unauthorized', message:'Authentication required.' } }, { status:401 });
  }
  return Response.json({
    ok:true,
    profile:{
      id:auth.user.id,
      email:auth.user.email || null,
      name:auth.user.name || auth.user.email?.split('@')[0] || 'Member',
      user_type:'regular',
      is_active:true,
      is_verified:true,
      phone_verification_required:false,
      phone_number_verified:true,
      subscription_plan:'Premiere',
      subscription_status:'trial',
      stripe_subscription_id:null,
      prelaunch_profile:true,
    }
  }, {
    headers:{
      'cache-control':'no-store',
      'x-content-type-options':'nosniff',
    }
  });
}

export default {
  async fetch(request: Request, env: { ASSETS: Fetcher; MEDIA: R2Bucket; NEON_AUTH_BASE_URL: string }) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/studio-media/')) {
      const response = await handleStudioMediaRequest(request, env, url);
      if (response) return response;
    }

    if (url.pathname.startsWith('/api/community-chat')) {
      const response = await handlePrelaunchCommunityChatRequest(request, env, url);
      if (response) return response;
    }

    if (url.pathname.startsWith('/api/auth')) {
      return proxyAuth(request, env, url);
    }

    if (url.pathname === '/api/profile') {
      return prelaunchProfile(request, env);
    }

    if (url.pathname.startsWith('/api/')) {
      return Response.json(
        { ok: false, preview: true, message: 'API access is disabled in this visual preview.' },
        { status: 503 },
      );
    }

    return env.ASSETS.fetch(request);
  },
};
