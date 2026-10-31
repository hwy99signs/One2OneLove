import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Film, Gamepad2, Heart, Headphones, LockKeyhole, Search, Sparkles, UserPlus, X } from 'lucide-react';
import { useLanguage } from '@/Layout';
import { launchPodcastLibrary } from '@/data/podcastLibrary';
import { publicArticleTitles } from '@/data/publicArticleTitles';
import { GAME_TITLES, NOTE_CATEGORIES, FEATURE_CATEGORIES } from '@/pages/PublicCatalog';

// Rendered INSIDE the original feature route, not at /Catalog.
// Guest access never mounts member-only feature components, game logic,
// article bodies, media players or private records. All items below are
// public metadata or title-only API results. Sign-in/member behavior is not changed.
const GAME_ROUTES = new Set(['/pests','/poolpingpong','/ithoughtso','/scrabluko','/whatshouldtheydo','/whatshouldtheydoglobalpreview','/scratchgame','/likeminded']);
const PODCAST_ROUTES = new Set(['/podcastssupport','/podcasts','/podcast']);
const STUDIO_ROUTES = new Set(['/o2olstudio','/onair','/o2olstudio/episodes']);
const ARTICLE_ROUTES = new Set(['/articlessupport','/blog']);
const GAMES_ROUTES = new Set(['/cooperativegames','/games']);
const FEATURE_GROUPS = Object.fromEntries(FEATURE_CATEGORIES.flatMap(([group,items])=>items.map(([title,path])=>[path.toLowerCase(),{title,group}])));
const MORE = {
 '/relationshipquizzes':['Relationship Quizzes','Communication & Relationship Support'],
 '/lovelanguagequiz':['Love Language Quiz','Communication & Relationship Support'],
 '/anniversarytracker':['Anniversary Tracker','Couples, Memories & Planning'],
 '/relationshipcoach':['Relationship Coach','Communication & Relationship Support'],
 '/communities':['Community','Community & Connection'],
 '/chatrooms':['Chat Rooms','Community & Connection'],
 '/chatroom':['Chat Room','Community & Connection'],
 '/onair':['O2OL Studio','Creative Tools & Learning'],
 '/couplesdashboard':['Couples Dashboard','Couples, Memories & Planning'],
 '/premiumfeatures':['Premium Features','Creative Tools & Learning'],
 '/whatshouldtheydoglobalpreview':['Global Voting — Preview','Games'],
 '/aicontentcreator':['AI Content Creator','Creative Tools & Learning'],
};
const TITLES = {
 notes:{title:'Love Notes Collection',subtitle:'Choose from heartfelt love notes to express your feelings perfectly',icon:Heart,tone:'from-pink-600 via-rose-600 to-fuchsia-700',card:'border-pink-100'},
 dates:{title:'Date Ideas for Couples',subtitle:'52 date ideas — one for every week of the year',icon:Sparkles,tone:'from-teal-600 via-emerald-600 to-cyan-700',card:'border-emerald-100'},
 podcasts:{title:'Relationship Podcasts',subtitle:'Discover podcasts by conversation category and episode title',icon:Headphones,tone:'from-violet-700 via-purple-700 to-indigo-800',card:'border-purple-100'},
 studio:{title:'O2OL Studio Show',subtitle:'Browse seasons and episode titles',icon:Film,tone:'from-fuchsia-700 via-purple-800 to-indigo-900',card:'border-fuchsia-100'},
 games:{title:'Relationship Games',subtitle:'Play together, laugh together, grow together — FREE FOREVER for members',icon:Gamepad2,tone:'from-emerald-600 via-teal-600 to-green-800',card:'border-green-100'},
 articles:{title:'Relationship Library',subtitle:'Practical, plain-language articles for healthier relationships',icon:BookOpen,tone:'from-indigo-700 via-purple-700 to-pink-600',card:'border-indigo-100'},
 feature:{title:'One2OneLove Feature',subtitle:'Preview this feature, then create a free account to access it',icon:Heart,tone:'from-blue-700 via-indigo-700 to-violet-700',card:'border-blue-100'},
};
const COPY={
 en:{category:'Categories',all:'All',search:'Search titles',open:'Open',guest:'Create a FREE One2OneLove account or sign in to open this content.',join:'Create Free Account',signin:'Sign In',close:'Close',loading:'Loading titles…',empty:'No titles in this category.',access:'Sign up free to access',browse:'Browse titles and categories without an account',back:'Back to Home'},
 es:{category:'Categorías',all:'Todas',search:'Buscar títulos',open:'Abrir',guest:'Crea una cuenta GRATIS de One2OneLove o inicia sesión para acceder al contenido.',join:'Crear cuenta gratis',signin:'Iniciar sesión',close:'Cerrar',loading:'Cargando títulos…',empty:'No hay títulos.',access:'Regístrate gratis para acceder',browse:'Consulta títulos y categorías sin una cuenta',back:'Volver al inicio'},
 fr:{category:'Catégories',all:'Toutes',search:'Rechercher des titres',open:'Ouvrir',guest:'Créez un compte One2OneLove GRATUIT ou connectez-vous pour accéder au contenu.',join:'Créer un compte gratuit',signin:'Se connecter',close:'Fermer',loading:'Chargement des titres…',empty:'Aucun titre.',access:'Inscrivez-vous gratuitement pour accéder',browse:'Parcourez les titres sans compte',back:'Retour à l’accueil'},
 it:{category:'Categorie',all:'Tutte',search:'Cerca titoli',open:'Apri',guest:'Crea un account GRATUITO One2OneLove o accedi per visualizzare il contenuto.',join:'Crea account gratuito',signin:'Accedi',close:'Chiudi',loading:'Caricamento titoli…',empty:'Nessun titolo.',access:'Registrati gratis per accedere',browse:'Consulta titoli e categorie senza account',back:'Torna alla home'},
 de:{category:'Kategorien',all:'Alle',search:'Titel suchen',open:'Öffnen',guest:'Erstelle ein KOSTENLOSES One2OneLove-Konto oder melde dich an, um den Inhalt zu öffnen.',join:'Kostenloses Konto erstellen',signin:'Anmelden',close:'Schließen',loading:'Titel werden geladen…',empty:'Keine Titel.',access:'Kostenlos anmelden, um zuzugreifen',browse:'Titel und Kategorien ohne Konto ansehen',back:'Zur Startseite'},
};
const titleCase=value=>String(value||'General').replace(/([a-z])([A-Z])/g,'$1 $2').replace(/_/g,' ').replace(/\b\w/g,ch=>ch.toUpperCase());
function sectionFor(route){
 if(route==='/lovenotes')return 'notes';
 if(route==='/dateideas')return 'dates';
 if(PODCAST_ROUTES.has(route))return 'podcasts';
 if(STUDIO_ROUTES.has(route))return 'studio';
 if(ARTICLE_ROUTES.has(route))return 'articles';
 if(GAMES_ROUTES.has(route)||GAME_ROUTES.has(route))return 'games';
 return 'feature';
}
export default function GuestFeaturePreview({pathname}){
 const {currentLanguage}=useLanguage();
 const {search:locationSearch}=useLocation();
 const navigate=useNavigate();
 const route=String(pathname||'/').toLowerCase().replace(/\/$/,'')||'/';
 const type=sectionFor(route),t=COPY[currentLanguage]||COPY.en;
 const theme=TITLES[type];
 const [notes,setNotes]=useState([]),[dates,setDates]=useState([]),[studio,setStudio]=useState([]);
 const [loading,setLoading]=useState(false),[category,setCategory]=useState('all'),[search,setSearch]=useState(''),[selected,setSelected]=useState(null);
 useEffect(()=>{setCategory('all');setSearch('');setSelected(null)},[route]);
 useEffect(()=>{
   if(!['notes','dates','studio'].includes(type))return;
   let active=true;
   setLoading(true);
   const lang=encodeURIComponent(currentLanguage);
   const endpoint=type==='notes'?'/api/love-note-library?lang='+lang:type==='dates'?'/api/date-idea-library?lang='+lang:'/api/studio/episodes';
   fetch(endpoint,{credentials:'omit'}).then(r=>r.ok?r.json():null).then(data=>{
     if(!active)return;
     if(type==='notes')setNotes((data?.notes||[]).map(n=>({id:String(n.id),title:String(n.title||''),category:String(n.category||'other')})));
     if(type==='dates')setDates((data?.ideas||[]).map(n=>({id:String(n.id),title:String(n.title||''),category:String(n.category||'other')})));
     if(type==='studio')setStudio((data?.episodes||[]).map(n=>({id:String(n.id),title:String(n.title||''),category:'Season '+String(n.season||1)})));
   }).catch(()=>{}).finally(()=>{if(active)setLoading(false)});
   return()=>{active=false};
 },[type,currentLanguage]);
 const detail=FEATURE_GROUPS[route]||MORE[route]&&{title:MORE[route][0],group:MORE[route][1]};
 const singleGame=GAME_TITLES.find(([, , target])=>target.toLowerCase()===route);
 const pageName=singleGame?.[0]||detail?.title||(route==='/onair'?'O2OL Studio':null)||theme.title;
 const pageCategory=detail?.group||singleGame?.[1]||'One2OneLove';
 const rows=useMemo(()=>{
   if(type==='notes')return notes;
   if(type==='dates')return dates;
   if(type==='studio')return studio;
   if(type==='articles')return (publicArticleTitles[currentLanguage]||publicArticleTitles.en).map(a=>({id:a.id,title:a.title,category:a.category}));
   if(type==='podcasts')return launchPodcastLibrary.flatMap(p=>p.episodes.map(e=>({id:p.id+':'+e.id,title:e.title,category:(p.focus||[])[0]||p.language,group:p.title})));
   if(type==='games'){
     const all=GAME_TITLES.map(([title,category,target])=>({id:target,title,category}));
     return singleGame?all.filter(g=>g.id.toLowerCase()===route):all;
   }
   // Every other homepage tab opens its OWN page, not a generic site catalog.
   // The feature name is the listing and its topic is the category.
   return [{id:route,title:pageName,category:pageCategory}];
 },[type,notes,dates,studio,currentLanguage,route,pageName,pageCategory,singleGame]);
 const categoryList=useMemo(()=>['all',...new Set(rows.map(r=>r.category))],[rows]);
 const shown=useMemo(()=>rows.filter(item=>(category==='all'||category===item.category)&&(!search.trim()||[item.title,item.category,item.group].join(' ').toLowerCase().includes(search.trim().toLowerCase()))),[rows,category,search]);
 const activeTitle=type==='feature'?pageName:singleGame?.[0]||theme.title;
 const signupReturn=pathname+locationSearch;
 const openAccountPage=(page)=>{
   // Direct navigation deliberately closes the card dialog before changing
   // routes, and preserves the feature to return to after authentication.
   setSelected(null);
   const destination=page==='SignIn'?'redirect':'return';
   navigate('/'+page+'?'+destination+'='+encodeURIComponent(signupReturn));
 };
 useEffect(()=>{
   if(!selected)return;
   const close=e=>{if(e.key==='Escape')setSelected(null)};
   window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close);
 },[selected]);
 const Icon=theme.icon;
 return <main data-guest-feature-page={route} className="min-h-[75vh] bg-gradient-to-br from-white via-rose-50/60 to-blue-50 px-4 py-9 text-slate-900 sm:px-6">
  <div className="mx-auto max-w-6xl">
   <Link to="/Home" className="mb-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:text-indigo-700"><ArrowLeft className="h-4 w-4"/>{t.back}</Link>
   <header className={`rounded-3xl bg-gradient-to-r ${theme.tone} p-6 text-white shadow-xl sm:p-10`}>
    <div className="flex items-start gap-4"><div className="rounded-2xl bg-white/20 p-3"><Icon className="h-7 w-7"/></div><div>
      <p className="text-xs font-extrabold uppercase tracking-[.16em] text-white/70">{pageCategory}</p>
      <h1 className="mt-2 text-3xl font-black sm:text-5xl">{activeTitle}</h1>
      <p className="mt-4 max-w-3xl text-base text-white/90">{type==='feature'||singleGame?t.browse:theme.subtitle}</p>
    </div></div>
    <p className="mt-5 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white/90"><LockKeyhole className="mr-2 inline h-4 w-4"/>{t.access}</p>
   </header>
   {rows.length>1&&<div className="mt-7 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
     <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3"><Search className="h-4 w-4 text-slate-500"/><input placeholder={t.search} aria-label={t.search} className="w-full py-3 outline-none" value={search} onChange={e=>setSearch(e.target.value)}/></label>
     <select value={category} onChange={e=>setCategory(e.target.value)} aria-label={t.category} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold"><option value="all">{t.all} {t.category}</option>{categoryList.filter(c=>c!=='all').map(c=><option value={c} key={c}>{type==='notes'?NOTE_CATEGORIES[c]||titleCase(c):titleCase(c)}</option>)}</select>
   </div>}
   <p className="mt-6 text-sm font-bold text-slate-600">{loading?t.loading:`${shown.length} ${shown.length===1?'title':'titles'} · ${Math.max(categoryList.length-1,0)} ${t.category.toLowerCase()}`}</p>
   {shown.length===0&&!loading&&<p className="mt-5 text-slate-600">{t.empty}</p>}
   <section aria-label={activeTitle} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
     {shown.map(item=><button data-guest-access-item={type} key={item.id} type="button" onClick={()=>setSelected(item)} className={`flex min-h-[142px] flex-col rounded-2xl border ${theme.card} bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}>
       <p className="text-xs font-black uppercase tracking-wider text-purple-700">{type==='notes'?NOTE_CATEGORIES[item.category]||titleCase(item.category):titleCase(item.category)}</p>
       <h2 className="mt-3 flex-1 text-lg font-black leading-snug text-slate-900">{item.title}</h2>
       {item.group&&<p className="mt-2 text-xs text-slate-500">{item.group}</p>}
       <p className="mt-4 inline-flex items-center gap-2 text-sm font-black text-fuchsia-700"><LockKeyhole className="h-4 w-4"/>{t.open}</p>
     </button>)}
   </section>
  </div>
  {selected&&<div data-feature-signup-modal role="dialog" aria-modal="true" aria-label={t.guest} className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-4" onClick={e=>{if(e.target===e.currentTarget)setSelected(null)}}>
    <div className="relative w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-2xl">
      <button type="button" aria-label={t.close} onClick={()=>setSelected(null)} className="absolute right-4 top-4 rounded-lg p-2 hover:bg-slate-100"><X className="h-5 w-5"/></button>
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-pink-100 text-pink-700"><LockKeyhole className="h-7 w-7"/></div>
      <h2 className="mt-4 text-xl font-black">{selected.title}</h2>
      <p className="mt-3 text-slate-600">{t.guest}</p>
      <div className="mt-6 grid gap-3"><button type="button" data-feature-signup-action="signup" onClick={()=>openAccountPage('SignUp')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-700 to-fuchsia-600 px-5 py-3 font-black text-white"><UserPlus className="h-5 w-5"/>{t.join}</button><button type="button" data-feature-signup-action="signin" onClick={()=>openAccountPage('SignIn')} className="rounded-xl border border-purple-300 px-5 py-3 font-black text-purple-700">{t.signin}</button></div>
    </div>
   </div>}
 </main>;
}
