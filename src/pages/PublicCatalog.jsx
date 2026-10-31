import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, Heart, Headphones, Film, Gamepad2, Sparkles, LockKeyhole, Search, X, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/Layout';
import { launchPodcastLibrary } from '@/data/podcastLibrary';
import { publicArticleTitles } from '@/data/publicArticleTitles';

// Metadata only. Never fetch detailed note/idea endpoints or render media,
// article bodies, game components, AI conversations or member records here.
// The public endpoints below are already title-only.
const TYPES = [
  ['notes','Love Notes',Heart],['dates','Date Ideas',Sparkles],
  ['podcasts','Podcasts',Headphones],['studio','Studio Episodes',Film],
  ['games','Games',Gamepad2],['articles','Articles',BookOpen],
  ['features','More Features',Sparkles],
];
const NOTE_CATEGORIES = {
  all:'All Notes',sweet:'Sweet Messages',memories:'Memories',future:'Future Plans',
  daily:'Daily Notes',morning:'Morning Notes',night:'Night Notes',
  special:'Special Occasions',romantic:'Romantic',playful:'Playful',deep:'Deep',
  appreciation:'Appreciation',dateIdeas:'Date Ideas',milestone:'Milestone Celebrations',
  justBecause:'Just Because',encouragement:'Encouragement',apology:'Apology',
  family:'Family',friends:'Friends',heartBroken:'Heart Broken',sick:'For Someone Sick',
  goodLuck:'Good Luck',holiday:'Holiday',missingYou:'Missing You',religious:'Religious',
  service:'Service',workplace:'Workplace',lgbtqRomantic:'LGBTQ Romantic',
  lgbtqSupport:'LGBTQ Support',lgbtqMilestone:'LGBTQ Milestone',
};
const GAME_TITLES = [
  ['Like Minded?','Brain & Puzzle','/LikeMinded'],
  ['SCRABLUKO','Brain & Puzzle','/Scrabluko'],
  ['What Should They Do?','Brain & Puzzle','/WhatShouldTheyDo'],
  ['LOVE SCRATCH GAME','Arcade & Quick Play','/ScratchGame'],
  ["PEST'S",'Arcade & Quick Play','/Pests'],
  ['Pool Ping Pong','Arcade & Quick Play','/PoolPingPong'],
  ['I Thought So!','Brain & Puzzle','/IThoughtSo'],
  ['Global Voting — Preview','Brain & Puzzle','/WhatShouldTheyDoGlobalPreview'],
];
const FEATURE_CATEGORIES = [
  ['Communication & Relationship Support',[
    ['Couple Support','/CoupleSupport'],['LGBTQ+ Support','/LGBTQSupport'],
    ['Communication Practice','/CommunicationPractice'],
    ['Relationship Quizzes','/RelationshipQuizzes'],['Love Language Quiz','/LoveLanguageQuiz'],
    ['Counseling Support','/CounselingSupport'],['Meditation','/Meditation'],
    ['Professionals','/Professionals'],['Influencer Support','/InfluencersSupport'],
  ]],
  ['Community & Connection',[
    ['Chat Rooms','/Chat'],['Community','/Community'],['Find Friends','/FindFriends'],
    ['Friend Requests','/FriendRequests'],['Invite','/Invite'],
    ['MyMatchIQ','/MyMatchIQ'],['Like Minded?','/LikeMinded'],
  ]],
  ['Couples, Memories & Planning',[
    ['Memory Lane','/MemoryLane'],['Shared Journals','/SharedJournals'],
    ['Relationship Goals','/RelationshipGoals'],
    ['Relationship Milestones','/RelationshipMilestones'],
    ['Anniversary Tracker','/AnniversaryTracker'],['Couples Calendar','/CouplesCalendar'],
    ['Couple Activities','/CoupleActivities'],['Couples Dashboard','/CouplesDashboard'],
    ['Couples Profile','/CouplesProfile'],['Achievements','/Achievements'],
    ['Leaderboard','/Leaderboard'],
  ]],
  ['Creative Tools & Learning',[
    ['AI Content Creator','/AIContentCreator'],['TikTok Post','/TikTokPost'],
    ['Send Love Notes','/LoveNotes'],['Relationship Articles','/ArticlesSupport'],
    ['Podcasts','/PodcastsSupport'],['O2OL Studio','/O2OLStudio'],
  ]],
];
const COPY = {
 en:{title:'Explore One2OneLove',subtitle:'Browse every category, title and listing before creating an account. Sign up free when you are ready to open a feature.',search:'Search titles and categories',all:'All Categories',open:'Open',guest:'Create a free account or sign in to access this feature.',join:'Create Free Account',signin:'Sign In',close:'Close',empty:'No titles found. Try a different search or category.',loading:'Loading titles…',noPrice:'Browsing is free. Existing feature prices and promotions are unchanged.',browse:'Browse the Catalog'},
 es:{title:'Explora One2OneLove',subtitle:'Descubre categorías y títulos antes de registrarte. Crea una cuenta gratis para abrir una función.',search:'Buscar títulos y categorías',all:'Todas las categorías',open:'Abrir',guest:'Crea una cuenta gratis o inicia sesión para acceder.',join:'Crear cuenta gratis',signin:'Iniciar sesión',close:'Cerrar',empty:'No se encontraron títulos.',loading:'Cargando títulos…',noPrice:'Explorar es gratis. Los precios y promociones no cambian.',browse:'Explorar el catálogo'},
 fr:{title:'Découvrez One2OneLove',subtitle:'Parcourez les catégories et titres avant de créer un compte gratuit.',search:'Rechercher des titres',all:'Toutes les catégories',open:'Ouvrir',guest:'Créez un compte gratuit ou connectez-vous pour accéder.',join:'Créer un compte gratuit',signin:'Se connecter',close:'Fermer',empty:'Aucun titre trouvé.',loading:'Chargement des titres…',noPrice:'La consultation est gratuite. Les prix et promotions ne changent pas.',browse:'Parcourir le catalogue'},
 it:{title:'Esplora One2OneLove',subtitle:'Sfoglia categorie e titoli prima di creare un account gratuito.',search:'Cerca titoli',all:'Tutte le categorie',open:'Apri',guest:'Crea un account gratuito o accedi per continuare.',join:'Crea account gratuito',signin:'Accedi',close:'Chiudi',empty:'Nessun titolo trovato.',loading:'Caricamento titoli…',noPrice:'La navigazione è gratuita. Prezzi e promozioni restano invariati.',browse:'Esplora il catalogo'},
 de:{title:'One2OneLove Entdecken',subtitle:'Sieh dir Kategorien und Titel an, bevor du ein kostenloses Konto erstellst.',search:'Titel durchsuchen',all:'Alle Kategorien',open:'Öffnen',guest:'Erstelle ein kostenloses Konto oder melde dich an, um fortzufahren.',join:'Kostenloses Konto erstellen',signin:'Anmelden',close:'Schließen',empty:'Keine Titel gefunden.',loading:'Titel werden geladen…',noPrice:'Das Stöbern ist kostenlos. Preise und Aktionen bleiben unverändert.',browse:'Katalog durchsuchen'},
};
const pretty = (v) => String(v || 'General').replace(/([a-z])([A-Z])/g,'$1 $2').replace(/_/g,' ').replace(/\b\w/g,ch=>ch.toUpperCase());
const featureToType = (v) => {
 const s=String(v||'').toLowerCase().replace(/^\//,'');
 if(s.includes('lovenote'))return 'notes';
 if(s.includes('dateidea'))return 'dates';
 if(s.includes('podcast'))return 'podcasts';
 if(s.includes('studio')||s==='onair')return 'studio';
 if(['cooperativegames','games','pests','poolpingpong','ithoughtso','scrabluko','whatshouldtheydo','whatshouldtheydoglobalpreview','scratchgame','likeminded'].includes(s))return 'games';
 if(s.includes('article')||s==='blog')return 'articles';
 return 'features';
};
export default function PublicCatalog(){
 const {currentLanguage}=useLanguage();
 const {isAuthenticated,isLoading}=useAuth();
 const t=COPY[currentLanguage]||COPY.en;
 const [params,setParams]=useSearchParams();
 const navigate=useNavigate();
 const [notes,setNotes]=useState([]);
 const [dates,setDates]=useState([]);
 const [studio,setStudio]=useState([]);
 const [busy,setBusy]=useState(true);
 const [selected,setSelected]=useState(null);
 const [category,setCategory]=useState('all');
 const [search,setSearch]=useState('');
 const requested=params.get('feature')||'notes';
 const type=TYPES.some(v=>v[0]===requested)?requested:featureToType(requested);
 useEffect(()=>{setCategory('all');setSearch('');},[type]);
 useEffect(()=>{
  let alive=true;setBusy(true);
  const lang=encodeURIComponent(currentLanguage);
  Promise.allSettled([
   fetch('/api/love-note-library?lang='+lang,{credentials:'omit'}).then(r=>r.ok?r.json():null),
   fetch('/api/date-idea-library?lang='+lang,{credentials:'omit'}).then(r=>r.ok?r.json():null),
   fetch('/api/studio/episodes',{credentials:'omit'}).then(r=>r.ok?r.json():null),
  ]).then(results=>{
   if(!alive)return;
   const values=results.map(r=>r.status==='fulfilled'?r.value:null);
   setNotes((values[0]?.notes||[]).map(n=>({id:String(n.id),title:String(n.title||''),category:String(n.category||'other'),target:'/LoveNotes'})));
   setDates((values[1]?.ideas||[]).map(n=>({id:String(n.id),title:String(n.title||''),category:String(n.category||'other'),target:'/DateIdeas'})));
   setStudio((values[2]?.episodes||[]).map(e=>({id:String(e.id),title:String(e.title||''),category:'Season '+String(e.season||1),target:'/O2OLStudio?episode='+encodeURIComponent(e.id)})));
  }).finally(()=>{if(alive)setBusy(false)});
  return ()=>{alive=false};
 },[currentLanguage]);
 const items=useMemo(()=>{
  if(type==='notes')return notes;
  if(type==='dates')return dates;
  if(type==='studio')return studio;
  if(type==='games')return GAME_TITLES.map(([title,category,target])=>({id:target,title,category,target}));
  if(type==='articles')return (publicArticleTitles[currentLanguage]||publicArticleTitles.en).map(a=>({...a,target:'/ArticlesSupport'}));
  if(type==='podcasts')return launchPodcastLibrary.flatMap(p=>p.episodes.map(e=>({id:p.id+':'+e.id,title:e.title,category:(p.focus||[])[0]||p.language,group:p.title,target:'/PodcastsSupport'})));
  return FEATURE_CATEGORIES.flatMap(([category,list])=>list.map(([title,target])=>({id:target,title,category,target})));
 },[type,notes,dates,studio,currentLanguage]);
 const categories=useMemo(()=>['all',...new Set(items.map(i=>i.category))], [items]);
 const shown=useMemo(()=>items.filter(i=>(category==='all'||i.category===category)&&(!search.trim()||[i.title,i.category,i.group].join(' ').toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))),[items,category,search]);
 const openItem=(item)=>{if(isLoading)return;if(isAuthenticated){navigate(item.target);return}setSelected(item);};
 const switchType=(value)=>setParams({feature:value});
 useEffect(()=>{if(!selected)return;const close=e=>{if(e.key==='Escape')setSelected(null)};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[selected]);
 return <div className="min-h-[75vh] bg-gradient-to-br from-rose-50 via-white to-sky-50 px-4 py-10 text-slate-900">
  <div className="mx-auto max-w-7xl">
   <div className="rounded-3xl bg-gradient-to-r from-fuchsia-700 via-purple-700 to-blue-700 px-6 py-9 text-white shadow-xl sm:px-10">
    <p className="text-xs font-black uppercase tracking-[.2em] text-yellow-200">{t.browse}</p>
    <h1 className="mt-2 text-4xl font-black sm:text-5xl">{t.title}</h1>
    <p className="mt-3 max-w-3xl text-base text-white/90">{t.subtitle}</p>
    <p className="mt-3 text-sm font-bold text-amber-200">{t.noPrice}</p>
   </div>
   <div className="mt-7 flex flex-wrap gap-2" role="tablist" aria-label={t.all}>
    {TYPES.map(([id,label,Icon])=><button key={id} type="button" role="tab" aria-selected={type===id} onClick={()=>switchType(id)} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-black shadow-sm ${type===id?'border-purple-700 bg-purple-700 text-white':'border-purple-200 bg-white text-purple-900 hover:bg-purple-50'}`}><Icon className="h-4 w-4"/>{label}</button>)}
   </div>
   <div className="mt-7 flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3"><Search className="h-4 w-4 text-slate-500"/><input aria-label={t.search} className="w-full py-3 outline-none" placeholder={t.search} value={search} onChange={e=>setSearch(e.target.value)}/></label>
    <select aria-label={t.all} value={category} onChange={e=>setCategory(e.target.value)} className="max-w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900"><option value="all">{t.all}</option>{categories.filter(c=>c!=='all').map(c=><option key={c} value={c}>{type==='notes'?(NOTE_CATEGORIES[c]||pretty(c)):pretty(c)}</option>)}</select>
   </div>
   <p className="mt-5 text-sm font-bold text-slate-600">{busy&&['notes','dates','studio'].includes(type)?t.loading:`${shown.length} titles · ${categories.length-1} categories`}</p>
   {shown.length===0&&!busy&&<p className="mt-6 text-slate-600">{t.empty}</p>}
   <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label={TYPES.find(v=>v[0]===type)?.[1]||t.title}>
    {shown.map((item,index)=><button key={item.id+'-'+index} type="button" data-catalog-item={type} data-catalog-title={item.title} onClick={()=>openItem(item)} className="flex min-h-[112px] flex-col rounded-2xl border border-purple-100 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md">
     <span className="text-xs font-black uppercase tracking-wide text-purple-600">{type==='notes'?(NOTE_CATEGORIES[item.category]||pretty(item.category)):pretty(item.category)}</span>
     <span className="mt-2 flex-1 text-base font-black leading-snug text-slate-900">{item.title}</span>
     {item.group&&<span className="mt-1 text-xs text-slate-500">{item.group}</span>}
     <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-purple-700"><LockKeyhole className="h-3.5 w-3.5"/>{t.open}</span>
    </button>)}
   </section>
  </div>
  {selected&&<div data-catalog-signup-modal role="dialog" aria-modal="true" aria-label={t.guest} className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 px-4 py-6" onClick={e=>{if(e.target===e.currentTarget)setSelected(null)}}>
   <div className="relative w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-2xl">
    <button type="button" aria-label={t.close} onClick={()=>setSelected(null)} className="absolute right-4 top-4 rounded-lg p-2 text-slate-600 hover:bg-slate-100"><X className="h-5 w-5"/></button>
    <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-purple-100 text-purple-700"><LockKeyhole className="h-7 w-7"/></div>
    <h2 className="mt-4 text-xl font-black">{selected.title}</h2>
    <p className="mt-3 text-slate-600">{t.guest}</p>
    <div className="mt-6 grid gap-3"><Link to={'/SignUp?return='+encodeURIComponent(selected.target)} className="inline-flex justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-700 to-pink-600 px-5 py-3 font-black text-white"><UserPlus className="h-5 w-5"/>{t.join}</Link><Link to={'/SignIn?return='+encodeURIComponent(selected.target)} className="rounded-xl border border-purple-200 px-5 py-3 font-black text-purple-800">{t.signin}</Link></div>
   </div>
  </div>}
 </div>;
}
