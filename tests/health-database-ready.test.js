import test from 'node:test';
import assert from 'node:assert/strict';
import {withDatabaseHealth} from '../worker/health-response.js';

const req = new Request('https://one2onelove.com/api/health');
function upstream(payload,status=200) {
 return async()=>new Response(JSON.stringify(payload),{status,headers:{'content-type':'application/json'}});
}
test('live DB readiness returns 200, true and preserves public metadata',async()=>{
 const res=await withDatabaseHealth(req,{},upstream({ok:true,database_ready:true,service:'one2onelove-api'}));
 assert.equal(res.status,200);
 const data=await res.json();
 assert.equal(data.database_ready,true);
 assert.equal(data.ok,true);
 assert.equal(data.production,true);
 assert.equal(data.environment,'production');
 assert.equal(data.accessModel,'free_tokens');
 assert.equal(res.headers.get('cache-control'),'no-store');
});
test('failed DB readiness returns 503 and false',async()=>{
 const res=await withDatabaseHealth(req,{},upstream({ok:false,database_ready:false},503));
 assert.equal(res.status,503);assert.equal((await res.json()).database_ready,false);
});
test('former static HTTP 200 is not accepted without database_ready',async()=>{
 const res=await withDatabaseHealth(req,{},upstream({ok:true,app:'one2onelove'}));
 assert.equal(res.status,503);assert.equal((await res.json()).database_ready,false);
});
test('database transport failures fail closed without leaking exception text',async()=>{
 const res=await withDatabaseHealth(req,{},async()=>{throw new Error('postgres connection password secret')});
 assert.equal(res.status,503);
 const body=await res.text();
 assert.equal(JSON.parse(body).database_ready,false);
 assert.ok(!body.includes('password'));
});
test('prelaunch identity remains correctly marked',async()=>{
 const res=await withDatabaseHealth(req,{PRELAUNCH_ENVIRONMENT:'true'},upstream({database_ready:true}));
 const data=await res.json();
 assert.equal(data.environment,'token-prelaunch');assert.equal(data.production,false);
});
