import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/Layout";

const copy = {
  en: { back: "Back to Games" },
  es: { back: "Volver a Juegos" },
  fr: { back: "Retour aux Jeux" },
  it: { back: "Torna ai Giochi" },
  de: { back: "Zurück zu Spielen" },
};

// I Thought So! is a pass-the-device party game with per-player points and
// no single run score, so it has no leaderboard or score submission.
export default function IThoughtSo() {
  const { currentLanguage } = useLanguage();
  const t = copy[currentLanguage] || copy.en;

  return (
    <div className="min-h-screen" style={{backgroundColor:'#3a2a05'}}>
      <div className="max-w-[1500px] mx-auto px-3 md:px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <Link to={createPageUrl("CooperativeGames")} className="inline-flex items-center font-semibold text-white/85 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.back}
          </Link>
        </div>
        <img src="/game-cards/card-i-thought-so.jpg" alt="I Thought So! game card" className="mx-auto mb-6 block w-full max-w-3xl rounded-[24px] shadow-2xl ring-1 ring-white/15" />
        <div className="overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/15">
          <iframe title="I Thought So!" src="/games-src/i-thought-so.html" onLoad={(event) => {
            // Display-only correction for the embedded legacy footer; game logic unchanged.
            try {
              const strongs = event.currentTarget.contentDocument?.querySelectorAll('footer strong') || [];
              strongs.forEach((node) => { if (node.textContent?.includes('BUILD v1.1.0')) node.textContent = node.textContent.replace('BUILD v1.1.0', 'BUILD v1.1.2'); });
            } catch (_) {}
          }} className="w-full border-0" style={{ height: "min(85vh, 1000px)", minHeight: "620px" }} allow="fullscreen; clipboard-write" />
        </div>
        <p className="mt-4 text-center text-xs text-white/50">Copyright © 2026 EPS Venture Group. All rights reserved.</p>
      </div>
    </div>
  );
}
