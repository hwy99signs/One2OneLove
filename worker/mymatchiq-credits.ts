// @ts-nocheck

const HEADERS={
  'content-type':'application/json; charset=utf-8',
  'cache-control':'no-store',
  'x-content-type-options':'nosniff',
};

function json(data,status=200){
  return new Response(JSON.stringify(data),{status,headers:HEADERS});
}

/**
 * Legacy compatibility shim.
 *
 * MyMatchIQ credits were superseded by the single O2OL Token wallet.
 * Historical mmiq_* credit tables remain intact for reconciliation only;
 * this module must never create purchases, debit balances, or auto-replenish.
 */
export async function handleMyMatchIQCreditsRequest(_request,_env,url){
  if(!url.pathname.startsWith('/api/mymatchiq/credits'))return null;
  return json({
    ok:false,
    error:{
      code:'legacy_mymatchiq_credits_retired',
      message:'MyMatchIQ credits are retired. One2OneLove now uses a single O2OL Token wallet.',
      tokenWallet:'/api/tokens/wallet',
      tokenPackages:'/api/tokens/packages',
      tokenCheckout:'/api/tokens/checkout',
    },
  },410);
}

export async function consumeMyMatchIQCredits(){
  const error=new Error('MyMatchIQ credits are retired. Use the O2OL Token engine.');
  error.status=410;
  error.code='legacy_mymatchiq_credits_retired';
  throw error;
}
