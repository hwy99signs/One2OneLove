// @ts-nocheck
import { Client } from 'pg';
import { recordCostEvent } from './o2ol-cost-ledger';
import { CREDIT_CONFIG } from './credit-config';
import { ensureCreditSchema } from './love-note-credit';

const HEADERS = {
  'content-type':'application/json; charset=utf-8',
  'cache-control':'no-store',
  'x-content-type-options':'nosniff',
};

function json(data,status=200){ return new Response(JSON.stringify(data),{status,headers:HEADERS}); }
function fail(message,status=400,code='bad_request',extra={}){ return json({ok:false,error:{code,message,...extra}},status); }
async function readJson(request){
  if(!(request.headers.get('content-type')||'').includes('application/json')) {
    throw Object.assign(new Error('Expected application/json body.'),{status:400,code:'bad_request'});
  }
  return request.json();
}
async function withDb(env,fn){
  const db=new Client({connectionString:env.HYPERDRIVE.connectionString});
  await db.connect();
  try{return await fn(db);}finally{await db.end();}
}
async function session(request,env){
  const cookie=request.headers.get('cookie');
  if(!cookie)return null;
  const response=await fetch(env.NEON_AUTH_BASE_URL.replace(/\/$/,'')+'/get-session',{
    headers:{cookie,accept:'application/json'},
  });
  if(!response.ok)return null;
  const payload=await response.json().catch(()=>null);
  const user=payload?.user??payload?.data?.user??null;
  const active=payload?.session??payload?.data?.session??null;
  return user?.id&&user?.emailVerified===true&&active?{user,session:active}:null;
}
async function requireVerifiedMember(db,auth){
  const row=(await db.query(
    `SELECT COALESCE(phone_number_verified,false) AS phone_verified,
            COALESCE(is_active,true) AS is_active,
            stripe_customer_id,email,name
       FROM public.users WHERE id=$1::uuid LIMIT 1`,
    [auth.user.id],
  )).rows[0];
  if(!row)throw Object.assign(new Error('Member profile is not ready.'),{status:409,code:'profile_not_ready'});
  if(row.is_active===false)throw Object.assign(new Error('This account is not active.'),{status:403,code:'account_inactive'});
  if(row.phone_verified!==true)throw Object.assign(new Error('Phone verification is required.'),{status:428,code:'phone_verification_required'});
  return row;
}
async function stripeRequest(env,method,path,body=null,idempotencyKey=null){
  if(!env.STRIPE_SECRET_KEY)throw Object.assign(new Error('Credit checkout is not configured yet.'),{status:503,code:'payments_not_configured'});
  const headers={authorization:`Bearer ${env.STRIPE_SECRET_KEY}`,accept:'application/json'};
  let requestBody;
  if(body){
    headers['content-type']='application/x-www-form-urlencoded';
    const params=new URLSearchParams();
    for(const [key,value] of Object.entries(body)){
      if(value!==undefined&&value!==null)params.append(key,String(value));
    }
    requestBody=params;
  }
  if(idempotencyKey)headers['idempotency-key']=idempotencyKey;
  const response=await fetch('https://api.stripe.com/v1'+path,{method,headers,body:requestBody});
  const payload=await response.json().catch(()=>null);
  if(!response.ok)throw Object.assign(new Error(payload?.error?.message||'Stripe request failed.'),{status:502,code:payload?.error?.code||'payment_provider_error'});
  return payload;
}
async function ensureStripeCustomer(db,env,auth,profile=null){
  const row=profile||await requireVerifiedMember(db,auth);
  if(row.stripe_customer_id)return row.stripe_customer_id;
  const customer=await stripeRequest(env,'POST','/customers',{
    email:auth.user.email||row.email||'',
    name:auth.user.name||row.name||'',
    'metadata[user_id]':auth.user.id,
    'metadata[product]':'one2onelove_tokens',
  });
  await db.query(
    'UPDATE public.users SET stripe_customer_id=$1,updated_at=now() WHERE id=$2::uuid AND stripe_customer_id IS NULL',
    [customer.id,auth.user.id],
  );
  return customer.id;
}

async function ensureOwnerPricing(db){
  const rows=[
    ['bianca_response','Bianca reply (Medium legacy alias)',10,'response'],
    ['bianca_response_short','Bianca short reply',5,'response'],
    ['bianca_response_medium','Bianca medium reply',10,'response'],
    ['bianca_response_long','Bianca long reply',20,'response'],
    ['bianca_report','Bianca deeper report',299,'report'],
    ['amora_response','Amora reply (Medium legacy alias)',10,'response'],
    ['amora_response_short','Amora short reply',5,'response'],
    ['amora_response_medium','Amora medium reply',10,'response'],
    ['amora_response_long','Amora long reply',20,'response'],
    ['ai_content_generation','AI content generation',49,'action'],
    ['love_note_ai','Love Note AI generation',25,'action'],
    ['date_idea_unlock','Date Idea unlock',49,'item'],
    ['podcast_episode_unlock','Podcast episode unlock',199,'episode'],
    ['premium_content_unlock','Premium content unlock',299,'item'],
    ['studio_episode_unlock','Studio episode unlock',100,'episode'],
    ['like_minded_session','Like Minded session',49,'session'],
    ['scratch_game_session','Scratch Game session',49,'session'],
    ['premium_game_session','Premium game session',49,'session'],
    ['memories_unlock','Memories & Memory Photos unlock',299,'item'],
    ['journals_unlock','Journals unlock',299,'item'],
    ['milestones_unlock','Milestones unlock',299,'item'],
    ['goals_unlock','Goals Tracker unlock',299,'item'],
    ['calendar_unlock','Calendar Events unlock',299,'item'],
    ['love_language_report','Love Language detailed report',199,'report'],
    ['compatibility_report','MyMatchIQ full compatibility report',299,'report'],
    ['relationship_pattern_report','Relationship pattern report',299,'report'],
    ['premium_report','Premium deeper report',299,'report'],
  ];
  for(const [featureCode,label,tokenCost,pricingUnit] of rows){
    await db.query(
      `INSERT INTO public.o2ol_token_feature_prices(feature_code,label,token_cost,pricing_unit,active,calibration_only)
       VALUES($1,$2,$3,$4,true,false)
       ON CONFLICT(feature_code) DO UPDATE SET
         label=EXCLUDED.label,
         token_cost=EXCLUDED.token_cost,
         pricing_unit=EXCLUDED.pricing_unit,
         active=true,
         calibration_only=false`,
      [featureCode,label,tokenCost,pricingUnit],
    );
  }
}

