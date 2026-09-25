import React, { useMemo, useState } from 'react';
import { ArrowRight, Brain, FileText, Heart, MessageCircle, Mic, Rainbow, Search, Target, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/Layout';
import { createPageUrl } from '@/utils';

const copy = {
  en: {
    title:'Relationship Support', subtitle:'Practical tools and learning resources to help relationships grow stronger.', search:'Search support resources…', all:'All', interactive:'Interactive Tools', learning:'Learning Content', explore:'Explore', clearSearch:'Clear support search',
    goals:['Relationship Goals','Set meaningful goals and track progress together.'], quizzes:['Relationship Quizzes','Use self-reflection quizzes to better understand communication, conflict and relationship patterns.'], communication:['Communication Practice','Practice healthier responses in realistic relationship scenarios.'], articles:['Relationship Library','Read practical One2OneLove articles on communication, trust, dating, marriage and repair.'], podcasts:['Podcasts','Explore relationship podcasts and conversations across key relationship topics.'], lgbtq:['LGBTQ+ Support','Affirming articles, relationship guidance and an international LGBTQ+ support directory.'],
    cta:'Start with one thing you can use today.', ctaBody:'You do not need to fix everything at once. Choose the tool that matches what your relationship needs right now.'
  },
  es: {
    title:'Apoyo para Relaciones', subtitle:'Herramientas prácticas y recursos para ayudar a fortalecer las relaciones.', search:'Buscar recursos de apoyo…', all:'Todos', interactive:'Herramientas Interactivas', learning:'Contenido de Aprendizaje', explore:'Explorar', clearSearch:'Borrar búsqueda de apoyo',
    goals:['Metas de Relación','Establezcan metas significativas y sigan el progreso juntos.'], quizzes:['Cuestionarios de Relaciones','Usa cuestionarios de autorreflexión para comprender mejor la comunicación, el conflicto y los patrones de relación.'], communication:['Práctica de Comunicación','Practica respuestas más saludables en escenarios realistas de relación.'], articles:['Biblioteca de Relaciones','Lee artículos prácticos de One2OneLove sobre comunicación, confianza, citas, matrimonio y reparación.'], podcasts:['Podcasts','Explora podcasts y conversaciones sobre temas importantes de relaciones.'], lgbtq:['Apoyo LGBTQ+','Artículos afirmativos, orientación de relaciones y un directorio internacional de apoyo LGBTQ+.'],
    cta:'Empieza con una cosa que puedas usar hoy.', ctaBody:'No tienes que arreglarlo todo de una vez. Elige la herramienta que coincida con lo que tu relación necesita ahora.'
  },
  fr: {
    title:'Soutien aux Relations', subtitle:'Des outils pratiques et des ressources pour aider les relations à se renforcer.', search:'Rechercher des ressources…', all:'Tous', interactive:'Outils Interactifs', learning:'Contenu d’Apprentissage', explore:'Explorer', clearSearch:'Effacer la recherche d’aide',
    goals:['Objectifs de Relation','Fixez des objectifs significatifs et suivez vos progrès ensemble.'], quizzes:['Quiz Relationnels','Utilisez des quiz d’auto-réflexion pour mieux comprendre communication, conflit et schémas relationnels.'], communication:['Pratique de Communication','Entraînez-vous à des réponses plus saines dans des scénarios réalistes.'], articles:['Bibliothèque des Relations','Lisez des articles pratiques One2OneLove sur la communication, la confiance, les rencontres, le mariage et la réparation.'], podcasts:['Podcasts','Explorez des podcasts et conversations sur les grands sujets relationnels.'], lgbtq:['Soutien LGBTQ+','Articles affirmatifs, soutien relationnel et annuaire international de ressources LGBTQ+.'],
    cta:'Commencez par une chose utile aujourd’hui.', ctaBody:'Vous n’avez pas besoin de tout résoudre en même temps. Choisissez l’outil qui correspond au besoin actuel de votre relation.'
  },
  it: {
    title:'Supporto per le Relazioni', subtitle:'Strumenti pratici e risorse per aiutare le relazioni a diventare più forti.', search:'Cerca risorse di supporto…', all:'Tutti', interactive:'Strumenti Interattivi', learning:'Contenuti di Apprendimento', explore:'Esplora', clearSearch:'Cancella ricerca di supporto',
    goals:['Obiettivi di Relazione','Stabilite obiettivi significativi e seguite insieme i progressi.'], quizzes:['Quiz sulle Relazioni','Usa quiz di autoriflessione per comprendere meglio comunicazione, conflitto e schemi relazionali.'], communication:['Pratica di Comunicazione','Esercitati con risposte più sane in scenari realistici.'], articles:['Biblioteca delle Relazioni','Leggi articoli pratici One2OneLove su comunicazione, fiducia, incontri, matrimonio e riparazione.'], podcasts:['Podcasts','Esplora podcast e conversazioni sui principali temi relazionali.'], lgbtq:['Supporto LGBTQ+','Articoli affermativi, guida relazionale e directory internazionale di supporto LGBTQ+.'],
    cta:'Inizia con una cosa che puoi usare oggi.', ctaBody:'Non devi sistemare tutto in una volta. Scegli lo strumento che corrisponde a ciò di cui la tua relazione ha bisogno adesso.'
  },
  de: {
    title:'Beziehungsunterstützung', subtitle:'Praktische Werkzeuge und Lernressourcen, die Beziehungen stärken können.', search:'Unterstützungsressourcen suchen…', all:'Alle', interactive:'Interaktive Werkzeuge', learning:'Lerninhalte', explore:'Öffnen', clearSearch:'Support-Suche löschen',
    goals:['Beziehungsziele','Setzt sinnvolle Ziele und verfolgt euren Fortschritt gemeinsam.'], quizzes:['Beziehungsquiz','Nutze Selbstreflexionsquiz, um Kommunikation, Konflikt und Beziehungsmuster besser zu verstehen.'], communication:['Kommunikationspraxis','Übe gesündere Reaktionen in realistischen Beziehungssituationen.'], articles:['Beziehungsbibliothek','Lies praktische One2OneLove-Artikel zu Kommunikation, Vertrauen, Dating, Ehe und Reparatur.'], podcasts:['Podcasts','Entdecke Podcasts und Gespräche zu wichtigen Beziehungsthemen.'], lgbtq:['LGBTQ+ Unterstützung','Affirmative Artikel, Beziehungsunterstützung und ein internationales LGBTQ+ Hilfsverzeichnis.'],
    cta:'Beginne mit einer Sache, die du heute nutzen kannst.', ctaBody:'Du musst nicht alles auf einmal lösen. Wähle das Werkzeug, das zu dem passt, was deine Beziehung gerade braucht.'
  },
};

export default function CoupleSupport() {
  const { currentLanguage } = useLanguage();
  const t = copy[currentLanguage] || copy.en;
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const resources = [
    { id:'goals', type:'interactive', icon:Target, label:t.goals, link:'RelationshipGoals', gradient:'from-pink-500 to-rose-500' },
    { id:'quizzes', type:'interactive', icon:Brain, label:t.quizzes, link:'RelationshipQuizzes', gradient:'from-purple-500 to-violet-500' },
    { id:'communication', type:'interactive', icon:MessageCircle, label:t.communication, link:'CommunicationPractice', gradient:'from-cyan-500 to-blue-500' },
    { id:'articles', type:'learning', icon:FileText, label:t.articles, link:'ArticlesSupport', gradient:'from-blue-500 to-indigo-500' },
    { id:'podcasts', type:'learning', icon:Mic, label:t.podcasts, link:'PodcastsSupport', gradient:'from-orange-500 to-amber-500' },
    { id:'lgbtq', type:'learning', icon:Rainbow, label:t.lgbtq, link:'LGBTQSupport', gradient:'from-pink-500 via-purple-500 to-blue-500' },
  ];

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return resources.filter(item => (filter === 'all' || item.type === filter) && (!term || `${item.label[0]} ${item.label[1]}`.toLowerCase().includes(term)));
  }, [filter, search, currentLanguage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 px-4 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 text-white shadow-lg"><Heart size={31}/></div>
          <h1 className="text-4xl font-black text-slate-900 md:text-5xl">{t.title}</h1>
          <p className="mx-auto mt-3 max-w-3xl text-lg leading-7 text-slate-600">{t.subtitle}</p>
        </div>

        <div className="mx-auto mb-8 max-w-3xl rounded-3xl border border-purple-100 bg-white p-5 shadow-sm">
          <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={19}/><input value={search} onChange={event => setSearch(event.target.value)} placeholder={t.search} className="h-12 w-full rounded-2xl border border-slate-200 pl-11 pr-11 outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100"/>{search && <button type="button" onClick={() => setSearch('')} aria-label={t.clearSearch} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"><X size={18}/></button>}</div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">{[['all',t.all],['interactive',t.interactive],['learning',t.learning]].map(([id,label]) => <button key={id} type="button" onClick={() => setFilter(id)} className={`rounded-full px-4 py-2 text-sm font-bold ${filter === id ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>{label}</button>)}</div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item,index) => { const Icon=item.icon; return <motion.div key={item.id} initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:index*0.04}}><Link to={createPageUrl(item.link)} className="group flex h-full flex-col rounded-3xl border border-purple-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${item.gradient} text-white shadow-sm`}><Icon size={27}/></div><h2 className="mt-5 text-xl font-black text-slate-900">{item.label[0]}</h2><p className="mt-3 flex-1 leading-7 text-slate-600">{item.label[1]}</p><div className="mt-5 inline-flex items-center gap-2 font-black text-purple-600">{t.explore}<ArrowRight size={17} className="transition group-hover:translate-x-1"/></div></Link></motion.div>; })}
        </div>

        <div className="mt-10 rounded-3xl bg-gradient-to-r from-purple-600 to-pink-600 p-8 text-center text-white shadow-lg"><h2 className="text-2xl font-black">{t.cta}</h2><p className="mx-auto mt-2 max-w-3xl text-white/90">{t.ctaBody}</p></div>
      </div>
    </div>
  );
}
