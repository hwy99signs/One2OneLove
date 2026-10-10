import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, Film, Loader2, LockKeyhole, PlayCircle } from 'lucide-react';
import { useLanguage } from './Layout';
import { useAuth } from '@/contexts/AuthContext';
import { isTokensRequiredError, tokenRequiredDetails, unlockTokenContent } from '@/lib/tokenService';
import UnlockPriceDialog from '@/components/pricing/UnlockPriceDialog';

const COPY={
  en:{title:'Previous Episodes',sub:'Watch earlier O2OL Studio conversations anytime they are available to your account.',back:'Back to O2OL Studio',season:'Season',episode:'Episode',watch:'Watch Episode',locked:'Replay not available yet',opens:'Public replay opens',empty:'No Studio episodes are available yet.',loading:'Loading episodes…',unlockBtn:'Unlock for $1 Credit',unlockPrice:'Episode unlock — $1 Credit',unlocking:'Unlocking…',needCredit:'You need {required} Credit. Balance: {balance}.',addCredit:'Add Credit',unlockFailed:'Unable to unlock. Please try again.'},
  es:{title:'Episodios Anteriores',sub:'Mira conversaciones anteriores de O2OL Studio cuando estén disponibles para tu cuenta.',back:'Volver a O2OL Studio',season:'Temporada',episode:'Episodio',watch:'Ver Episodio',locked:'La repetición aún no está disponible',opens:'La repetición pública abre',empty:'Aún no hay episodios de Studio disponibles.',loading:'Cargando episodios…',unlockBtn:'Desbloquear por $1 de Crédito',unlockPrice:'Desbloqueo del episodio — $1 de Crédito',unlocking:'Desbloqueando…',needCredit:'Necesitas {required} de Crédito. Saldo: {balance}.',addCredit:'Añadir Crédito',unlockFailed:'No se pudo desbloquear. Inténtalo de nuevo.'},
  fr:{title:'Épisodes Précédents',sub:'Regardez les conversations précédentes d’O2OL Studio dès qu’elles sont disponibles pour votre compte.',back:'Retour à O2OL Studio',season:'Saison',episode:'Épisode',watch:'Regarder l’épisode',locked:'La rediffusion n’est pas encore disponible',opens:'La rediffusion publique ouvre',empty:'Aucun épisode Studio n’est encore disponible.',loading:'Chargement des épisodes…',unlockBtn:'Débloquer pour 1 $ de Crédit',unlockPrice:'Déblocage de l’épisode — 1 $ de Crédit',unlocking:'Déblocage…',needCredit:'Il vous faut {required} de Crédit. Solde : {balance}.',addCredit:'Ajouter du Crédit',unlockFailed:'Déblocage impossible. Veuillez réessayer.'},
  it:{title:'Episodi Precedenti',sub:'Guarda le conversazioni precedenti di O2OL Studio quando sono disponibili per il tuo account.',back:'Torna a O2OL Studio',season:'Stagione',episode:'Episodio',watch:'Guarda Episodio',locked:'La replica non è ancora disponibile',opens:'La replica pubblica apre',empty:'Non ci sono ancora episodi Studio disponibili.',loading:'Caricamento episodi…',unlockBtn:'Sblocca con $1 di Credito',unlockPrice:'Sblocco episodio — $1 di Credito',unlocking:'Sblocco in corso…',needCredit:'Ti servono {required} di Credito. Saldo: {balance}.',addCredit:'Aggiungi Credito',unlockFailed:'Sblocco non riuscito. Riprova.'},
  de:{title:'Frühere Folgen',sub:'Sieh frühere O2OL-Studio-Gespräche an, sobald sie für dein Konto verfügbar sind.',back:'Zurück zu O2OL Studio',season:'Staffel',episode:'Folge',watch:'Folge ansehen',locked:'Wiederholung noch nicht verfügbar',opens:'Öffentliche Wiederholung ab',empty:'Noch keine Studio-Folgen verfügbar.',loading:'Folgen werden geladen…',unlockBtn:'Für 1 $ Credit freischalten',unlockPrice:'Folge freischalten — 1 $ Credit',unlocking:'Wird freigeschaltet…',needCredit:'Du brauchst {required} Credit. Guthaben: {balance}.',addCredit:'Credit hinzufügen',unlockFailed:'Freischalten nicht möglich. Bitte erneut versuchen.'}
};

