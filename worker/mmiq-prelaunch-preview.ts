import { getPrelaunchChatAdminSnapshot, handlePrelaunchCommunityChatRequest } from './prelaunch-community-chat';
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

async function prelaunchAdminDashboard(env: { MEDIA: R2Bucket }) {
  const chatRoom=await getPrelaunchChatAdminSnapshot(env);
  return Response.json({
    ok:true,
    preview:true,
    readOnly:true,
    generatedAt:new Date().toISOString(),
    summary:{
      users:{ total:0,new_7d:0,inactive:0,verified:0 },
      plans:[],
      applications:{ pending_total:0 },
      moderation:{ pending_total:0 },
      payments:{ recorded_payments:0,payments_this_month:0 },
      loveNotes:{ sent_total:0,sent_30d:0,scheduler_users:0,scheduler_users_30d:0,scheduled_total:0,scheduled_passed:0,scheduled_failed:0,scheduled_pending:0,scheduled_30d:0 },
    },
    members:[],
    applications:[],
    moderation:[],
    billing:{ payments:[],changes:[] },
    loveNotes:{ schedulers:{ users_total:0,users_30d:0,schedules_total:0,schedules_30d:0,avg_schedules_per_user:0 },recent:[] },
    featureUsage:{
      liveTracking:false,
      trackingMessage:'Prelaunch Admin preview is read-only. Only isolated Chat Room analytics are enabled here.',
      features:[],
    },
    topFeatureActivity:{ windows:[7,14,21,30] },
    chatRoom,
    system:{ aiUsage30d:[],authRoles:[],migrations:[] },
  }, {
    headers:{ 'cache-control':'no-store','x-content-type-options':'nosniff' },
  });
}

function prelaunchFoundingOffer() {
  return Response.json({
    ok:true,
    preview:true,
    readOnly:true,
    offer:{
      available:true,
      existing:false,
      foundingLimit:200,
      reservedCount:0,
      remaining:200,
      foundingNumber:null,
      cohort:null,
      status:null,
      badgeRetained:true,
      tokenBenefit:null,
      economicsPendingCalibration:true,
      recurringSubscriptionOffer:false,
      accessModel:'free_tokens',
    },
  }, {
    headers:{ 'cache-control':'no-store','x-content-type-options':'nosniff' },
  });
}

function prelaunchAdminAnalytics() {
  return Response.json({
    ok:true,
    preview:true,
    readOnly:true,
    directDelivery:{ sent:0,passed:0,failed:0,pending:0,receiptTrackingActive:false },
  }, {
    headers:{ 'cache-control':'no-store','x-content-type-options':'nosniff' },
  });
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
      subscription_plan:'Free',
      subscription_price:0,
      subscription_status:'inactive',
      stripe_subscription_id:null,
      token_balance:0,
      access_model:'free_tokens',
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

    if (url.pathname === '/api/admin/dashboard' && request.method === 'GET') {
      return prelaunchAdminDashboard(env);
    }

    if (url.pathname === '/api/admin/analytics' && request.method === 'GET') {
      return prelaunchAdminAnalytics();
    }

    if (url.pathname.startsWith('/api/admin/')) {
      return Response.json(
        { ok:false, preview:true, readOnly:true, error:{ code:'prelaunch_admin_read_only', message:'Admin controls are disabled in the prelaunch preview.' } },
        { status:405, headers:{ 'cache-control':'no-store','x-content-type-options':'nosniff' } },
      );
    }

    if (url.pathname === '/api/billing/founding-offer' && request.method === 'GET') {
      return prelaunchFoundingOffer();
    }

    if (url.pathname === '/api/billing/config' && request.method === 'GET') {
      return Response.json({
        ok:true,preview:true,readOnly:true,
        access_model:'free_tokens',
        free_account:true,
        recurring_checkout_ready:false,
        legacy_subscription_mutations_locked:true,
        founding_limit:200,
        founding_economics_pending_calibration:true,
        token_wallet:'/api/tokens/wallet',
        token_checkout:'/api/tokens/checkout',
      }, { headers:{ 'cache-control':'no-store','x-content-type-options':'nosniff' } });
    }

    if (url.pathname.startsWith('/api/billing/')) {
      const auth = await session(request, env);
      if (!auth) {
        return Response.json(
          { ok:false,preview:true,readOnly:true,error:{code:'unauthorized',message:'Authentication required.'} },
          { status:401,headers:{ 'cache-control':'no-store','x-content-type-options':'nosniff' } },
        );
      }
      return Response.json(
        { ok:false,preview:true,readOnly:true,error:{code:'prelaunch_billing_read_only',message:'Billing writes are disabled in Prelaunch.'} },
        { status:405,headers:{ 'cache-control':'no-store','x-content-type-options':'nosniff' } },
      );
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
