import React,{useEffect,useRef} from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/Layout";
import { apiRequest } from "@/lib/apiClient";
import GameLeaderboard from "@/components/activities/GameLeaderboard";
import { useQueryClient } from "@tanstack/react-query";

const copy = {
  en: { back: "Back to Games" },
  es: { back: "Volver a Juegos" },
  fr: { back: "Retour aux Jeux" },
  it: { back: "Torna ai Giochi" },
  de: { back: "Zurück zu Spielen" },
};

export default function Scrabluko({gameSessionRef}) {
  const { currentLanguage } = useLanguage();
  const t = copy[currentLanguage] || copy.en;
  const iframeRef=useRef(null);
  const runRef=useRef(null);
  const queryClient=useQueryClient();

  useEffect(()=>{
    const frame=iframeRef.current;
    if(!frame||!gameSessionRef)return;
    let doc=null,observer=null,cleanup=[];
    const newRun=()=>{runRef.current=gameSessionRef+':'+(globalThis.crypto?.randomUUID?.()||String(Date.now()));};
    const submitFinal=()=>{
      const sessionRef=runRef.current;
      if(!sessionRef)return;
      const ownRow=doc?.querySelector('#standings .srow.me')||(doc?.querySelectorAll('#standings .srow').length===1?doc.querySelector('#standings .srow'):null);
      if(!ownRow)return;
      const score=Number(ownRow.querySelector('.pts')?.textContent||0);
      if(!Number.isFinite(score)||score<0)return;
      runRef.current=null;
      apiRequest('/api/games/scores',{method:'POST',body:{game:'scrabluko',score,sessionRef}})
        .then(()=>queryClient.invalidateQueries({queryKey:['gameLeaderboard','scrabluko']})).catch(()=>{});
    };
    const bind=()=>{
      try{
        doc=frame.contentDocument;if(!doc)return;
        ['startBtn','againBtn','overNewBtn','newBtn'].forEach(id=>{
          const el=doc.getElementById(id);if(!el)return;
          el.addEventListener('click',newRun,true);
          cleanup.push(()=>el.removeEventListener('click',newRun,true));
        });
        const overlay=doc.getElementById('overOverlay');
        if(overlay){
          observer=new MutationObserver(()=>{
            if(overlay.classList.contains('show'))submitFinal();
          });
          observer.observe(overlay,{attributes:true,attributeFilter:['class']});
        }
      }catch(_){}
    };
    frame.addEventListener('load',bind);
    if(frame.contentDocument?.readyState==='complete')bind();
    return()=>{frame.removeEventListener('load',bind);observer?.disconnect();cleanup.forEach(fn=>fn());};
  },[gameSessionRef,queryClient]);

  return (
    <div className="min-h-screen" style={{backgroundColor:'#0a1f44'}}>
      <div className="max-w-[1500px] mx-auto px-3 md:px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <Link to={createPageUrl("CooperativeGames")} className="inline-flex items-center font-semibold text-white/85 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.back}
          </Link>
        </div>
        <img src="/game-cards/card-scrabluko.jpg" alt="game card" className="mx-auto mb-6 block w-full max-w-3xl rounded-[24px] shadow-2xl ring-1 ring-white/15" />
        <GameLeaderboard game="scrabluko" className="mb-4"/>
        <div className="overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/15">
          <iframe ref={iframeRef} title="Scrabluko" src="/games-src/scrabluko.html" className="w-full border-0" style={{ height: "min(62vh, 760px)", minHeight: "520px" }} allow="fullscreen" />
        </div>
        <p className="mt-4 text-center text-xs text-white/50">Copyright © 2026 EPS Venture Group. All rights reserved.</p>
      </div>
    </div>
  );
}
