import React,{useEffect,useRef} from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/Layout";
import { apiRequest, beaconJson } from "@/lib/apiClient";
import GameLeaderboard from "@/components/activities/GameLeaderboard";
import { useQueryClient } from "@tanstack/react-query";

const copy = {
  en: { back: "Back to Games" },
  es: { back: "Volver a Juegos" },
  fr: { back: "Retour aux Jeux" },
  it: { back: "Torna ai Giochi" },
  de: { back: "Zurück zu Spielen" },
};

export default function Pests({gameSessionRef}) {
  const { currentLanguage } = useLanguage();
  const t = copy[currentLanguage] || copy.en;
  const iframeRef=useRef(null);
  const runRef=useRef(null);
  const queryClient=useQueryClient();

  useEffect(()=>{
    const frame=iframeRef.current;
    if(!frame||!gameSessionRef)return;
    let doc=null,cleanup=[];
    const newRun=()=>{runRef.current=gameSessionRef+':'+(globalThis.crypto?.randomUUID?.()||String(Date.now()));};
    const readScore=()=>Number(doc?.getElementById('catches')?.textContent||0);
    const submit=(beacon=false)=>{
      const score=readScore(),sessionRef=runRef.current;
      if(!sessionRef||score<=0)return;
      runRef.current=null;
      const body={game:'pests',score,sessionRef};
      if(beacon){beaconJson('/api/games/scores',body);return;}
      apiRequest('/api/games/scores',{method:'POST',body}).then(()=>queryClient.invalidateQueries({queryKey:['gameLeaderboard','pests']})).catch(()=>{});
    };
    const bind=()=>{
      try{
        doc=frame.contentDocument;
        if(!doc)return;
        const play=doc.getElementById('playBtn'),menu=doc.getElementById('resetBtn');
        const onPlay=()=>newRun();
        const onMenu=()=>submit(false);
        play?.addEventListener('click',onPlay,true);
        menu?.addEventListener('click',onMenu,true);
        cleanup.push(()=>play?.removeEventListener('click',onPlay,true),()=>menu?.removeEventListener('click',onMenu,true));
      }catch(_){}
    };
    frame.addEventListener('load',bind);
    if(frame.contentDocument?.readyState==='complete')bind();
    const onHide=()=>submit(true);
    window.addEventListener('pagehide',onHide);
    return()=>{submit(true);window.removeEventListener('pagehide',onHide);frame.removeEventListener('load',bind);cleanup.forEach(fn=>fn());};
  },[gameSessionRef,queryClient]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-emerald-50">
      <div className="max-w-[1500px] mx-auto px-3 md:px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <Link to={createPageUrl("CooperativeGames")} className="inline-flex items-center text-slate-700 hover:text-emerald-600 font-semibold">
            <ArrowLeft className="w-4 h-4 mr-2" />{t.back}
          </Link>
        </div>
        <GameLeaderboard game="pests" className="mb-4"/>
        <img src="/game-cards/card-pests.jpg" alt="game card" className="mx-auto mb-5 block w-full max-w-2xl rounded-2xl shadow-lg ring-1 ring-black/5" />
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-amber-100">
          <iframe ref={iframeRef} title="PEST'S" src="/games-src/pests.html" className="w-full border-0" style={{ height: "min(62vh, 760px)", minHeight: "520px" }} allow="fullscreen" />
        </div>
        <p className="mt-4 text-center text-xs text-slate-500">Copyright © 2026 EPS Venture Group. All rights reserved.</p>
      </div>
    </div>
  );
}
