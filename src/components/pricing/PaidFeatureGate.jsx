import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getTokenWallet, listTokenUnlocks, unlockTokenContent, isTokensRequiredError, tokenRequiredDetails } from '@/lib/tokenService';
import UnlockPriceDialog from '@/components/pricing/UnlockPriceDialog';
import { FEATURE_PRICE_BY_CODE } from '@/lib/featurePricing';

export default function PaidFeatureGate({ featureCode, children }) {
  const { user, isAuthenticated } = useAuth();
  const catalog = FEATURE_PRICE_BY_CODE[featureCode];
  const [ready,setReady]=useState(false),[unlocked,setUnlocked]=useState(false),[open,setOpen]=useState(false),[busy,setBusy]=useState(false);
  const [error,setError]=useState(''),[balance,setBalance]=useState(null),[serverPrice,setServerPrice]=useState(null);
  const refresh=async()=>{
    if(!isAuthenticated||!user?.id){ setReady(true); setOpen(true); return; }
    try{
      const [u,w]=await Promise.all([listTokenUnlocks(featureCode),getTokenWallet()]);
      const has=(u?.unlocks||[]).some(x=>String(x.content_key)==='feature');
      setUnlocked(has); setBalance(Number(w?.wallet?.balance||0));
      const row=(w?.featurePrices||[]).find(x=>x.feature_code===featureCode);
      setServerPrice(row?Number(row.token_cost):null); setOpen(!has);
    }catch(_){ setOpen(true); }
    finally{ setReady(true); }
  };
  useEffect(()=>{ refresh(); },[featureCode,user?.id,isAuthenticated]);
  const unlock=async()=>{
    if(!user?.id){ window.location.href='/SignIn?return='+encodeURIComponent(window.location.pathname); return; }
    if(busy)return;
    setBusy(true);setError('');
    try{
      await unlockTokenContent({featureCode,contentKey:'feature',source:'feature_gate',idempotencyKey:'feature:'+user.id+':'+featureCode});
      setUnlocked(true);setOpen(false); await refresh();
    }catch(e){
      if(isTokensRequiredError(e)){
        const info=tokenRequiredDetails(e);
        setError('You need $'+(Number(info.required||catalog?.cents||0)/100).toFixed(2)+' Credit. Your balance is $'+(Number(info.balance||0)/100).toFixed(2)+'.');
      }else setError(e?.message||'Unable to unlock this feature.');
    }finally{setBusy(false);}
  };
  if(!ready) return <div className="min-h-[45vh] grid place-items-center text-slate-500 font-bold">Checking access…</div>;
  if(unlocked) return children;
  return <>
    <div className="min-h-[60vh] grid place-items-center bg-gradient-to-br from-pink-50 via-white to-sky-50 p-6 text-center"><div><div className="text-5xl">🔒</div><h1 className="mt-4 text-3xl font-black text-slate-900">{catalog?.feature||'Premium feature'}</h1><p className="mt-2 text-slate-600">Click below to see the price. You will not be charged unless you confirm Unlock.</p><button type="button" onClick={()=>setOpen(true)} className="mt-5 rounded-full bg-fuchsia-600 px-6 py-3 font-black text-white">View unlock price</button></div></div>
    <UnlockPriceDialog open={open} title={catalog?.feature} priceCents={serverPrice??catalog?.cents} priceLabel={catalog?.priceLabel} description={catalog?.paid} balanceCents={balance} busy={busy} error={error} onUnlock={unlock} onClose={()=>setOpen(false)} />
  </>;
}
