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

export default function Scrabluko() {
  const { currentLanguage } = useLanguage();
  const t = copy[currentLanguage] || copy.en;
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-emerald-50">
      <div className="max-w-[1500px] mx-auto px-3 md:px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <Link to={createPageUrl("CooperativeGames")} className="inline-flex items-center text-slate-700 hover:text-emerald-600 font-semibold">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.back}
          </Link>
        </div>
        <img src="/game-cards/card-scrabluko.jpg" alt="game card" className="mb-4 block h-40 w-full rounded-2xl object-cover object-center shadow-lg ring-1 ring-black/5 sm:h-48" />
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-amber-100">
          <iframe title="Scrabluko" src="/games-src/scrabluko.html" className="w-full border-0" style={{ height: "min(62vh, 760px)", minHeight: "520px" }} allow="fullscreen" />
        </div>
        <p className="mt-4 text-center text-xs text-slate-500">Copyright © 2026 EPS Venture Group. All rights reserved.</p>
      </div>
    </div>
  );
}