export async function ensureTokenWallet(db,userId){
  const wallet=(await db.query(
    `INSERT INTO public.o2ol_token_wallets(user_id) VALUES($1::uuid)
     ON CONFLICT(user_id) DO UPDATE SET updated_at=public.o2ol_token_wallets.updated_at
     RETURNING *`,
    [userId],
  )).rows[0];
  const settings=(await db.query(
    `INSERT INTO public.o2ol_auto_replenish_settings(user_id) VALUES($1::uuid)
     ON CONFLICT(user_id) DO UPDATE SET updated_at=public.o2ol_auto_replenish_settings.updated_at
     RETURNING *`,
    [userId],
  )).rows[0];
  return {wallet,settings};
}

export async function getTokenFeaturePrice(db,featureCode){
  await ensureOwnerPricing(db);
  const row=(await db.query(
    `SELECT feature_code,label,token_cost,pricing_unit,active,calibration_only,metadata
       FROM public.o2ol_token_feature_prices
      WHERE feature_code=$1 LIMIT 1`,
    [String(featureCode||'')],
  )).rows[0];
  if(!row||row.active!==true)throw Object.assign(new Error('This token feature is not available.'),{status:503,code:'token_feature_unavailable'});
  return {...row,token_cost:Number(row.token_cost||0)};
}

export async function reserveTokenCharge(db,userId,featureCode,{idempotencyKey,metadata={}}={}){
  const key=String(idempotencyKey||'').trim();
  if(!key)throw Object.assign(new Error('A token idempotency key is required.'),{status:400,code:'idempotency_required'});
  await db.query('BEGIN');
  try{
    const existing=(await db.query(
      `SELECT r.*,t.balance_after
         FROM public.o2ol_token_reservations r
         LEFT JOIN public.o2ol_token_transactions t ON t.id=r.transaction_id
        WHERE r.idempotency_key=$1 LIMIT 1`,
      [key],
    )).rows[0];
    if(existing){
      await db.query('COMMIT');
      return {...existing,tokens:Number(existing.tokens||0),reused:true};
    }

    const price=await getTokenFeaturePrice(db,featureCode);
    if(price.token_cost<=0){
      await db.query('COMMIT');
      return {id:null,user_id:userId,feature_code:featureCode,tokens:0,status:'consumed',idempotency_key:key,balance_after:null,free:true};
    }

    await db.query(
      `INSERT INTO public.o2ol_token_wallets(user_id) VALUES($1::uuid)
       ON CONFLICT(user_id) DO NOTHING`,
      [userId],
    );
    const wallet=(await db.query(
      'SELECT * FROM public.o2ol_token_wallets WHERE user_id=$1::uuid FOR UPDATE',
      [userId],
    )).rows[0];
    const balance=Number(wallet?.balance||0);
    if(balance<price.token_cost){
      await db.query('ROLLBACK');
      throw Object.assign(new Error('Add Credit To Access'),{
        status:402,
        code:'tokens_required',
        balance,
        required:price.token_cost,
        featureCode,
        featureLabel:price.label,
      });
    }
    const next=balance-price.token_cost;
    await db.query(
      `UPDATE public.o2ol_token_wallets
          SET balance=$1,lifetime_used=lifetime_used+$2,updated_at=now()
        WHERE user_id=$3::uuid`,
      [next,price.token_cost,userId],
    );
    const tx=(await db.query(
      `INSERT INTO public.o2ol_token_transactions
        (user_id,wallet_delta,balance_after,transaction_type,feature_code,idempotency_key,metadata)
       VALUES($1::uuid,$2,$3,'reserve',$4,$5,$6::jsonb)
       RETURNING *`,
      [userId,-price.token_cost,next,featureCode,key,JSON.stringify(metadata||{})],
    )).rows[0];
    const reservation=(await db.query(
      `INSERT INTO public.o2ol_token_reservations
        (user_id,feature_code,tokens,idempotency_key,transaction_id,metadata)
       VALUES($1::uuid,$2,$3,$4,$5::uuid,$6::jsonb)
       RETURNING *`,
      [userId,featureCode,price.token_cost,key,tx.id,JSON.stringify(metadata||{})],
    )).rows[0];
    await db.query('COMMIT');
    return {...reservation,balance_after:next,transaction:tx};
  }catch(error){
    try{await db.query('ROLLBACK');}catch(_){}
    throw error;
  }
}

// Reserve an explicit Credit amount (USD cents) — used by Love Note SMS,
// whose price is regional (worker/credit-config.ts) rather than a single
// feature-price row. Same transactional guarantees as reserveTokenCharge:
// idempotency replay returns the original reservation, the wallet row is
// locked FOR UPDATE, and the balance can never go below zero (the ledger's
// balance_after CHECK is the database-level backstop).
export async function reserveCreditCharge(db,userId,featureCode,{amountCents,idempotencyKey,metadata={}}={}){
  const key=String(idempotencyKey||'').trim();
  if(!key)throw Object.assign(new Error('An idempotency key is required.'),{status:400,code:'idempotency_required'});
  const amount=Math.max(0,Math.floor(Number(amountCents)||0));
  await db.query('BEGIN');
  try{
    const existing=(await db.query(
      `SELECT r.*,t.balance_after
         FROM public.o2ol_token_reservations r
         LEFT JOIN public.o2ol_token_transactions t ON t.id=r.transaction_id
        WHERE r.idempotency_key=$1 LIMIT 1`,
      [key],
    )).rows[0];
    if(existing){
      await db.query('COMMIT');
      return {...existing,tokens:Number(existing.tokens||0),reused:true};
    }
    if(amount<=0){
      await db.query('COMMIT');
      return {id:null,user_id:userId,feature_code:featureCode,tokens:0,status:'consumed',idempotency_key:key,balance_after:null,free:true};
    }
    await db.query(
      `INSERT INTO public.o2ol_token_wallets(user_id) VALUES($1::uuid)
       ON CONFLICT(user_id) DO NOTHING`,
      [userId],
    );
    const wallet=(await db.query(
      'SELECT * FROM public.o2ol_token_wallets WHERE user_id=$1::uuid FOR UPDATE',
      [userId],
    )).rows[0];
    const balance=Number(wallet?.balance||0);
    if(balance<amount){
      await db.query('ROLLBACK');
      throw Object.assign(new Error('Add Credit To Access'),{
        status:402,
        code:'credit_required',
        balance,
        required:amount,
        featureCode,
        featureLabel:metadata?.featureLabel||'Love Note send',
      });
    }
    const next=balance-amount;
    await db.query(
      `UPDATE public.o2ol_token_wallets
          SET balance=$1,lifetime_used=lifetime_used+$2,updated_at=now()
        WHERE user_id=$3::uuid`,
      [next,amount,userId],
    );
    const tx=(await db.query(
      `INSERT INTO public.o2ol_token_transactions
        (user_id,wallet_delta,balance_after,transaction_type,feature_code,idempotency_key,metadata)
       VALUES($1::uuid,$2,$3,'reserve',$4,$5,$6::jsonb)
       RETURNING *`,
      [userId,-amount,next,featureCode,key,JSON.stringify(metadata||{})],
    )).rows[0];
    const reservation=(await db.query(
      `INSERT INTO public.o2ol_token_reservations
        (user_id,feature_code,tokens,idempotency_key,transaction_id,metadata)
       VALUES($1::uuid,$2,$3,$4,$5::uuid,$6::jsonb)
       RETURNING *`,
      [userId,featureCode,amount,key,tx.id,JSON.stringify(metadata||{})],
    )).rows[0];
    await db.query('COMMIT');
    return {...reservation,balance_after:next,transaction:tx};
  }catch(error){
    try{await db.query('ROLLBACK');}catch(_){}
    throw error;
  }
}

