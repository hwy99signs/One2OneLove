import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/apiClient';
import { getTokenWallet, isTokensRequiredError, tokenRequiredDetails } from '@/lib/tokenService';
import { useAuth } from '@/contexts/AuthContext';
import UnlockPriceDialog from './UnlockPriceDialog';

export default function PaidGameSessionGate({game,title,image,children}){
  const {user,isAuthenticated}=useAuth();
  const [ready,setReady]=useState(false),[active,setActive]=useState(false),[open,setOpen]=useState(false),[busy,setBusy]=useState(false);
  const [price,setPrice]=useState(49),[balance,setBalance]=useState(null),[error,setError]=useState(''),[promotion,setPromotion]=useState(null);
  useEffect(()=>{
    let live=true;
    if(!isAuthenticated||!user?.id){setReady(true);return()=>{live=false};}
    let settled=0;const done=()=>{settled+=1;if(settled>=2&&live)setReady(true);};
    apiRequest('/api/games/standard/access?game='+encodeURIComponent(game)).then(access=>{
      if(!live)return;
      setPromotion(access?.promotion||null);
      if(access?.promotion?.free)setPrice(0);
      setActive(Boolean(access?.active));
    }).catch(()=>{
      apiRequest('/api/games/promotion').then(d=>{if(live){setPromotion(d?.promotion||null);if(d?.promotion?.free)setPrice(0);}}).catch(()=>{});
    }).finally(()=>{if(live)done();});
    getTokenWallet().then(wallet=>{
      if(!live)return;
      setPrice(prev=>prev===0?0:Number(wallet?.featurePrices?.find(x=>x.feature_code==='premium_game_session')?.token_cost||49));
      setBalance(Number(wallet?.wallet?.balance||0));
    }).catch(()=>{}).finally(()=>{if(live)done();});
    return()=>{live=false};
  },[game,user?.id,isAuthenticated]);
  const unlock=async()=>{
    if(!user?.id){window.location.assign('/SignIn?return='+encodeURIComponent(window.location.pathname));return;}
    setBusy(true);setError('');
    try{
      const requestId=globalThis.crypto?.randomUUID?.()||'game-'+Date.now();
      const data=await apiRequest('/api/games/standard/access',{method:'POST',body:{game,requestId}});
      if(data?.tokens?.balance!=null)setBalance(Number(data.tokens.balance));
      if(data?.promotion)setPromotion(data.promotion);
      setActive(true);setOpen(false);
    }catch(e){
      if(isTokensRequiredError(e)){const info=tokenRequiredDetails(e);setBalance(Number(info.balance||0));setPrice(Number(info.required||49));setError('You need $'+(Number(info.required||49)/100).toFixed(2)+' Credit. Your balance is $'+(Number(info.balance||0)/100).toFixed(2)+'.');}
      else setError(e?.message||'Unable to start this game.');
    }finally{setBusy(false);}
  };
  if(!ready)return <div className="min-h-[50vh] grid place-items-center font-bold text-slate-500">Checking game access…</div>;
  if(active)return children;
  if(promotion?.free)return <div className="min-h-[60vh] grid place-items-center bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-6 text-center"><div className="max-w-xl">{image&&<img src={image} alt={title} className="mx-auto mb-5 block w-full rounded-2xl shadow-lg"/>}<div className="text-5xl">🎮</div><div className="mt-4 inline-flex rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-800">ALL GAMES FREE</div><h1 className="mt-4 text-3xl font-black">{title}</h1><p className="mt-3 text-slate-600">Free through Sunday, October 11 at 11:59 PM Central Time. No Credit will be used.</p>{error&&<div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-900">{error}</div>}<button onClick={unlock} disabled={busy} className="mt-5 rounded-full bg-emerald-600 px-7 py-3 font-black text-white hover:bg-emerald-700 disabled:opacity-60">{busy?'Opening…':'Play FREE'}</button></div></div>;
  return <div className="min-h-[60vh] grid place-items-center bg-gradient-to-br from-pink-50 via-white to-sky-50 p-6 text-center"><div className="w-full max-w-xl">{image&&<img src={image} alt={title} className="mx-auto mb-5 block w-full rounded-2xl shadow-lg"/>}<div className="text-5xl">🔒</div><h1 className="mt-4 text-3xl font-black">{title}</h1><p className="mt-2 text-slate-600">This game is $0.49 per play/session. View the price before deciding.</p><button onClick={()=>setOpen(true)} className="mt-5 rounded-full bg-fuchsia-600 px-6 py-3 font-black text-white">View price to play</button></div><UnlockPriceDialog open={open} title={title} priceCents={price} terms="Per game / session." balanceCents={balance} busy={busy} error={error} onUnlock={unlock} onClose={()=>{setOpen(false);setError('')}}/></div>;
}
