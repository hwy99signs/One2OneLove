import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrainCircuit, ChevronRight, CreditCard, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from './Layout';
import { completeMyMatchIQAssessmentSession, createMyMatchIQAssessmentSession, getMyMatchIQAccess, getMyMatchIQLatestAssessmentSession, saveMyMatchIQAssessmentProgress } from '@/lib/aiService';
import { getAssessmentQuestions, MMIQ_DIMENSIONS, scoreAssessment } from '@/lib/mymatchiqAssessment';

const COPY={
 en:{eyebrow:'Bianca’s guided reflection',title:'Personality & Relationship Pattern Assessment',intro:'Answer at your own pace. The assessment combines structured reflection with your ongoing conversations with Bianca to build a more personalized report.',accuracy:'The more frequently you talk with Bianca, the more context she has. That can improve the accuracy and personalization of your Personality & Relationship Pattern Reports.',casual:'Casual talk with Bianca',start:'Begin my assessment',resume:'Resume my assessment',restart:'Start again',progress:'Question {current} of {total}',tier:'Assessment access',saving:'Saving…',saved:'Progress saved',local:'Account signup and a credit/debit card are required to begin.',card:'Sign Up + Add Card to Start',reportEyebrow:'Your structured starting point',reportTitle:'Assessment complete',reportBody:'These scores summarize only your structured answers. Bianca can combine them with your conversations to create a deeper evidence-grounded report.',talk:'Continue with Bianca',credits:'View MyMatchIQ credits',privacy:'For self-reflection only. This is not therapy, diagnosis, medical advice, or a guarantee of compatibility.',error:'Your answer was kept on screen, but progress could not be saved.'},
 es:{eyebrow:'Reflexión guiada por Bianca',title:'Evaluación de Patrones de Personalidad y Relaciones',intro:'Responde a tu propio ritmo. La evaluación combina reflexión estructurada con tus conversaciones continuas con Bianca para crear un informe más personalizado.',accuracy:'Cuanto más frecuentemente hables con Bianca, más contexto tendrá. Eso puede mejorar la precisión y personalización de tus Informes de Patrones de Personalidad y Relaciones.',casual:'Charla casual con Bianca',start:'Comenzar mi evaluación',resume:'Reanudar mi evaluación',restart:'Comenzar de nuevo',progress:'Pregunta {current} de {total}',tier:'Acceso a la evaluación',saving:'Guardando…',saved:'Progreso guardado',local:'Se requiere crear una cuenta y agregar una tarjeta de crédito/débito para comenzar.',card:'Registrarse + Agregar Tarjeta',reportEyebrow:'Tu punto de partida estructurado',reportTitle:'Evaluación completada',reportBody:'Estas puntuaciones resumen solo tus respuestas estructuradas. Bianca puede combinarlas con tus conversaciones para crear un informe más profundo basado en evidencia.',talk:'Continuar con Bianca',credits:'Ver créditos MyMatchIQ',privacy:'Solo para autorreflexión. No es terapia, diagnóstico, consejo médico ni garantía de compatibilidad.',error:'Tu respuesta se mantuvo en pantalla, pero no se pudo guardar el progreso.'},
 fr:{eyebrow:'Réflexion guidée par Bianca',title:'Évaluation des Schémas de Personnalité et de Relation',intro:'Répondez à votre rythme. L’évaluation combine une réflexion structurée avec vos conversations continues avec Bianca afin de produire un rapport plus personnalisé.',accuracy:'Plus vous parlez régulièrement avec Bianca, plus elle dispose de contexte. Cela peut améliorer la précision et la personnalisation de vos rapports.',casual:'Discussion décontractée avec Bianca',start:'Commencer mon évaluation',resume:'Reprendre mon évaluation',restart:'Recommencer',progress:'Question {current} sur {total}',tier:'Accès à l’évaluation',saving:'Enregistrement…',saved:'Progression enregistrée',local:'La création d’un compte et l’ajout d’une carte de crédit/débit sont requis pour commencer.',card:'S’inscrire + Ajouter une Carte',reportEyebrow:'Votre point de départ structuré',reportTitle:'Évaluation terminée',reportBody:'Ces scores résument uniquement vos réponses structurées. Bianca peut les combiner à vos conversations pour créer un rapport plus approfondi fondé sur les éléments disponibles.',talk:'Continuer avec Bianca',credits:'Voir les crédits MyMatchIQ',privacy:'Pour l’autoréflexion uniquement. Ceci n’est ni une thérapie, ni un diagnostic, ni un conseil médical, ni une garantie de compatibilité.',error:'Votre réponse reste affichée, mais la progression n’a pas pu être enregistrée.'},
 it:{eyebrow:'Riflessione guidata da Bianca',title:'Valutazione dei Pattern di Personalità e Relazione',intro:'Rispondi con i tuoi tempi. La valutazione combina una riflessione strutturata con le conversazioni continue con Bianca per creare un rapporto più personalizzato.',accuracy:'Più frequentemente parli con Bianca, più contesto avrà. Questo può migliorare l’accuratezza e la personalizzazione dei tuoi rapporti.',casual:'Conversazione informale con Bianca',start:'Inizia la mia valutazione',resume:'Riprendi la valutazione',restart:'Ricomincia',progress:'Domanda {current} di {total}',tier:'Accesso alla valutazione',saving:'Salvataggio…',saved:'Progresso salvato',local:'Per iniziare sono richiesti un account e una carta di credito/debito.',card:'Registrati + Aggiungi Carta',reportEyebrow:'Il tuo punto di partenza strutturato',reportTitle:'Valutazione completata',reportBody:'Questi punteggi riassumono solo le risposte strutturate. Bianca può combinarli con le tue conversazioni per creare un rapporto più profondo e basato sulle evidenze disponibili.',talk:'Continua con Bianca',credits:'Vedi crediti MyMatchIQ',privacy:'Solo per autoriflessione. Non è terapia, diagnosi, consiglio medico né garanzia di compatibilità.',error:'La risposta resta sullo schermo, ma non è stato possibile salvare il progresso.'},
 de:{eyebrow:'Biancas geführte Reflexion',title:'Assessment zu Persönlichkeits- und Beziehungsmustern',intro:'Antworten Sie in Ihrem eigenen Tempo. Das Assessment verbindet strukturierte Reflexion mit Ihren laufenden Gesprächen mit Bianca, um einen stärker personalisierten Bericht zu erstellen.',accuracy:'Je häufiger Sie mit Bianca sprechen, desto mehr Kontext hat sie. Das kann die Genauigkeit und Personalisierung Ihrer Berichte verbessern.',casual:'Lockeres Gespräch mit Bianca',start:'Assessment beginnen',resume:'Assessment fortsetzen',restart:'Neu beginnen',progress:'Frage {current} von {total}',tier:'Assessment-Zugang',saving:'Speichern…',saved:'Fortschritt gespeichert',local:'Zum Start sind ein Konto und eine Kredit-/Debitkarte erforderlich.',card:'Registrieren + Karte Hinzufügen',reportEyebrow:'Ihr strukturierter Ausgangspunkt',reportTitle:'Assessment abgeschlossen',reportBody:'Diese Werte fassen nur Ihre strukturierten Antworten zusammen. Bianca kann sie mit Ihren Gesprächen verbinden, um einen tieferen, evidenzbasierten Bericht zu erstellen.',talk:'Mit Bianca fortfahren',credits:'MyMatchIQ-Credits ansehen',privacy:'Nur zur Selbstreflexion. Keine Therapie, Diagnose, medizinische Beratung oder Kompatibilitätsgarantie.',error:'Ihre Antwort bleibt sichtbar, aber der Fortschritt konnte nicht gespeichert werden.'}
};