export async function consumeTokenReservation(db,reservationId){
  if(!reservationId)return null;
  return (await db.query(
    `UPDATE public.o2ol_token_reservations
        SET status='consumed',consumed_at=COALESCE(consumed_at,now())
      WHERE id=$1::uuid AND status='reserved'
      RETURNING *`,
    [reservationId],
  )).rows[0]||null;
}

export async function releaseTokenReservation(db,reservationId,reason='operation_failed'){
  if(!reservationId)return null;
  await db.query('BEGIN');
  try{
    const r=(await db.query(
      'SELECT * FROM public.o2ol_token_reservations WHERE id=$1::uuid FOR UPDATE',
      [reservationId],
    )).rows[0];
    if(!r||r.status!=='reserved'){await db.query('COMMIT');return r||null;}
    const wallet=(await db.query(
      'SELECT * FROM public.o2ol_token_wallets WHERE user_id=$1::uuid FOR UPDATE',
      [r.user_id],
    )).rows[0];
    const next=Number(wallet?.balance||0)+Number(r.tokens||0);
    await db.query(
      `UPDATE public.o2ol_token_wallets
          SET balance=$1,lifetime_used=GREATEST(0,lifetime_used-$2),updated_at=now()
        WHERE user_id=$3::uuid`,
      [next,r.tokens,r.user_id],
    );
    await db.query(
      `INSERT INTO public.o2ol_token_transactions
        (user_id,wallet_delta,balance_after,transaction_type,feature_code,metadata)
       VALUES($1::uuid,$2,$3,'release',$4,$5::jsonb)`,
      [r.user_id,r.tokens,next,r.feature_code,JSON.stringify({reservation_id:r.id,reason})],
    );
    const updated=(await db.query(
      `UPDATE public.o2ol_token_reservations SET status='released',released_at=now(),
       metadata=metadata||$2::jsonb WHERE id=$1::uuid RETURNING *`,
      [r.id,JSON.stringify({release_reason:reason})],
    )).rows[0];
    await db.query('COMMIT');
    return {...updated,balance_after:next};
  }catch(error){
    try{await db.query('ROLLBACK');}catch(_){}
    throw error;
  }
}

async function creditTokens(db,userId,{tokens,transactionType='purchase',packageCode=null,amountCents=null,provider='stripe',providerReference=null,idempotencyKey=null,metadata={}}){
  const qty=Math.max(0,Math.floor(Number(tokens)||0));
  if(!qty)return null;
  await db.query('BEGIN');
  try{
    if(idempotencyKey){
      const existing=(await db.query(
        'SELECT * FROM public.o2ol_token_transactions WHERE idempotency_key=$1 LIMIT 1',
        [idempotencyKey],
      )).rows[0];
      if(existing){await db.query('COMMIT');return existing;}
    }
    await db.query(
      'INSERT INTO public.o2ol_token_wallets(user_id) VALUES($1::uuid) ON CONFLICT(user_id) DO NOTHING',
      [userId],
    );
    const wallet=(await db.query(
      'SELECT * FROM public.o2ol_token_wallets WHERE user_id=$1::uuid FOR UPDATE',
      [userId],
    )).rows[0];
    const next=Number(wallet.balance||0)+qty;
    const purchaseLike=['purchase','auto_replenish'].includes(transactionType);
    const grantLike=['grant','founding_bonus','migration_credit','admin_adjustment'].includes(transactionType);
    await db.query(
      `UPDATE public.o2ol_token_wallets SET
        balance=$1,
        lifetime_purchased=lifetime_purchased+$2,
        lifetime_granted=lifetime_granted+$3,
        updated_at=now()
       WHERE user_id=$4::uuid`,
      [next,purchaseLike?qty:0,grantLike?qty:0,userId],
    );
    const tx=(await db.query(
      `INSERT INTO public.o2ol_token_transactions
       (user_id,wallet_delta,balance_after,transaction_type,package_code,amount_cents,provider,provider_reference,idempotency_key,metadata)
       VALUES($1::uuid,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)
       RETURNING *`,
      [userId,qty,next,transactionType,packageCode,amountCents,provider,providerReference,idempotencyKey,JSON.stringify(metadata||{})],
    )).rows[0];
    await db.query('COMMIT');
    return tx;
  }catch(error){
    try{await db.query('ROLLBACK');}catch(_){}
    throw error;
  }
}

