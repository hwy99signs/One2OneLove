import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/Layout";
import { apiRequest } from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import { hasFullMemberAccess } from "@/lib/openHouseAccess";
import { getTokenWallet, isTokensRequiredError, tokenRequiredDetails } from "@/lib/tokenService";
import OpenHouseBrowseNotice from "@/components/launch/OpenHouseBrowseNotice";
import UnlockPriceDialog from "@/components/pricing/UnlockPriceDialog";

const GAME_URL = "https://play.one2onelove.com/";

const copy = {
  en: { back:"Back to Games", full:"Open Full Screen", title:"One2OneLove Scratch Game", preview:"Scratch. Share. Grow closer. This game costs $0.49 per play.", loading:"Opening your One2OneLove game…", error:"Unable to open the Scratch Game." },
  es: { back:"Volver a Juegos", full:"Abrir Pantalla Completa", title:"Juego de Rasca One2OneLove", preview:"Rasca. Comparte. Acérquense. Este juego cuesta $0.49 por partida.", loading:"Abriendo tu juego One2OneLove…", error:"No se pudo abrir el Juego de Rasca." },
  fr: { back:"Retour aux Jeux", full:"Ouvrir en Plein Écran", title:"Jeu à Gratter One2OneLove", preview:"Grattez. Partagez. Rapprochez-vous. Ce jeu coûte 0,49 $ par partie.", loading:"Ouverture de votre jeu One2OneLove…", error:"Impossible d’ouvrir le Jeu à Gratter." },
  it: { back:"Torna ai Giochi", full:"Apri a Schermo Intero", title:"Gioco Gratta One2OneLove", preview:"Gratta. Condividi. Avvicinatevi. Questo gioco costa $0.49 a partita.", loading:"Apertura del gioco One2OneLove…", error:"Impossibile aprire il Gioco Gratta." },
  de: { back:"Zurück zu Spielen", full:"Vollbild Öffnen", title:"One2OneLove Rubbelspiel", preview:"Rubbeln. Teilen. Näher zusammenwachsen. Dieses Spiel kostet $0.49 pro Spiel.", loading:"Dein One2OneLove-Spiel wird geöffnet…", error:"Das Rubbelspiel kann nicht geöffnet werden." },
};

export default function ScratchGame() {
  const { currentLanguage } = useLanguage();
  const { user } = useAuth();
  const fullMemberAccess = hasFullMemberAccess(user);
  const t = copy[currentLanguage] || copy.en;
  const [gameUrl,setGameUrl] = useState(null);
  const [error,setError] = useState('');
  const [unlocking,setUnlocking] = useState(false);
  const [showUnlock,setShowUnlock] = useState(false);
  const [priceCents,setPriceCents] = useState(49);
  const [balanceCents,setBalanceCents] = useState(null);
  const [promotion,setPromotion] = useState(null);

  useEffect(()=>{
    let active=true;
    if(!fullMemberAccess)return()=>{active=false};
    Promise.all([getTokenWallet(),apiRequest('/api/games/promotion')]).then(([data,promo])=>{
      if(!active)return;
      setPromotion(promo?.promotion||null);
      setBalanceCents(Number(data?.wallet?.balance||0));
      setPriceCents(promo?.promotion?.free?0:Number(data?.featurePrices?.find(x=>x.feature_code==='scratch_game_session')?.token_cost||49));
      setShowUnlock(!promo?.promotion?.free);
    }).catch(()=>{if(active)setShowUnlock(true)});
    return()=>{active=false};
  },[fullMemberAccess]);

  const launchGame=async()=>{
    if(!fullMemberAccess||unlocking)return;
    setUnlocking(true);setError('');
    try{
      const requestId=globalThis.crypto?.randomUUID?.()||`scratch-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const payload=await apiRequest('/api/games/scratch/launch',{method:'POST',body:{requestId}});
      const token=payload?.token;
      if(!token)throw new Error(t.error);
      if(payload?.promotion)setPromotion(payload.promotion);
      if(payload?.tokens?.balance!=null)setBalanceCents(Number(payload.tokens.balance));
      setGameUrl(`${GAME_URL}?lang=${encodeURIComponent(currentLanguage||"en")}&ticket=${encodeURIComponent(token)}`);
      setShowUnlock(false);
    }catch(err){
      if(isTokensRequiredError(err)){
        const info=tokenRequiredDetails(err);
        setBalanceCents(Number(info.balance||0));
        setPriceCents(Number(info.required||49));
        setError(`You need $${(Number(info.required||49)/100).toFixed(2)} Credit. Your balance is $${(Number(info.balance||0)/100).toFixed(2)}.`);
      }else setError(err?.message||t.error);
    }finally{setUnlocking(false);}
  };

  return <div className="min-h-screen bg-gradient-to-br from-pink-50 via-cyan-50 to-blue-50">
    <div className="max-w-[1500px] mx-auto px-3 md:px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <Link to={createPageUrl("CooperativeGames")} className="inline-flex items-center text-slate-700 hover:text-pink-600 font-semibold"><ArrowLeft className="w-4 h-4 mr-2"/>{t.back}</Link>
        {gameUrl&&<a href={gameUrl} target="_blank" rel="noopener noreferrer"><Button variant="outline" className="gap-2"><ExternalLink className="w-4 h-4"/>{t.full}</Button></a>}
      </div>
      {!fullMemberAccess&&<div className="mb-4"><OpenHouseBrowseNotice/></div>}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-pink-100">
        {!fullMemberAccess?(
          <div className="p-8 text-center sm:p-12"><h1 className="text-3xl font-black text-slate-900">{t.title}</h1><p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-600">{t.preview}</p></div>
        ):gameUrl?(
          <iframe title="One2OneLove Scratch Game" src={gameUrl} className="w-full border-0" style={{height:"min(82vh, 980px)",minHeight:"680px"}} allow="fullscreen"/>
        ):promotion?.free?(
          <div className="p-10 text-center sm:p-14">
            <div className="mx-auto w-fit rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-800">ALL GAMES FREE</div>
            <h1 className="mt-4 text-3xl font-black text-slate-900">{t.title}</h1>
            <p className="mx-auto mt-3 max-w-xl text-slate-600">Free through Sunday, October 11 at 11:59 PM Central Time. No Credit will be used.</p>
            {error&&<div className="mx-auto mt-4 max-w-xl rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-900">{error}</div>}
            <Button onClick={launchGame} disabled={unlocking} className="mt-6 bg-emerald-600 font-black hover:bg-emerald-700">{unlocking?'Opening…':'Play FREE'}</Button>
          </div>
        ):(
          <div className="p-10 text-center sm:p-14">
            <LockKeyhole className="mx-auto h-12 w-12 text-pink-600"/>
            <h1 className="mt-4 text-3xl font-black text-slate-900">{t.title}</h1>
            <p className="mx-auto mt-3 max-w-xl text-slate-600">{t.preview}</p>
            <Button onClick={()=>setShowUnlock(true)} className="mt-6 bg-pink-600 font-black hover:bg-pink-700">View price to play</Button>
          </div>
        )}
      </div>
    </div>
    <UnlockPriceDialog open={showUnlock&&fullMemberAccess&&!gameUrl} title={t.title} priceCents={priceCents} description="One paid play/session. You are not charged for viewing this price." balanceCents={balanceCents} busy={unlocking} error={error} onUnlock={launchGame} onClose={()=>{setShowUnlock(false);setError('')}}/>
  </div>;
}
