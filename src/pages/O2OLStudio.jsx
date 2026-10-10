import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BrainCircuit, Film, MessageCircle, PlayCircle, Sparkles, LockKeyhole, UserPlus } from 'lucide-react';
import { useLanguage } from './Layout';
import { useAuth } from '@/contexts/AuthContext';

const COPY={
  en:{
    eyebrow:'O2OL Studio Show',seasonLabel:'Season',episodeLabel:'Episode',
    body:'Watch the latest O2OL Studio conversation, then join the community discussion and share your point of view.',
    studio:'O2OL Studio conversation',
    unavailable:'This episode is temporarily unavailable. Please try again shortly.',
    test:'Take the MyMatchIQ Compatibility Test',talk:'Talk with Bianca',chat:'Enter Chat Room to Comment',
    explore:'Explore MyMatchIQ',episodes:'Previous Episodes',
    note:'Current Studio episodes are immediate for free verified O2OL accounts. Public visitors receive the replay seven days after release. Bianca and other metered premium actions use Credit.',
    replay:'Public replay opens',freeNow:'Create a FREE account to watch now',signIn:'Sign In'
  },
  es:{
    eyebrow:'O2OL Studio Show',seasonLabel:'Temporada',episodeLabel:'Episodio',
    body:'Mira la conversación más reciente de O2OL Studio y luego entra a la comunidad para compartir tu punto de vista.',
    studio:'Conversación de O2OL Studio',
    unavailable:'Este episodio no está disponible temporalmente. Inténtalo de nuevo en unos momentos.',
    test:'Hacer la Prueba de Compatibilidad MyMatchIQ',talk:'Hablar con Bianca',chat:'Entrar al Chat para Comentar',
    explore:'Explorar MyMatchIQ',episodes:'Episodios Anteriores',
    note:'Los episodios actuales de Studio están disponibles de inmediato para cuentas O2OL gratuitas y verificadas. Los visitantes reciben la repetición siete días después. Bianca y otras funciones premium usan Crédito.',
    replay:'La repetición pública abre',freeNow:'Crea una cuenta GRATIS para verlo ahora',signIn:'Iniciar Sesión'
  },
  fr:{
    eyebrow:'O2OL Studio Show',seasonLabel:'Saison',episodeLabel:'Épisode',
    body:'Regardez la conversation O2OL Studio la plus récente, puis rejoignez la communauté pour partager votre point de vue.',
    studio:'Conversation O2OL Studio',
    unavailable:'Cet épisode est temporairement indisponible. Veuillez réessayer dans quelques instants.',
    test:'Faire le Test de Compatibilité MyMatchIQ',talk:'Parler avec Bianca',chat:'Entrer dans le Chat pour Commenter',
    explore:'Explorer MyMatchIQ',episodes:'Épisodes Précédents',
    note:'Les épisodes Studio actuels sont immédiats pour les comptes O2OL gratuits et vérifiés. Le public reçoit la rediffusion sept jours après. Bianca et les autres fonctions premium mesurées utilisent du Crédit.',
    replay:'La rediffusion publique ouvre',freeNow:'Créez un compte GRATUIT pour regarder maintenant',signIn:'Se Connecter'
  },
  it:{
    eyebrow:'O2OL Studio Show',seasonLabel:'Stagione',episodeLabel:'Episodio',
    body:'Guarda la conversazione più recente di O2OL Studio, poi entra nella community e condividi il tuo punto di vista.',
    studio:'Conversazione O2OL Studio',
    unavailable:'Questo episodio non è temporaneamente disponibile. Riprova tra poco.',
    test:'Fai il Test di Compatibilità MyMatchIQ',talk:'Parla con Bianca',chat:'Entra nella Chat per Commentare',
    explore:'Esplora MyMatchIQ',episodes:'Episodi Precedenti',
    note:'Gli episodi Studio attuali sono immediati per gli account O2OL gratuiti e verificati. Il pubblico riceve la replica dopo sette giorni. Bianca e le altre funzioni premium a consumo usano Credito.',
    replay:'La replica pubblica apre',freeNow:'Crea un account GRATUITO per guardare ora',signIn:'Accedi'
  },
  de:{
    eyebrow:'O2OL Studio Show',seasonLabel:'Staffel',episodeLabel:'Folge',
    body:'Sieh dir das neueste O2OL-Studio-Gespräch an und teile anschließend deine Sichtweise in der Community.',
    studio:'O2OL-Studio-Gespräch',
    unavailable:'Diese Folge ist vorübergehend nicht verfügbar. Bitte versuche es in Kürze erneut.',
    test:'MyMatchIQ-Kompatibilitätstest Starten',talk:'Mit Bianca Sprechen',chat:'Chatraum Betreten und Kommentieren',
    explore:'MyMatchIQ Entdecken',episodes:'Frühere Folgen',
    note:'Aktuelle Studio-Folgen sind für kostenlose verifizierte O2OL-Konten sofort verfügbar. Öffentliche Besucher erhalten die Wiederholung sieben Tage später. Bianca und andere Premium-Aktionen verwenden Credit.',
    replay:'Öffentliche Wiederholung ab',freeNow:'KOSTENLOSES Konto erstellen und jetzt ansehen',signIn:'Anmelden'
  }
};