async function tokenPackages(db){
  return (await db.query(
    `SELECT code,label,tokens,amount_cents,active,calibration_only,display_order
       FROM public.o2ol_token_packages WHERE active=true ORDER BY display_order,amount_cents`
  )).rows.map(x=>({...x,tokens:Number(x.tokens),amount_cents:Number(x.amount_cents)}));
}
async function featurePrices(db){
  return (await db.query(
    `SELECT feature_code,label,token_cost,pricing_unit,active,calibration_only,metadata
       FROM public.o2ol_token_feature_prices WHERE active=true ORDER BY feature_code`
  )).rows.map(x=>({...x,token_cost:Number(x.token_cost)}));
}
async function recentTransactions(db,userId){
  return (await db.query(
    `SELECT id,wallet_delta,balance_after,transaction_type,feature_code,package_code,amount_cents,
            provider,provider_reference,metadata,created_at
       FROM public.o2ol_token_transactions
      WHERE user_id=$1::uuid ORDER BY created_at DESC LIMIT 75`,
    [userId],
  )).rows;
}
async function createCheckout(request,db,env,auth,input){
  await requireVerifiedMember(db,auth);
  const requestedPackage=String(input?.packageCode||'').trim();
  let pkg;
  if(requestedPackage==='custom_credit'){
    const amountCents=Math.floor(Number(input?.customAmountCents)||0);
    // Stripe's USD minimum is below this; the $1 floor keeps the customer-facing
    // custom Credit control simple. The upper bound limits accidental/abusive charges.
    if(!Number.isInteger(amountCents)||amountCents<100||amountCents>100000){
      return fail('Custom Credit amount must be between $1.00 and $1,000.00.',400,'invalid_custom_credit_amount');
    }
    pkg={code:'custom_credit',label:'Custom Amount',tokens:amountCents,amount_cents:amountCents,calibration_only:false};
  }else{
    pkg=(await db.query(
      'SELECT * FROM public.o2ol_token_packages WHERE code=$1 AND active=true LIMIT 1',
      [requestedPackage],
    )).rows[0];
    if(!pkg)return fail('Invalid Credit package.',400,'invalid_package');
  }
  const customer=await ensureStripeCustomer(db,env,auth);
  const origin=new URL(request.url).origin;
  const requestedReturn=String(input?.returnTo||'').trim();
  const safeReturn=requestedReturn.startsWith('/')&&!requestedReturn.startsWith('//')?requestedReturn:'/Home';
  const encodedReturn=encodeURIComponent(safeReturn);
  const checkout=await stripeRequest(env,'POST','/checkout/sessions',{
    mode:'payment',
    customer,
    'line_items[0][price_data][currency]':'usd',
    'line_items[0][price_data][unit_amount]':pkg.amount_cents,
    'line_items[0][price_data][product_data][name]':`One2OneLove — ${pkg.label}${pkg.calibration_only?' Credit Package':' Credit'}`,
    'line_items[0][quantity]':1,
    success_url:`${origin}/Credit?checkout=success&session_id={CHECKOUT_SESSION_ID}&return=${encodedReturn}`,
    cancel_url:`${origin}/Credit?checkout=cancelled&return=${encodedReturn}`,
    client_reference_id:auth.user.id,
    'metadata[user_id]':auth.user.id,
    'metadata[purpose]':'o2ol_token_purchase',
    'metadata[package_code]':pkg.code,
    'metadata[tokens]':pkg.tokens,
    'metadata[amount_cents]':pkg.amount_cents,
  });
  return json({ok:true,checkout:{id:checkout.id,url:checkout.url,package:{code:pkg.code,label:pkg.label,tokens:Number(pkg.tokens),amountCents:Number(pkg.amount_cents)}}});
}
async function recordStripeFeeFromPaymentIntent(db,env,userId,paymentIntentId,packageCode,tokens){
  if(!paymentIntentId)return null;
  try{
    const intent=await stripeRequest(env,'GET',`/payment_intents/${encodeURIComponent(paymentIntentId)}?expand[]=latest_charge.balance_transaction`);
    const bt=intent?.latest_charge?.balance_transaction;
    const feeCents=Number(bt?.fee||0);
    if(!feeCents)return null;
    const providerRequestId=String(bt?.id||paymentIntentId);
    const existing=(await db.query(
      `SELECT id FROM public.o2ol_cost_events
        WHERE feature_code='token_purchase' AND provider='stripe' AND provider_request_id=$1
        LIMIT 1`,
      [providerRequestId],
    )).rows[0]||null;
    if(existing)return existing;
    return recordCostEvent(db,env,{
      userId,
      featureCode:'token_purchase',
      provider:'stripe',
      providerProduct:'card_processing',
      providerRequestId,
      providerCostMicros:feeCents*10000,
      customerTokensCharged:0,
      metadata:{package_code:packageCode,purchased_tokens:tokens,payment_intent:paymentIntentId,fee_cents:feeCents,net_cents:Number(bt?.net||0)},
    });
  }catch(error){
    console.error('Unable to record Stripe fee telemetry',error);
    return null;
  }
}
async function confirmCheckout(db,env,auth,sessionId){
  await requireVerifiedMember(db,auth);
  if(!/^cs_[A-Za-z0-9_]+$/.test(String(sessionId||'')))throw Object.assign(new Error('Invalid checkout session.'),{status:400,code:'invalid_checkout_session'});
  const checkout=await stripeRequest(env,'GET',`/checkout/sessions/${encodeURIComponent(sessionId)}`);
  const meta=checkout?.metadata||{};
  if(meta.purpose!=='o2ol_token_purchase'||meta.user_id!==auth.user.id)throw Object.assign(new Error('Checkout session does not belong to this account.'),{status:403,code:'checkout_mismatch'});
  if(checkout.payment_status!=='paid')throw Object.assign(new Error('Credit payment has not completed.'),{status:409,code:'payment_not_complete'});
  const purchasedTokens=Math.max(0,Math.floor(Number(meta.tokens)||0));
  const packageCode=String(meta.package_code||'').trim();
  const amountCents=Math.max(0,Math.floor(Number(checkout.amount_total??meta.amount_cents)||0));
  if(!packageCode||!purchasedTokens||!amountCents)throw Object.assign(new Error('Credit purchase metadata is incomplete.'),{status:409,code:'purchase_metadata_invalid'});
  const tx=await creditTokens(db,auth.user.id,{
    tokens:purchasedTokens,
    transactionType:'purchase',
    packageCode,
    amountCents,
    provider:'stripe',
    providerReference:checkout.id,
    idempotencyKey:`stripe_checkout:${checkout.id}`,
    metadata:{payment_intent:checkout.payment_intent||null,purchased_snapshot:true},
  });
  await recordStripeFeeFromPaymentIntent(db,env,auth.user.id,checkout.payment_intent,packageCode,purchasedTokens);
  return tx;
}
async function createSetupCheckout(request,db,env,auth){
  const profile=await requireVerifiedMember(db,auth);
  const customer=await ensureStripeCustomer(db,env,auth,profile);
  const origin=new URL(request.url).origin;
  const checkout=await stripeRequest(env,'POST','/checkout/sessions',{
    mode:'setup',
    customer,
    success_url:`${origin}/Credit?payment_method=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:`${origin}/Credit?payment_method=cancelled`,
    'setup_intent_data[metadata][user_id]':auth.user.id,
    'setup_intent_data[metadata][purpose]':'o2ol_token_auto_replenish',
    'metadata[user_id]':auth.user.id,
    'metadata[purpose]':'o2ol_token_auto_replenish',
  });
  return checkout;
}
async function confirmSetupCheckout(db,env,auth,sessionId){
  await requireVerifiedMember(db,auth);
  if(!/^cs_[A-Za-z0-9_]+$/.test(String(sessionId||'')))throw Object.assign(new Error('Invalid setup session.'),{status:400,code:'invalid_setup_session'});
  const checkout=await stripeRequest(env,'GET',`/checkout/sessions/${encodeURIComponent(sessionId)}`);
  const meta=checkout?.metadata||{};
  if(meta.purpose!=='o2ol_token_auto_replenish'||meta.user_id!==auth.user.id)throw Object.assign(new Error('Setup session does not belong to this account.'),{status:403,code:'setup_mismatch'});
  if(!checkout.setup_intent)throw Object.assign(new Error('Payment method setup is not complete.'),{status:409,code:'setup_not_complete'});
  const setup=await stripeRequest(env,'GET',`/setup_intents/${encodeURIComponent(checkout.setup_intent)}`);
  if(setup.status!=='succeeded'||!setup.payment_method)throw Object.assign(new Error('Payment method setup is not complete.'),{status:409,code:'setup_not_complete'});
  return (await db.query(
    `INSERT INTO public.o2ol_auto_replenish_settings(user_id,payment_method_reference)
     VALUES($1::uuid,$2)
     ON CONFLICT(user_id) DO UPDATE SET payment_method_reference=$2,updated_at=now()
     RETURNING *`,
    [auth.user.id,setup.payment_method],
  )).rows[0];
}
async function updateAutoReplenish(db,userId,input){
  await ensureCreditSchema(db);
  const packageCode=String(input?.packageCode||CREDIT_CONFIG.autoReplenish.defaultPackageCode);
  const pkg=(await db.query('SELECT code,tokens FROM public.o2ol_token_packages WHERE code=$1 AND active=true LIMIT 1',[packageCode])).rows[0];
  if(!pkg)throw Object.assign(new Error('Invalid auto-replenish package.'),{status:400,code:'invalid_package'});
  const state=(await ensureTokenWallet(db,userId)).settings;
  const enabled=Boolean(input?.enabled);
  if(enabled&&!state.payment_method_reference)throw Object.assign(new Error('Add a payment method before enabling Auto-Replenish.'),{status:409,code:'payment_method_required'});
  // Off-session charges run ONLY on a mandate the member explicitly consents
  // to: enabling (or re-enabling after consent was never recorded) requires a
  // fresh explicit consent in the request, and the consent time is stored.
  const consentGiven=input?.consentGiven===true;
  if(enabled&&!consentGiven&&!state.consent_at){
    throw Object.assign(new Error('Please confirm the Auto-Replenish consent so we can charge your saved card when your Credit runs low.'),{status:409,code:'auto_replenish_consent_required'});
  }
  const trigger=input?.triggerBalance===undefined||input?.triggerBalance===null
    ? CREDIT_CONFIG.autoReplenish.triggerCents
    : Math.max(0,Math.floor(Number(input?.triggerBalance)||0));
  if(trigger>Number(pkg.tokens||0)){
    throw Object.assign(new Error('Choose a refill threshold no higher than the selected package size.'),{
      status:400,code:'trigger_too_high',maxTrigger:Number(pkg.tokens||0),
    });
  }
  let monthlyCap;
  if(input?.monthlyCapCents===undefined){
    monthlyCap=state.monthly_cap_cents===undefined||state.monthly_cap_cents===null
      ? (enabled?CREDIT_CONFIG.autoReplenish.defaultMonthlyCapCents:null)
      : state.monthly_cap_cents;
  }else if(input?.monthlyCapCents===null){
    monthlyCap=null;
  }else{
    monthlyCap=Math.max(0,Math.floor(Number(input.monthlyCapCents)||0));
  }
  return (await db.query(
    `UPDATE public.o2ol_auto_replenish_settings
        SET enabled=$1,package_code=$2,trigger_balance=$3,monthly_cap_cents=$4,
            consent_at=CASE WHEN $5 THEN now() ELSE consent_at END,updated_at=now()
      WHERE user_id=$6::uuid RETURNING *`,
    [enabled,packageCode,trigger,monthlyCap,consentGiven,userId],
  )).rows[0];
}
export async function maybeAutoReplenish(db,env,userId){
  await ensureCreditSchema(db);
  const row=(await db.query(
    `SELECT w.balance,s.enabled,s.package_code,s.trigger_balance,s.payment_method_reference,
            s.monthly_cap_cents,s.consent_at,u.stripe_customer_id,u.email AS user_email,
            p.tokens,p.amount_cents
       FROM public.o2ol_token_wallets w
       JOIN public.o2ol_auto_replenish_settings s ON s.user_id=w.user_id
       JOIN public.o2ol_token_packages p ON p.code=s.package_code
       LEFT JOIN public.users u ON u.id=w.user_id
      WHERE w.user_id=$1::uuid`,
    [userId],
  )).rows[0];
  if(!row?.enabled||!row.payment_method_reference||!row.stripe_customer_id)return null;
  // No recorded mandate consent -> never charge off-session.
  if(!row.consent_at)return null;
  // Trigger: fire when the balance falls TO or BELOW the trigger mark ($5).
  if(Number(row.balance)>Number(row.trigger_balance))return null;
  // User-set monthly cap: never let this month's reloads exceed it.
  if(row.monthly_cap_cents!==null&&row.monthly_cap_cents!==undefined){
    const spent=(await db.query(
      `SELECT COALESCE(sum(amount_cents),0)::bigint AS total
         FROM public.o2ol_token_transactions
        WHERE user_id=$1::uuid AND transaction_type='auto_replenish'
          AND created_at>=date_trunc('month',now())`,
      [userId],
    )).rows[0];
    if(Number(spent?.total||0)+Number(row.amount_cents||0)>Number(row.monthly_cap_cents))return null;
  }
  const marker=`o2ol_auto:${userId}:${row.package_code}:${Math.floor(Date.now()/600000)}`;
  const existing=(await db.query('SELECT * FROM public.o2ol_token_transactions WHERE idempotency_key=$1 LIMIT 1',[marker])).rows[0];
  if(existing)return existing;
  const intent=await stripeRequest(env,'POST','/payment_intents',{
    amount:row.amount_cents,
    currency:'usd',
    customer:row.stripe_customer_id,
    payment_method:row.payment_method_reference,
    off_session:'true',
    confirm:'true',
    // Receipt on every reload: Stripe emails the receipt to the member.
    ...(row.user_email?{receipt_email:row.user_email}:{}),
    'expand[0]':'latest_charge',
    'metadata[user_id]':userId,
    'metadata[purpose]':'o2ol_token_auto_replenish',
    'metadata[package_code]':row.package_code,
    'metadata[tokens]':row.tokens,
    'metadata[idempotency_key]':marker,
  },marker);
  if(intent.status!=='succeeded')throw Object.assign(new Error('Auto-Replenish payment requires attention.'),{status:402,code:'auto_replenish_payment_failed'});
  const tx=await creditTokens(db,userId,{
    tokens:Number(row.tokens),
    transactionType:'auto_replenish',
    packageCode:row.package_code,
    amountCents:Number(row.amount_cents),
    provider:'stripe',
    providerReference:intent.id,
    idempotencyKey:marker,
    metadata:{
      payment_method:row.payment_method_reference,
      receipt_email:row.user_email||null,
      receipt_url:intent?.latest_charge?.receipt_url||null,
    },
  });
  await db.query('UPDATE public.o2ol_auto_replenish_settings SET last_triggered_at=now(),updated_at=now() WHERE user_id=$1::uuid',[userId]);
  await recordStripeFeeFromPaymentIntent(db,env,userId,intent.id,row.package_code,Number(row.tokens));
  return tx;
}
async function verifyStripeSignature(raw,signature,secret){
  if(!signature||!secret)return false;
  const values={};
  for(const item of signature.split(',')){
    const [k,v]=item.split('=',2);
    if(k&&v&&!values[k])values[k]=v;
  }
  const timestamp=values.t,expected=values.v1;
  if(!timestamp||!expected)return false;
  if(Math.abs(Math.floor(Date.now()/1000)-Number(timestamp))>300)return false;
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const signed=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(timestamp+'.'+raw));
  const actual=[...new Uint8Array(signed)].map(b=>b.toString(16).padStart(2,'0')).join('');
  if(actual.length!==expected.length)return false;
  let diff=0;for(let i=0;i<actual.length;i++)diff|=actual.charCodeAt(i)^expected.charCodeAt(i);
  return diff===0;
}
async function tokenWebhook(request,env){
  if(!env.STRIPE_WEBHOOK_SECRET)return fail('Stripe webhook is not configured.',503,'payments_not_configured');
  const raw=await request.text();
  if(!(await verifyStripeSignature(raw,request.headers.get('stripe-signature'),env.STRIPE_WEBHOOK_SECRET)))return fail('Invalid Stripe signature.',400,'invalid_signature');
  const event=JSON.parse(raw);
  const obj=event?.data?.object||{};
  const meta=obj.metadata||{};
  return withDb(env,async db=>{
    const existingEvent=(await db.query(
      `SELECT id,processed_at FROM public.o2ol_token_payment_events
        WHERE provider='stripe' AND event_id=$1 LIMIT 1`,
      [event.id],
    )).rows[0]||null;
    if(existingEvent?.processed_at)return json({ok:true,duplicate:true});

    await db.query(
      `INSERT INTO public.o2ol_token_payment_events(provider,event_id,event_type,user_id,payload,processed_at)
       VALUES('stripe',$1,$2,$3::uuid,$4::jsonb,NULL)
       ON CONFLICT(provider,event_id) DO UPDATE SET
         event_type=EXCLUDED.event_type,
         user_id=COALESCE(EXCLUDED.user_id,public.o2ol_token_payment_events.user_id),
         payload=EXCLUDED.payload`,
      [event.id,event.type,meta.user_id||null,JSON.stringify(event)],
    );
    if(event.type==='checkout.session.completed'&&obj.payment_status==='paid'&&meta.purpose==='o2ol_token_purchase'&&meta.user_id){
      const purchasedTokens=Math.max(0,Math.floor(Number(meta.tokens)||0));
      const packageCode=String(meta.package_code||'').trim();
      const amountCents=Math.max(0,Math.floor(Number(obj.amount_total??meta.amount_cents)||0));
      if(packageCode&&purchasedTokens&&amountCents){
        await creditTokens(db,meta.user_id,{
          tokens:purchasedTokens,transactionType:'purchase',packageCode,amountCents,
          provider:'stripe',providerReference:obj.id,idempotencyKey:`stripe_checkout:${obj.id}`,
          metadata:{payment_intent:obj.payment_intent||null,webhook_event:event.id,purchased_snapshot:true},
        });
        await recordStripeFeeFromPaymentIntent(db,env,meta.user_id,obj.payment_intent,packageCode,purchasedTokens);
      }else{
        throw Object.assign(new Error('Credit purchase webhook metadata is incomplete.'),{status:409,code:'purchase_metadata_invalid'});
      }
    }
    if(event.type==='payment_intent.succeeded'&&meta.purpose==='o2ol_token_auto_replenish'&&meta.user_id){
      const replenishedTokens=Math.max(0,Math.floor(Number(meta.tokens)||0));
      const packageCode=String(meta.package_code||'').trim();
      const amountCents=Math.max(0,Math.floor(Number(obj.amount_received??obj.amount)||0));
      if(packageCode&&replenishedTokens&&amountCents){
        await creditTokens(db,meta.user_id,{
          tokens:replenishedTokens,transactionType:'auto_replenish',packageCode,amountCents,
          provider:'stripe',providerReference:obj.id,idempotencyKey:meta.idempotency_key||`stripe_auto:${obj.id}`,
          metadata:{webhook_event:event.id,payment_intent:obj.id,purchased_snapshot:true},
        });
        await recordStripeFeeFromPaymentIntent(db,env,meta.user_id,obj.id,packageCode,replenishedTokens);
      }else{
        throw Object.assign(new Error('Auto-Replenish webhook metadata is incomplete.'),{status:409,code:'purchase_metadata_invalid'});
      }
    }
    await db.query(
      `UPDATE public.o2ol_token_payment_events
          SET processed_at=now()
        WHERE provider='stripe' AND event_id=$1`,
      [event.id],
    );
    return json({ok:true});
  });
}
async function twilioMessageDetails(env,messageSid){
  if(!messageSid||!env.TWILIO_ACCOUNT_SID||!env.TWILIO_AUTH_TOKEN)return null;
  const auth=btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`);
  const response=await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(env.TWILIO_ACCOUNT_SID)}/Messages/${encodeURIComponent(messageSid)}.json`,
    {headers:{authorization:`Basic ${auth}`,accept:'application/json'}},
  );
  if(!response.ok)return null;
  return response.json().catch(()=>null);
}
async function refreshTwilioCalibrationCosts(db,env,sessionId){
  const rows=(await db.query(
    `SELECT id,provider_request_id,provider_cost_micros,provider_output_units,metadata
       FROM public.o2ol_cost_events
      WHERE calibration_session_id=$1::uuid
        AND provider='twilio'
        AND provider_request_id IS NOT NULL
        AND (provider_cost_micros IS NULL OR provider_output_units=0)`,
    [sessionId],
  )).rows;
  let refreshed=0,pending=0;
  for(const row of rows){
    try{
      const message=await twilioMessageDetails(env,row.provider_request_id);
      if(!message){pending+=1;continue;}
      const price=message.price==null?null:Number(message.price);
      const costMicros=Number.isFinite(price)?Math.round(Math.abs(price)*1000000):null;
      const segments=Math.max(0,Number(message.num_segments||0)||0);
      const metadata={...(row.metadata||{}),twilio_status:message.status||null,twilio_price_unit:message.price_unit||'USD',cost_pending:costMicros==null,settled_lookup:true};
      await db.query(
        `UPDATE public.o2ol_cost_events
            SET provider_cost_micros=COALESCE($1,provider_cost_micros),
                provider_output_units=CASE WHEN $2>0 THEN $2 ELSE provider_output_units END,
                metadata=$3::jsonb
          WHERE id=$4::uuid`,
        [costMicros,segments,JSON.stringify(metadata),row.id],
      );
      if(costMicros==null)pending+=1;else refreshed+=1;
    }catch(error){
      pending+=1;
      console.error('Twilio calibration refresh failed',{messageSid:row.provider_request_id,message:error?.message});
    }
  }
  return {refreshed,pending};
}

async function calibrationStart(db,auth,input){
  if(String(auth.user.role||'').toLowerCase()!=='admin')throw Object.assign(new Error('Admin access required.'),{status:403,code:'admin_required'});
  const featureCode=String(input?.featureCode||'').trim();
  if(!featureCode)throw Object.assign(new Error('Feature is required.'),{status:400,code:'feature_required'});
  const state=await ensureTokenWallet(db,auth.user.id);
  await db.query('UPDATE public.o2ol_calibration_sessions SET ended_at=COALESCE(ended_at,now()),ending_balance=COALESCE(ending_balance,$1) WHERE user_id=$2::uuid AND ended_at IS NULL',[state.wallet.balance,auth.user.id]);
  return (await db.query(
    `INSERT INTO public.o2ol_calibration_sessions
     (user_id,feature_code,package_code,starting_balance,notes,metadata)
     VALUES($1::uuid,$2,$3,$4,$5,$6::jsonb) RETURNING *`,
    [auth.user.id,featureCode,input?.packageCode||null,Number(state.wallet.balance||0),String(input?.notes||'').slice(0,2000)||null,JSON.stringify({started_by:'admin'})],
  )).rows[0];
}
async function calibrationEnd(db,env,auth,input){
  if(String(auth.user.role||'').toLowerCase()!=='admin')throw Object.assign(new Error('Admin access required.'),{status:403,code:'admin_required'});
  const id=String(input?.sessionId||'').trim();
  const state=await ensureTokenWallet(db,auth.user.id);
  const ended=(await db.query(
    `UPDATE public.o2ol_calibration_sessions
        SET ended_at=COALESCE(ended_at,now()),ending_balance=$1
      WHERE id=$2::uuid AND user_id=$3::uuid
      RETURNING *`,
    [state.wallet.balance,id,auth.user.id],
  )).rows[0];
  if(!ended)throw Object.assign(new Error('Calibration session not found.'),{status:404,code:'not_found'});
  const providerRefresh={twilio:await refreshTwilioCalibrationCosts(db,env,id)};
  const summary=(await db.query(
    `SELECT
       COUNT(*)::int AS cost_events,
       COALESCE(SUM(input_characters),0)::bigint AS input_characters,
       COALESCE(SUM(output_characters),0)::bigint AS output_characters,
       COALESCE(SUM(context_characters),0)::bigint AS context_characters,
       COALESCE(SUM(provider_input_units),0)::bigint AS provider_input_units,
       COALESCE(SUM(provider_output_units),0)::bigint AS provider_output_units,
       COALESCE(SUM(provider_cached_input_units),0)::bigint AS provider_cached_input_units,
       COALESCE(SUM(provider_cost_micros),0)::bigint AS provider_cost_micros,
       COALESCE(SUM(customer_tokens_charged),0)::bigint AS customer_tokens_charged
       FROM public.o2ol_cost_events WHERE calibration_session_id=$1::uuid`,
    [id],
  )).rows[0];
  return {session:ended,summary,providerRefresh};
}

// Lazy-ensure DDL tolerance (2026-10-08): on the preview database the
// connecting role does not own the pre-existing tables, so an ensure DDL
// statement against an object that is already in shape can fail with 42501
// (must be owner). The full DDL set is pre-applied by the table owner via
// preview-schema-preapply.sql; here, skip ONLY the benign already-in-shape
// codes (42501 insufficient_privilege, 42701 duplicate_column, 42P07
// duplicate_table) per statement and continue. Any other error still throws,
// and the DML that follows surfaces a genuinely missing object loudly.
const TOLERATED_DDL_CODES = new Set(['42501', '42701', '42P07']);
async function ensureDdl(db, sql) {
  try { await db.query(sql); }
  catch (err) { if (!TOLERATED_DDL_CODES.has(err?.code)) throw err; }
}

async function ensureContentUnlockSchema(db){
  await ensureDdl(db, `
    CREATE TABLE IF NOT EXISTS public.o2ol_token_content_unlocks (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL,
      feature_code text NOT NULL,
      content_key text NOT NULL,
      token_transaction_id uuid NULL,
      tokens_charged integer NOT NULL DEFAULT 0,
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      unlocked_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(user_id, feature_code, content_key)
    )`);
  await ensureDdl(db, `CREATE INDEX IF NOT EXISTS idx_o2ol_token_content_unlocks_user_feature
    ON public.o2ol_token_content_unlocks(user_id,feature_code,unlocked_at DESC)`);
  await ensureOwnerPricing(db);
}

async function listContentUnlocks(db,userId,featureCode){
  await ensureContentUnlockSchema(db);
  const feature=String(featureCode||'').trim();
  if(!feature)return [];
  return (await db.query(
    `SELECT feature_code,content_key,tokens_charged,unlocked_at,metadata
       FROM public.o2ol_token_content_unlocks
      WHERE user_id=$1::uuid AND feature_code=$2
      ORDER BY unlocked_at DESC`,
    [userId,feature],
  )).rows;
}

async function unlockTokenContent(db,auth,input){
  await ensureContentUnlockSchema(db);
  const featureCode=String(input?.featureCode||'').trim();
  const contentKey=String(input?.contentKey||'').trim().slice(0,180);
  if(!featureCode||!contentKey)throw Object.assign(new Error('Feature and content key are required.'),{status:400,code:'unlock_target_required'});
  const allowed=new Set(['date_idea_unlock','podcast_episode_unlock','premium_content_unlock','studio_episode_unlock','memories_unlock','journals_unlock','milestones_unlock','goals_unlock','calendar_unlock','love_language_report','compatibility_report','relationship_pattern_report','premium_report']);
  if(!allowed.has(featureCode))throw Object.assign(new Error('This content unlock type is not available.'),{status:400,code:'unlock_feature_invalid'});

  const existing=(await db.query(
    `SELECT feature_code,content_key,tokens_charged,unlocked_at,metadata
       FROM public.o2ol_token_content_unlocks
      WHERE user_id=$1::uuid AND feature_code=$2 AND content_key=$3 LIMIT 1`,
    [auth.user.id,featureCode,contentKey],
  )).rows[0];
  if(existing)return {unlock:existing,reused:true,tokens:{charged:0}};

  const idempotencyKey=String(input?.idempotencyKey||`unlock:${featureCode}:${contentKey}:${auth.user.id}`).slice(0,220);
  const reservation=await reserveTokenCharge(db,auth.user.id,featureCode,{
    idempotencyKey,
    metadata:{content_key:contentKey,source:String(input?.source||'content_unlock').slice(0,120)},
  });

  try{
    const row=(await db.query(
      `INSERT INTO public.o2ol_token_content_unlocks
        (user_id,feature_code,content_key,token_transaction_id,tokens_charged,metadata)
       VALUES($1::uuid,$2,$3,$4::uuid,$5,$6::jsonb)
       ON CONFLICT(user_id,feature_code,content_key) DO UPDATE SET content_key=EXCLUDED.content_key
       RETURNING feature_code,content_key,tokens_charged,unlocked_at,metadata`,
      [
        auth.user.id,featureCode,contentKey,reservation.transaction_id||null,
        Number(reservation.tokens||0),JSON.stringify({source:String(input?.source||'content_unlock').slice(0,120)}),
      ],
    )).rows[0];
    await consumeTokenReservation(db,reservation.id);
    return {unlock:row,reused:false,tokens:{charged:Number(reservation.tokens||0),balance:Number(reservation.balance_after??0)}};
  }catch(error){
    if(reservation?.id)await releaseTokenReservation(db,reservation.id,'content_unlock_failed').catch(()=>{});
    throw error;
  }
}

async function walletPayload(db,userId){
  await ensureCreditSchema(db);
  await ensureOwnerPricing(db);
  const state=await ensureTokenWallet(db,userId);
  const activeCalibration=(await db.query(
    `SELECT * FROM public.o2ol_calibration_sessions
      WHERE user_id=$1::uuid AND ended_at IS NULL ORDER BY started_at DESC LIMIT 1`,
    [userId],
  )).rows[0]||null;
  const safeSettings={
    ...state.settings,
    payment_method_reference:undefined,
    payment_method_saved:Boolean(state.settings?.payment_method_reference),
  };
  return {
    wallet:state.wallet,
    settings:safeSettings,
    transactions:await recentTransactions(db,userId),
    packages:await tokenPackages(db),
    featurePrices:await featurePrices(db),
    activeCalibration,
    // The wallet unit is one US cent of Credit; balances display as dollars.
    credit:{currency:'Credit',unit:'USD_CENTS',expires:CREDIT_CONFIG.creditExpires},
  };
}

export async function handleO2OLTokenRequest(request,env,url){
  if(url.pathname==='/api/tokens/webhook'&&request.method==='POST'){
    try{return await tokenWebhook(request,env);}catch(error){console.error('O2OL token webhook error',error);return fail(error?.message||'Webhook failed.',500,'webhook_error');}
  }
  if(!url.pathname.startsWith('/api/tokens'))return null;
  const auth=await session(request,env);
  if(!auth)return fail('Verified One2OneLove sign-in is required.',401,'unauthorized');
  try{
    return await withDb(env,async db=>{
      await requireVerifiedMember(db,auth);
      if(url.pathname==='/api/tokens/wallet'&&request.method==='GET')return json({ok:true,...await walletPayload(db,auth.user.id)});
      if(url.pathname==='/api/tokens/packages'&&request.method==='GET'){await ensureCreditSchema(db);await ensureOwnerPricing(db);return json({ok:true,packages:await tokenPackages(db),featurePrices:await featurePrices(db)});}
      if(url.pathname==='/api/tokens/unlocks'&&request.method==='GET'){
        const featureCode=url.searchParams.get('featureCode')||'';
        return json({ok:true,unlocks:await listContentUnlocks(db,auth.user.id,featureCode)});
      }
      if(url.pathname==='/api/tokens/unlocks'&&request.method==='POST'){
        return json({ok:true,...await unlockTokenContent(db,auth,await readJson(request))},201);
      }

      if(url.pathname==='/api/tokens/checkout'&&request.method==='POST')return createCheckout(request,db,env,auth,await readJson(request));
      if(url.pathname==='/api/tokens/checkout/confirm'&&request.method==='POST'){
        const input=await readJson(request);const tx=await confirmCheckout(db,env,auth,input?.sessionId);
        return json({ok:true,transaction:tx,...await walletPayload(db,auth.user.id)});
      }
      if(url.pathname==='/api/tokens/payment-method/setup'&&request.method==='POST'){
        const checkout=await createSetupCheckout(request,db,env,auth);
        return json({ok:true,checkout:{id:checkout.id,url:checkout.url}});
      }
      if(url.pathname==='/api/tokens/payment-method/confirm'&&request.method==='POST'){
        const input=await readJson(request);const settings=await confirmSetupCheckout(db,env,auth,input?.sessionId);
        return json({ok:true,settings});
      }
      if(url.pathname==='/api/tokens/auto-replenish'&&request.method==='PUT'){
        const input=await readJson(request);
        const settings=await updateAutoReplenish(db,auth.user.id,input);
        const {payment_method_reference,...safe}=settings;
        return json({ok:true,settings:{...safe,payment_method_saved:Boolean(payment_method_reference)}});
      }
      if(url.pathname==='/api/tokens/calibration/start'&&request.method==='POST'){
        return json({ok:true,session:await calibrationStart(db,auth,await readJson(request))},201);
      }
      if(url.pathname==='/api/tokens/calibration/end'&&request.method==='POST'){
        return json({ok:true,...await calibrationEnd(db,env,auth,await readJson(request))});
      }
      if(url.pathname==='/api/tokens/calibration/history'&&request.method==='GET'){
        if(String(auth.user.role||'').toLowerCase()!=='admin')return fail('Admin access required.',403,'admin_required');
        const rows=(await db.query(
          `SELECT s.*,
            COALESCE((SELECT SUM(c.provider_cost_micros) FROM public.o2ol_cost_events c WHERE c.calibration_session_id=s.id),0) AS provider_cost_micros,
            COALESCE((SELECT SUM(c.customer_tokens_charged) FROM public.o2ol_cost_events c WHERE c.calibration_session_id=s.id),0) AS customer_tokens_charged
           FROM public.o2ol_calibration_sessions s WHERE s.user_id=$1::uuid
           ORDER BY s.started_at DESC LIMIT 50`,
          [auth.user.id],
        )).rows;
        return json({ok:true,sessions:rows});
      }
      return fail('Token route not found.',404,'not_found');
    });
  }catch(error){
    console.error('O2OL token API error',error);
    return fail(error?.message||'Unable to process token request.',error?.status||500,error?.code||'token_error',{
      balance:error?.balance,required:error?.required,featureCode:error?.featureCode,featureLabel:error?.featureLabel,
    });
  }
}