const EPISODE_TITLES={
  en:{'season-1-episode-1':'Who Should Apologize First?','season-1-episode-2':'Who Pays for the First Date?'},
  es:{'season-1-episode-1':'¿Quién debería disculparse primero?','season-1-episode-2':'¿Quién paga en la primera cita?'},
  fr:{'season-1-episode-1':'Qui devrait s’excuser en premier ?','season-1-episode-2':'Qui paie au premier rendez-vous ?'},
  it:{'season-1-episode-1':'Chi dovrebbe scusarsi per primo?','season-1-episode-2':'Chi paga al primo appuntamento?'},
  de:{'season-1-episode-1':'Wer sollte sich zuerst entschuldigen?','season-1-episode-2':'Wer bezahlt beim ersten Date?'}
};

export default function O2OLStudioEpisodes(){
  const {currentLanguage}=useLanguage();
  const {isAuthenticated,user}=useAuth();
  const t=COPY[currentLanguage]||COPY.en;
  const [episodes,setEpisodes]=useState([]);
  const [loading,setLoading]=useState(true);
  const [failedMedia,setFailedMedia]=useState({});
  const [refreshKey,setRefreshKey]=useState(0);
  const [unlockingId,setUnlockingId]=useState(null);
  const [unlockErrors,setUnlockErrors]=useState({});
  const [confirmEpisode,setConfirmEpisode]=useState(null);

  useEffect(()=>{
    let active=true;
    fetch('/api/studio/episodes',{credentials:'include'})
      .then(async res=>{const data=await res.json();if(!res.ok)throw new Error(data?.error?.message||'Unable to load episodes.');return data;})
      .then(data=>{if(active)setEpisodes(Array.isArray(data?.episodes)?data.episodes:[]);})
      .catch(()=>{if(active)setEpisodes([]);})
      .finally(()=>{if(active)setLoading(false);});
    return()=>{active=false};
  },[isAuthenticated,refreshKey]);

  const handleUnlock=async(ep)=>{
    if(!user?.id||unlockingId)return;
    setUnlockingId(ep.id);
    setUnlockErrors(v=>({...v,[ep.id]:''}));
    try{
      await unlockTokenContent({featureCode:'studio_episode_unlock',contentKey:ep.id,source:'o2ol_studio_episodes',idempotencyKey:`studio:${user.id}:${ep.id}`});
      setRefreshKey(k=>k+1);
    }catch(error){
      if(isTokensRequiredError(error)){
        const info=tokenRequiredDetails(error);
        setUnlockErrors(v=>({...v,[ep.id]:t.needCredit.replace('{required}',(Number(info.required||ep.unlockPriceCents||0)/100).toFixed(2)).replace('{balance}',(Number(info.balance||0)/100).toFixed(2))}));
      }else{
        setUnlockErrors(v=>({...v,[ep.id]:error?.message||t.unlockFailed}));
      }
    }finally{setUnlockingId(null);}
  };

  const ordered=useMemo(()=>[...episodes].sort((a,b)=>{
    const seasonDiff=Number(a?.season||0)-Number(b?.season||0);
    return seasonDiff||Number(a?.episode||0)-Number(b?.episode||0);
  }),[episodes]);

  return <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 sm:py-12">
    <section className="mx-auto max-w-6xl">
      <Link to="/O2OLStudio" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-black hover:bg-white/15"><ArrowLeft className="h-4 w-4"/>{t.back}</Link>
      <div className="mt-6 rounded-[2rem] border border-fuchsia-300/25 bg-[radial-gradient(circle_at_12%_0%,rgba(236,72,153,0.2),transparent_30%),radial-gradient(circle_at_88%_10%,rgba(59,130,246,0.2),transparent_28%),linear-gradient(145deg,#090514,#10163a)] p-6 shadow-2xl sm:p-8">
        <div className="text-center"><Film className="mx-auto h-10 w-10 text-fuchsia-200"/><h1 className="mt-3 text-4xl font-black sm:text-5xl">{t.title}</h1><p className="mx-auto mt-3 max-w-2xl text-white/70">{t.sub}</p></div>
        {loading?<div className="py-16 text-center text-white/60">{t.loading}</div>:
        ordered.length===0?<div className="py-16 text-center text-white/60">{t.empty}</div>:
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {ordered.map(ep=>{
            const canOpen=Boolean(ep?.canWatch&&ep?.mediaPath);
            const playable=Boolean(canOpen&&!failedMedia[ep.id]);
            return <article key={ep.id} className="overflow-hidden rounded-[1.5rem] border border-white/15 bg-white/[0.06] shadow-xl">
              <div className="aspect-video bg-black">
                {playable?<video className="h-full w-full bg-black" controls playsInline preload="metadata" poster={ep.posterPath||undefined} src={ep.mediaPath+'#t=0.1'} onError={()=>setFailedMedia(v=>({...v,[ep.id]:true}))}>Your browser does not support HTML5 video.</video>:
                <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.32),transparent_45%),#030712] p-6 text-center"><div><LockKeyhole className="mx-auto h-11 w-11 text-amber-300"/><p className="mt-3 font-black">{t.locked}</p>{ep?.unlockPriceCents?<p className="mt-1 text-xs font-bold text-amber-200">{t.unlockPrice}</p>:(ep?.publicAvailableAt&&<p className="mt-1 text-xs text-white/55">{t.opens}: {new Date(ep.publicAvailableAt).toLocaleDateString()}</p>)}</div></div>}
              </div>
              <div className="p-5"><p className="text-xs font-black uppercase tracking-[.16em] text-cyan-200">{t.season} {ep.season} • {t.episode} {ep.episode}</p><h2 className="mt-2 text-2xl font-black">{EPISODE_TITLES[currentLanguage]?.[ep.id]||EPISODE_TITLES.en[ep.id]||ep.title}</h2>{canOpen&&<Link to={`/O2OLStudio?episode=${encodeURIComponent(ep.id)}`} className="mt-4 inline-flex items-center gap-2 rounded-full border border-fuchsia-300/30 bg-fuchsia-500/15 px-4 py-2 text-sm font-black text-fuchsia-100 hover:bg-fuchsia-500/25"><PlayCircle className="h-5 w-5"/>{t.watch} {ep.episode}</Link>}
              {!canOpen&&ep?.unlockPriceCents&&(isAuthenticated?(
                <span className="mt-4 block">
                  <button type="button" disabled={unlockingId===ep.id} onClick={()=>setConfirmEpisode(ep)} className="inline-flex items-center gap-2 rounded-full bg-fuchsia-600 px-4 py-2 text-sm font-black text-white transition hover:brightness-110 disabled:opacity-60">
                    {unlockingId===ep.id?<Loader2 className="h-4 w-4 animate-spin"/>:<CreditCard className="h-4 w-4"/>}{unlockingId===ep.id?t.unlocking:t.unlockBtn}
                  </button>
                  {unlockErrors[ep.id]&&<span className="mt-2 block text-xs font-bold text-amber-200">{unlockErrors[ep.id]} <Link to="/Credit" className="underline">{t.addCredit}</Link></span>}
                </span>
              ):(
                <Link to={`/O2OLStudio?episode=${encodeURIComponent(ep.id)}`} className="mt-4 inline-flex items-center gap-2 rounded-full bg-fuchsia-600 px-4 py-2 text-sm font-black text-white transition hover:brightness-110"><CreditCard className="h-4 w-4"/>{t.unlockBtn}</Link>
              ))}</div>
            </article>;
          })}
        </div>}
      </div>
    </section>
    <UnlockPriceDialog
      open={Boolean(confirmEpisode)}
      title={confirmEpisode?.title ? 'Unlock '+confirmEpisode.title : 'Unlock O2OL Studio Episode'}
      priceCents={Number(confirmEpisode?.unlockPriceCents||100)}
      description="Pay once and watch anytime from this account."
      busy={Boolean(confirmEpisode&&unlockingId===confirmEpisode.id)}
      error={confirmEpisode ? (unlockErrors[confirmEpisode.id]||'') : ''}
      onUnlock={()=>confirmEpisode&&handleUnlock(confirmEpisode)}
      onClose={()=>setConfirmEpisode(null)}
    />
  </main>;
}