const EPISODE_TITLES={
  en:{'season-1-episode-1':'Who Should Apologize First?','season-1-episode-2':'Who Pays for the First Date?'},
  es:{'season-1-episode-1':'¿Quién debería disculparse primero?','season-1-episode-2':'¿Quién paga en la primera cita?'},
  fr:{'season-1-episode-1':'Qui devrait s’excuser en premier ?','season-1-episode-2':'Qui paie au premier rendez-vous ?'},
  it:{'season-1-episode-1':'Chi dovrebbe scusarsi per primo?','season-1-episode-2':'Chi paga al primo appuntamento?'},
  de:{'season-1-episode-1':'Wer sollte sich zuerst entschuldigen?','season-1-episode-2':'Wer bezahlt beim ersten Date?'}
};

export default function O2OLStudio(){
  const {currentLanguage}=useLanguage();
  const {isAuthenticated}=useAuth();
  const [searchParams]=useSearchParams();
  const requestedEpisodeId=searchParams.get('episode');
  const t=COPY[currentLanguage]||COPY.en;
  const [videoUnavailable,setVideoUnavailable]=useState(false);
  const [episode,setEpisode]=useState(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    let active=true;
    setVideoUnavailable(false);
    fetch('/api/studio/episodes',{credentials:'include'})
      .then(async res=>{const data=await res.json();if(!res.ok)throw new Error(data?.error?.message||'Unable to load Studio access.');return data;})
      .then(data=>{
        if(!active)return;
        const episodes=Array.isArray(data?.episodes)?data.episodes:[];
        const requested=requestedEpisodeId?episodes.find(item=>item?.id===requestedEpisodeId):null;
        setEpisode(requested||episodes[0]||null);
      })
      .catch(()=>{if(active)setEpisode(null);})
      .finally(()=>{if(active)setLoading(false);});
    return()=>{active=false};
  },[isAuthenticated,requestedEpisodeId]);

  const localizedTitle=EPISODE_TITLES[currentLanguage]?.[episode?.id]||EPISODE_TITLES.en[episode?.id]||episode?.title||'O2OL Studio';
  const chatRoom=episode?.chatRoom||'studio-who-should-apologize-first';

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 sm:py-12">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] border border-fuchsia-300/30 bg-[radial-gradient(circle_at_15%_0%,rgba(236,72,153,0.28),transparent_32%),radial-gradient(circle_at_85%_10%,rgba(59,130,246,0.26),transparent_30%),linear-gradient(145deg,#090514,#10163a)] p-5 shadow-2xl sm:p-8">
          <div className="text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-fuchsia-100">
              <Sparkles className="h-4 w-4"/>{t.eyebrow}
            </div>
            <p className="mt-5 text-sm font-black uppercase tracking-[0.18em] text-cyan-200">
              {t.seasonLabel} {episode?.season||1} • {t.episodeLabel} {episode?.episode||2}
            </p>
            <h1 className="mx-auto mt-2 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">{localizedTitle}</h1>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-white/75 sm:text-lg">{t.body}</p>
          </div>

          <div className="relative mx-auto mt-8 max-w-5xl overflow-hidden rounded-[1.5rem] border border-white/15 bg-black shadow-2xl">
            {loading ? (
              <div className="flex aspect-video items-center justify-center bg-black text-white/60">Checking Studio access…</div>
            ) : episode?.canWatch && !videoUnavailable ? (
              <video
                className="aspect-video w-full bg-black"
                controls
                playsInline
                preload="auto"
                poster={episode.posterPath||undefined}
                src={episode.mediaPath?episode.mediaPath+'#t=0.1':undefined}
                onError={()=>setVideoUnavailable(true)}
              >
                Your browser does not support HTML5 video.
              </video>
            ) : episode && !episode.publicAvailable && !episode.memberAvailable ? (
              <div className="flex aspect-video items-center justify-center bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.35),transparent_45%),#030712] p-8 text-center">
                <div className="max-w-xl">
                  <LockKeyhole className="mx-auto h-14 w-14 text-amber-300"/>
                  <p className="mt-5 text-xl font-black text-white">{t.freeNow}</p>
                  <p className="mt-2 text-sm text-white/60">{t.replay}: {new Date(episode.publicAvailableAt).toLocaleDateString()}</p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <Link to="/SignUp?source=o2ol-studio&type=individual" className="inline-flex items-center gap-2 rounded-full bg-fuchsia-600 px-5 py-3 font-black text-white"><UserPlus className="h-4 w-4"/>{t.freeNow}</Link>
                    <Link to="/SignIn?source=o2ol-studio" className="rounded-full border border-white/25 bg-white/10 px-5 py-3 font-black text-white">{t.signIn}</Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex aspect-video items-center justify-center bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.35),transparent_45%),#030712] p-8 text-center">
                <div className="max-w-xl">
                  <PlayCircle className="mx-auto h-16 w-16 text-fuchsia-300"/>
                  <p className="mt-5 text-lg font-bold text-white">{t.unavailable}</p>
                </div>
              </div>
            )}
            <Link
              to={`/Chat?room=${encodeURIComponent(chatRoom)}&from=studio`}
              className="absolute right-3 top-3 z-10 inline-flex items-center gap-2 rounded-full border border-white/30 bg-slate-950/80 px-4 py-2.5 text-xs font-black text-white shadow-xl backdrop-blur-md transition hover:bg-fuchsia-600/90 sm:right-4 sm:top-4 sm:px-5 sm:text-sm"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true"/>{t.chat}
            </Link>
          </div>

          <div className="mx-auto mt-6 flex max-w-5xl items-center justify-center gap-2 rounded-2xl border border-cyan-200/20 bg-cyan-950/25 px-5 py-4 text-center text-sm font-bold text-cyan-50">
            <Film className="h-5 w-5 shrink-0"/>{t.studio}
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

          <div className="mx-auto mt-5 flex max-w-5xl flex-wrap justify-center gap-3 text-center">
            <Link to="/O2OLStudio/Episodes" className="inline-flex items-center gap-2 rounded-full border border-fuchsia-200/30 bg-fuchsia-500/15 px-5 py-3 text-sm font-black text-white hover:bg-fuchsia-500/25"><Film className="h-4 w-4"/>{t.episodes}</Link>
            <Link to="/MyMatchIQ" className="inline-flex rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white hover:bg-white/15">{t.explore}</Link>
          </div>
          <p className="mx-auto mt-5 max-w-3xl text-center text-xs leading-5 text-white/45">{t.note}</p>
        </div>
      </section>
    </main>
  );
}
