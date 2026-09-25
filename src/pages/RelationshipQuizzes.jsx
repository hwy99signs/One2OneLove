import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Brain, Heart, MessageCircle, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/Layout';
import { createPageUrl } from '@/utils';
import { relationshipQuizLibrary } from '@/data/relationshipQuizLibrary';

const copy = {
  en: { title:'Relationship Quizzes', subtitle:'Useful self-reflection tools—not diagnoses or labels.', back:'Back to Support', start:'Start Quiz', questions:'questions', loveTitle:'Love Language Quiz', loveDesc:'Discover how you most naturally give and receive care.', scale:['Usually','Sometimes','Rarely'], next:'Next', finish:'See My Reflection', result:'Your Reflection', restart:'Take Again', library:'Back to Quizzes', note:'Answer based on what is generally true, not only your best or worst day.', disclaimer:'These quizzes are educational self-reflection tools. They are not clinical assessments and do not diagnose a relationship or a person.' },
  es: { title:'Cuestionarios de Relaciones', subtitle:'Herramientas útiles de autorreflexión, no diagnósticos ni etiquetas.', back:'Volver al Apoyo', start:'Comenzar', questions:'preguntas', loveTitle:'Cuestionario de Lenguajes del Amor', loveDesc:'Descubre cómo das y recibes afecto de forma más natural.', scale:['Normalmente','A veces','Rara vez'], next:'Siguiente', finish:'Ver Mi Reflexión', result:'Tu Reflexión', restart:'Hacer de Nuevo', library:'Volver a Cuestionarios', note:'Responde según lo que suele ser verdad, no solo tu mejor o peor día.', disclaimer:'Estos cuestionarios son herramientas educativas de autorreflexión. No son evaluaciones clínicas ni diagnostican una relación o persona.' },
  fr: { title:'Quiz Relationnels', subtitle:'Des outils utiles d’auto-réflexion, pas des diagnostics ni des étiquettes.', back:'Retour au Soutien', start:'Commencer', questions:'questions', loveTitle:'Quiz des Langages de l’Amour', loveDesc:'Découvrez comment vous donnez et recevez le plus naturellement de l’affection.', scale:['Habituellement','Parfois','Rarement'], next:'Suivant', finish:'Voir Ma Réflexion', result:'Votre Réflexion', restart:'Recommencer', library:'Retour aux Quiz', note:'Répondez selon ce qui est généralement vrai, pas seulement votre meilleur ou pire jour.', disclaimer:'Ces quiz sont des outils éducatifs d’auto-réflexion. Ils ne constituent pas des évaluations cliniques et ne diagnostiquent ni une relation ni une personne.' },
  it: { title:'Quiz sulle Relazioni', subtitle:'Strumenti utili di autoriflessione, non diagnosi o etichette.', back:'Torna al Supporto', start:'Inizia Quiz', questions:'domande', loveTitle:'Quiz dei Linguaggi dell’Amore', loveDesc:'Scopri come dai e ricevi affetto più naturalmente.', scale:['Di solito','A volte','Raramente'], next:'Avanti', finish:'Vedi la Mia Riflessione', result:'La Tua Riflessione', restart:'Rifai il Quiz', library:'Torna ai Quiz', note:'Rispondi in base a ciò che è generalmente vero, non solo al giorno migliore o peggiore.', disclaimer:'Questi quiz sono strumenti educativi di autoriflessione. Non sono valutazioni cliniche e non diagnosticano una relazione o una persona.' },
  de: { title:'Beziehungsquiz', subtitle:'Hilfreiche Selbstreflexion – keine Diagnosen oder Etiketten.', back:'Zurück zur Unterstützung', start:'Quiz Starten', questions:'Fragen', loveTitle:'Liebessprachen-Quiz', loveDesc:'Entdecke, wie du Fürsorge am natürlichsten gibst und empfängst.', scale:['Meistens','Manchmal','Selten'], next:'Weiter', finish:'Meine Reflexion Anzeigen', result:'Deine Reflexion', restart:'Noch Einmal', library:'Zurück zu den Quiz', note:'Antworte nach dem, was meistens zutrifft – nicht nur an deinem besten oder schlechtesten Tag.', disclaimer:'Diese Quiz dienen der pädagogischen Selbstreflexion. Sie sind keine klinischen Tests und diagnostizieren weder eine Beziehung noch eine Person.' },
};

const quizIcons = { communication: MessageCircle, conflict: Sparkles, relationship: ShieldCheck };
const quizGradients = { communication:'from-blue-500 to-cyan-500', conflict:'from-orange-500 to-rose-500', relationship:'from-purple-500 to-pink-500' };

