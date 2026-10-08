// Independent report-B sender: separate Cloudflare Worker from the live site.
// @ts-nocheck
const EPSCIE_URL='https://epscie-core.hwy99signs.workers.dev/v1/health/admin';
export default {
 async scheduled(_controller,env,ctx){
  if(env.O2OL_EPSCIE_ADMIN_ENABLED!=='true'||env.O2OL_MONITOR_ENV!=='production')return;
  ctx.waitUntil((async()=>{
   const required=['O2OL_ADMIN_HEALTH_URL','O2OL_ADMIN_PROBE_SECRET','O2OL_EPSCIE_ADMIN_KEY_ID',
    'O2OL_EPSCIE_ADMIN_SECRET','O2OL_EPSCIE_ACCESS_CLIENT_ID','O2OL_EPSCIE_ACCESS_CLIENT_SECRET','O2OL_DEPLOYMENT_ID'];
   if(required.some(key=>!env[key])) throw new Error('O2OL admin monitor secrets or identity missing');
   let status='critical';
   const started=performance.now();
   try{
    const response=await fetch(env.O2OL_ADMIN_HEALTH_URL,{method:'GET',headers:{
      'x-o2ol-admin-probe':env.O2OL_ADMIN_PROBE_SECRET,'accept':'application/json'
    },signal:AbortSignal.timeout(8000)});
    const body=await response.json().catch(()=>null);
    status=response.ok&&body?.ok===true&&body?.check==='healthy'?'healthy':'critical';
   }catch{status='critical'}
   const payload={schema_version:1,health:{
      component:'one2onelove-admin',environment:'production',status,
      sender_id:'o2ol-independent-admin-worker',deployment_id:env.O2OL_DEPLOYMENT_ID,
      version:env.O2OL_DEPLOYMENT_ID,checks:{admin_api:status},
      response_ms:Math.round(performance.now()-started),observed_at:new Date().toISOString()
   }};
   const upstream=await fetch(EPSCIE_URL,{method:'POST',headers:{
     'content-type':'application/json','x-epscie-app-key':'one2onelove',
     'x-epscie-key-id':env.O2OL_EPSCIE_ADMIN_KEY_ID,
     'x-epscie-secret':env.O2OL_EPSCIE_ADMIN_SECRET,
     'CF-Access-Client-Id':env.O2OL_EPSCIE_ACCESS_CLIENT_ID,
     'CF-Access-Client-Secret':env.O2OL_EPSCIE_ACCESS_CLIENT_SECRET
    },body:JSON.stringify(payload),signal:AbortSignal.timeout(10000)});
   if(upstream.status!==202)throw new Error('EPSCIE admin channel rejected: '+upstream.status);
  })().catch(()=>console.error('Independent O2OL admin health delivery failed')));
 },
 async fetch(){return new Response('Not found',{status:404})}
};
