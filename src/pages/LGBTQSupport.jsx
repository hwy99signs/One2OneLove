import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, ExternalLink, Globe2, Heart, Languages, MapPin, Search, ShieldCheck, Sparkles, Users, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/Layout';
import { createPageUrl } from '@/utils';
import { lgbtqSupportArticles } from '@/data/lgbtqSupportArticles';
import { lgbtqCountryOptions, lgbtqLanguageOptions, lgbtqSupportResources } from '@/data/lgbtqSupportResources';

const copy = {
  en:{
    title:'LGBTQ+ Support', subtitle:'Affirming relationship guidance, practical tools, community resources and international support for LGBTQ+ people, couples and loved ones.',
    back:'Back to Relationship Support', intro:'You deserve support that respects your identity, your relationship, your safety and the life you are building.',
    learn:'Learn & Understand', learnBody:'Original One2OneLove articles written for common LGBTQ+ relationship experiences.', read:'Read Article', backArticles:'Back to LGBTQ+ Articles', key:'Key Takeaways',
    resources:'Support Directory', resourcesBody:'Find LGBTQ+ organizations, affirming care, peer support and community resources by country and service language.', search:'Search organizations or locations…', country:'Country / Territory', language:'Service Language', all:'All', visit:'Visit Resource', noResults:'No matching resources. Try another country, language or search term.',
    featured:'Featured Resources', therapistAid:'Therapist Aid', therapistAidBody:'Original therapy worksheets and relationship tools. One2OneLove links to Therapist Aid directly so the original copyrighted resources stay with their publisher.',
    comingOut:'Coming Out Questions', relationshipTools:'Relationship Tools', healthcare:'Affirming Care Directory',
    safetyTitle:'Need urgent help?', safety:'If you are in immediate danger, contact the emergency service for your location. Crisis and peer-support options vary by country; use the directory below to find the appropriate service.',
    external:'External resource', languages:'Languages', location:'Location', type:'Support type',
    typeMap:{'Worksheets & education':'Worksheets & education','Relationship tools':'Relationship tools','Youth crisis & support':'Youth crisis & support','Family & community':'Family & community','Peer support':'Peer support','Affirming healthcare':'Affirming healthcare','Education & support':'Education & support','Youth & community':'Youth & community','24/7 public support':'24/7 public support','Community support':'Community support','Local directory':'Local directory','Listening & anti-violence':'Listening & anti-violence','Community directory':'Community directory','LGBTQ+ community center':'LGBTQ+ community center','Community & social support':'Community & social support','Counseling & legal support':'Counseling & legal support','Community network':'Community network','Support directory':'Support directory','Information & referral':'Information & referral'}
  },
  es:{
    title:'Apoyo LGBTQ+', subtitle:'Orientación afirmativa, herramientas prácticas, recursos comunitarios y apoyo internacional para personas LGBTQ+, parejas y seres queridos.',
    back:'Volver al Apoyo de Relaciones', intro:'Mereces apoyo que respete tu identidad, tu relación, tu seguridad y la vida que estás construyendo.',
    learn:'Aprender y Comprender', learnBody:'Artículos originales de One2OneLove sobre experiencias comunes en relaciones LGBTQ+.', read:'Leer Artículo', backArticles:'Volver a Artículos LGBTQ+', key:'Puntos Clave',
    resources:'Directorio de Apoyo', resourcesBody:'Encuentra organizaciones LGBTQ+, atención afirmativa, apoyo entre pares y recursos comunitarios por país e idioma.', search:'Buscar organizaciones o lugares…', country:'País / Territorio', language:'Idioma del Servicio', all:'Todos', visit:'Visitar Recurso', noResults:'No hay recursos que coincidan. Prueba otro país, idioma o búsqueda.',
    featured:'Recursos Destacados', therapistAid:'Therapist Aid', therapistAidBody:'Hojas de trabajo y herramientas originales. One2OneLove enlaza directamente a Therapist Aid para mantener los recursos con su editor original.',
    comingOut:'Preguntas para Salir del Clóset', relationshipTools:'Herramientas de Relaciones', healthcare:'Directorio de Atención Afirmativa',
    safetyTitle:'¿Necesitas ayuda urgente?', safety:'Si estás en peligro inmediato, contacta el servicio de emergencia de tu ubicación. Las opciones de crisis y apoyo varían por país; usa el directorio para encontrar el servicio adecuado.',
    external:'Recurso externo', languages:'Idiomas', location:'Ubicación', type:'Tipo de apoyo',
    typeMap:{'Worksheets & education':'Hojas y educación','Relationship tools':'Herramientas de relaciones','Youth crisis & support':'Crisis y apoyo juvenil','Family & community':'Familia y comunidad','Peer support':'Apoyo entre pares','Affirming healthcare':'Atención afirmativa','Education & support':'Educación y apoyo','Youth & community':'Juventud y comunidad','24/7 public support':'Apoyo público 24/7','Community support':'Apoyo comunitario','Local directory':'Directorio local','Listening & anti-violence':'Escucha y anti-violencia','Community directory':'Directorio comunitario','LGBTQ+ community center':'Centro comunitario LGBTQ+','Community & social support':'Apoyo comunitario y social','Counseling & legal support':'Orientación y apoyo legal','Community network':'Red comunitaria','Support directory':'Directorio de apoyo','Information & referral':'Información y derivación'}
  },
  fr:{
    title:'Soutien LGBTQ+', subtitle:'Conseils affirmatifs, outils pratiques, ressources communautaires et soutien international pour les personnes LGBTQ+, les couples et leurs proches.',
    back:'Retour au Soutien Relationnel', intro:'Vous méritez un soutien qui respecte votre identité, votre relation, votre sécurité et la vie que vous construisez.',
    learn:'Apprendre et Comprendre', learnBody:'Articles originaux One2OneLove sur des expériences relationnelles LGBTQ+ courantes.', read:'Lire l’Article', backArticles:'Retour aux Articles LGBTQ+', key:'Points Clés',
    resources:'Annuaire de Soutien', resourcesBody:'Trouvez des organisations LGBTQ+, des soins affirmatifs, du soutien par les pairs et des ressources communautaires par pays et langue.', search:'Rechercher une organisation ou un lieu…', country:'Pays / Territoire', language:'Langue du Service', all:'Tous', visit:'Voir la Ressource', noResults:'Aucune ressource correspondante. Essayez un autre pays, une autre langue ou une autre recherche.',
    featured:'Ressources en Vedette', therapistAid:'Therapist Aid', therapistAidBody:'Outils et fiches thérapeutiques originaux. One2OneLove renvoie directement vers Therapist Aid afin de laisser les ressources protégées chez leur éditeur.',
    comingOut:'Questions sur le Coming Out', relationshipTools:'Outils Relationnels', healthcare:'Annuaire de Soins Affirmatifs',
    safetyTitle:'Besoin d’aide urgente ?', safety:'En cas de danger immédiat, contactez les services d’urgence de votre lieu. Les services de crise et de soutien varient selon le pays ; utilisez l’annuaire pour trouver le service adapté.',
    external:'Ressource externe', languages:'Langues', location:'Lieu', type:'Type de soutien',
    typeMap:{'Worksheets & education':'Fiches et éducation','Relationship tools':'Outils relationnels','Youth crisis & support':'Crise et soutien jeunesse','Family & community':'Famille et communauté','Peer support':'Soutien par les pairs','Affirming healthcare':'Soins affirmatifs','Education & support':'Éducation et soutien','Youth & community':'Jeunesse et communauté','24/7 public support':'Soutien public 24/7','Community support':'Soutien communautaire','Local directory':'Annuaire local','Listening & anti-violence':'Écoute et anti-violence','Community directory':'Annuaire communautaire','LGBTQ+ community center':'Centre communautaire LGBTQ+','Community & social support':'Soutien communautaire et social','Counseling & legal support':'Conseil et soutien juridique','Community network':'Réseau communautaire','Support directory':'Annuaire de soutien','Information & referral':'Information et orientation'}
  },
  it:{
    title:'Supporto LGBTQ+', subtitle:'Guida affermativa, strumenti pratici, risorse comunitarie e supporto internazionale per persone LGBTQ+, coppie e persone care.',
    back:'Torna al Supporto Relazionale', intro:'Meriti un supporto che rispetti la tua identità, la tua relazione, la tua sicurezza e la vita che stai costruendo.',
    learn:'Impara e Comprendi', learnBody:'Articoli originali One2OneLove su esperienze comuni nelle relazioni LGBTQ+.', read:'Leggi Articolo', backArticles:'Torna agli Articoli LGBTQ+', key:'Punti Chiave',
    resources:'Directory di Supporto', resourcesBody:'Trova organizzazioni LGBTQ+, cure affermative, supporto tra pari e risorse comunitarie per paese e lingua.', search:'Cerca organizzazioni o luoghi…', country:'Paese / Territorio', language:'Lingua del Servizio', all:'Tutti', visit:'Visita Risorsa', noResults:'Nessuna risorsa corrispondente. Prova un altro paese, lingua o ricerca.',
    featured:'Risorse in Evidenza', therapistAid:'Therapist Aid', therapistAidBody:'Fogli e strumenti terapeutici originali. One2OneLove collega direttamente a Therapist Aid per mantenere i contenuti protetti presso l’editore originale.',
    comingOut:'Domande sul Coming Out', relationshipTools:'Strumenti di Relazione', healthcare:'Directory di Cure Affermative',
    safetyTitle:'Serve aiuto urgente?', safety:'In caso di pericolo immediato, contatta il servizio di emergenza della tua zona. I servizi di crisi e supporto variano per paese; usa la directory per trovare quello adatto.',
    external:'Risorsa esterna', languages:'Lingue', location:'Luogo', type:'Tipo di supporto',
    typeMap:{'Worksheets & education':'Fogli ed educazione','Relationship tools':'Strumenti di relazione','Youth crisis & support':'Crisi e supporto giovani','Family & community':'Famiglia e comunità','Peer support':'Supporto tra pari','Affirming healthcare':'Cure affermative','Education & support':'Educazione e supporto','Youth & community':'Giovani e comunità','24/7 public support':'Supporto pubblico 24/7','Community support':'Supporto comunitario','Local directory':'Directory locale','Listening & anti-violence':'Ascolto e anti-violenza','Community directory':'Directory comunitaria','LGBTQ+ community center':'Centro comunitario LGBTQ+','Community & social support':'Supporto comunitario e sociale','Counseling & legal support':'Consulenza e supporto legale','Community network':'Rete comunitaria','Support directory':'Directory di supporto','Information & referral':'Informazioni e orientamento'}
  },
  de:{
    title:'LGBTQ+ Unterstützung', subtitle:'Bestärkende Beziehungsinformationen, praktische Werkzeuge, Community-Ressourcen und internationale Unterstützung für LGBTQ+ Menschen, Paare und Angehörige.',
    back:'Zurück zur Beziehungsunterstützung', intro:'Du verdienst Unterstützung, die deine Identität, deine Beziehung, deine Sicherheit und dein Leben respektiert.',
    learn:'Lernen und Verstehen', learnBody:'Originale One2OneLove-Artikel zu häufigen LGBTQ+ Beziehungserfahrungen.', read:'Artikel Lesen', backArticles:'Zurück zu LGBTQ+ Artikeln', key:'Wichtige Erkenntnisse',
    resources:'Unterstützungsverzeichnis', resourcesBody:'Finde LGBTQ+ Organisationen, affirmative Versorgung, Peer-Support und Community-Angebote nach Land und Sprache.', search:'Organisationen oder Orte suchen…', country:'Land / Gebiet', language:'Servicesprache', all:'Alle', visit:'Ressource Öffnen', noResults:'Keine passenden Ressourcen. Versuche ein anderes Land, eine andere Sprache oder Suche.',
    featured:'Empfohlene Ressourcen', therapistAid:'Therapist Aid', therapistAidBody:'Originale Arbeitsblätter und Beziehungstools. One2OneLove verlinkt direkt zu Therapist Aid, damit die geschützten Inhalte beim ursprünglichen Anbieter bleiben.',
    comingOut:'Coming-out Fragen', relationshipTools:'Beziehungswerkzeuge', healthcare:'Verzeichnis Affirmativer Versorgung',
    safetyTitle:'Brauchst du dringend Hilfe?', safety:'Bei unmittelbarer Gefahr wende dich an den Notdienst deines Standorts. Krisen- und Peer-Angebote unterscheiden sich je nach Land; nutze das Verzeichnis, um passende Hilfe zu finden.',
    external:'Externe Ressource', languages:'Sprachen', location:'Ort', type:'Art der Unterstützung',
    typeMap:{'Worksheets & education':'Arbeitsblätter & Bildung','Relationship tools':'Beziehungswerkzeuge','Youth crisis & support':'Krisen- & Jugendhilfe','Family & community':'Familie & Community','Peer support':'Peer-Support','Affirming healthcare':'Affirmative Versorgung','Education & support':'Bildung & Unterstützung','Youth & community':'Jugend & Community','24/7 public support':'Öffentliche Hilfe 24/7','Community support':'Community-Unterstützung','Local directory':'Lokales Verzeichnis','Listening & anti-violence':'Beratung & Anti-Gewalt','Community directory':'Community-Verzeichnis','LGBTQ+ community center':'LGBTQ+ Community-Zentrum','Community & social support':'Community- & Sozialhilfe','Counseling & legal support':'Beratung & Rechtshilfe','Community network':'Community-Netzwerk','Support directory':'Unterstützungsverzeichnis','Information & referral':'Information & Weitervermittlung'}
  }
};

