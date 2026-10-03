import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BrainCircuit, MessageCircle, PlayCircle, Sparkles } from 'lucide-react';
import { useLanguage } from './Layout';

const COPY={
  en:{
    eyebrow:'O2OL Studio Show',
    season:'Season 1 • Episode 1',
    title:'Who Should Apologize First?',
    body:'See Bianca in an actual O2OL Studio conversation and watch how relationship questions can be explored from more than one point of view.',
    bianca:'Featuring Bianca in conversation',
    unavailable:'Episode 1 is staged for O2OL Studio, but the video file is not available from media storage yet.',
    test:'Take the MyMatchIQ Compatibility Test',
    talk:'Talk with Bianca',
    chat:'Enter Chat Room to Comment',
    explore:'Explore MyMatchIQ',
    note:'Watching the Studio episode is open. Starting the Compatibility Test or a live Bianca conversation follows the current One2OneLove account and card requirements.'
  },
  es:{
    eyebrow:'O2OL Studio Show',
    season:'Temporada 1 • Episodio 1',
    title:'Who Should Apologize First?',
    body:'Mira a Bianca en una conversación real de O2OL Studio y observa cómo una pregunta de relación puede explorarse desde más de un punto de vista.',
    bianca:'Con Bianca en conversación',
    unavailable:'El Episodio 1 está preparado para O2OL Studio, pero el archivo de video aún no está disponible en el almacenamiento multimedia.',
    test:'Hacer la Prueba de Compatibilidad MyMatchIQ',
    talk:'Hablar con Bianca',
    chat:'Entrar al Chat para Comentar',
    explore:'Explorar MyMatchIQ',
    note:'Ver el episodio de Studio es abierto. Iniciar la Prueba de Compatibilidad o una conversación en vivo con Bianca sigue los requisitos actuales de cuenta y tarjeta de One2OneLove.'
  },
  fr:{
    eyebrow:'O2OL Studio Show',
    season:'Saison 1 • Épisode 1',
    title:'Who Should Apologize First?',
    body:'Découvrez Bianca dans une véritable conversation O2OL Studio et voyez comment une question relationnelle peut être explorée sous plusieurs angles.',
    bianca:'Avec Bianca en conversation',
    unavailable:'L’épisode 1 est prêt pour O2OL Studio, mais le fichier vidéo n’est pas encore disponible dans le stockage média.',
    test:'Faire le Test de Compatibilité MyMatchIQ',
    talk:'Parler avec Bianca',
    chat:'Entrer dans le Chat pour Commenter',
    explore:'Explorer MyMatchIQ',
    note:'Le visionnage de l’épisode Studio est ouvert. Le Test de Compatibilité et la conversation en direct avec Bianca suivent les exigences actuelles de compte et de carte One2OneLove.'
  },
  it:{
    eyebrow:'O2OL Studio Show',
    season:'Stagione 1 • Episodio 1',
    title:'Who Should Apologize First?',
    body:'Guarda Bianca in una vera conversazione O2OL Studio e scopri come una domanda relazionale può essere esplorata da più punti di vista.',
    bianca:'Con Bianca in conversazione',
    unavailable:'L’Episodio 1 è pronto per O2OL Studio, ma il file video non è ancora disponibile nello storage multimediale.',
    test:'Fai il Test di Compatibilità MyMatchIQ',
    talk:'Parla con Bianca',
    chat:'Entra nella Chat per Commentare',
    explore:'Esplora MyMatchIQ',
    note:'La visione dell’episodio Studio è aperta. Il Test di Compatibilità e la conversazione live con Bianca seguono gli attuali requisiti di account e carta One2OneLove.'
  },
  de:{
    eyebrow:'O2OL Studio Show',
    season:'Staffel 1 • Folge 1',
    title:'Who Should Apologize First?',
    body:'Erleben Sie Bianca in einem echten O2OL-Studio-Gespräch und sehen Sie, wie Beziehungsfragen aus mehreren Blickwinkeln betrachtet werden können.',
    bianca:'Mit Bianca im Gespräch',
    unavailable:'Folge 1 ist für O2OL Studio vorbereitet, aber die Videodatei ist im Medienspeicher noch nicht verfügbar.',
    test:'MyMatchIQ-Kompatibilitätstest Starten',
    talk:'Mit Bianca Sprechen',
    chat:'Chatraum Betreten und Kommentieren',
    explore:'MyMatchIQ Entdecken',
    note:'Das Studio-Video kann frei angesehen werden. Für den Kompatibilitätstest und ein Live-Gespräch mit Bianca gelten die aktuellen One2OneLove-Konto- und Kartenanforderungen.'
  }
};

