import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/Layout";
import { apiRequest } from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import { hasFullMemberAccess } from "@/lib/openHouseAccess";
import OpenHouseBrowseNotice from "@/components/launch/OpenHouseBrowseNotice";

const GAME_URL = "https://play.one2onelove.com/";
const copy = {
  en: { back:"Back to Games", full:"Open Full Screen", title:"LOVE SCRATCH GAME", howTitle:'How to Play', howTo:"Pick a deck, draw a card, scratch to reveal a question, and talk it through. Solo, one couple, or two couples. No scoring — just conversation.", forever:'FREE FOREVER', free:'LOVE SCRATCH and all current and future One2OneLove games are permanently FREE. No Credit needed, ever.', play:'Play FREE', loading:'Opening your game…',error:'Unable to open the Scratch Game.', signUp:'Create a free verified account to play.' },
  es: { back:"Volver a Juegos", full:"Abrir Pantalla Completa", title:"LOVE SCRATCH GAME", howTitle:'Cómo jugar', howTo:"Elige un mazo, toma una carta, rasca para revelar una pregunta y hablen sobre ella. En solitario, una pareja o dos parejas. Sin puntos, solo conversación.", forever:'GRATIS PARA SIEMPRE', free:'LOVE SCRATCH y todos los juegos actuales y futuros de One2OneLove son GRATIS PARA SIEMPRE. Sin cobros de Crédito.', play:'Jugar GRATIS', loading:'Abriendo el juego…',error:'No se pudo abrir el Juego de Rasca.',signUp:'Crea una cuenta gratuita verificada para jugar.' },
  fr: { back:"Retour aux Jeux", full:"Ouvrir en Plein Écran", title:"LOVE SCRATCH GAME", howTitle:'Comment jouer',howTo:"Choisissez un paquet, piochez une carte, grattez pour révéler une question et discutez-en. En solo, à un couple ou à deux couples. Pas de score, juste la conversation.", forever:'GRATUIT POUR TOUJOURS', free:'LOVE SCRATCH et tous les jeux One2OneLove actuels et futurs sont GRATUITS POUR TOUJOURS. Aucun Crédit nécessaire.', play:'Jouer GRATUITEMENT',loading:'Ouverture du jeu…',error:'Impossible d’ouvrir le jeu.',signUp:'Créez un compte gratuit vérifié pour jouer.' },
  it: { back:"Torna ai Giochi", full:"Apri a Schermo Intero", title:"LOVE SCRATCH GAME",howTitle:'Come giocare',howTo:"Scegli un mazzo, pesca una carta, gratta per scoprire una domanda e parlatene. Da soli, in una coppia o in due coppie. Nessun punteggio: solo conversazione.",forever:'GRATIS PER SEMPRE',free:'LOVE SCRATCH e tutti i giochi One2OneLove attuali e futuri sono GRATIS PER SEMPRE. Nessun Credito necessario.',play:'Gioca GRATIS',loading:'Apertura del gioco…',error:'Impossibile aprire il gioco.',signUp:'Crea un account gratuito verificato per giocare.' },
  de: { back:"Zurück zu Spielen",full:"Vollbild Öffnen",title:"LOVE SCRATCH GAME",howTitle:'Spielanleitung',howTo:"Wähle ein Kartendeck, ziehe eine Karte, rubbele eine Frage frei und sprecht darüber. Allein, als Paar oder mit zwei Paaren. Keine Punkte – nur Gespräche.",forever:'FÜR IMMER KOSTENLOS',free:'LOVE SCRATCH und alle aktuellen und zukünftigen One2OneLove-Spiele sind FÜR IMMER KOSTENLOS. Kein Credit nötig.',play:'GRATIS spielen',loading:'Spiel wird geöffnet…',error:'Spiel konnte nicht geöffnet werden.',signUp:'Erstelle ein kostenloses verifiziertes Konto zum Spielen.' },
};
export default function ScratchGame(){
  const {currentLanguage}=useLanguage();
  const t=copy[currentLanguage]||copy.en;
  const {user}=useAuth();
  const fullMemberAccess=hasFullMemberAccess(user);
  const [gameUrl,setGameUrl]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const launchGame=async()=>{
    if(!fullMemberAccess||busy)return;
    setBusy(true);setError('');
    try{
      const requestId=globalThis.crypto?.randomUUID?.()||`scratch-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const payload=await apiRequest('/api/games/scratch/launch',{method:'POST',body:{requestId}});
      if(!payload?.token)throw new Error(t.error);
      setGameUrl(`${GAME_URL}?lang=${encodeURIComponent(currentLanguage||'en')}&ticket=${encodeURIComponent(payload.token)}`);
    }catch(err){setError(err?.message||t.error);}
    finally{setBusy(false);}
  };
  return <div className="min-h-screen" style={{backgroundColor:'#2b0813'}}>
    <div className="max-w-[1500px] mx-auto px-3 md:px-5 py-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link to={createPageUrl('CooperativeGames')} className="inline-flex items-center font-semibold text-white/85 hover:text-white"><ArrowLeft className="mr-2 h-4 w-4"/>{t.back}</Link>
        {gameUrl&&<a href={gameUrl} target="_blank" rel="noopener noreferrer"><Button variant="outline" className="gap-2"><ExternalLink className="h-4 w-4"/>{t.full}</Button></a>}
      </div>
      {!fullMemberAccess&&<div className="mb-4"><OpenHouseBrowseNotice/></div>}
      <img src="/game-cards/card-love-scratch.jpg" alt="LOVE SCRATCH GAME" className="mx-auto mb-6 block w-full max-w-3xl rounded-[24px] shadow-2xl ring-1 ring-white/15"/>
      <section aria-label={t.howTitle} className="mx-auto mb-5 max-w-3xl rounded-2xl border border-pink-300/30 bg-white/10 px-6 py-4 text-white">
        <h2 className="mb-2 text-xl font-black">{t.howTitle}</h2><p className="text-sm leading-7 text-white/90">{t.howTo}</p>
      </section>
      {gameUrl
        ? <div className="overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/15"><iframe title="LOVE SCRATCH GAME" src={gameUrl} className="w-full border-0" style={{height:'min(60vh, 720px)',minHeight:'520px'}} allow="fullscreen"/></div>
        : <div className="p-8 text-center text-white sm:p-12">
            <div className="mx-auto w-fit rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-800">{t.forever}</div>
            <h1 className="mt-4 text-3xl font-black">{t.title}</h1>
            <p className="mx-auto mt-3 max-w-xl text-white/80">{t.free}</p>
            {!fullMemberAccess&&<p className="mx-auto mt-3 text-white/70">{t.signUp}</p>}
            {error&&<div className="mx-auto mt-4 max-w-xl rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-900">{error}</div>}
            {fullMemberAccess&&<Button onClick={launchGame} disabled={busy} className="mt-6 bg-emerald-600 font-black hover:bg-emerald-700">{busy?t.loading:t.play}</Button>}
          </div>}
    </div>
    <p className="pb-5 pt-4 text-center text-xs text-white/50">Copyright © 2026 EPS Venture Group. All rights reserved.</p>
  </div>;
}
