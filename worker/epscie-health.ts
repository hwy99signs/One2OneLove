// Preview-only, fail-closed production site monitor. Never place credentials in browser code.
// @ts-nocheck
import { Client } from 'pg';
const ENDPOINT='https://epscie-core.hwy99signs.workers.dev/v1/health/site';
async function timed(label, fn){
 const started=performance.now();
 try { const ok=await fn(); return {status:ok?'healthy':'critical',ms:Math.round(performance.now()-started)}; }
 catch(error){console.error('O2OL health check failed:',label);return {status:'critical',ms:Math.round(performance.now()-started)};}
}
async function assetHealthy(env){
 if(!env.ASSETS) return false;
 const response=await env.ASSETS.fetch(new Request('https://one2onelove.com/index.html'));
 if(!response.ok)return false;
 const html=await response.text();
 return /id=["']root["']/.test(html) && /<script[^>]+src=/.test(html);
}
async function databaseHealthy(env){
 if(!env.HYPERDRIVE?.connectionString)return false;
 const db=new Client({connectionString:env.HYPERDRIVE.connectionString,connectionTimeoutMillis:4000});
 await db.connect();
 try{const r=await db.query("SELECT to_regclass('public.users') IS NOT NULL AS ready");return r.rows[0]?.ready===true}
 finally{await db.end()}
}
async function postToEpscie(env,url,headers,payload){
 const request=new Request(url,{method:'POST',headers,body:JSON.stringify(payload)});
 return env.EPSCIE_SERVICE?.fetch ? env.EPSCIE_SERVICE.fetch(request) : fetch(request,{signal:AbortSignal.timeout(10000)});
}
export async function sendProductionSiteHealth(env){
 // This guard intentionally rejects preview/staging deployments.
 if(env.O2OL_EPSCIE_SITE_ENABLED!=='true'||env.O2OL_DEPLOYMENT_ENV!=='production')return;
 const keyId=env.O2OL_EPSCIE_SITE_KEY_ID,secret=env.O2OL_EPSCIE_SITE_SECRET;
 const accessId=env.O2OL_EPSCIE_ACCESS_CLIENT_ID,accessSecret=env.O2OL_EPSCIE_ACCESS_CLIENT_SECRET;
 const deployment=env.O2OL_DEPLOYMENT_ID;
 const serviceBound=Boolean(env.EPSCIE_SERVICE?.fetch);
 if(!keyId||!secret||!deployment||(!serviceBound&&(!accessId||!accessSecret)))throw new Error('O2OL production health configuration incomplete');
 const [assets,db]=await Promise.all([timed('production-assets',()=>assetHealthy(env)),timed('production-db',()=>databaseHealthy(env))]);
 const checks={site_assets:assets.status,site_database:db.status};
 const status=Object.values(checks).includes('critical')?'critical':'healthy';
 const payload={schema_version:1,health:{
    component:'one2onelove',status,environment:'production',
    sender_id:'o2ol-live-site-worker',deployment_id:deployment,
    version:deployment,checks,response_ms:Math.max(assets.ms,db.ms),
    observed_at:new Date().toISOString()
 }};
 const headers={
  'content-type':'application/json',
  'x-epscie-app-key':'one2onelove',
  'x-epscie-key-id':keyId,'x-epscie-secret':secret
 };
 if(accessId&&accessSecret){
  headers['CF-Access-Client-Id']=accessId;
  headers['CF-Access-Client-Secret']=accessSecret;
 }
 const r=await postToEpscie(env,ENDPOINT,headers,payload);
 if(r.status!==202)throw new Error('Production site health reporting rejected: '+r.status);
}
export async function handlePrivateAdminHealth(request,env){
 const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store'};
 if(request.method!=='GET')return new Response('{"ok":false}',{status:405,headers});
 const expected=env.O2OL_ADMIN_PROBE_SECRET||'',provided=request.headers.get('x-o2ol-admin-probe')||'';
 if(!expected||!provided||expected.length!==provided.length)return new Response('{"ok":false}',{status:403,headers});
 let diff=0;for(let i=0;i<expected.length;i++)diff|=expected.charCodeAt(i)^provided.charCodeAt(i);
 if(diff!==0)return new Response('{"ok":false}',{status:403,headers});
 const health=await timed('admin-db',async()=>{
  if(!env.HYPERDRIVE?.connectionString)return false;
  const db=new Client({connectionString:env.HYPERDRIVE.connectionString,connectionTimeoutMillis:4000});
  await db.connect();
  try{
    const r=await db.query("SELECT to_regclass('neon_auth.user') IS NOT NULL AS users_ready, to_regclass('public.users') IS NOT NULL AS profiles_ready");
    return r.rows[0]?.users_ready===true && r.rows[0]?.profiles_ready===true;
  }finally{await db.end()}
 });
 return new Response(JSON.stringify({ok:health.status==='healthy',check:health.status}),{status:health.status==='healthy'?200:503,headers});
}
