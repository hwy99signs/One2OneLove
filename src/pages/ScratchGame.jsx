import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/Layout";

const GAME_URL = "https://play.one2onelove.com/";

const copy = {
  en: { back: "Back to Games", full: "Open Full Screen" },
  es: { back: "Volver a Juegos", full: "Abrir Pantalla Completa" },
  fr: { back: "Retour aux Jeux", full: "Ouvrir en Plein Écran" },
  it: { back: "Torna ai Giochi", full: "Apri a Schermo Intero" },
  de: { back: "Zurück zu Spielen", full: "Vollbild Öffnen" },
};

export default function ScratchGame() {
  const { currentLanguage } = useLanguage();
  const t = copy[currentLanguage] || copy.en;
  const localizedGameUrl = `${GAME_URL}?lang=${encodeURIComponent(currentLanguage || "en")}`;
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-cyan-50 to-blue-50">
      <div className="max-w-[1500px] mx-auto px-3 md:px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <Link to={createPageUrl("CooperativeGames")} className="inline-flex items-center text-slate-700 hover:text-pink-600 font-semibold">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.back}
          </Link>
          <a href={localizedGameUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="gap-2">
              <ExternalLink className="w-4 h-4" />
              {t.full}
            </Button>
          </a>
        </div>
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-pink-100">
          <iframe
            title="One2OneLove Scratch Game"
            src={localizedGameUrl}
            className="w-full border-0"
            style={{ height: "min(82vh, 980px)", minHeight: "680px" }}
            allow="fullscreen"
          />
        </div>
      </div>
    </div>
  );
}