export default function RelationshipQuizzes() {
  const { currentLanguage } = useLanguage();
  const t = copy[currentLanguage] || copy.en;
  const library = relationshipQuizLibrary[currentLanguage] || relationshipQuizLibrary.en;
  const [activeQuizId, setActiveQuizId] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.relationshipSubview !== 'quiz') {
      setActiveQuizId(null);
      setQuestionIndex(0);
      setScores([]);
      setComplete(false);
    }
  }, [location.key]);
  const [scores, setScores] = useState([]);
  const [complete, setComplete] = useState(false);

  const activeQuiz = activeQuizId ? library[activeQuizId] : null;
  const score = scores.reduce((sum, value) => sum + value, 0);
  const result = useMemo(() => {
    if (!activeQuiz || !complete) return null;
    return [...activeQuiz.results].sort((a,b) => b.min - a.min).find(item => score >= item.min) || activeQuiz.results[activeQuiz.results.length - 1];
  }, [activeQuiz, complete, score]);

  const startQuiz = (id) => {
    if (location.state?.relationshipSubview !== 'quiz') {
      navigate(location.pathname + location.search, {
        state: { ...(location.state || {}), relationshipSubview: 'quiz' },
      });
    }
    setActiveQuizId(id);
    setQuestionIndex(0);
    setScores([]);
    setComplete(false);
    window.scrollTo({ top:0, behavior:'smooth' });
  };

  const answer = (value) => {
    const nextScores = [...scores];
    nextScores[questionIndex] = value;
    setScores(nextScores);
    if (questionIndex >= activeQuiz.questions.length - 1) setComplete(true);
    else setQuestionIndex(index => index + 1);
  };

  const backToLibrary = () => {
    if (location.state?.relationshipSubview === 'quiz') {
      navigate(-1);
      return;
    }
    setActiveQuizId(null);
    setQuestionIndex(0);
    setScores([]);
    setComplete(false);
  };

  if (activeQuiz) {
    const Icon = quizIcons[activeQuizId] || Brain;
    const gradient = quizGradients[activeQuizId] || 'from-purple-500 to-pink-500';
    if (complete && result) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 px-4 py-12">
          <div className="mx-auto max-w-2xl rounded-3xl border border-purple-100 bg-white p-7 text-center shadow-xl sm:p-10">
            <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg`}><Icon size={32}/></div>
            <p className="mt-6 text-sm font-black uppercase tracking-wide text-purple-600">{t.result}</p>
            <h1 className="mt-2 text-3xl font-black text-slate-900">{result.title}</h1>
            <p className="mt-4 text-lg leading-8 text-slate-600">{result.body}</p>
            <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left text-sm leading-6 text-slate-600"><ShieldCheck className="mr-2 inline text-slate-500" size={17}/>{t.disclaimer}</div>
            <div className="mt-7 flex flex-wrap justify-center gap-3"><button type="button" onClick={() => startQuiz(activeQuizId)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 px-5 py-3 font-black text-white"><RotateCcw size={17}/>{t.restart}</button><button type="button" onClick={backToLibrary} className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700">{t.library}</button></div>
          </div>
        </div>
      );
    }

    const question = activeQuiz.questions[questionIndex];
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <button type="button" onClick={backToLibrary} className="mb-6 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 hover:bg-white"><ArrowLeft size={18}/>{t.library}</button>
          <div className="rounded-3xl border border-purple-100 bg-white p-6 shadow-xl sm:p-9">
            <div className="flex items-center justify-between gap-4"><div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white`}><Icon size={24}/></div><span className="rounded-full bg-purple-50 px-3 py-1.5 text-sm font-black text-purple-700">{questionIndex + 1}/{activeQuiz.questions.length}</span></div>
            <h1 className="mt-5 text-2xl font-black text-slate-900">{activeQuiz.title}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">{t.note}</p>
            <div className="mt-7 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full bg-gradient-to-r ${gradient} transition-all`} style={{ width:`${((questionIndex + 1) / activeQuiz.questions.length) * 100}%` }}/></div>
            <motion.div key={questionIndex} initial={{ opacity:0, x:12 }} animate={{ opacity:1, x:0 }} className="mt-8"><h2 className="text-xl font-bold leading-8 text-slate-900">{question}</h2><div className="mt-6 grid gap-3">{t.scale.map((label, index) => { const value = 2 - index; return <button key={label} type="button" onClick={() => answer(value)} className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left font-bold text-slate-700 transition hover:border-purple-300 hover:bg-purple-50"><span>{label}</span><ArrowRight className="text-slate-300 transition group-hover:text-purple-600" size={19}/></button>; })}</div></motion.div>
          </div>
        </div>
      </div>
    );
  }

  const quizEntries = Object.entries(library);
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <Link to={createPageUrl('CoupleSupport')} className="mb-6 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 hover:bg-white"><ArrowLeft size={18}/>{t.back}</Link>
        <div className="mb-10 text-center"><div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 text-white shadow-lg"><Brain size={32}/></div><h1 className="text-4xl font-black text-slate-900 md:text-5xl">{t.title}</h1><p className="mx-auto mt-3 max-w-3xl text-lg text-slate-600">{t.subtitle}</p></div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <Link to={createPageUrl('LoveLanguageQuiz')} className="group flex h-full flex-col rounded-3xl border border-pink-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 text-white"><Heart size={24}/></div><h2 className="mt-5 text-xl font-black text-slate-900">{t.loveTitle}</h2><p className="mt-3 flex-1 leading-6 text-slate-600">{t.loveDesc}</p><div className="mt-6 inline-flex items-center gap-2 font-black text-pink-600">{t.start}<ArrowRight size={17}/></div></Link>

          {quizEntries.map(([id, quiz]) => { const Icon = quizIcons[id] || Brain; const gradient = quizGradients[id] || 'from-purple-500 to-pink-500'; return <button key={id} type="button" onClick={() => startQuiz(id)} className="group flex h-full flex-col rounded-3xl border border-purple-100 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white`}><Icon size={24}/></div><h2 className="mt-5 text-xl font-black text-slate-900">{quiz.title}</h2><p className="mt-3 flex-1 leading-6 text-slate-600">{quiz.description}</p><p className="mt-4 text-xs font-semibold text-slate-400">{quiz.questions.length} {t.questions}</p><div className="mt-4 inline-flex items-center gap-2 font-black text-purple-600">{t.start}<ArrowRight size={17}/></div></button>; })}
        </div>

        <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm leading-6 text-slate-600"><ShieldCheck className="mr-2 inline text-slate-500" size={17}/>{t.disclaimer}</div>
      </div>
    </div>
  );
}