export default function O2OLStudio(){
  const {currentLanguage}=useLanguage();
  const t=COPY[currentLanguage]||COPY.en;
  const [videoUnavailable,setVideoUnavailable]=useState(false);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 sm:py-12">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] border border-fuchsia-300/30 bg-[radial-gradient(circle_at_15%_0%,rgba(236,72,153,0.28),transparent_32%),radial-gradient(circle_at_85%_10%,rgba(59,130,246,0.26),transparent_30%),linear-gradient(145deg,#090514,#10163a)] p-5 shadow-2xl sm:p-8">
          <div className="text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-fuchsia-100">
              <Sparkles className="h-4 w-4"/>{t.eyebrow}
            </div>
            <p className="mt-5 text-sm font-black uppercase tracking-[0.18em] text-cyan-200">{t.season}</p>
            <h1 className="mx-auto mt-2 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">{t.title}</h1>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-white/75 sm:text-lg">{t.body}</p>
          </div>

          <div className="relative mx-auto mt-8 max-w-5xl overflow-hidden rounded-[1.5rem] border border-white/15 bg-black shadow-2xl">
            {!videoUnavailable ? (
              <video
                className="aspect-video w-full bg-black"
                controls
                playsInline
                preload="metadata"
                src="/studio-media/season-1-episode-1.mp4"
                onError={()=>setVideoUnavailable(true)}
              >
                Your browser does not support HTML5 video.
              </video>
            ) : (
              <div className="flex aspect-video items-center justify-center bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.35),transparent_45%),#030712] p-8 text-center">
                <div className="max-w-xl">
                  <PlayCircle className="mx-auto h-16 w-16 text-fuchsia-300"/>
                  <p className="mt-5 text-lg font-bold text-white">{t.unavailable}</p>
                </div>
              </div>
            )}
            <Link
              to="/Chat?room=studio-who-should-apologize-first&from=studio"
              className="absolute right-3 top-3 z-10 inline-flex items-center gap-2 rounded-full border border-white/30 bg-slate-950/80 px-4 py-2.5 text-xs font-black text-white shadow-xl backdrop-blur-md transition hover:bg-fuchsia-600/90 sm:right-4 sm:top-4 sm:px-5 sm:text-sm"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true"/>{t.chat}
            </Link>
          </div>

          <div className="mx-auto mt-6 flex max-w-5xl items-center justify-center gap-2 rounded-2xl border border-cyan-200/20 bg-cyan-950/25 px-5 py-4 text-center text-sm font-bold text-cyan-50">
            <MessageCircle className="h-5 w-5 shrink-0"/>{t.bianca}
          </div>

          <div className="mx-auto mt-8 grid max-w-5xl gap-4 md:grid-cols-2">
            <Link to="/MyMatchIQ/Assessment" className="group rounded-2xl border border-fuchsia-200/25 bg-gradient-to-r from-fuchsia-600 to-violet-700 p-5 text-center shadow-lg transition hover:-translate-y-0.5 hover:brightness-110">
              <BrainCircuit className="mx-auto h-7 w-7"/>
              <div className="mt-2 text-lg font-black">{t.test}</div>
            </Link>
            <Link to="/MyMatchIQ/Bianca" className="group rounded-2xl border border-cyan-200/25 bg-gradient-to-r from-blue-600 to-cyan-600 p-5 text-center shadow-lg transition hover:-translate-y-0.5 hover:brightness-110">
              <MessageCircle className="mx-auto h-7 w-7"/>
              <div className="mt-2 text-lg font-black">{t.talk}</div>
            </Link>
          </div>

          <div className="mx-auto mt-5 max-w-5xl text-center">
            <Link to="/MyMatchIQ" className="inline-flex rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white hover:bg-white/15">{t.explore}</Link>
            <p className="mx-auto mt-5 max-w-3xl text-xs leading-5 text-white/45">{t.note}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
