import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Film, PlayCircle } from 'lucide-react';
import { useLanguage } from './Layout';
import { useAuth } from '@/contexts/AuthContext';

const COPY={
  en:{title:'Previous Episodes',sub:'Watch both O2OL Studio videos FREE DURING LAUNCH — no account or Credit needed.',back:'Back to O2OL Studio',season:'Season',episode:'Episode',watch:'Watch Episode',locked:'Replay not available yet',opens:'Public replay opens',empty:'No Studio episodes are available yet.',loading:'Loading episodes…'},
  es:{title:'Episodios Anteriores',sub:'Mira ambos vídeos de O2OL Studio GRATIS DURANTE EL LANZAMIENTO, sin cuenta ni Crédito.',back:'Volver a O2OL Studio',season:'Temporada',episode:'Episodio',watch:'Ver Episodio',locked:'La repetición aún no está disponible',opens:'La repetición pública abre',empty:'Aún no hay episodios de Studio disponibles.',loading:'Cargando episodios…'},
  fr:{title:'Épisodes Précédents',sub:'Regardez les deux vidéos O2OL Studio GRATUITEMENT PENDANT LE LANCEMENT, sans compte ni Crédit.',back:'Retour à O2OL Studio',season:'Saison',episode:'Épisode',watch:'Regarder l’épisode',locked:'La rediffusion n’est pas encore disponible',opens:'La rediffusion publique ouvre',empty:'Aucun épisode Studio n’est encore disponible.',loading:'Chargement des épisodes…'},
  it:{title:'Episodi Precedenti',sub:'Guarda entrambi i video O2OL Studio GRATIS DURANTE IL LANCIO, senza account né Credito.',back:'Torna a O2OL Studio',season:'Stagione',episode:'Episodio',watch:'Guarda Episodio',locked:'La replica non è ancora disponibile',opens:'La replica pubblica apre',empty:'Non ci sono ancora episodi Studio disponibili.',loading:'Caricamento episodi…'},
  de:{title:'Frühere Folgen',sub:'Beide O2OL-Studio-Videos sind KOSTENLOS IN DER STARTPHASE — ohne Konto oder Credit.',back:'Zurück zu O2OL Studio',season:'Staffel',episode:'Folge',watch:'Folge ansehen',locked:'Wiederholung noch nicht verfügbar',opens:'Öffentliche Wiederholung ab',empty:'Noch keine Studio-Folgen verfügbar.',loading:'Folgen werden geladen…'}
};

const FREE_EPISODE_NOTE = {
  en:'FREE DURING LAUNCH for everyone',es:'GRATIS DURANTE EL LANZAMIENTO para todos',
  fr:'GRATUIT PENDANT LE LANCEMENT pour tous',it:'GRATIS DURANTE IL LANCIO per tutti',
  de:'KOSTENLOS IN DER STARTPHASE für alle'
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
  const freeNote=FREE_EPISODE_NOTE[currentLanguage]||FREE_EPISODE_NOTE.en;
  const [episodes,setEpisodes]=useState([]);
  const [loading,setLoading]=useState(true);
  const [failedMedia,setFailedMedia]=useState({});
  const [refreshKey,setRefreshKey]=useState(0);


  useEffect(()=>{
    let active=true;
    fetch('/api/studio/episodes',{credentials:'include'})
      .then(async res=>{const data=await res.json();if(!res.ok)throw new Error(data?.error?.message||'Unable to load episodes.');return data;})
      .then(data=>{if(active)setEpisodes(Array.isArray(data?.episodes)?data.episodes:[]);})
      .catch(()=>{if(active)setEpisodes([]);})
      .finally(()=>{if(active)setLoading(false);});
    return()=>{active=false};
  },[isAuthenticated,refreshKey]);

const ordered=useMemo(()=>[...episodes].sort((a,b)=>{
    const seasonDiff=Number(a?.season||0)-Number(b?.season||0);
    return seasonDiff||Number(a?.episode||0)-Number(b?.episode||0);
  }),[episodes]);

  return <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 sm:py-12">
    <section className="mx-auto max-w-6xl">
      <Link to="/O2OLStudio" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-black hover:bg-white/15"><ArrowLeft className="h-4 w-4"/>{t.back}</Link>
      <div className="mt-6 rounded-[2rem] border border-fuchsia-300/25 bg-[linear-gradient(90deg,#5d2ea8_0%,#9b10b2_18%,#a812c5_58%,#b01cc9_100%)] p-6 shadow-2xl sm:p-8">
        <div className="text-center"><Film className="mx-auto h-10 w-10 text-fuchsia-200"/><h1 className="mt-3 text-4xl font-black sm:text-5xl">{t.title}</h1><p className="mx-auto mt-3 max-w-2xl text-white/70">{t.sub}</p></div>
        {loading?<div className="py-16 text-center text-white/70">{t.loading}</div>:
        ordered.length===0?<div className="py-16 text-center text-white/70">{t.empty}</div>:
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {ordered.map(ep=>{
            const canOpen=Boolean(ep?.canWatch&&ep?.mediaPath);
            const playable=Boolean(canOpen&&!failedMedia[ep.id]);
            return <article key={ep.id} className="relative overflow-hidden rounded-[1.5rem] border border-white/15 bg-white/[0.06] shadow-xl">
              <div className="aspect-video bg-black">
                {playable?<video className="h-full w-full bg-black object-contain" controls playsInline preload="metadata" poster={ep.posterPath||undefined} src={ep.mediaPath+'#t=0.1'} onError={()=>setFailedMedia(v=>({...v,[ep.id]:true}))}>Your browser does not support HTML5 video.</video>:
                <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.32),transparent_45%),#030712] p-6 text-center"><div><PlayCircle className="mx-auto h-11 w-11 text-amber-300"/><p className="mt-3 font-black">{ep?.freeForever?freeNote:t.locked}</p>{ep?.publicAvailableAt&&!ep?.freeForever&&<p className="mt-1 text-xs text-white/55">{t.opens}: {new Date(ep.publicAvailableAt).toLocaleDateString()}</p>}</div></div>}
              </div>
              <div className="p-5"><p className="text-xs font-black uppercase tracking-[.16em] text-cyan-200">{t.season} {ep.season} • {t.episode} {ep.episode}</p><h2 className="mt-2 text-2xl font-black">{EPISODE_TITLES[currentLanguage]?.[ep.id]||EPISODE_TITLES.en[ep.id]||ep.title}</h2>{canOpen&&<Link to={`/O2OLStudio?episode=${encodeURIComponent(ep.id)}`} className="mt-4 inline-flex items-center gap-2 rounded-full border border-fuchsia-300/30 bg-fuchsia-500/15 px-4 py-2 text-sm font-black text-fuchsia-100 hover:bg-fuchsia-500/25"><PlayCircle className="h-5 w-5"/>{t.watch} {ep.episode}</Link>}
              {!canOpen&&ep?.mediaReady===false&&<p className="mt-4 text-sm text-white/60">{t.locked}</p>}</div>
            </article>;
          })}
        </div>}
      </div>
    </section>
  </main>;
}
