// @ts-nocheck

const HEADERS={
  'content-type':'application/json; charset=utf-8',
  'cache-control':'no-store',
  'x-content-type-options':'nosniff',
};

function json(data,status=200){
  return new Response(JSON.stringify(data),{status,headers:HEADERS});
}

// Legacy route retained only to fail closed. Premiere/Exclusive plan changes
// must never mutate Stripe in the O2OL Free Account + Token model.
export async function handleBillingPlanChangeRequest(request,_env,url){
  if(url.pathname!=='/api/billing/change-plan')return null;
  if(request.method!=='POST'){
    return json({ok:false,error:{code:'method_not_allowed',message:'Method not allowed.'}},405);
  }
  return json({
    ok:false,
    error:{
      code:'legacy_subscription_model_retired',
      message:'Premiere/Exclusive recurring plan changes are retired. One2OneLove accounts are free and metered premium services use One2OneLove Credit.',
      tokenWallet:'/api/tokens/wallet',
    },
  },410);
}
