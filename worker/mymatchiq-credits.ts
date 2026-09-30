// @ts-nocheck
import { Client } from 'pg';

const HEADERS={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'};
const PACKAGES={
  single:{code:'single',credits:1,amount_cents:199,label:'Single Play Credit'},
  six:{code:'six',credits:6,amount_cents:999,label:'Six-credit bundle'},
  twelve:{code:'twelve',credits:12,amount_cents:1999,label:'Twelve-credit bundle'},
};
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:HEADERS});}
function fail(message,status=400,code='bad_request'){return json({ok:false,error:{code,message}},status);}
async function readJson(request){if(!(request.headers.get('content-type')||'').includes('application/json'))throw new Error('Expected application/json body.');return request.json();}
async function session(request,env){const cookie=request.headers.get('cookie');if(!cookie)return null;const response=await fetch(env.NEON_AUTH_BASE_URL.replace(/\/$/,'')+'/get-session',{headers:{cookie,accept:'application/json'}});if(!response.ok)return null;const payload=await response.json().catch(()=>null);const user=payload?.user??payload?.data?.user??null;const active=payload?.session??payload?.data?.session??null;return user?.id&&user?.emailVerified===true&&active?{user,session:active}:null;}
async function withDb(env,fn){const db=new Client({connectionString:env.HYPERDRIVE.connectionString});await db.connect();try{return await fn(db);}finally{await db.end();}}
async function ensureWallet(db,userId){
  const wallet=(await db.query(`INSERT INTO public.mmiq_credit_wallets(user_id) VALUES($1::uuid) ON CONFLICT(user_id) DO UPDATE SET updated_at=public.mmiq_credit_wallets.updated_at RETURNING *`,[userId])).rows[0];
  const settings=(await db.query(`INSERT INTO public.mmiq_auto_replenish_settings(user_id) VALUES($1::uuid) ON CONFLICT(user_id) DO UPDATE SET updated_at=public.mmiq_auto_replenish_settings.updated_at RETURNING *`,[userId])).rows[0];
  return {wallet,settings};
}
async function recentTransactions(db,userId){return (await db.query(`SELECT id,wallet_delta,balance_after,transaction_type,package_code,amount_cents,provider,provider_reference,metadata,created_at FROM public.mmiq_credit_transactions WHERE user_id=$1::uuid ORDER BY created_at DESC LIMIT 30`,[userId])).rows;}
async function stripeRequest(env,path,body){
  if(!env.STRIPE_SECRET_KEY)throw Object.assign(new Error('Stripe Prelaunch checkout is not configured.'),{status:503,code:'payments_not_configured'});
  const params=new URLSearchParams();
  for(const [key,value] of Object.entries(body||{})){if(value!==undefined&&value!==null)params.set(key,String(value));}
  const response=await fetch('https://api.stripe.com/v1'+path,{method:'POST',headers:{authorization:`Bearer ${env.STRIPE_SECRET_KEY}`,'content-type':'application/x-www-form-urlencoded'},body:params});
  const payload=await response.json().catch(()=>null);
  if(!response.ok)throw Object.assign(new Error(payload?.error?.message||'Stripe request failed.'),{status:502,code:'payment_provider_error'});
  return payload;
}
async function ensureStripeCustomer(db,env,auth){
  const existing=(await db.query('SELECT stripe_customer_id,email,name FROM public.users WHERE id=$1::uuid',[auth.user.id])).rows[0]||null;
  if(existing?.stripe_customer_id)return existing.stripe_customer_id;
  const customer=await stripeRequest(env,'/customers',{
    email:auth.user.email||existing?.email||'',
    name:auth.user.name||existing?.name||'',
    'metadata[user_id]':auth.user.id,
    'metadata[product]':'mymatchiq',
  });
  await db.query('UPDATE public.users SET stripe_customer_id=$1,updated_at=now() WHERE id=$2::uuid AND stripe_customer_id IS NULL',[customer.id,auth.user.id]);
  return customer.id;
}
async function maybeAutoReplenish(db,env,userId){
  const r=await db.query(`SELECT w.balance,s.enabled,s.package_code,s.trigger_balance,s.payment_method_reference,u.stripe_customer_id
    FROM public.mmiq_credit_wallets w
    JOIN public.mmiq_auto_replenish_settings s ON s.user_id=w.user_id
    LEFT JOIN public.users u ON u.id=w.user_id
    WHERE w.user_id=$1::uuid`,[userId]);
  const row=r.rows[0];
  if(!row?.enabled||!row.payment_method_reference||!row.stripe_customer_id)return null;
  if(Number(row.balance)>Number(row.trigger_balance))return null;
  const pkg=PACKAGES[row.package_code]||PACKAGES.six;
  const pending=await db.query(`SELECT 1 FROM public.mmiq_payment_events WHERE user_id=$1::uuid AND provider='stripe' AND event_type='auto_replenish_requested' AND processed_at IS NULL AND created_at>now()-interval '30 minutes' LIMIT 1`,[userId]);
  if(pending.rowCount)return null;
  const marker='auto_'+crypto.randomUUID();
  await db.query(`INSERT INTO public.mmiq_payment_events(provider,event_id,event_type,user_id,payload) VALUES('stripe',$1,'auto_replenish_requested',$2::uuid,$3::jsonb)`,[marker,userId,JSON.stringify({package_code:pkg.code,credits:pkg.credits,amount_cents:pkg.amount_cents})]);
  try{
    const intent=await stripeRequest(env,'/payment_intents',{
      amount:pkg.amount_cents,
      currency:'usd',
      customer:row.stripe_customer_id,
      payment_method:row.payment_method_reference,
      off_session:'true',
      confirm:'true',
      'metadata[user_id]':userId,
      'metadata[package_code]':pkg.code,
      'metadata[credits]':pkg.credits,
      'metadata[amount_cents]':pkg.amount_cents,
      'metadata[purpose]':'mmiq_auto_replenish',
      'metadata[request_marker]':marker,
    });
    await db.query(`UPDATE public.mmiq_payment_events SET processed_at=now(),payload=payload||$1::jsonb WHERE provider='stripe' AND event_id=$2`,[JSON.stringify({payment_intent:intent.id,status:intent.status}),marker]);
    await db.query(`UPDATE public.mmiq_auto_replenish_settings SET last_triggered_at=now(),updated_at=now() WHERE user_id=$1::uuid`,[userId]);
    return intent;
  }catch(error){
    await db.query(`UPDATE public.mmiq_payment_events SET processed_at=now(),payload=payload||$1::jsonb WHERE provider='stripe' AND event_id=$2`,[JSON.stringify({failed:true,message:String(error?.message||'payment failed').slice(0,500)}),marker]);
    throw error;
  }
}
async function createCheckout(request,env,auth,input){
  const pkg=PACKAGES[String(input?.packageCode||'')];
  if(!pkg)return fail('Invalid credit package.',400,'invalid_package');
  const origin=new URL(request.url).origin;
  const checkout=await stripeRequest(env,'/checkout/sessions',{
    mode:'payment',
    'line_items[0][price_data][currency]':'usd',
    'line_items[0][price_data][unit_amount]':pkg.amount_cents,
    'line_items[0][price_data][product_data][name]':`MyMatchIQ — ${pkg.label}`,
    'line_items[0][quantity]':1,
    success_url:`${origin}/MyMatchIQ/Credits?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:`${origin}/MyMatchIQ/Credits?checkout=cancelled`,
    'metadata[user_id]':auth.user.id,
    'metadata[package_code]':pkg.code,
    'metadata[credits]':pkg.credits,
    'metadata[amount_cents]':pkg.amount_cents,
    client_reference_id:auth.user.id,
  });
  return json({ok:true,checkout:{id:checkout.id,url:checkout.url,package:pkg}});
}
async function createSetupIntent(db,env,auth){
  const customer=await ensureStripeCustomer(db,env,auth);
  const setup=await stripeRequest(env,'/setup_intents',{
    usage:'off_session',
    customer,
    'payment_method_types[0]':'card',
    'metadata[user_id]':auth.user.id,
    'metadata[purpose]':'mmiq_auto_replenish',
  });
  return json({ok:true,setupIntent:{id:setup.id,client_secret:setup.client_secret,customer}});
}
async function updateAuto(db,userId,input){
  const packageCode=String(input?.packageCode||'six');
  if(!PACKAGES[packageCode])throw Object.assign(new Error('Invalid auto-replenish package.'),{status:400,code:'invalid_package'});
  const trigger=Math.max(0,Math.min(12,Number(input?.triggerBalance||0)||0));
  const requested=Boolean(input?.enabled);
  const current=(await ensureWallet(db,userId)).settings;
  if(requested&&!current.payment_method_reference)throw Object.assign(new Error('A verified payment method is required before Auto Replenish can be enabled.'),{status:409,code:'payment_method_required'});
  return (await db.query(`UPDATE public.mmiq_auto_replenish_settings SET enabled=$1,package_code=$2,trigger_balance=$3,updated_at=now() WHERE user_id=$4::uuid RETURNING *`,[requested,packageCode,trigger,userId])).rows[0];
}
async function attachPaymentMethod(db,userId,input){
  const ref=String(input?.paymentMethodReference||'').trim();
  if(!/^pm_[A-Za-z0-9]+$/.test(ref))throw Object.assign(new Error('Invalid payment method reference.'),{status:400,code:'invalid_payment_method'});
  return (await db.query(`UPDATE public.mmiq_auto_replenish_settings SET payment_method_reference=$1,updated_at=now() WHERE user_id=$2::uuid RETURNING *`,[ref,userId])).rows[0];
}
export async function consumeMyMatchIQCredits(db,env,userId,credits,metadata={}){
  const amount=Math.max(1,Math.floor(Number(credits)||0));
  await db.query('BEGIN');
  try{
    const wallet=(await db.query(`SELECT * FROM public.mmiq_credit_wallets WHERE user_id=$1::uuid FOR UPDATE`,[userId])).rows[0];
    if(!wallet||wallet.balance<amount)throw Object.assign(new Error('Not enough MyMatchIQ credits.'),{status:402,code:'insufficient_credits'});
    const next=wallet.balance-amount;
    await db.query(`UPDATE public.mmiq_credit_wallets SET balance=$1,lifetime_used=lifetime_used+$2,updated_at=now() WHERE user_id=$3::uuid`,[next,amount,userId]);
    await db.query(`INSERT INTO public.mmiq_credit_transactions(user_id,wallet_delta,balance_after,transaction_type,metadata) VALUES($1::uuid,$2,$3,'use',$4::jsonb)`,[userId,-amount,next,JSON.stringify(metadata||{})]);
    await db.query('COMMIT');
    let autoReplenish=null;
    try{autoReplenish=await maybeAutoReplenish(db,env,userId);}catch(error){console.error('MMIQ auto replenish failed',error);}
    return {balance:next,autoReplenish: autoReplenish?{id:autoReplenish.id,status:autoReplenish.status}:null};
  }catch(error){await db.query('ROLLBACK');throw error;}
}
async function verifyStripeSignature(raw,signature,secret){
  if(!signature||!secret)return false;
  const parts=Object.fromEntries(signature.split(',').map(p=>p.split('=',2)));
  const timestamp=parts.t,expected=parts.v1;if(!timestamp||!expected)return false;
  if(Math.abs(Math.floor(Date.now()/1000)-Number(timestamp))>300)return false;
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const signed=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(timestamp+'.'+raw));
  const actual=[...new Uint8Array(signed)].map(b=>b.toString(16).padStart(2,'0')).join('');
  if(actual.length!==expected.length)return false;
  let diff=0;for(let i=0;i<actual.length;i++)diff|=actual.charCodeAt(i)^expected.charCodeAt(i);return diff===0;
}
async function webhook(request,env){
  if(!env.STRIPE_WEBHOOK_SECRET)return fail('Stripe webhook is not configured.',503,'payments_not_configured');
  const raw=await request.text();
  const valid=await verifyStripeSignature(raw,request.headers.get('stripe-signature'),env.STRIPE_WEBHOOK_SECRET);
  if(!valid)return fail('Invalid Stripe signature.',400,'invalid_signature');
  const event=JSON.parse(raw); const obj=event?.data?.object||{}; const metadata=obj.metadata||{};
  return withDb(env,async db=>{
    const seen=await db.query(`SELECT 1 FROM public.mmiq_payment_events WHERE provider='stripe' AND event_id=$1`,[event.id]);
    if(seen.rowCount)return json({ok:true,duplicate:true});
    await db.query('BEGIN');
    try{
      await db.query(`INSERT INTO public.mmiq_payment_events(provider,event_id,event_type,user_id,payload) VALUES('stripe',$1,$2,$3::uuid,$4::jsonb)`,[event.id,event.type,metadata.user_id||null,JSON.stringify(event)]);
      if(event.type==='checkout.session.completed'&&obj.payment_status==='paid'&&metadata.user_id&&PACKAGES[metadata.package_code]){
        const pkg=PACKAGES[metadata.package_code];
        const wallet=(await db.query(`INSERT INTO public.mmiq_credit_wallets(user_id) VALUES($1::uuid) ON CONFLICT(user_id) DO UPDATE SET updated_at=now() RETURNING *`,[metadata.user_id])).rows[0];
        const next=Number(wallet.balance||0)+pkg.credits;
        await db.query(`UPDATE public.mmiq_credit_wallets SET balance=$1,lifetime_purchased=lifetime_purchased+$2,updated_at=now() WHERE user_id=$3::uuid`,[next,pkg.credits,metadata.user_id]);
        await db.query(`INSERT INTO public.mmiq_credit_transactions(user_id,wallet_delta,balance_after,transaction_type,package_code,amount_cents,provider,provider_reference,metadata) VALUES($1::uuid,$2,$3,'purchase',$4,$5,'stripe',$6,$7::jsonb)`,[metadata.user_id,pkg.credits,next,pkg.code,pkg.amount_cents,obj.id,JSON.stringify({payment_intent:obj.payment_intent||null})]);
      }
      if(event.type==='setup_intent.succeeded'&&metadata.user_id&&metadata.purpose==='mmiq_auto_replenish'&&obj.payment_method){
        await db.query(`INSERT INTO public.mmiq_auto_replenish_settings(user_id,payment_method_reference) VALUES($1::uuid,$2) ON CONFLICT(user_id) DO UPDATE SET payment_method_reference=$2,updated_at=now()`,[metadata.user_id,obj.payment_method]);
      }
      if(event.type==='payment_intent.succeeded'&&metadata.user_id&&metadata.purpose==='mmiq_auto_replenish'&&PACKAGES[metadata.package_code]){
        const pkg=PACKAGES[metadata.package_code];
        const wallet=(await db.query(`INSERT INTO public.mmiq_credit_wallets(user_id) VALUES($1::uuid) ON CONFLICT(user_id) DO UPDATE SET updated_at=now() RETURNING *`,[metadata.user_id])).rows[0];
        const next=Number(wallet.balance||0)+pkg.credits;
        await db.query(`UPDATE public.mmiq_credit_wallets SET balance=$1,lifetime_purchased=lifetime_purchased+$2,updated_at=now() WHERE user_id=$3::uuid`,[next,pkg.credits,metadata.user_id]);
        await db.query(`INSERT INTO public.mmiq_credit_transactions(user_id,wallet_delta,balance_after,transaction_type,package_code,amount_cents,provider,provider_reference,metadata) VALUES($1::uuid,$2,$3,'auto_replenish',$4,$5,'stripe',$6,$7::jsonb) ON CONFLICT DO NOTHING`,[metadata.user_id,pkg.credits,next,pkg.code,pkg.amount_cents,obj.id,JSON.stringify({payment_method:obj.payment_method||null})]);
      }

      await db.query(`UPDATE public.mmiq_payment_events SET processed_at=now() WHERE provider='stripe' AND event_id=$1`,[event.id]);
      await db.query('COMMIT');return json({ok:true});
    }catch(error){await db.query('ROLLBACK');throw error;}
  });
}

export async function handleMyMatchIQCreditsRequest(request,env,url){
  if(url.pathname==='/api/mymatchiq/credits/webhook'&&request.method==='POST'){
    try{return await webhook(request,env);}catch(error){console.error('MMIQ Stripe webhook error',error);return fail(error?.message||'Webhook failed.',500,'webhook_error');}
  }
  if(!url.pathname.startsWith('/api/mymatchiq/credits'))return null;
  const auth=await session(request,env);if(!auth)return fail('Verified MyMatchIQ sign-in is required.',401,'unauthorized');
  try{
    if(url.pathname==='/api/mymatchiq/credits/checkout'&&request.method==='POST')return createCheckout(request,env,auth,await readJson(request));
    return await withDb(env,async db=>{
      if(url.pathname==='/api/mymatchiq/credits/setup-intent'&&request.method==='POST')return createSetupIntent(db,env,auth);
      if(url.pathname==='/api/mymatchiq/credits/wallet'&&request.method==='GET'){const state=await ensureWallet(db,auth.user.id);return json({ok:true,...state,transactions:await recentTransactions(db,auth.user.id),packages:PACKAGES});}
      if(url.pathname==='/api/mymatchiq/credits/auto-replenish'&&request.method==='PUT')return json({ok:true,settings:await updateAuto(db,auth.user.id,await readJson(request))});
      if(url.pathname==='/api/mymatchiq/credits/payment-method'&&request.method==='POST')return json({ok:true,settings:await attachPaymentMethod(db,auth.user.id,await readJson(request))});
      return fail('MyMatchIQ credit route not found.',404,'not_found');
    });
  }catch(error){console.error('MyMatchIQ credits API error',error);return fail(error?.message||'Unable to process MyMatchIQ credits request.',error?.status||500,error?.code||'credit_error');}
}
