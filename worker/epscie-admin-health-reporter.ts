// O2OL independent administrator-backend reporter; preview-disabled, server-side only.
// @ts-nocheck
import { Client } from 'pg';

const HEALTH='https://epscie-core.hwy99signs.workers.dev/v1/health/admin';
const MIRROR='https://epscie-core.hwy99signs.workers.dev/v1/admin-mirror/snapshot';

async function captureAdminSnapshot(env){
  if(!env.HYPERDRIVE?.connectionString)throw new Error('Admin monitor database binding missing');
  const client=new Client({connectionString:env.HYPERDRIVE.connectionString,connectionTimeoutMillis:4000});
  await client.connect();
  try{
    // Uses the same count definitions as the real O2OL admin overview.
    // No email, phone, ID, messages, profiles or other member rows are exported.
    const r=await client.query(`
      SELECT count(*)::int AS total,
        count(*) FILTER (WHERE p.id IS NOT NULL
          AND lower(COALESCE(p.subscription_status,'inactive'))
            NOT IN ('active','trial','trialing','past_due'))::int AS registered_free,
        count(*) FILTER (WHERE COALESCE(p.created_at,a."createdAt")
          >= now()-interval '24 hours')::int AS signups_24h,
        count(*) FILTER (WHERE NOT (
          (COALESCE(p.is_verified,false)=true OR COALESCE(a."emailVerified",false)=true)
          AND COALESCE(p.phone_number_verified,false)=true))::int AS pending_verification
      FROM neon_auth."user" a
      FULL OUTER JOIN public.users p ON p.id=a.id
      WHERE COALESCE(a.role,'user') <> 'admin'
    `);
    if(!r.rows.length)throw new Error('Admin overview query returned no summary');
    const x=r.rows[0];
    return {
      'members.total':Number(x.total),
      'members.free':Number(x.registered_free),
      'signups.last_24h':Number(x.signups_24h),
      'members.pending_verification':Number(x.pending_verification)
    };
  }finally{await client.end()}
}
async function postReport(env,path,payload){
  const r=await fetch(path,{method:'POST',headers:{
    'content-type':'application/json','x-epscie-app-key':'one2onelove',
    'x-epscie-key-id':env.O2OL_EPSCIE_ADMIN_KEY_ID,
    'x-epscie-secret':env.O2OL_EPSCIE_ADMIN_SECRET,
    'CF-Access-Client-Id':env.O2OL_EPSCIE_ACCESS_CLIENT_ID,
    'CF-Access-Client-Secret':env.O2OL_EPSCIE_ACCESS_CLIENT_SECRET
  },body:JSON.stringify(payload),signal:AbortSignal.timeout(10000)});
  if(r.status!==202)throw new Error('EPSCIE admin report rejected: '+r.status);
}
export default {
  async scheduled(_controller,env,ctx){
    if(env.O2OL_EPSCIE_ADMIN_ENABLED!=='true'||env.O2OL_MONITOR_ENV!=='production')return;
    ctx.waitUntil((async()=>{
      const required=['HYPERDRIVE','O2OL_EPSCIE_ADMIN_KEY_ID','O2OL_EPSCIE_ADMIN_SECRET',
        'O2OL_EPSCIE_ACCESS_CLIENT_ID','O2OL_EPSCIE_ACCESS_CLIENT_SECRET','O2OL_DEPLOYMENT_ID'];
      if(required.some(k=>!env[k]))throw new Error('Independent O2OL admin reporter configuration missing');
      const started=performance.now();
      let metrics=null,status='critical';
      try{metrics=await captureAdminSnapshot(env);status='healthy'}catch(error){
        console.error('O2OL admin snapshot readiness failed');
      }
      const when=new Date().toISOString();
      await postReport(env,HEALTH,{schema_version:1,health:{
        component:'one2onelove-admin',environment:'production',status,
        sender_id:'o2ol-independent-admin-worker',deployment_id:env.O2OL_DEPLOYMENT_ID,
        version:env.O2OL_DEPLOYMENT_ID,checks:{admin_database:status},
        response_ms:Math.round(performance.now()-started),observed_at:when
      }});
      if(status==='healthy'&&metrics){
        await postReport(env,MIRROR,{schema_version:1,environment:'production',
          sender_id:'o2ol-independent-admin-worker',deployment_id:env.O2OL_DEPLOYMENT_ID,
          observed_at:when,metrics});
      }
    })().catch(()=>console.error('Independent O2OL admin delivery failed')));
  },
  async fetch(){return new Response('Not found',{status:404})}
};
