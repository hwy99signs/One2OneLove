import React, { useEffect, useState } from "react";
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
  en: { back: "Back to Games", full: "Open Full Screen", title:"One2OneLove Scratch Game", preview:"Scratch. Share. Grow closer. Members can launch the interactive game here.", loading:"Opening your One2OneLove game…", error:"Unable to open the Scratch Game." },
  es: { back: "Volver a Juegos", full: "Abrir Pantalla Completa", title:"Juego de Rasca One2OneLove", preview:"Rasca. Comparte. Acérquense. Los miembros pueden iniciar aquí el juego interactivo.", loading:"Abriendo tu juego One2OneLove…", error:"No se pudo abrir el Juego de Rasca." },
  fr: { back: "Retour aux Jeux", full: "Ouvrir en Plein Écran", title:"Jeu à Gratter One2OneLove", preview:"Grattez. Partagez. Rapprochez-vous. Les membres peuvent lancer le jeu interactif ici.", loading:"Ouverture de votre jeu One2OneLove…", error:"Impossible d’ouvrir le Jeu à Gratter." },
  it: { back: "Torna ai Giochi", full: "Apri a Schermo Intero", title:"Gioco Gratta One2OneLove", preview:"Gratta. Condividi. Avvicinatevi. I membri possono avviare qui il gioco interattivo.", loading:"Apertura del gioco One2OneLove…", error:"Impossibile aprire il Gioco Gratta." },
  de: { back: "Zurück zu Spielen", full: "Vollbild Öffnen", title:"One2OneLove Rubbelspiel", preview:"Rubbeln. Teilen. Näher zusammenwachsen. Mitglieder können das interaktive Spiel hier starten.", loading:"Dein One2OneLove-Spiel wird geöffnet…", error:"Das Rubbelspiel kann nicht geöffnet werden." },
};

export default function ScratchGame() {
  const { currentLanguage } = useLanguage();
  const { user } = useAuth();
  const fullMemberAccess = hasFullMemberAccess(user);
  const t = copy[currentLanguage] || copy.en;
  const [gameUrl,setGameUrl] = useState(null);
  const [error,setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!fullMemberAccess) {
      setGameUrl(null);
      setError('');
      return () => { active = false; };
    }
    (async () => {
      try {
        const payload = await apiRequest('/api/games/scratch/launch', { method:'POST' });
        if (!active) return;
        const token = payload?.token;
        if (!token) throw new Error(t.error);
        setGameUrl(`${GAME_URL}?lang=${encodeURIComponent(currentLanguage || "en")}&ticket=${encodeURIComponent(token)}`);
      } catch (err) {
        if (!active) return;
        setError(t.error);
      }
    })();
    return () => { active = false; };
  }, [currentLanguage, fullMemberAccess]);
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-cyan-50 to-blue-50">
      <div className="max-w-[1500px] mx-auto px-3 md:px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <Link to={createPageUrl("CooperativeGames")} className="inline-flex items-center text-slate-700 hover:text-pink-600 font-semibold">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.back}
          </Link>
          {gameUrl && <a href={gameUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="gap-2">
              <ExternalLink className="w-4 h-4" />
              {t.full}
            </Button>
          </a>}
        </div>
        {!fullMemberAccess && <div className="mb-4"><OpenHouseBrowseNotice /></div>}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-pink-100">
          {!fullMemberAccess ? (
            <div className="p-8 text-center sm:p-12">
              <h1 className="text-3xl font-black text-slate-900">{t.title}</h1>
              <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-600">{t.preview}</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-rose-700 font-semibold">{error}</div>
          ) : gameUrl ? (
            <iframe
              title="One2OneLove Scratch Game"
              src={gameUrl}
              className="w-full border-0"
              style={{ height: "min(82vh, 980px)", minHeight: "680px" }}
              allow="fullscreen"
            />
          ) : (
            <div className="p-8 text-center text-slate-600 font-semibold">{t.loading}</div>
          )}
        </div>
      </div>
    </div>
  );
}
