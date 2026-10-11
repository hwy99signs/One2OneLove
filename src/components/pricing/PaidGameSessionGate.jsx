import React, { cloneElement, isValidElement, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/apiClient';
import { getTokenWallet, isTokensRequiredError, tokenRequiredDetails } from '@/lib/tokenService';
import { useAuth } from '@/contexts/AuthContext';
import UnlockPriceDialog from './UnlockPriceDialog';

export default function PaidGameSessionGate({game,title,image,backdrop,children}){
  const {user,isAuthenticated}=useAuth();
  const [ready,setReady]=useState(false),[active,setActive]=useState(false),[sessionRef,setSessionRef]=useState(null),[open,setOpen]=useState(false),[busy,setBusy]=useState(false);
  const [price,setPrice]=useState(49),[balance,setBalance]=useState(null),[gameCredit,setGameCredit]=useState(null),[error,setError]=useState(''),[promotion,setPromotion]=useState(null);
  useEffect(()=>{
    let live=true;
    if(!isAuthenticated||!user?.id){setReady(true);return()=>{live=false};}
    let settled=0;const done=()=>{settled+=1;if(settled>=2&&live)setReady(true);};
    const tz=Intl.DateTimeFormat().resolvedOptions().timeZone;
    if(tz)apiRequest('/api/games/timezone',{method:'POST',body:{timeZone:tz}}).catch(()=>{});
    apiRequest('/api/games/standard/access?game='+encodeURIComponent(game)).then(access=>{
      if(!live)return;
      setPromotion(access?.promotion||null);
      if(access?.priceCents!=null)setPrice(Number(access.priceCents));
      if(access?.gameCredit?.balanceCents!=null)setGameCredit(Number(access.gameCredit.balanceCents));
      setActive(Boolean(access?.active));
      setSessionRef(access?.pass?.id||null);
    }).catch(()=>{
      apiRequest('/api/games/promotion?game='+encodeURIComponent(game)).then(d=>{if(live)setPromotion(d?.promotion||null);}).catch(()=>{});
    }).finally(()=>{if(live)done();});
    getTokenWallet().then(wallet=>{
      if(!live)return;
      setPrice(prev=>promotion?.free?0:prev||Number(wallet?.featurePrices?.find(x=>x.feature_code==='premium_game_session')?.token_cost||49));
      setBalance(Number(wallet?.wallet?.balance||0));
      setGameCredit(Number(wallet?.gameCredit?.balanceCents||0));
    }).catch(()=>{}).finally(()=>{if(live)done();});
    return()=>{live=false};
  },[game,user?.id,isAuthenticated]);
  const unlock=async()=>{
    if(!user?.id){window.location.assign('/SignIn?return='+encodeURIComponent(window.location.pathname));return;}
    setBusy(true);setError('');
    try{
      const requestId=globalThis.crypto?.randomUUID?.()||'game-'+Date.now();
      const data=await apiRequest('/api/games/standard/access',{method:'POST',body:{game,requestId}});
      if(data?.gameCredit?.balanceCents!=null)setGameCredit(Number(data.gameCredit.balanceCents));
      if(data?.pass?.metadata?.charged_price_cents!=null)setPrice(Number(data.pass.metadata.charged_price_cents));
      if(data?.promotion)setPromotion(data.promotion);
      setSessionRef(data?.pass?.id||null);
      setActive(true);setOpen(false);
    }catch(e){
      if(isTokensRequiredError(e)){const info=tokenRequiredDetails(e);setBalance(Number((info.creditBalance??info.balance)||0));setGameCredit(Number(info.gameCreditBalance||0));setPrice(Number(info.required||49));setError('You need $'+(Number(info.required||49)/100).toFixed(2)+' total game funding.');}
      else setError(e?.message||'Unable to start this game.');
    }finally{setBusy(false);}
  };
  if(!ready)return <div className="min-h-[50vh] grid place-items-center font-bold text-slate-500">Checking game access…</div>;
  if(active)return isValidElement(children)?cloneElement(children,{gameSessionRef:sessionRef}):children;
  if(promotion?.free)return <div className="grid min-h-[60vh] place-items-center p-6 text-center text-white" style={{backgroundColor:backdrop||'#07112f'}}><div className="w-full max-w-3xl">{image&&<img src={image} alt={title} className="mx-auto mb-6 block w-full rounded-[24px] shadow-2xl ring-1 ring-white/15"/>}<div className="text-5xl">🎮</div><div className="mt-4 inline-flex rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-800">{promotion?.name||'FREE GAME'}</div><h1 className="mt-4 text-3xl font-black">{title}</h1><p className="mt-3 text-white/75">{promotion?.temporary?'Free through Sunday, October 11 at 11:59 PM Central Time. No Credit will be used.':`${promotion?.name||'Promotion'} — every game is FREE today. No credits used.`}</p>{error&&<div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-900">{error}</div>}<button onClick={unlock} disabled={busy} className="mt-5 rounded-full bg-emerald-600 px-7 py-3 font-black text-white hover:bg-emerald-700 disabled:opacity-60">{busy?'Opening…':'Play FREE'}</button></div></div>;
  return <div className="grid min-h-[60vh] place-items-center p-6 text-center text-white" style={{backgroundColor:backdrop||'#07112f'}}><div className="w-full max-w-3xl">{image&&<img src={image} alt={title} className="mx-auto mb-6 block w-full rounded-[24px] shadow-2xl ring-1 ring-white/15"/>}<div className="text-5xl">🔒</div><h1 className="mt-4 text-3xl font-black">{title}</h1><p className="mt-2 text-white/75">This game is $0.49 per play/session. View the price before deciding.</p><button onClick={()=>setOpen(true)} className="mt-5 rounded-full bg-fuchsia-600 px-6 py-3 font-black text-white">View price to play</button></div><UnlockPriceDialog open={open} title={title} priceCents={price} terms="Per game / session." balanceCents={balance} gameCreditCents={gameCredit} promotion={promotion} busy={busy} error={error} onUnlock={unlock} onClose={()=>{setOpen(false);setError('')}}/></div>;
}
