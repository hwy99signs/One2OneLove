import React, { useMemo } from 'react';
import { BookOpen, Target, Calendar, ArrowRight, Heart, Brain, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/Layout';
import { createPageUrl } from '@/utils';
import { calendarDayDifference, parseLocalDate } from '@/utils/localDate';

const copy = {
  en: { journal:'Write Together', journalDesc:'Add a shared journal entry and capture what is on your minds.', goals:'Update a Goal', goalsDesc:'Choose one active relationship goal and move it forward together.', milestone:'Plan for a Milestone', milestoneDesc:'A special date is coming up. Decide how you want to mark it.', memory:'Capture a Memory', memoryDesc:'Save a meaningful moment from your relationship story.', quiz:'Take a Reflection Quiz', quizDesc:'Use a short relationship reflection to start a useful conversation.', communication:'Practice Communication', communicationDesc:'Work through a realistic scenario and compare how you would respond.', start:'Start', recommended:'Recommended', newLabel:'Try This' },
  es: { journal:'Escriban Juntos', journalDesc:'Añadan una entrada compartida y capturen lo que tienen en mente.', goals:'Actualizar una Meta', goalsDesc:'Elijan una meta activa y avancen juntos.', milestone:'Planear un Hito', milestoneDesc:'Se acerca una fecha especial. Decidan cómo quieren celebrarla.', memory:'Guardar un Recuerdo', memoryDesc:'Conserven un momento significativo de su historia.', quiz:'Hacer un Cuestionario', quizDesc:'Usa una breve reflexión para iniciar una conversación útil.', communication:'Practicar Comunicación', communicationDesc:'Trabajen un escenario realista y comparen cómo responderían.', start:'Comenzar', recommended:'Recomendado', newLabel:'Prueba Esto' },
  fr: { journal:'Écrire Ensemble', journalDesc:'Ajoutez une entrée partagée et notez ce qui vous traverse l’esprit.', goals:'Mettre à Jour un Objectif', goalsDesc:'Choisissez un objectif actif et faites-le avancer ensemble.', milestone:'Préparer un Jalón', milestoneDesc:'Une date spéciale approche. Décidez comment la marquer.', memory:'Créer un Souvenir', memoryDesc:'Conservez un moment important de votre histoire.', quiz:'Faire un Quiz de Réflexion', quizDesc:'Utilisez une courte réflexion pour lancer une conversation utile.', communication:'Pratiquer la Communication', communicationDesc:'Travaillez un scénario réaliste et comparez vos réponses.', start:'Commencer', recommended:'Recommandé', newLabel:'À Essayer' },
  it: { journal:'Scrivete Insieme', journalDesc:'Aggiungete una voce condivisa e annotate ciò che avete in mente.', goals:'Aggiorna un Obiettivo', goalsDesc:'Scegliete un obiettivo attivo e fatelo avanzare insieme.', milestone:'Pianifica un Traguardo', milestoneDesc:'Si avvicina una data speciale. Decidete come celebrarla.', memory:'Salva un Ricordo', memoryDesc:'Conservate un momento significativo della vostra storia.', quiz:'Fai un Quiz di Riflessione', quizDesc:'Usa una breve riflessione per iniziare una conversazione utile.', communication:'Pratica la Comunicazione', communicationDesc:'Affrontate uno scenario realistico e confrontate le risposte.', start:'Inizia', recommended:'Consigliato', newLabel:'Prova Questo' },
  de: { journal:'Gemeinsam Schreiben', journalDesc:'Erstellt einen gemeinsamen Journaleintrag und haltet fest, was euch beschäftigt.', goals:'Ein Ziel Aktualisieren', goalsDesc:'Wählt ein aktives Beziehungsziel und bringt es gemeinsam voran.', milestone:'Einen Meilenstein Planen', milestoneDesc:'Ein besonderer Termin steht bevor. Entscheidet, wie ihr ihn gestalten möchtet.', memory:'Eine Erinnerung Festhalten', memoryDesc:'Speichert einen bedeutungsvollen Moment eurer Beziehungsgeschichte.', quiz:'Reflexionsquiz Machen', quizDesc:'Nutzt eine kurze Reflexion als Einstieg in ein hilfreiches Gespräch.', communication:'Kommunikation Üben', communicationDesc:'Geht ein realistisches Szenario durch und vergleicht eure Reaktionen.', start:'Starten', recommended:'Empfohlen', newLabel:'Ausprobieren' },
};

export default function UpcomingActivities({ data }) {
  const { currentLanguage } = useLanguage();
  const t = copy[currentLanguage] || copy.en;

  const recommendations = useMemo(() => {
    const list = [];
    const goals = data.goals || [];
    const journals = data.journals || [];
    const milestones = data.milestones || [];
    const memories = data.memories || [];

    const activeGoals = goals.filter(goal => goal.status === 'in_progress' || goal.status === 'in progress');
    if (activeGoals.length) list.push({ name:t.goals, description:t.goalsDesc, icon:Target, link:'RelationshipGoals', gradient:'from-orange-500 to-red-500', badge:t.recommended, priority:10 });

    const upcoming = milestones.some(item => {
      const days = calendarDayDifference(item.date || item.milestone_date);
      return days !== null && days > 0 && days <= 30;
    });
    if (upcoming) list.push({ name:t.milestone, description:t.milestoneDesc, icon:Calendar, link:'RelationshipMilestones', gradient:'from-pink-500 to-purple-500', badge:t.recommended, priority:9 });

    const latestJournalDate = parseLocalDate(journals[0]?.entry_date);
    if (journals.length === 0 || !latestJournalDate || Date.now() - latestJournalDate.getTime() > 7 * 86400000) list.push({ name:t.journal, description:t.journalDesc, icon:BookOpen, link:'SharedJournals', gradient:'from-blue-500 to-cyan-500', badge:t.newLabel, priority:8 });
    if (memories.length < 3) list.push({ name:t.memory, description:t.memoryDesc, icon:Heart, link:'MemoryLane', gradient:'from-pink-500 to-rose-500', badge:t.newLabel, priority:7 });

    list.push({ name:t.communication, description:t.communicationDesc, icon:MessageCircle, link:'CommunicationPractice', gradient:'from-cyan-500 to-blue-600', badge:t.newLabel, priority:6 });
    list.push({ name:t.quiz, description:t.quizDesc, icon:Brain, link:'RelationshipQuizzes', gradient:'from-purple-500 to-pink-500', badge:t.newLabel, priority:5 });

    return list.sort((a,b) => b.priority - a.priority).slice(0,3);
  }, [data, currentLanguage]);

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {recommendations.map((activity,index) => {
        const Icon = activity.icon;
        return (
          <motion.div key={activity.name} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:index*0.05}}>
            <Link to={createPageUrl(activity.link)} className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-start justify-between gap-3"><div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${activity.gradient} text-white`}><Icon size={24}/></div><span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-black text-purple-700">{activity.badge}</span></div>
              <h3 className="mt-4 text-lg font-black text-slate-900">{activity.name}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{activity.description}</p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-black text-purple-600">{t.start}<ArrowRight size={16} className="transition group-hover:translate-x-1"/></div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