const languageNameMap = {
  English:{en:'English',es:'Inglés',fr:'Anglais',it:'Inglese',de:'Englisch'},
  Spanish:{en:'Spanish',es:'Español',fr:'Espagnol',it:'Spagnolo',de:'Spanisch'},
  French:{en:'French',es:'Francés',fr:'Français',it:'Francese',de:'Französisch'},
  Italian:{en:'Italian',es:'Italiano',fr:'Italien',it:'Italiano',de:'Italienisch'},
  German:{en:'German',es:'Alemán',fr:'Allemand',it:'Tedesco',de:'Deutsch'}
};

const countryNameMap = {
  All:{en:'All',es:'Todos',fr:'Tous',it:'Tutti',de:'Alle'},
  Global:{en:'Global',es:'Global',fr:'Mondial',it:'Globale',de:'Global'},
  'United States':{en:'United States',es:'Estados Unidos',fr:'États-Unis',it:'Stati Uniti',de:'USA'},
  Canada:{en:'Canada',es:'Canadá',fr:'Canada',it:'Canada',de:'Kanada'},
  Mexico:{en:'Mexico',es:'México',fr:'Mexique',it:'Messico',de:'Mexiko'},
  Spain:{en:'Spain',es:'España',fr:'Espagne',it:'Spagna',de:'Spanien'},
  France:{en:'France',es:'Francia',fr:'France',it:'Francia',de:'Frankreich'},
  Guadeloupe:{en:'Guadeloupe',es:'Guadalupe',fr:'Guadeloupe',it:'Guadalupa',de:'Guadeloupe'},
  Martinique:{en:'Martinique',es:'Martinica',fr:'Martinique',it:'Martinica',de:'Martinique'},
  Germany:{en:'Germany',es:'Alemania',fr:'Allemagne',it:'Germania',de:'Deutschland'},
  Italy:{en:'Italy',es:'Italia',fr:'Italie',it:'Italia',de:'Italien'},
  Belgium:{en:'Belgium',es:'Bélgica',fr:'Belgique',it:'Belgio',de:'Belgien'},
  Switzerland:{en:'Switzerland',es:'Suiza',fr:'Suisse',it:'Svizzera',de:'Schweiz'}
};

