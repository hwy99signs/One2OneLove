// @ts-nocheck
import { Client } from 'pg';
import { handleMyMatchIQAiRequest } from './mymatchiq-ai';
import { handleMyMatchIQCreditsRequest } from './mymatchiq-credits';
import { handleMyMatchIQMembersRequest } from './mymatchiq-members';
import { handleMyMatchIQLegacyRequest } from './mymatchiq-legacy';
import { handleLikeMindedRequest } from './like-minded';
import { handleFeatureUsageRequest } from './feature-usage';

const HEADERS={
  'content-type':'application/json; charset=utf-8',
  'cache-control':'no-store',
  'x-content-type-options':'nosniff',
};

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:HEADERS});}
function fail(message,status=400,code='bad_request'){return json({ok:false,error:{code,message}},status);}

function copyAuthResponseHeaders(upstreamHeaders){
  const headers=new Headers(upstreamHeaders);
  headers.delete('content-length');
  headers.delete('content-encoding');
  headers.delete('transfer-encoding');
  const getSetCookie=upstreamHeaders.getSetCookie?.bind(upstreamHeaders);
  if(getSetCookie){
    const cookies=getSetCookie();
    if(cookies.length){
      headers.delete('set-cookie');
      for(const cookie of cookies)headers.append('set-cookie',cookie.replace(/;\s*Domain=[^;]+/ig,''));
    }
  }
  return headers;
}

async function proxyAuth(request,env,url){
  const suffix=url.pathname.slice('/api/auth'.length)||'/';
  const upstream=new URL(env.NEON_AUTH_BASE_URL.replace(/\/$/,'')+suffix);
  upstream.search=url.search;
  const headers=new Headers(request.headers);
  headers.delete('host');
  headers.delete('content-length');
  const response=await fetch(upstream.toString(),{
    method:request.method,
    headers,
    body:['GET','HEAD'].includes(request.method)?undefined:request.body,
    redirect:'manual',
  });
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers:copyAuthResponseHeaders(response.headers)});
}

async function getSession(request,env){
  const cookie=request.headers.get('cookie');
  if(!cookie)return null;
  const response=await fetch(env.NEON_AUTH_BASE_URL.replace(/\/$/,'')+'/get-session',{headers:{cookie,accept:'application/json'}});
  if(!response.ok)return null;
  const payload=await response.json().catch(()=>null);
  const user=payload?.user??payload?.data?.user??null;
  const session=payload?.session??payload?.data?.session??null;
  return user?.id&&user?.emailVerified===true&&session?{user,session}:null;
}

async function profileGet(request,env){
  if(request.method!=='GET')return fail('Functional Prelaunch profile access is read-only.',405,'method_not_allowed');
  const auth=await getSession(request,env);
  if(!auth)return fail('Authentication required.',401,'unauthorized');
  const db=new Client({connectionString:env.HYPERDRIVE.connectionString});
  await db.connect();
  try{
    const result=await db.query(`
      SELECT u.id,u.email,u.name,u.user_type,u.is_active,u.subscription_plan,u.subscription_price,
             u.subscription_status,u.subscription_end_date,u.stripe_subscription_id,
             u.subscription_current_period_start,u.subscription_current_period_end,u.trial_end_date,
             u.cancel_at_period_end,u.created_at,u.updated_at,
             COALESCE((to_jsonb(u)->>'phone_number_verified')::boolean,false) AS phone_number_verified,
             NULLIF(to_jsonb(u)->>'phone_number','') AS phone_number,
             true AS phone_verification_required
        FROM public.users u WHERE u.id=$1::uuid LIMIT 1`,[auth.user.id]);
    return json({ok:true,profile:result.rows[0]||null});
  }finally{await db.end();}
}

export default {
  async fetch(request,env){
    const url=new URL(request.url);

    if(url.pathname==='/api/health'){
      return json({
        ok:true,
        environment:'o2ol-mymatchiq-functional-prelaunch',
        production:false,
        apiScope:['auth','profile-read','mymatchiq','like-minded','feature-usage'],
      });
    }

    if(url.pathname.startsWith('/api/auth/')){
      return proxyAuth(request,env,url);
    }
    if(url.pathname==='/api/profile'){
      return profileGet(request,env);
    }
    if(url.pathname==='/api/feature-usage'){
      const response=await handleFeatureUsageRequest(request,env,url);
      if(response)return response;
    }
    if(url.pathname.startsWith('/api/mymatchiq/credits')){
      const response=await handleMyMatchIQCreditsRequest(request,env,url);
      if(response)return response;
    }
    if(url.pathname.startsWith('/api/mymatchiq/members')){
      const response=await handleMyMatchIQMembersRequest(request,env,url);
      if(response)return response;
    }
    if(url.pathname.startsWith('/api/mymatchiq/legacy')){
      const response=await handleMyMatchIQLegacyRequest(request,env,url);
      if(response)return response;
    }
    if(url.pathname==='/api/mymatchiq/access'||url.pathname.startsWith('/api/mymatchiq/bianca')||url.pathname.startsWith('/api/mymatchiq/assessment')){
      const response=await handleMyMatchIQAiRequest(request,env,url);
      if(response)return response;
    }
    if(url.pathname.startsWith('/api/like-minded')){
      const response=await handleLikeMindedRequest(request,env,url);
      if(response)return response;
    }

    if(url.pathname.startsWith('/api/')){
      return json({ok:false,error:{code:'prelaunch_api_blocked',message:'This functional Prelaunch only exposes isolated auth/profile reads, MyMatchIQ, Like Minded and their aggregate analytics.'}},404);
    }
    return env.ASSETS.fetch(request);
  },
};
