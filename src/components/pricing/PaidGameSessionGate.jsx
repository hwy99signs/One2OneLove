import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/apiClient';
import { getTokenWallet, isTokensRequiredError, tokenRequiredDetails } from '@/lib/tokenService';
import { useAuth } from '@/contexts/AuthContext';
import UnlockPriceDialog from './UnlockPriceDialog';

export default function PaidGameSessionGate({game,title,children}){
  const {user,isAuthenticated}=useAuth();
  const [ready,setReady]=useState(false),[active,setActive]=useState(false),[open,setOpen]=useState(false),[busy,setBusy]=useState(false);
  const [price,setPrice]=useState(49),[balance,setBalance]=useState(null),[error,setError]=useState('');
  useEffect(()=>{
    let live=true;
    if(!isAuthenticated||!user?.id){setReady(true);return()=>{live=false};}
    Promise.all([getTokenWallet(),apiRequest('/api/games/standard/access?game='+encodeURIComponent(game))]).then(([wallet,access])=>{
      if(!live)return;
      setPrice(Number(wallet?.featurePrices?.find(x=>x.feature_code==='premium_game_session')?.token_cost||49));
      setBalance(Number(wallet?.wallet?.balance||0));
      setActive(Boolean(access?.active));setOpen(!access?.active);setReady(true);
    }).catch(()=>{if(live){setOpen(true);setReady(true);}});
    return()=>{live=false};
  },[game,user?.id,isAuthenticated]);
  const unlock=async()=>{
    if(!user?.id){window.location.assign('/SignIn?return='+encodeURIComponent(window.location.pathname));return;}
    setBusy(true);setError('');
    try{
      const requestId=globalThis.crypto?.randomUUID?.()||'game-'+Date.now();
      const data=await apiRequest('/api/games/standard/access',{method:'POST',body:{game,requestId}});
      if(data?.tokens?.balance!=null)setBalance(Number(data.tokens.balance));
      setActive(true);setOpen(false);
    }catch(e){
      if(isTokensRequiredError(e)){const info=tokenRequiredDetails(e);setBalance(Number(info.balance||0));setPrice(Number(info.required||49));setError('You need $'+(Number(info.required||49)/100).toFixed(2)+' Credit. Your balance is $'+(Number(info.balance||0)/100).toFixed(2)+'.');}
      else setError(e?.message||'Unable to start this game.');
    }finally{setBusy(false);}
  };
  if(!ready)return <div className="min-h-[50vh] grid place-items-center font-bold text-slate-500">Checking game access…</div>;
  if(active)return children;
  return <div className="min-h-[60vh] grid place-items-center bg-gradient-to-br from-pink-50 via-white to-sky-50 p-6 text-center"><div><div className="text-5xl">🔒</div><h1 className="mt-4 text-3xl font-black">{title}</h1><p className="mt-2 text-slate-600">This game is $0.49 per play/session. View the price before deciding.</p><button onClick={()=>setOpen(true)} className="mt-5 rounded-full bg-fuchsia-600 px-6 py-3 font-black text-white">View price to play</button></div><UnlockPriceDialog open={open} title={title} priceCents={price} description="One paid game/session. Closing this window does not charge your account." balanceCents={balance} busy={busy} error={error} onUnlock={unlock} onClose={()=>{setOpen(false);setError('')}}/></div>;
}