function normalizeTier(value){
 const raw=String(value||'free').toLowerCase();
 if(raw==='elite')return 'Elite';
 if(raw==='premier')return 'Premier';
 return 'Free';
}

export default function MyMatchIQAssessment(){
 const {currentLanguage}=useLanguage();
 const navigate=useNavigate();
 const {isAuthenticated}=useAuth();
 const t=COPY[currentLanguage]||COPY.en;
 const [tier,setTier]=useState('Free');
 const [cardReady,setCardReady]=useState(false);
 const [accessLoading,setAccessLoading]=useState(false);
 const questions=useMemo(()=>getAssessmentQuestions({language:currentLanguage,tier}),[currentLanguage,tier]);
 const [started,setStarted]=useState(false);
 const [sessionId,setSessionId]=useState(null);
 const [answers,setAnswers]=useState([]);
 const [saving,setSaving]=useState(false);
 const [saveError,setSaveError]=useState('');
 const complete=started&&answers.length>=questions.length;
 const scores=useMemo(()=>scoreAssessment(answers),[answers]);
 const dimensionMap=useMemo(()=>Object.fromEntries(MMIQ_DIMENSIONS.map(d=>[d.id,d.label[currentLanguage]||d.label.en])),[currentLanguage]);

 useEffect(()=>{ 
  if(!isAuthenticated){setTier('Free');setCardReady(false);setAccessLoading(false);return;} 
  let cancelled=false; 
  setAccessLoading(true);
  getMyMatchIQAccess()
    .then(access=>{if(!cancelled){setTier(normalizeTier(access?.tier));setCardReady(access?.card_on_file===true);}})
    .catch(()=>{if(!cancelled){setTier('Free');setCardReady(false);}})
    .finally(()=>{if(!cancelled)setAccessLoading(false);}); 
  return()=>{cancelled=true}; 
 },[isAuthenticated]);

 useEffect(()=>{ if(!isAuthenticated||!cardReady)return; let cancelled=false; (async()=>{ try{ const session=await getMyMatchIQLatestAssessmentSession(); if(cancelled||!session||session.status!=='in_progress')return; const existing=Array.isArray(session.answers)?session.answers:[]; if(existing.length<=questions.length){setSessionId(session.id);setAnswers(existing);setStarted(existing.length>0);} }catch{} })(); return()=>{cancelled=true}; },[isAuthenticated,cardReady,questions.length]);

 async function begin(){
  if(!isAuthenticated){
    navigate('/MyMatchIQ/SignUp?source=open-house-assessment&card=required');
    return;
  }
  if(!cardReady){
    navigate('/MyMatchIQ/Subscription?source=open-house-assessment&card=required&setup=required');
    return;
  }
  setAnswers([]);setSaveError('');setStarted(true);
  try{const session=await createMyMatchIQAssessmentSession({language:currentLanguage,tier});setSessionId(session?.id||null);}catch{setSaveError(t.error);}
 }

 async function pick(question,choiceIndex){
  const answer={questionId:question.id,dimension:question.dimension,facet:question.facet,choiceIndex,score:question.scores[choiceIndex],answeredAt:new Date().toISOString()};
  const next=[...answers,answer];
  setAnswers(next);
  if(!isAuthenticated||!sessionId)return;
  setSaving(true);setSaveError('');
  try{
   const dimensionScores=scoreAssessment(next);
   if(next.length>=questions.length)await completeMyMatchIQAssessmentSession(sessionId,{answers:next,dimensionScores,questionCount:next.length});
   else await saveMyMatchIQAssessmentProgress(sessionId,{answers:next,dimensionScores,questionCount:next.length});
  }catch{setSaveError(t.error);}finally{setSaving(false);}
 }

 const current=questions[Math.min(answers.length,Math.max(questions.length-1,0))];
 const reset=()=>begin();
 const casualHref=cardReady
  ? '/MyMatchIQ/Bianca'
  : isAuthenticated
    ? '/MyMatchIQ/Subscription?source=open-house-bianca&card=required&setup=required'
    : '/MyMatchIQ/SignUp?source=open-house-bianca&card=required';

 return <main className="min-h-screen bg-[#070312] px-4 py-10 text-white sm:px-6" style={{backgroundImage:'radial-gradient(circle at 16% 0%, #5b126f 0%, transparent 32%), radial-gradient(circle at 86% 20%, #162e78 0%, transparent 32%)'}}>
  <section className="mx-auto max-w-5xl">
   <div className="text-center">
    <img src="/assets/bianca-mymatchiq-portrait-v2.webp" alt="Bianca" className="mx-auto w-[168px] rounded-t-[1.25rem] border-x border-t border-white/20 object-contain object-bottom shadow-[0_12px_30px_rgba(18,5,35,0.35)] sm:w-[190px]"/>
    <p className="mt-5 text-xs font-black uppercase tracking-[0.22em] text-fuchsia-200">{t.eyebrow}</p>
    <h1 className="mx-auto mt-3 max-w-4xl text-4xl font-black sm:text-5xl">{t.title}</h1>
    <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-white/80">{t.intro}</p>
   </div>

   <div className="mx-auto mt-6 max-w-4xl rounded-2xl border border-cyan-200/25 bg-cyan-950/30 p-5 text-sm leading-6 text-cyan-50"><Sparkles className="mb-2 h-5 w-5"/>{t.accuracy}<div className="mt-4"><Link to={casualHref} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 py-3 font-black text-white"><MessageCircle className="h-4 w-4"/>{t.casual}{!cardReady&&<CreditCard className="h-4 w-4"/>}</Link></div></div>
   <div className="mx-auto mt-4 flex max-w-4xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/[0.05] px-5 py-4 text-sm"><span><strong>{t.tier}:</strong> {tier}</span><span>{questions.length} questions</span><span className={saving?'text-amber-200':'text-cyan-200'}>{saving?t.saving:(cardReady?t.saved:t.local)}</span></div>

   {!started&&<section className="mx-auto mt-7 max-w-4xl rounded-[1.75rem] border border-fuchsia-200/25 bg-black/35 p-7 text-center shadow-xl backdrop-blur"><BrainCircuit className="mx-auto h-10 w-10 text-fuchsia-200"/><p className="mt-4 text-white/75">{t.privacy}</p><button type="button" onClick={begin} disabled={accessLoading} className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 via-pink-500 to-violet-600 px-7 py-3 font-black shadow-lg disabled:opacity-60">{!cardReady&&<CreditCard className="h-4 w-4"/>}{cardReady?(answers.length?t.resume:t.start):t.card}</button></section>}

   {started&&!complete&&current&&<section className="mx-auto mt-7 max-w-4xl overflow-hidden rounded-[1.75rem] border border-fuchsia-200/25 bg-black/35 shadow-2xl backdrop-blur">
    <div className="p-6 sm:p-9">
     <div className="flex items-center justify-between gap-3 text-sm font-bold text-fuchsia-100"><span>{t.progress.replace('{current}',String(answers.length+1)).replace('{total}',String(questions.length))}</span><span>{Math.round((answers.length/questions.length)*100)}%</span></div>
     <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400 transition-all" style={{width:`${(answers.length/questions.length)*100}%`}}/></div>
     <p className="mt-7 text-xs font-black uppercase tracking-[0.18em] text-cyan-200">{dimensionMap[current.dimension]}</p>
     <h2 className="mt-3 text-2xl font-black leading-snug sm:text-3xl">{current.prompt}</h2>
     <div className="mt-6 grid gap-3">{current.choices.map((choice,choiceIndex)=><button key={choice} type="button" onClick={()=>pick(current,choiceIndex)} className="group flex items-center justify-between rounded-2xl border border-white/20 bg-white/[0.06] px-5 py-4 text-left text-base font-semibold text-white transition hover:border-fuchsia-200 hover:bg-fuchsia-500/15"><span>{choice}</span><ChevronRight className="h-5 w-5 text-fuchsia-200 transition group-hover:translate-x-1"/></button>)}</div>
     {saveError&&<p className="mt-4 rounded-xl border border-amber-200/25 bg-amber-950/25 p-3 text-sm text-amber-50">{saveError}</p>}
    </div>
   </section>}

   {complete&&<section className="mx-auto mt-7 max-w-5xl rounded-[1.75rem] border border-fuchsia-200/25 bg-black/35 p-6 shadow-2xl backdrop-blur sm:p-9">
    <p className="text-xs font-black uppercase tracking-[0.2em] text-fuchsia-200">{t.reportEyebrow}</p><h2 className="mt-3 text-3xl font-black sm:text-4xl">{t.reportTitle}</h2><p className="mt-4 max-w-3xl text-lg leading-8 text-white/80">{t.reportBody}</p>
    <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(scores).map(([dimension,score])=><article key={dimension} className="rounded-2xl border border-white/15 bg-white/[0.06] p-5"><p className="text-sm font-black text-fuchsia-100">{dimensionMap[dimension]||dimension}</p><div className="mt-3 flex items-end gap-2"><span className="text-3xl font-black">{score}</span><span className="pb-1 text-sm text-white/50">/100</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400" style={{width:`${score}%`}}/></div></article>)}</div>
    <div className="mt-7 flex flex-wrap gap-3"><Link to="/MyMatchIQ/Bianca" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 py-3 text-sm font-black"><MessageCircle className="h-4 w-4"/>{t.talk}</Link><Link to="/MyMatchIQ/Credits" className="rounded-full border border-white/30 bg-white/10 px-5 py-3 text-sm font-black">{t.credits}</Link><button type="button" onClick={reset} className="rounded-full border border-white/20 bg-white/[0.06] px-5 py-3 text-sm font-black">{t.restart}</button></div>
   </section>}

   <div className="mx-auto mt-6 flex max-w-4xl items-start gap-3 rounded-2xl border border-white/15 bg-white/[0.04] p-4 text-sm leading-6 text-white/65"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-200"/>{t.privacy}</div>
  </section>
 </main>;
}
