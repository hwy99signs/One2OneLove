import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getTokenWallet, listTokenUnlocks, unlockTokenContent, isTokensRequiredError, isPhoneVerificationError, tokenRequiredDetails } from '@/lib/tokenService';
import UnlockPriceDialog from '@/components/pricing/UnlockPriceDialog';
import { FEATURE_PRICE_BY_CODE } from '@/lib/featurePricing';
import { isO2OLPromoFreeFeature } from '@/lib/o2olFreePromo2026';
import { useLanguage } from '@/Layout';
const FREE_ACCESS_COPY = {
  en:{title:'FREE during the promotion',body:'This feature is free for verified members through December 31, 2026. No Credit is needed.',signin:'Sign in to access for free',retry:'Check free access again'},
  es:{title:'GRATIS durante la promoción',body:'Esta función es gratis para miembros verificados hasta el 31 de diciembre de 2026. No se necesita Crédito.',signin:'Inicia sesión para acceder gratis',retry:'Comprobar acceso gratis'},
  fr:{title:'GRATUIT pendant l’offre',body:'Cette fonction est gratuite pour les membres vérifiés jusqu’au 31 décembre 2026. Aucun Crédit nécessaire.',signin:'Connectez-vous pour accéder gratuitement',retry:'Vérifier de nouveau l’accès gratuit'},
  it:{title:'GRATIS durante la promozione',body:'Questa funzione è gratis per i membri verificati fino al 31 dicembre 2026. Nessun Credito necessario.',signin:'Accedi per usufruirne gratis',retry:'Ricontrolla l’accesso gratis'},
  de:{title:'Während der Aktion KOSTENLOS',body:'Diese Funktion ist bis zum 31. Dezember 2026 für bestätigte Mitglieder kostenlos. Kein Credit nötig.',signin:'Anmelden für kostenlosen Zugang',retry:'Kostenlosen Zugang erneut prüfen'}
};

export default function PaidFeatureGate({ featureCode, children }) {
  const { user, isAuthenticated } = useAuth();
  const { currentLanguage } = useLanguage();
  const freeCopy = FREE_ACCESS_COPY[currentLanguage] || FREE_ACCESS_COPY.en;
  const catalog = FEATURE_PRICE_BY_CODE[featureCode];
  const [ready,setReady]=useState(false),[unlocked,setUnlocked]=useState(false),[open,setOpen]=useState(false),[busy,setBusy]=useState(false);
  const [error,setError]=useState(''),[balance,setBalance]=useState(null),[serverPrice,setServerPrice]=useState(null),[phoneGate,setPhoneGate]=useState(false);
  const refresh=async()=>{
    if(!isAuthenticated||!user?.id){ setReady(true); return; }
    // Fetch unlock state and wallet independently: one failing must not cost
    // the other, or the unlock dialog loses the member's balance and price.
    try{
      const u=await listTokenUnlocks(featureCode);
      const has=(u?.unlocks||[]).some(x=>String(x.content_key)==='feature');
      setUnlocked(has);
    }catch(_){}
    try{
      const w=await getTokenWallet();
      setBalance(Number(w?.wallet?.balance||0));
      const row=(w?.featurePrices||[]).find(x=>x.feature_code===featureCode);
      setServerPrice(row?Number(row.token_cost):null);
    }catch(_){}
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
      }else if(isPhoneVerificationError(e)){
        // Same door /Credit got in PR #163: never a bare sentence —
        // send the member to verify, with a way back to this feature.
        setOpen(false); setPhoneGate(true);
      }else setError(e?.message||'Unable to unlock this feature.');
    }finally{setBusy(false);}
  };
  if(!ready) return <div className="min-h-[45vh] grid place-items-center text-slate-500 font-bold">Checking access…</div>;
  if(unlocked) return children;
  if(phoneGate) return <div className="min-h-[60vh] grid place-items-center bg-gradient-to-br from-pink-50 via-white to-sky-50 p-6 text-center"><div className="max-w-md"><div className="text-5xl">📱</div><h1 className="mt-4 text-3xl font-black text-slate-900">Verify your phone number</h1><p className="mt-2 text-slate-600">Unlocking runs on your Credit wallet, and your wallet opens once your phone is verified. It takes about a minute — and verifying also lands your $5.00 in FREE O2OL Bonus Game Credits.</p><button type="button" onClick={()=>{window.location.assign('/VerifyPhone?redirect='+encodeURIComponent(window.location.pathname));}} className="mt-5 rounded-full bg-fuchsia-600 px-6 py-3 font-black text-white">Verify My Phone</button></div></div>;
  if(isO2OLPromoFreeFeature(featureCode))return <div className="min-h-[60vh] grid place-items-center bg-gradient-to-br from-pink-50 via-white to-sky-50 p-6 text-center"><div className="max-w-md"><div className="text-5xl">✨</div><h1 className="mt-4 text-3xl font-black text-slate-900">{freeCopy.title}</h1><p className="mt-3 text-slate-600">{freeCopy.body}</p><button type="button" onClick={()=>isAuthenticated?refresh():window.location.assign('/SignIn?return='+encodeURIComponent(window.location.pathname))} className="mt-5 rounded-full bg-fuchsia-600 px-6 py-3 font-black text-white">{isAuthenticated?freeCopy.retry:freeCopy.signin}</button></div></div>;
  return <>
    <div className="min-h-[60vh] grid place-items-center bg-gradient-to-br from-pink-50 via-white to-sky-50 p-6 text-center"><div><div className="text-5xl">🔒</div><h1 className="mt-4 text-3xl font-black text-slate-900">{catalog?.feature||'Premium feature'}</h1><p className="mt-2 text-slate-600">This feature is locked. Tap the locked feature to see its price.</p><button type="button" onClick={()=>setOpen(true)} className="mt-5 rounded-full bg-fuchsia-600 px-6 py-3 font-black text-white">View unlock price</button></div></div>
    <UnlockPriceDialog open={open} title={catalog?.feature} priceCents={serverPrice??catalog?.cents} priceLabel={catalog?.priceLabel} terms="One-time unlock — yours forever." balanceCents={balance} busy={busy} error={error} onUnlock={unlock} onClose={()=>setOpen(false)} />
  </>;
}