export default function LGBTQSupport() {
  const { currentLanguage } = useLanguage();
  const t = copy[currentLanguage] || copy.en;
  const articles = lgbtqSupportArticles[currentLanguage] || lgbtqSupportArticles.en;
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedArticle,setSelectedArticle] = useState(null);
  const [country,setCountry] = useState('All');
  const [serviceLanguage,setServiceLanguage] = useState('All');
  const [search,setSearch] = useState('');

  useEffect(() => {
    if (location.state?.lgbtqSubview !== 'article') setSelectedArticle(null);
  }, [location.key]);

  const openArticle = article => {
    navigate(location.pathname + location.search,{state:{...(location.state||{}),lgbtqSubview:'article'}});
    setSelectedArticle(article);
    window.scrollTo({top:0,behavior:'smooth'});
  };

  const backToArticles = () => {
    if(location.state?.lgbtqSubview === 'article') navigate(-1);
    else setSelectedArticle(null);
  };

  const filteredResources = useMemo(() => {
    const q=search.trim().toLowerCase();
    return lgbtqSupportResources.filter(resource => {
      const countryMatch = country === 'All' || resource.country === country || (country === 'United States' && resource.country === 'United States & Canada') || (country === 'Canada' && resource.country === 'United States & Canada');
      const languageMatch = serviceLanguage === 'All' || resource.languages.includes(serviceLanguage);
      const searchMatch = !q || [resource.name,resource.country,resource.city,resource.type,...resource.languages].join(' ').toLowerCase().includes(q);
      return countryMatch && languageMatch && searchMatch;
    });
  },[country,serviceLanguage,search]);

  const localizeLanguage = name => languageNameMap[name]?.[currentLanguage] || name;
  const localizeCountry = name => countryNameMap[name]?.[currentLanguage] || name;

  if(selectedArticle){
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 px-4 py-8">
        <article className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-purple-100 bg-white shadow-lg">
          <div className="grid h-3 grid-cols-6"><div className="bg-red-500"/><div className="bg-orange-500"/><div className="bg-yellow-400"/><div className="bg-green-500"/><div className="bg-blue-500"/><div className="bg-violet-600"/></div>
          <div className="p-6 sm:p-10">
            <button type="button" onClick={backToArticles} className="mb-6 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-black text-slate-600 hover:bg-purple-50 hover:text-purple-700"><ArrowLeft size={18}/>{t.backArticles}</button>
            <span className="inline-flex rounded-full bg-purple-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-purple-700">{selectedArticle.category}</span>
            <h1 className="mt-4 text-3xl font-black leading-tight text-slate-900 sm:text-4xl">{selectedArticle.title}</h1>
            <p className="mt-4 text-lg leading-8 text-slate-600">{selectedArticle.summary}</p>
            <div className="mt-8 space-y-5 border-t border-slate-100 pt-8">{selectedArticle.body.map((p,i)=><p key={i} className="text-[17px] leading-8 text-slate-700">{p}</p>)}</div>
            <div className="mt-10 rounded-3xl border border-purple-100 bg-purple-50/70 p-6">
              <h2 className="text-xl font-black text-slate-900">{t.key}</h2>
              <div className="mt-4 space-y-3">{selectedArticle.takeaways.map((item,i)=><div key={i} className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-600 text-xs font-black text-white">{i+1}</span><p className="leading-7 text-slate-700">{item}</p></div>)}</div>
            </div>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="grid h-3 grid-cols-6"><div className="bg-red-500"/><div className="bg-orange-500"/><div className="bg-yellow-400"/><div className="bg-green-500"/><div className="bg-blue-500"/><div className="bg-violet-600"/></div>

      <div className="mx-auto max-w-7xl px-4 py-10">
        <Link to={createPageUrl('CoupleSupport')} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-black text-slate-600 hover:bg-white"><ArrowLeft size={18}/>{t.back}</Link>

        <motion.header initial={{opacity:0,y:-14}} animate={{opacity:1,y:0}} className="mt-4 overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-xl">
          <div className="bg-gradient-to-r from-red-500 via-yellow-400 to-violet-600 p-[3px]">
            <div className="rounded-[1.8rem] bg-white px-6 py-10 text-center sm:px-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 text-white shadow-lg"><Heart size={32} className="fill-white"/></div>
              <h1 className="mt-5 text-4xl font-black text-slate-900 md:text-5xl">{t.title}</h1>
              <p className="mx-auto mt-3 max-w-4xl text-lg leading-8 text-slate-600">{t.subtitle}</p>
              <p className="mx-auto mt-5 max-w-3xl rounded-2xl bg-purple-50 p-4 font-semibold leading-7 text-slate-700">{t.intro}</p>
            </div>
          </div>
        </motion.header>

        <section className="mt-10">
          <div className="flex items-center gap-3"><BookOpen className="text-purple-600"/><div><h2 className="text-2xl font-black text-slate-900">{t.learn}</h2><p className="mt-1 text-slate-600">{t.learnBody}</p></div></div>
          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {articles.map((article,index)=><motion.button key={article.id} type="button" onClick={()=>openArticle(article)} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:index*.03}} className="group flex h-full flex-col rounded-3xl border border-purple-100 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <span className="w-fit rounded-full bg-purple-100 px-3 py-1 text-xs font-black text-purple-700">{article.category}</span>
              <h3 className="mt-4 text-lg font-black leading-6 text-slate-900">{article.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{article.summary}</p>
              <div className="mt-5 inline-flex items-center gap-2 font-black text-purple-600">{t.read}<ArrowRight size={16} className="transition group-hover:translate-x-1"/></div>
            </motion.button>)}
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-center gap-3"><Sparkles className="text-pink-600"/><div><h2 className="text-2xl font-black text-slate-900">{t.featured}</h2><p className="mt-1 text-slate-600">{t.therapistAidBody}</p></div></div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <a href="https://www.therapistaid.com/therapy-worksheet/coming-out-discussion-questions" target="_blank" rel="noopener noreferrer" className="rounded-3xl border border-purple-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><BookOpen className="text-purple-600"/><h3 className="mt-3 font-black text-slate-900">{t.therapistAid}: {t.comingOut}</h3><div className="mt-4 inline-flex items-center gap-2 text-sm font-black text-purple-600">{t.external}<ExternalLink size={15}/></div></a>
            <a href="https://www.therapistaid.com/tools/relationships" target="_blank" rel="noopener noreferrer" className="rounded-3xl border border-purple-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><Users className="text-blue-600"/><h3 className="mt-3 font-black text-slate-900">{t.therapistAid}: {t.relationshipTools}</h3><div className="mt-4 inline-flex items-center gap-2 text-sm font-black text-purple-600">{t.external}<ExternalLink size={15}/></div></a>
            <a href="https://lgbtqhealthcaredirectory.org/directory" target="_blank" rel="noopener noreferrer" className="rounded-3xl border border-purple-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><ShieldCheck className="text-emerald-600"/><h3 className="mt-3 font-black text-slate-900">{t.healthcare}</h3><div className="mt-4 inline-flex items-center gap-2 text-sm font-black text-purple-600">{t.external}<ExternalLink size={15}/></div></a>
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-center gap-3"><Globe2 className="text-blue-600"/><div><h2 className="text-2xl font-black text-slate-900">{t.resources}</h2><p className="mt-1 text-slate-600">{t.resourcesBody}</p></div></div>

          <div className="mt-5 rounded-3xl border border-purple-100 bg-white p-5 shadow-sm">
            <div className="grid gap-4 md:grid-cols-[1.5fr_1fr_1fr]">
              <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t.search} className="h-12 w-full rounded-2xl border border-slate-200 pl-11 pr-10 outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100"/>{search&&<button type="button" onClick={()=>setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X size={17}/></button>}</div>
              <label className="text-sm font-bold text-slate-700">{t.country}<select value={country} onChange={e=>setCountry(e.target.value)} className="mt-1 h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 font-medium text-slate-700">{lgbtqCountryOptions.map(item=><option key={item} value={item}>{localizeCountry(item)}</option>)}</select></label>
              <label className="text-sm font-bold text-slate-700">{t.language}<select value={serviceLanguage} onChange={e=>setServiceLanguage(e.target.value)} className="mt-1 h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 font-medium text-slate-700">{lgbtqLanguageOptions.map(item=><option key={item} value={item}>{item==='All'?t.all:localizeLanguage(item)}</option>)}</select></label>
            </div>
          </div>

          {filteredResources.length ? <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{filteredResources.map(resource=><a key={resource.id} href={resource.url} target="_blank" rel="noopener noreferrer" className="group rounded-3xl border border-purple-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-start justify-between gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-700"><Heart size={20}/></div><ExternalLink className="text-slate-300 transition group-hover:text-purple-500" size={18}/></div>
            <h3 className="mt-4 text-lg font-black leading-6 text-slate-900">{resource.name}</h3>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <div className="flex items-start gap-2"><MapPin className="mt-0.5 shrink-0 text-slate-400" size={16}/><span><strong>{t.location}:</strong> {resource.country} · {resource.city}</span></div>
              <div className="flex items-start gap-2"><Languages className="mt-0.5 shrink-0 text-slate-400" size={16}/><span><strong>{t.languages}:</strong> {resource.languages.map(localizeLanguage).join(', ')}</span></div>
              <div className="flex items-start gap-2"><ShieldCheck className="mt-0.5 shrink-0 text-slate-400" size={16}/><span><strong>{t.type}:</strong> {t.typeMap[resource.type] || resource.type}</span></div>
            </div>
            <div className="mt-5 inline-flex items-center gap-2 font-black text-purple-600">{t.visit}<ArrowRight size={16} className="transition group-hover:translate-x-1"/></div>
          </a>)}</div> : <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center font-semibold text-slate-600">{t.noResults}</div>}
        </section>

        <div className="mt-10 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950"><ShieldCheck className="mt-0.5 shrink-0" size={20}/><div><h3 className="font-black">{t.safetyTitle}</h3><p className="mt-1">{t.safety}</p></div></div>
      </div>
    </div>
  );
}
