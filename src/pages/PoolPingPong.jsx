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

export default function PoolPingPong({gameSessionRef}) {
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
    const readScore=()=>Number(String(doc?.getElementById('hudScore')?.textContent||'').replace(/[^0-9]/g,'')||0);
    const submit=(beacon=false)=>{
      const score=readScore(),sessionRef=runRef.current;
      if(!sessionRef||score<=0)return;
      runRef.current=null;
      const body={game:'pool_ping_pong',score,sessionRef};
      if(beacon){beaconJson('/api/games/scores',body);return;}
      apiRequest('/api/games/scores',{method:'POST',body}).then(()=>queryClient.invalidateQueries({queryKey:['gameLeaderboard','pool_ping_pong']})).catch(()=>{});
    };
    const bind=()=>{
      try{
        doc=frame.contentDocument;
        if(!doc)return;
        // Pool Ping Pong starts a run from either start button; a finished
        // run shows "Play again" on #againBtn ("Next ball" continues the
        // same run). Capture-phase listeners read the score before reset.
        const starts=['swipeStartBtn','motionStartBtn'].map(id=>doc.getElementById(id)).filter(Boolean);
        const again=doc.getElementById('againBtn');
        const onPlay=()=>newRun();
        const onAgain=()=>{if(String(again?.textContent||'').trim().toLowerCase()==='play again'){submit(false);newRun();}};
        starts.forEach(b=>b.addEventListener('click',onPlay,true));
        again?.addEventListener('click',onAgain,true);
        cleanup.push(()=>starts.forEach(b=>b.removeEventListener('click',onPlay,true)),()=>again?.removeEventListener('click',onAgain,true));
      }catch(_){}
    };
    frame.addEventListener('load',bind);
    if(frame.contentDocument?.readyState==='complete')bind();
    const onHide=()=>submit(true);
    window.addEventListener('pagehide',onHide);
    return()=>{submit(true);window.removeEventListener('pagehide',onHide);frame.removeEventListener('load',bind);cleanup.forEach(fn=>fn());};
  },[gameSessionRef,queryClient]);

  return (
    <div className="min-h-screen" style={{backgroundColor:'#0d3b2a'}}>
      <div className="max-w-[1500px] mx-auto px-3 md:px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <Link to={createPageUrl("CooperativeGames")} className="inline-flex items-center font-semibold text-white/85 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.back}
          </Link>
        </div>
        <img src="/game-cards/card-pool-ping-pong.jpg" alt="game card" className="mx-auto mb-6 block w-full max-w-3xl rounded-[24px] shadow-2xl ring-1 ring-white/15" />
        <GameLeaderboard game="pool_ping_pong" className="mb-4"/>
        <div className="overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/15">
          <iframe ref={iframeRef} title="Pool Ping Pong" src={`/games-src/pool-ping-pong.html?lang=${encodeURIComponent(currentLanguage || 'en')}`} className="w-full border-0" style={{ height: "min(62vh, 760px)", minHeight: "520px" }} allow="fullscreen; accelerometer; gyroscope" />
        </div>
        <p className="mt-4 text-center text-xs text-white/50">Copyright © 2026 EPS Venture Group. All rights reserved.</p>
      </div>
    </div>
  );
}
