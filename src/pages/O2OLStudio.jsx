import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BrainCircuit, CreditCard, Film, Loader2, MessageCircle, PlayCircle, Sparkles, LockKeyhole, UserPlus } from 'lucide-react';
import { useLanguage } from './Layout';
import { useAuth } from '@/contexts/AuthContext';
import { getTokenWallet, isTokensRequiredError, tokenRequiredDetails, unlockTokenContent } from '@/lib/tokenService';
import UnlockPriceDialog from '@/components/pricing/UnlockPriceDialog';

const COPY={
  en:{
    eyebrow:'O2OL Studio Show',seasonLabel:'Season',episodeLabel:'Episode',
    body:'Watch the latest O2OL Studio conversation, then join the community discussion and share your point of view.',
    studio:'O2OL Studio conversation',
    unavailable:'This episode is temporarily unavailable. Please try again shortly.',
    test:'Take the MyMatchIQ Compatibility Test',talk:'Talk with Bianca',chat:'Enter Chat Room to Comment',
    explore:'Explore MyMatchIQ',episodes:'Previous Episodes',
    note:'Episode 1 is free for everyone. Episode 2 is a one-time $1 Credit unlock — yours to keep once unlocked. Bianca and other metered premium actions use Credit.',
    replay:'Public replay opens',freeNow:'Create a FREE account to watch now',signIn:'Sign In',
    unlockTitle:'Unlock this episode',unlockNote:'One-time $1.00 in Credit — unlock once, watch anytime, yours to keep.',unlockBtn:'Unlock for $1 Credit',unlocking:'Unlocking…',joinToUnlock:'Create a FREE account to unlock',needCredit:'You need {required} Credit to unlock this episode. Your balance: {balance}.',addCredit:'Add Credit',unlockFailed:'Unable to unlock this episode. Please try again.'
  },
  es:{
    eyebrow:'O2OL Studio Show',seasonLabel:'Temporada',episodeLabel:'Episodio',
    body:'Mira la conversación más reciente de O2OL Studio y luego entra a la comunidad para compartir tu punto de vista.',
    studio:'Conversación de O2OL Studio',
    unavailable:'Este episodio no está disponible temporalmente. Inténtalo de nuevo en unos momentos.',
    test:'Hacer la Prueba de Compatibilidad MyMatchIQ',talk:'Hablar con Bianca',chat:'Entrar al Chat para Comentar',
    explore:'Explorar MyMatchIQ',episodes:'Episodios Anteriores',
    note:'El Episodio 1 es gratis para todos. El Episodio 2 se desbloquea una sola vez con $1 de Crédito — tuyo para siempre una vez desbloqueado. Bianca y otras funciones premium a consumo usan Crédito.',
    replay:'La repetición pública abre',freeNow:'Crea una cuenta GRATIS para verlo ahora',signIn:'Iniciar Sesión',
    unlockTitle:'Desbloquea este episodio',unlockNote:'Un solo pago de $1.00 en Crédito — desbloquea una vez y míralo cuando quieras, tuyo para siempre.',unlockBtn:'Desbloquear por $1 de Crédito',unlocking:'Desbloqueando…',joinToUnlock:'Crea una cuenta GRATIS para desbloquear',needCredit:'Necesitas {required} de Crédito para desbloquear este episodio. Tu saldo: {balance}.',addCredit:'Añadir Crédito',unlockFailed:'No se pudo desbloquear este episodio. Inténtalo de nuevo.'
  },
  fr:{
    eyebrow:'O2OL Studio Show',seasonLabel:'Saison',episodeLabel:'Épisode',
    body:'Regardez la conversation O2OL Studio la plus récente, puis rejoignez la communauté pour partager votre point de vue.',
    studio:'Conversation O2OL Studio',
    unavailable:'Cet épisode est temporairement indisponible. Veuillez réessayer dans quelques instants.',
    test:'Faire le Test de Compatibilité MyMatchIQ',talk:'Parler avec Bianca',chat:'Entrer dans le Chat pour Commenter',
    explore:'Explorer MyMatchIQ',episodes:'Épisodes Précédents',
    note:'L’Épisode 1 est gratuit pour tout le monde. L’Épisode 2 se débloque une fois pour 1 $ de Crédit — à vous pour toujours une fois débloqué. Bianca et les autres fonctions premium mesurées utilisent du Crédit.',
    replay:'La rediffusion publique ouvre',freeNow:'Créez un compte GRATUIT pour regarder maintenant',signIn:'Se Connecter',
    unlockTitle:'Débloquez cet épisode',unlockNote:'Un seul paiement de 1,00 $ en Crédit — débloquez une fois, regardez quand vous voulez, à vous pour toujours.',unlockBtn:'Débloquer pour 1 $ de Crédit',unlocking:'Déblocage…',joinToUnlock:'Créez un compte GRATUIT pour débloquer',needCredit:'Il vous faut {required} de Crédit pour débloquer cet épisode. Votre solde : {balance}.',addCredit:'Ajouter du Crédit',unlockFailed:'Impossible de débloquer cet épisode. Veuillez réessayer.'
  },
  it:{
    eyebrow:'O2OL Studio Show',seasonLabel:'Stagione',episodeLabel:'Episodio',
    body:'Guarda la conversazione più recente di O2OL Studio, poi entra nella community e condividi il tuo punto di vista.',
    studio:'Conversazione O2OL Studio',
    unavailable:'Questo episodio non è temporaneamente disponibile. Riprova tra poco.',
    test:'Fai il Test di Compatibilità MyMatchIQ',talk:'Parla con Bianca',chat:'Entra nella Chat per Commentare',
    explore:'Esplora MyMatchIQ',episodes:'Episodi Precedenti',
    note:'L’Episodio 1 è gratuito per tutti. L’Episodio 2 si sblocca una sola volta con $1 di Credito — tuo per sempre una volta sbloccato. Bianca e le altre funzioni premium a consumo usano Credito.',
    replay:'La replica pubblica apre',freeNow:'Crea un account GRATUITO per guardare ora',signIn:'Accedi',
    unlockTitle:'Sblocca questo episodio',unlockNote:'Un solo pagamento di $1,00 in Credito — sblocca una volta e guardalo quando vuoi, tuo per sempre.',unlockBtn:'Sblocca con $1 di Credito',unlocking:'Sblocco in corso…',joinToUnlock:'Crea un account GRATUITO per sbloccare',needCredit:'Ti servono {required} di Credito per sbloccare questo episodio. Il tuo saldo: {balance}.',addCredit:'Aggiungi Credito',unlockFailed:'Impossibile sbloccare questo episodio. Riprova.'
  },
  de:{
    eyebrow:'O2OL Studio Show',seasonLabel:'Staffel',episodeLabel:'Folge',
    body:'Sieh dir das neueste O2OL-Studio-Gespräch an und teile anschließend deine Sichtweise in der Community.',
    studio:'O2OL-Studio-Gespräch',
    unavailable:'Diese Folge ist vorübergehend nicht verfügbar. Bitte versuche es in Kürze erneut.',
    test:'MyMatchIQ-Kompatibilitätstest Starten',talk:'Mit Bianca Sprechen',chat:'Chatraum Betreten und Kommentieren',
    explore:'MyMatchIQ Entdecken',episodes:'Frühere Folgen',
    note:'Folge 1 ist für alle kostenlos. Folge 2 wird einmalig für 1 $ Credit freigeschaltet — nach der Freischaltung für immer deine. Bianca und andere Premium-Aktionen verwenden Credit.',
    replay:'Öffentliche Wiederholung ab',freeNow:'KOSTENLOSES Konto erstellen und jetzt ansehen',signIn:'Anmelden',
    unlockTitle:'Diese Folge freischalten',unlockNote:'Einmalig 1,00 $ in Credit — einmal freischalten, jederzeit ansehen, für immer deine.',unlockBtn:'Für 1 $ Credit freischalten',unlocking:'Wird freigeschaltet…',joinToUnlock:'KOSTENLOSES Konto erstellen zum Freischalten',needCredit:'Du brauchst {required} Credit, um diese Folge freizuschalten. Dein Guthaben: {balance}.',addCredit:'Credit hinzufügen',unlockFailed:'Diese Folge konnte nicht freigeschaltet werden. Bitte versuche es erneut.'
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
  const {isAuthenticated,user}=useAuth();
  const [searchParams]=useSearchParams();
  const requestedEpisodeId=searchParams.get('episode');
  const t=COPY[currentLanguage]||COPY.en;
  const [videoUnavailable,setVideoUnavailable]=useState(false);
  const [episode,setEpisode]=useState(null);
  const [loading,setLoading]=useState(true);
  const [refreshKey,setRefreshKey]=useState(0);
  const [unlocking,setUnlocking]=useState(false);
  const [unlockError,setUnlockError]=useState('');
  const [showUnlockConfirm,setShowUnlockConfirm]=useState(false);
  const [creditBalance,setCreditBalance]=useState(null);

  useEffect(()=>{
    let active=true;
    if(isAuthenticated)getTokenWallet().then(data=>{if(active)setCreditBalance(Number(data?.wallet?.balance||0));}).catch(()=>{});
    return()=>{active=false};
  },[isAuthenticated,refreshKey]);

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
  },[isAuthenticated,requestedEpisodeId,refreshKey]);

  const handleUnlock=async()=>{
    if(!episode||!user?.id||unlocking)return;
    setUnlocking(true);
    setUnlockError('');
    try{
      await unlockTokenContent({
        featureCode:'studio_episode_unlock',
        contentKey:episode.id,
        source:'o2ol_studio',
        idempotencyKey:`studio:${user.id}:${episode.id}`,
      });
      setRefreshKey(key=>key+1);
      getTokenWallet().then(data=>setCreditBalance(Number(data?.wallet?.balance||0))).catch(()=>{});
    }catch(error){
      if(isTokensRequiredError(error)){
        const info=tokenRequiredDetails(error);
        setUnlockError(t.needCredit.replace('{required}',(Number(info.required||episode.unlockPriceCents||0)/100).toFixed(2)).replace('{balance}',(Number(info.balance||0)/100).toFixed(2)));
      }else{
        setUnlockError(error?.message||t.unlockFailed);
      }
    }finally{
      setUnlocking(false);
    }
  };

  const localizedTitle=EPISODE_TITLES[currentLanguage]?.[episode?.id]||EPISODE_TITLES.en[episode?.id]||episode?.title||'O2OL Studio';
  const chatRoom=episode?.chatRoom||'studio-who-should-apologize-first';

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 sm:py-12">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] border border-fuchsia-300/30 bg-[linear-gradient(90deg,#5d2ea8_0%,#9b10b2_18%,#a812c5_58%,#b01cc9_100%)] p-5 shadow-2xl sm:p-8">
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
            ) : episode?.unlockPriceCents ? (
              <div className="flex aspect-video items-center justify-center bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.35),transparent_45%),#030712] p-8 text-center">
                <div className="max-w-xl">
                  <LockKeyhole className="mx-auto h-14 w-14 text-amber-300"/>
                  <p className="mt-5 text-xl font-black text-white">{t.unlockTitle}</p>
                  <p className="mt-2 text-sm text-white/60">{t.unlockNote}</p>
                  {isAuthenticated ? (
                    <div className="mt-6">
                      <button type="button" onClick={()=>setShowUnlockConfirm(true)} disabled={unlocking} className="inline-flex items-center gap-2 rounded-full bg-fuchsia-600 px-5 py-3 font-black text-white transition hover:brightness-110 disabled:opacity-60">
                        {unlocking?<Loader2 className="h-4 w-4 animate-spin"/>:<CreditCard className="h-4 w-4"/>}{unlocking?t.unlocking:t.unlockBtn}
                      </button>
                      {unlockError && (
                        <p className="mt-4 text-sm font-bold text-amber-200">{unlockError} <Link to="/Credit" className="underline">{t.addCredit}</Link></p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                      <Link to="/SignUp?source=o2ol-studio&type=individual" className="inline-flex items-center gap-2 rounded-full bg-fuchsia-600 px-5 py-3 font-black text-white"><UserPlus className="h-4 w-4"/>{t.joinToUnlock}</Link>
                      <Link to="/SignIn?source=o2ol-studio" className="rounded-full border border-white/25 bg-white/10 px-5 py-3 font-black text-white">{t.signIn}</Link>
                    </div>
                  )}
                </div>
              </div>
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
          <p className="mx-auto mt-5 max-w-3xl text-center text-xs leading-5 text-white/70">{t.note}</p>
        </div>
      </section>
      <UnlockPriceDialog
        open={showUnlockConfirm}
        title={episode?.title ? 'Unlock '+episode.title : 'Unlock O2OL Studio Episode'}
        priceCents={Number(episode?.unlockPriceCents||100)}
        terms="One-time unlock — yours forever."
        balanceCents={creditBalance}
        busy={unlocking}
        error={unlockError}
        onUnlock={handleUnlock}
        onClose={()=>{setShowUnlockConfirm(false);setUnlockError('');}}
      />
    </main>
  );
}
