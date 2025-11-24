import React, { useState } from "react";
import { Heart, MessageCircle, Gift, Clock, Hand, ChevronRight, ChevronLeft, Share2, RotateCcw, Save, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { saveLoveLanguage } from "@/lib/profileService";
import { toast } from "sonner";

const translations = {
  en: {
    quiz: {
      title: "Love Language Quiz",
      subtitle: "Discover how you prefer to give and receive love",
      questionOf: "Question",
      of: "of",
      previous: "Previous Question",
      restart: "Restart Quiz",
      yourLoveLanguage: "Your Love Language",
      whatThisMeans: "What This Means:",
      shareResult: "Share this result with your partner to help them understand how you feel most loved",
      encouragePartner: "Encourage your partner to take the quiz too so you can better understand each other",
      useInsight: "Use this insight to strengthen your relationship and show love in ways that truly matter",
      takeAgain: "Take Quiz Again",
      shareResults: "Share Results"
    },
    loveLanguages: {
      words: { name: "Words of Affirmation", description: "You feel most loved when your partner expresses affection through spoken or written words of appreciation, encouragement, and compliments." },
      quality: { name: "Quality Time", description: "You feel most loved when your partner gives you their undivided attention and spends meaningful time together without distractions." },
      gifts: { name: "Receiving Gifts", description: "You feel most loved when your partner gives you thoughtful presents that show they were thinking of you and understand what you value." },
      service: { name: "Acts of Service", description: "You feel most loved when your partner does helpful things for you to make your life easier and shows love through actions." },
      touch: { name: "Physical Touch", description: "You feel most loved through physical affection like hugs, kisses, holding hands, and other forms of tender touch." }
    },
    questions: [
      { question: "What makes you feel most appreciated by your partner?", options: ["When they tell me they love me and appreciate me", "When they set aside time just for us", "When they surprise me with a thoughtful gift", "When they help me with tasks or chores", "When they hold my hand or give me a hug"] },
      { question: "Which would mean the most to you?", options: ["A heartfelt letter expressing their love", "A day planned just for the two of us", "Something you've been wanting for a while", "Your partner taking care of a task you've been dreading", "A long, warm embrace"] },
      { question: "What would hurt your feelings the most?", options: ["If they criticized you or said something harsh", "If they were too busy to spend time with you", "If they forgot an important occasion like your birthday", "If they never helped around the house", "If they pulled away when you tried to be affectionate"] },
      { question: "How do you prefer to show love to others?", options: ["By telling them how much they mean to me", "By spending quality time with them", "By giving them meaningful gifts", "By doing things to help them", "Through hugs, kisses, and physical closeness"] },
      { question: "What would be your ideal evening with your partner?", options: ["Deep conversation about our feelings and dreams", "Uninterrupted time together doing something we both enjoy", "Exchanging thoughtful surprises", "Tackling a project or task together as a team", "Cuddling on the couch"] },
      { question: "When you're feeling down, what helps you feel better?", options: ["Hearing encouraging words and affirmations", "Having someone sit with you and listen", "Receiving a small token of care", "Someone taking care of tasks so you can rest", "A comforting hug or physical comfort"] },
      { question: "What's your favorite way to celebrate a special occasion?", options: ["Exchanging heartfelt messages and toasts", "Spending the entire day together", "Giving and receiving meaningful presents", "Planning and organizing everything perfectly", "Lots of affectionate moments and closeness"] },
      { question: "Which absence would bother you most in a relationship?", options: ["Lack of verbal appreciation and compliments", "Not spending enough quality time together", "Never receiving thoughtful gifts or surprises", "Partner not helping with responsibilities", "Lack of physical affection and touch"] },
      { question: "How do you know your partner truly cares about you?", options: ["When they express their feelings with words", "When they make time for you no matter how busy", "When they remember little things you mentioned wanting", "When they notice what needs doing and just do it", "When they're physically affectionate without being asked"] },
      { question: "What makes you feel most secure in your relationship?", options: ["Regular verbal reassurance of their love", "Consistent quality time spent together", "Thoughtful gestures and meaningful tokens", "Reliable help and support in daily life", "Regular physical connection and affection"] },
      { question: "Which would make you feel most valued at work or home?", options: ["Recognition and praise for your efforts", "Undivided attention during conversations", "A thoughtful gift or token of appreciation", "Help with a difficult task or project", "A pat on the back or supportive touch"] },
      { question: "What's your preferred way to apologize or make amends?", options: ["With sincere words and heartfelt apologies", "By dedicating time to talk things through", "With a peace offering or make-up gift", "By doing something helpful to make up for it", "With a hug and physical reconciliation"] },
      { question: "When planning a date, what matters most to you?", options: ["That we talk and connect emotionally", "That we have uninterrupted time together", "That there's a thoughtful surprise element", "That everything is organized and runs smoothly", "That there's opportunity for closeness and affection"] },
      { question: "What would be the perfect way to end a great day?", options: ["My partner telling me what they loved about our day", "Reflecting on our time together over conversation", "Finding a small surprise waiting for me", "Coming home to find chores already done", "Falling asleep in each other's arms"] },
      { question: "Which relationship advice resonates most with you?", options: ["'Tell your partner you love them every day'", "'Make time for regular date nights'", "'Surprise your partner with thoughtful gestures'", "'Share responsibilities and support each other'", "'Never underestimate the power of a hug'"] }
    ]
  },
  es: {
    quiz: {
      title: "Quiz de Lenguaje del Amor",
      subtitle: "Descubre cómo prefieres dar y recibir amor",
      questionOf: "Pregunta",
      of: "de",
      previous: "Pregunta Anterior",
      restart: "Reiniciar Quiz",
      yourLoveLanguage: "Tu Lenguaje del Amor",
      whatThisMeans: "Lo Que Esto Significa:",
      shareResult: "Comparte este resultado con tu pareja para ayudarle a entender cómo te sientes más amado/a",
      encouragePartner: "Anima a tu pareja a hacer el quiz también para que puedan entenderse mejor",
      useInsight: "Usa esta perspectiva para fortalecer tu relación y mostrar amor de maneras que realmente importan",
      takeAgain: "Hacer el Quiz Otra Vez",
      shareResults: "Compartir Resultados"
    },
    loveLanguages: {
      words: { name: "Palabras de Afirmación", description: "Te sientes más amado/a cuando tu pareja expresa afecto a través de palabras habladas o escritas de apreciación, aliento y cumplidos." },
      quality: { name: "Tiempo de Calidad", description: "Te sientes más amado/a cuando tu pareja te da su atención completa y pasa tiempo significativo juntos sin distracciones." },
      gifts: { name: "Recibir Regalos", description: "Te sientes más amado/a cuando tu pareja te da regalos pensados que muestran que estaba pensando en ti y entiende lo que valoras." },
      service: { name: "Actos de Servicio", description: "Te sientes más amado/a cuando tu pareja hace cosas útiles por ti para hacer tu vida más fácil y muestra amor a través de acciones." },
      touch: { name: "Contacto Físico", description: "Te sientes más amado/a a través del afecto físico como abrazos, besos, tomarse de la mano y otras formas de contacto tierno." }
    },
    questions: [
      { question: "¿Qué te hace sentir más apreciado/a por tu pareja?", options: ["Cuando me dicen que me aman y me aprecian", "Cuando reservan tiempo solo para nosotros", "Cuando me sorprenden con un regalo pensado", "Cuando me ayudan con tareas o quehaceres", "Cuando me toman de la mano o me dan un abrazo"] },
      { question: "¿Qué significaría más para ti?", options: ["Una carta sincera expresando su amor", "Un día planeado solo para los dos", "Algo que has estado queriendo por un tiempo", "Que tu pareja se encargue de una tarea que has estado temiendo", "Un abrazo largo y cálido"] },
      { question: "¿Qué heriría más tus sentimientos?", options: ["Si te criticaran o dijeran algo duro", "Si estuvieran demasiado ocupados para pasar tiempo contigo", "Si olvidaran una ocasión importante como tu cumpleaños", "Si nunca ayudaran en la casa", "Si se alejaran cuando intentas ser afectuoso/a"] },
      { question: "¿Cómo prefieres mostrar amor a otros?", options: ["Diciéndoles cuánto significan para mí", "Pasando tiempo de calidad con ellos", "Dándoles regalos significativos", "Haciendo cosas para ayudarles", "A través de abrazos, besos y cercanía física"] },
      { question: "¿Cuál sería tu tarde ideal con tu pareja?", options: ["Conversación profunda sobre nuestros sentimientos y sueños", "Tiempo ininterrumpido juntos haciendo algo que ambos disfrutamos", "Intercambiando sorpresas pensadas", "Abordando un proyecto o tarea juntos como equipo", "Acurrucándose en el sofá"] },
      { question: "Cuando te sientes deprimido/a, ¿qué te ayuda a sentirte mejor?", options: ["Escuchar palabras de aliento y afirmaciones", "Que alguien se siente contigo y escuche", "Recibir un pequeño token de cuidado", "Que alguien se encargue de tareas para que puedas descansar", "Un abrazo reconfortante o consuelo físico"] },
      { question: "¿Cuál es tu forma favorita de celebrar una ocasión especial?", options: ["Intercambiando mensajes sinceros y brindis", "Pasando todo el día juntos", "Dando y recibiendo regalos significativos", "Planificando y organizando todo perfectamente", "Muchos momentos afectuosos y cercanía"] },
      { question: "¿Qué ausencia te molestaría más en una relación?", options: ["Falta de apreciación verbal y cumplidos", "No pasar suficiente tiempo de calidad juntos", "Nunca recibir regalos pensados o sorpresas", "Pareja no ayudando con responsabilidades", "Falta de afecto físico y contacto"] },
      { question: "¿Cómo sabes que tu pareja realmente se preocupa por ti?", options: ["Cuando expresan sus sentimientos con palabras", "Cuando hacen tiempo para ti sin importar lo ocupados que estén", "Cuando recuerdan pequeñas cosas que mencionaste querer", "Cuando notan lo que hay que hacer y simplemente lo hacen", "Cuando son físicamente afectuosos sin que se les pida"] },
      { question: "¿Qué te hace sentir más seguro/a en tu relación?", options: ["Reafirmación verbal regular de su amor", "Tiempo de calidad consistente pasado juntos", "Gestos pensados y tokens significativos", "Ayuda y apoyo confiable en la vida diaria", "Conexión física regular y afecto"] },
      { question: "¿Qué te haría sentir más valorado/a en el trabajo o en casa?", options: ["Reconocimiento y elogio por tus esfuerzos", "Atención completa durante conversaciones", "Un regalo pensado o token de apreciación", "Ayuda con una tarea o proyecto difícil", "Una palmadita en la espalda o toque de apoyo"] },
      { question: "¿Cuál es tu forma preferida de disculparte o hacer las paces?", options: ["Con palabras sinceras y disculpas sentidas", "Dedicando tiempo para hablar las cosas", "Con una ofrenda de paz o regalo de reconciliación", "Haciendo algo útil para compensar", "Con un abrazo y reconciliación física"] },
      { question: "Al planificar una cita, ¿qué te importa más?", options: ["Que hablemos y conectemos emocionalmente", "Que tengamos tiempo ininterrumpido juntos", "Que haya un elemento de sorpresa pensado", "Que todo esté organizado y funcione sin problemas", "Que haya oportunidad para cercanía y afecto"] },
      { question: "¿Cuál sería la forma perfecta de terminar un gran día?", options: ["Mi pareja diciéndome lo que amó de nuestro día", "Reflexionando sobre nuestro tiempo juntos durante la conversación", "Encontrando una pequeña sorpresa esperándome", "Llegando a casa para encontrar las tareas ya hechas", "Durmiéndonos en los brazos del otro"] },
      { question: "¿Qué consejo de relación resuena más contigo?", options: ["'Dile a tu pareja que la amas todos los días'", "'Haz tiempo para citas nocturnas regulares'", "'Sorprende a tu pareja con gestos pensados'", "'Comparte responsabilidades y apóyense mutuamente'", "'Nunca subestimes el poder de un abrazo'"] }
    ]
  },
  fr: {
    quiz: {
      title: "Quiz sur les Langages d'Amour",
      subtitle: "Découvrez comment vous préférez donner et recevoir de l'amour",
      questionOf: "Question",
      of: "sur",
      previous: "Question Précédente",
      restart: "Recommencer le Quiz",
      yourLoveLanguage: "Votre Langage d'Amour",
      whatThisMeans: "Ce Que Cela Signifie:",
      shareResult: "Partagez ce résultat avec votre partenaire pour l'aider à comprendre comment vous vous sentez le plus aimé(e)",
      encouragePartner: "Encouragez votre partenaire à faire le quiz aussi pour mieux vous comprendre",
      useInsight: "Utilisez cette perspicacité pour renforcer votre relation et montrer l'amour de manières qui comptent vraiment",
      takeAgain: "Refaire le Quiz",
      shareResults: "Partager les Résultats"
    },
    loveLanguages: {
      words: { name: "Paroles Valorisantes", description: "Vous vous sentez le plus aimé(e) lorsque votre partenaire exprime son affection par des mots parlés ou écrits d'appréciation, d'encouragement et de compliments." },
      quality: { name: "Moments de Qualité", description: "Vous vous sentez le plus aimé(e) lorsque votre partenaire vous accorde toute son attention et passe du temps significatif ensemble sans distractions." },
      gifts: { name: "Recevoir des Cadeaux", description: "Vous vous sentez le plus aimé(e) lorsque votre partenaire vous offre des cadeaux réfléchis qui montrent qu'il pensait à vous et comprend ce que vous appréciez." },
      service: { name: "Services Rendus", description: "Vous vous sentez le plus aimé(e) lorsque votre partenaire fait des choses utiles pour vous faciliter la vie et montre l'amour par des actions." },
      touch: { name: "Toucher Physique", description: "Vous vous sentez le plus aimé(e) par l'affection physique comme les câlins, les baisers, se tenir la main et d'autres formes de toucher tendre." }
    },
    questions: [
      { question: "Qu'est-ce qui vous fait vous sentir le plus apprécié(e) par votre partenaire?", options: ["Quand ils me disent qu'ils m'aiment et m'apprécient", "Quand ils réservent du temps juste pour nous", "Quand ils me surprennent avec un cadeau réfléchi", "Quand ils m'aident avec des tâches ou des corvées", "Quand ils me tiennent la main ou me font un câlin"] },
      { question: "Qu'est-ce qui signifierait le plus pour vous?", options: ["Une lettre sincère exprimant leur amour", "Une journée planifiée juste pour nous deux", "Quelque chose que vous vouliez depuis un moment", "Votre partenaire s'occupant d'une tâche que vous redoutiez", "Une longue et chaleureuse étreinte"] },
      { question: "Qu'est-ce qui blesserait le plus vos sentiments?", options: ["S'ils vous critiquaient ou disaient quelque chose de dur", "S'ils étaient trop occupés pour passer du temps avec vous", "S'ils oubliaient une occasion importante comme votre anniversaire", "S'ils n'aidaient jamais à la maison", "S'ils se retiraient quand vous essayiez d'être affectueux/se"] },
      { question: "Comment préférez-vous montrer de l'amour aux autres?", options: ["En leur disant combien ils comptent pour moi", "En passant du temps de qualité avec eux", "En leur offrant des cadeaux significatifs", "En faisant des choses pour les aider", "Par des câlins, des baisers et de la proximité physique"] },
      { question: "Quelle serait votre soirée idéale avec votre partenaire?", options: ["Conversation profonde sur nos sentiments et nos rêves", "Temps ininterrompu ensemble à faire quelque chose que nous aimons tous les deux", "Échanger des surprises réfléchies", "Aborder un projet ou une tâche ensemble en équipe", "Se blottir sur le canapé"] },
      { question: "Quand vous vous sentez déprimé(e), qu'est-ce qui vous aide à vous sentir mieux?", options: ["Entendre des mots d'encouragement et d'affirmations", "Avoir quelqu'un qui s'assoit avec vous et écoute", "Recevoir un petit gage d'attention", "Quelqu'un qui s'occupe des tâches pour que vous puissiez vous reposer", "Un câlin réconfortant ou un réconfort physique"] },
      { question: "Quelle est votre façon préférée de célébrer une occasion spéciale?", options: ["Échanger des messages sincères et des toasts", "Passer toute la journée ensemble", "Donner et recevoir des cadeaux significatifs", "Tout planifier et organiser parfaitement", "Beaucoup de moments affectueux et de proximité"] },
      { question: "Quelle absence vous dérangerait le plus dans une relation?", options: ["Manque d'appréciation verbale et de compliments", "Ne pas passer assez de temps de qualité ensemble", "Ne jamais recevoir de cadeaux réfléchis ou de surprises", "Partenaire n'aidant pas avec les responsabilités", "Manque d'affection physique et de toucher"] },
      { question: "Comment savez-vous que votre partenaire se soucie vraiment de vous?", options: ["Quand ils expriment leurs sentiments avec des mots", "Quand ils prennent du temps pour vous peu importe leur emploi du temps", "Quand ils se souviennent des petites choses que vous avez mentionné vouloir", "Quand ils remarquent ce qui doit être fait et le font simplement", "Quand ils sont physiquement affectueux sans qu'on le leur demande"] },
      { question: "Qu'est-ce qui vous fait vous sentir le plus en sécurité dans votre relation?", options: ["Réassurance verbale régulière de leur amour", "Temps de qualité constant passé ensemble", "Gestes réfléchis et gages significatifs", "Aide et soutien fiables dans la vie quotidienne", "Connexion physique régulière et affection"] },
      { question: "Qu'est-ce qui vous ferait vous sentir le plus valorisé(e) au travail ou à la maison?", options: ["Reconnaissance et éloge pour vos efforts", "Attention complète pendant les conversations", "Un cadeau réfléchi ou un gage d'appréciation", "Aide avec une tâche ou un projet difficile", "Une tape dans le dos ou un toucher de soutien"] },
      { question: "Quelle est votre façon préférée de vous excuser ou de faire amende honorable?", options: ["Avec des mots sincères et des excuses sincères", "En consacrant du temps à discuter des choses", "Avec une offre de paix ou un cadeau de réconciliation", "En faisant quelque chose d'utile pour compenser", "Avec un câlin et une réconciliation physique"] },
      { question: "Lors de la planification d'un rendez-vous, qu'est-ce qui compte le plus pour vous?", options: ["Que nous parlions et nous connections émotionnellement", "Que nous ayons du temps ininterrompu ensemble", "Qu'il y ait un élément de surprise réfléchi", "Que tout soit organisé et se déroule sans problème", "Qu'il y ait une opportunité de proximité et d'affection"] },
      { question: "Quelle serait la façon parfaite de terminer une belle journée?", options: ["Mon partenaire me disant ce qu'il a aimé de notre journée", "Réfléchir à notre temps ensemble pendant la conversation", "Trouver une petite surprise qui m'attend", "Rentrer à la maison pour trouver les corvées déjà faites", "S'endormir dans les bras l'un de l'autre"] },
      { question: "Quel conseil relationnel résonne le plus avec vous?", options: ["'Dites à votre partenaire que vous l'aimez tous les jours'", "'Prenez du temps pour des soirées régulières en amoureux'", "'Surprenez votre partenaire avec des gestes réfléchis'", "'Partagez les responsabilités et soutenez-vous mutuellement'", "'Ne sous-estimez jamais le pouvoir d'un câlin'"] }
    ]
  },
  it: {
    quiz: {
      title: "Quiz sul Linguaggio dell'Amore",
      subtitle: "Scopri come preferisci dare e ricevere amore",
      questionOf: "Domanda",
      of: "di",
      previous: "Domanda Precedente",
      restart: "Riavvia Quiz",
      yourLoveLanguage: "Il Tuo Linguaggio dell'Amore",
      whatThisMeans: "Cosa Significa:",
      shareResult: "Condividi questo risultato con il tuo partner per aiutarlo a capire come ti senti più amato/a",
      encouragePartner: "Incoraggia il tuo partner a fare il quiz anche lui/lei per capirvi meglio",
      useInsight: "Usa questa intuizione per rafforzare la tua relazione e mostrare amore in modi che contano davvero",
      takeAgain: "Rifai il Quiz",
      shareResults: "Condividi Risultati"
    },
    loveLanguages: {
      words: { name: "Parole di Affermazione", description: "Ti senti più amato/a quando il tuo partner esprime affetto attraverso parole parlate o scritte di apprezzamento, incoraggiamento e complimenti." },
      quality: { name: "Tempo di Qualità", description: "Ti senti più amato/a quando il tuo partner ti dà la sua attenzione indivisa e trascorre del tempo significativo insieme senza distrazioni." },
      gifts: { name: "Ricevere Regali", description: "Ti senti più amato/a quando il tuo partner ti fa regali pensati che mostrano che stava pensando a te e capisce ciò che apprezzi." },
      service: { name: "Atti di Servizio", description: "Ti senti più amato/a quando il tuo partner fa cose utili per te per rendere la tua vita più facile e mostra amore attraverso le azioni." },
      touch: { name: "Contatto Fisico", description: "Ti senti più amato/a attraverso l'affetto fisico come abbracci, baci, tenersi per mano e altre forme di tocco tenero." }
    },
    questions: [
      { question: "Cosa ti fa sentire più apprezzato/a dal tuo partner?", options: ["Quando mi dicono che mi amano e mi apprezzano", "Quando riservano del tempo solo per noi", "Quando mi sorprendono con un regalo pensato", "Quando mi aiutano con compiti o faccende", "Quando mi tengono la mano o mi danno un abbraccio"] },
      { question: "Cosa significherebbe di più per te?", options: ["Una lettera sincera che esprime il loro amore", "Una giornata pianificata solo per noi due", "Qualcosa che desideravi da un po'", "Il tuo partner che si occupa di un compito che temevi", "Un lungo e caldo abbraccio"] },
      { question: "Cosa ferirebbe di più i tuoi sentimenti?", options: ["Se ti criticassero o dicessero qualcosa di duro", "Se fossero troppo occupati per passare del tempo con te", "Se dimenticassero un'occasione importante come il tuo compleanno", "Se non aiutassero mai in casa", "Se si allontanassero quando provi ad essere affettuoso/a"] },
      { question: "Come preferisci mostrare amore agli altri?", options: ["Dicendo loro quanto significano per me", "Trascorrendo del tempo di qualità con loro", "Facendo loro regali significativi", "Facendo cose per aiutarli", "Attraverso abbracci, baci e vicinanza fisica"] },
      { question: "Quale sarebbe la tua serata ideale con il tuo partner?", options: ["Conversazione profonda sui nostri sentimenti e sogni", "Tempo ininterrotto insieme a fare qualcosa che piace a entrambi", "Scambiandoci sorprese pensate", "Affrontando un progetto o compito insieme come squadra", "Accoccolati sul divano"] },
      { question: "Quando ti senti giù, cosa ti aiuta a sentirti meglio?", options: ["Sentire parole di incoraggiamento e affermazioni", "Avere qualcuno che si siede con te e ascolta", "Ricevere un piccolo segno di cura", "Qualcuno che si occupa dei compiti così puoi riposare", "Un abbraccio confortante o conforto fisico"] },
      { question: "Qual è il tuo modo preferito di celebrare un'occasione speciale?", options: ["Scambiando messaggi sinceri e brindisi", "Trascorrendo l'intera giornata insieme", "Dando e ricevendo regali significativi", "Pianificando e organizzando tutto perfettamente", "Molti momenti affettuosi e vicinanza"] },
      { question: "Quale assenza ti darebbe più fastidio in una relazione?", options: ["Mancanza di apprezzamento verbale e complimenti", "Non trascorrere abbastanza tempo di qualità insieme", "Non ricevere mai regali pensati o sorprese", "Partner che non aiuta con le responsabilità", "Mancanza di affetto fisico e contatto"] },
      { question: "Come sai che il tuo partner si preoccupa veramente di te?", options: ["Quando esprimono i loro sentimenti con le parole", "Quando fanno tempo per te non importa quanto siano occupati", "Quando ricordano piccole cose che hai menzionato di volere", "Quando notano cosa deve essere fatto e semplicemente lo fanno", "Quando sono fisicamente affettuosi senza che gli venga chiesto"] },
      { question: "Cosa ti fa sentire più sicuro/a nella tua relazione?", options: ["Rassicurazione verbale regolare del loro amore", "Tempo di qualità costante trascorso insieme", "Gesti pensati e segni significativi", "Aiuto e supporto affidabile nella vita quotidiana", "Connessione fisica regolare e affetto"] },
      { question: "Cosa ti farebbe sentire più valorizzato/a al lavoro o a casa?", options: ["Riconoscimento e lode per i tuoi sforzi", "Attenzione indivisa durante le conversazioni", "Un regalo pensato o segno di apprezzamento", "Aiuto con un compito o progetto difficile", "Una pacca sulla spalla o tocco di supporto"] },
      { question: "Qual è il tuo modo preferito di scusarti o fare ammenda?", options: ["Con parole sincere e scuse sentite", "Dedicando tempo per parlare delle cose", "Con un'offerta di pace o regalo di riconciliazione", "Facendo qualcosa di utile per compensare", "Con un abbraccio e riconciliazione fisica"] },
      { question: "Quando pianifichi un appuntamento, cosa conta di più per te?", options: ["Che parliamo e ci connettiamo emotivamente", "Che abbiamo tempo ininterrotto insieme", "Che ci sia un elemento di sorpresa pensato", "Che tutto sia organizzato e funzioni senza intoppi", "Che ci sia opportunità di vicinanza e affetto"] },
      { question: "Quale sarebbe il modo perfetto di concludere una bella giornata?", options: ["Il mio partner che mi dice cosa ha amato della nostra giornata", "Riflettere sul nostro tempo insieme durante la conversazione", "Trovare una piccola sorpresa ad aspettarmi", "Tornare a casa per trovare le faccende già fatte", "Addormentarsi tra le braccia l'uno dell'altro"] },
      { question: "Quale consiglio sulla relazione risuona di più con te?", options: ["'Dì al tuo partner che lo ami ogni giorno'", "'Fai tempo per appuntamenti regolari'", "'Sorprendi il tuo partner con gesti pensati'", "'Condividi le responsabilità e sostenetevi a vicenda'", "'Non sottovalutare mai il potere di un abbraccio'"] }
    ]
  },
  de: {
    quiz: {
      title: "Liebessprachen-Quiz",
      subtitle: "Entdecken Sie, wie Sie Liebe am liebsten geben und empfangen",
      questionOf: "Frage",
      of: "von",
      previous: "Vorherige Frage",
      restart: "Quiz Neu Starten",
      yourLoveLanguage: "Ihre Liebessprache",
      whatThisMeans: "Was Das Bedeutet:",
      shareResult: "Teilen Sie dieses Ergebnis mit Ihrem Partner, um ihm zu helfen zu verstehen, wie Sie sich am meisten geliebt fühlen",
      encouragePartner: "Ermutigen Sie Ihren Partner, das Quiz auch zu machen, damit Sie sich besser verstehen können",
      useInsight: "Nutzen Sie diese Einsicht, um Ihre Beziehung zu stärken und Liebe auf Weisen zu zeigen, die wirklich wichtig sind",
      takeAgain: "Quiz Erneut Machen",
      shareResults: "Ergebnisse Teilen"
    },
    loveLanguages: {
      words: { name: "Worte der Bestätigung", description: "Sie fühlen sich am meisten geliebt, wenn Ihr Partner Zuneigung durch gesprochene oder geschriebene Worte der Wertschätzung, Ermutigung und Komplimente ausdrückt." },
      quality: { name: "Qualitätszeit", description: "Sie fühlen sich am meisten geliebt, wenn Ihr Partner Ihnen seine ungeteilte Aufmerksamkeit schenkt und bedeutsame Zeit ohne Ablenkungen zusammen verbringt." },
      gifts: { name: "Geschenke Erhalten", description: "Sie fühlen sich am meisten geliebt, wenn Ihr Partner Ihnen durchdachte Geschenke gibt, die zeigen, dass er an Sie gedacht hat und versteht, was Sie schätzen." },
      service: { name: "Hilfsbereitschaft", description: "Sie fühlen sich am meisten geliebt, wenn Ihr Partner hilfreiche Dinge für Sie tut, um Ihr Leben leichter zu machen und Liebe durch Taten zeigt." },
      touch: { name: "Körperliche Berührung", description: "Sie fühlen sich am meisten geliebt durch körperliche Zuneigung wie Umarmungen, Küsse, Händchenhalten und andere Formen zärtlicher Berührung." }
    },
    questions: [
      { question: "Was lässt Sie sich am meisten von Ihrem Partner geschätzt fühlen?", options: ["Wenn sie mir sagen, dass sie mich lieben und schätzen", "Wenn sie Zeit nur für uns reservieren", "Wenn sie mich mit einem durchdachten Geschenk überraschen", "Wenn sie mir bei Aufgaben oder Hausarbeiten helfen", "Wenn sie meine Hand halten oder mich umarmen"] },
      { question: "Was würde Ihnen am meisten bedeuten?", options: ["Ein herzlicher Brief, der ihre Liebe ausdrückt", "Ein Tag, der nur für uns beide geplant ist", "Etwas, das Sie schon eine Weile haben wollten", "Dass Ihr Partner sich um eine Aufgabe kümmert, vor der Sie sich gefürchtet haben", "Eine lange, warme Umarmung"] },
      { question: "Was würde Ihre Gefühle am meisten verletzen?", options: ["Wenn sie Sie kritisieren oder etwas Hartes sagen würden", "Wenn sie zu beschäftigt wären, um Zeit mit Ihnen zu verbringen", "Wenn sie einen wichtigen Anlass wie Ihren Geburtstag vergessen würden", "Wenn sie nie im Haushalt helfen würden", "Wenn sie sich zurückziehen würden, wenn Sie versuchen, zärtlich zu sein"] },
      { question: "Wie zeigen Sie am liebsten anderen Liebe?", options: ["Indem ich ihnen sage, wie viel sie mir bedeuten", "Indem ich Qualitätszeit mit ihnen verbringe", "Indem ich ihnen bedeutungsvolle Geschenke mache", "Indem ich Dinge tue, um ihnen zu helfen", "Durch Umarmungen, Küsse und körperliche Nähe"] },
      { question: "Wie würde Ihr idealer Abend mit Ihrem Partner aussehen?", options: ["Tiefes Gespräch über unsere Gefühle und Träume", "Ununterbrochene Zeit zusammen, etwas zu tun, das uns beiden Spaß macht", "Durchdachte Überraschungen austauschen", "Gemeinsam als Team an einem Projekt oder einer Aufgabe arbeiten", "Auf der Couch kuscheln"] },
      { question: "Was hilft Ihnen, sich besser zu fühlen, wenn Sie niedergeschlagen sind?", options: ["Ermutigende Worte und Bestätigungen hören", "Jemanden haben, der mit Ihnen sitzt und zuhört", "Ein kleines Zeichen der Fürsorge erhalten", "Jemand, der sich um Aufgaben kümmert, damit Sie sich ausruhen können", "Eine tröstende Umarmung oder körperlicher Trost"] },
      { question: "Was ist Ihre Lieblingsart, einen besonderen Anlass zu feiern?", options: ["Herzliche Nachrichten und Toasts austauschen", "Den ganzen Tag zusammen verbringen", "Bedeutungsvolle Geschenke geben und empfangen", "Alles perfekt planen und organisieren", "Viele liebevolle Momente und Nähe"] },
      { question: "Welche Abwesenheit würde Sie in einer Beziehung am meisten stören?", options: ["Mangel an verbaler Wertschätzung und Komplimenten", "Nicht genug Qualitätszeit zusammen verbringen", "Nie durchdachte Geschenke oder Überraschungen erhalten", "Partner hilft nicht bei Verantwortlichkeiten", "Mangel an körperlicher Zuneigung und Berührung"] },
      { question: "Woher wissen Sie, dass sich Ihr Partner wirklich um Sie kümmert?", options: ["Wenn sie ihre Gefühle mit Worten ausdrücken", "Wenn sie sich Zeit für Sie nehmen, egal wie beschäftigt sie sind", "Wenn sie sich an kleine Dinge erinnern, die Sie erwähnt haben zu wollen", "Wenn sie bemerken, was getan werden muss und es einfach tun", "Wenn sie ohne Aufforderung körperlich zärtlich sind"] },
      { question: "Was lässt Sie sich in Ihrer Beziehung am sichersten fühlen?", options: ["Regelmäßige verbale Versicherung ihrer Liebe", "Konsistente Qualitätszeit zusammen verbracht", "Durchdachte Gesten und bedeutungsvolle Zeichen", "Zuverlässige Hilfe und Unterstützung im täglichen Leben", "Regelmäßige körperliche Verbindung und Zuneigung"] },
      { question: "Was würde Sie sich bei der Arbeit oder zu Hause am meisten geschätzt fühlen lassen?", options: ["Anerkennung und Lob für Ihre Bemühungen", "Ungeteilte Aufmerksamkeit während Gesprächen", "Ein durchdachtes Geschenk oder Zeichen der Wertschätzung", "Hilfe bei einer schwierigen Aufgabe oder einem Projekt", "Ein Schulterklopfen oder unterstützende Berührung"] },
      { question: "Was ist Ihre bevorzugte Art, sich zu entschuldigen oder Wiedergutmachung zu leisten?", options: ["Mit aufrichtigen Worten und herzlichen Entschuldigungen", "Indem ich Zeit widme, um die Dinge zu besprechen", "Mit einem Friedensangebot oder Versöhnungsgeschenk", "Indem ich etwas Hilfreiches tue, um es wiedergutzumachen", "Mit einer Umarmung und körperlicher Versöhnung"] },
      { question: "Was ist Ihnen bei der Planung eines Dates am wichtigsten?", options: ["Dass wir reden und uns emotional verbinden", "Dass wir ununterbrochene Zeit zusammen haben", "Dass es ein durchdachtes Überraschungselement gibt", "Dass alles organisiert ist und reibungslos läuft", "Dass es Gelegenheit für Nähe und Zuneigung gibt"] },
      { question: "Was wäre der perfekte Weg, einen tollen Tag zu beenden?", options: ["Mein Partner erzählt mir, was er an unserem Tag geliebt hat", "Über unsere gemeinsame Zeit während des Gesprächs nachdenken", "Eine kleine Überraschung finden, die auf mich wartet", "Nach Hause kommen und feststellen, dass die Hausarbeit bereits erledigt ist", "In den Armen des anderen einschlafen"] },
      { question: "Welcher Beziehungsrat resoniert am meisten mit Ihnen?", options: ["'Sagen Sie Ihrem Partner jeden Tag, dass Sie ihn lieben'", "'Nehmen Sie sich Zeit für regelmäßige Date-Abende'", "'Überraschen Sie Ihren Partner mit durchdachten Gesten'", "'Teilen Sie Verantwortlichkeiten und unterstützen Sie sich gegenseitig'", "'Unterschätzen Sie niemals die Kraft einer Umarmung'"] }
    ]
  },
  nl: {
    quiz: {
      title: "Liefdetalen Quiz",
      subtitle: "Ontdek hoe je het liefst liefde geeft en ontvangt",
      questionOf: "Vraag",
      of: "van",
      previous: "Vorige Vraag",
      restart: "Quiz Opnieuw Starten",
      yourLoveLanguage: "Jouw Liefdetaal",
      whatThisMeans: "Wat Dit Betekent:",
      shareResult: "Deel dit resultaat met je partner om hen te helpen begrijpen hoe jij je het meest geliefd voelt",
      encouragePartner: "Moedig je partner aan om de quiz ook te doen zodat jullie elkaar beter kunnen begrijpen",
      useInsight: "Gebruik dit inzicht om je relatie te versterken en liefde te tonen op manieren die echt tellen",
      takeAgain: "Quiz Opnieuw Doen",
      shareResults: "Resultaten Delen"
    },
    loveLanguages: {
      words: { name: "Bevestigende Woorden", description: "Je voelt je het meest geliefd wanneer je partner affectie uitdrukt door gesproken of geschreven woorden van waardering, aanmoediging en complimenten." },
      quality: { name: "Quality Time", description: "Je voelt je het meest geliefd wanneer je partner je zijn/haar onverdeelde aandacht geeft en betekenisvolle tijd samen doorbrengt zonder afleiding." },
      gifts: { name: "Cadeaus Ontvangen", description: "Je voelt je het meest geliefd wanneer je partner je doordachte cadeaus geeft die laten zien dat hij/zij aan je dacht en begrijpt wat je waardeert." },
      service: { name: "Handelingen van Service", description: "Je voelt je het meest geliefd wanneer je partner nuttige dingen voor je doet om je leven makkelijker te maken en liefde toont door daden." },
      touch: { name: "Fysieke Aanraking", description: "Je voelt je het meest geliefd door fysieke genegenheid zoals knuffels, kussen, handen vasthouden en andere vormen van tedere aanraking." }
    },
    questions: [
      { question: "Wat laat je je het meest gewaardeerd voelen door je partner?", options: ["Als ze me vertellen dat ze van me houden en me waarderen", "Als ze tijd vrijmaken alleen voor ons", "Als ze me verrassen met een doordacht cadeau", "Als ze me helpen met taken of karweitjes", "Als ze mijn hand vasthouden of me een knuffel geven"] },
      { question: "Wat zou het meest voor je betekenen?", options: ["Een oprechte brief die hun liefde uitdrukt", "Een dag gepland alleen voor ons tweeën", "Iets waar je al een tijdje op hoopte", "Je partner die zich ontfermt over een taak waar je tegenop zag", "Een lange, warme omhelzing"] },
      { question: "Wat zou je gevoelens het meest kwetsen?", options: ["Als ze je bekritiseerden of iets hards zeiden", "Als ze te druk waren om tijd met je door te brengen", "Als ze een belangrijke gelegenheid zoals je verjaardag vergaten", "Als ze nooit hielpen in huis", "Als ze zich terugtrokken wanneer je probeerde liefdevol te zijn"] },
      { question: "Hoe toon je het liefst liefde aan anderen?", options: ["Door hen te vertellen hoeveel ze voor me betekenen", "Door quality time met hen door te brengen", "Door hen betekenisvolle cadeaus te geven", "Door dingen te doen om hen te helpen", "Door knuffels, kussen en fysieke nabijheid"] },
      { question: "Hoe zou je ideale avond met je partner eruit zien?", options: ["Diep gesprek over onze gevoelens en dromen", "Ononderbroken tijd samen iets doen waar we allebei van genieten", "Doordachte verrassingen uitwisselen", "Samen als team aan een project of taak werken", "Knuffelen op de bank"] },
      { question: "Wat helpt je je beter te voelen als je je down voelt?", options: ["Bemoedigende woorden en bevestigingen horen", "Iemand hebben die bij je zit en luistert", "Een klein teken van zorg ontvangen", "Iemand die zich ontfermt over taken zodat je kunt rusten", "Een troostende knuffel of fysiek comfort"] },
      { question: "Wat is je favoriete manier om een speciale gelegenheid te vieren?", options: ["Oprechte berichten en toosts uitwisselen", "De hele dag samen doorbrengen", "Betekenisvolle cadeaus geven en ontvangen", "Alles perfect plannen en organiseren", "Veel liefdevolle momenten en nabijheid"] },
      { question: "Welke afwezigheid zou je het meest storen in een relatie?", options: ["Gebrek aan verbale waardering en complimenten", "Niet genoeg quality time samen doorbrengen", "Nooit doordachte cadeaus of verrassingen ontvangen", "Partner helpt niet met verantwoordelijkheden", "Gebrek aan fysieke genegenheid en aanraking"] },
      { question: "Hoe weet je dat je partner echt om je geeft?", options: ["Wanneer ze hun gevoelens met woorden uiten", "Wanneer ze tijd voor je maken, hoe druk ze ook zijn", "Wanneer ze kleine dingen onthouden die je noemde te willen", "Wanneer ze merken wat gedaan moet worden en het gewoon doen", "Wanneer ze fysiek liefdevol zijn zonder dat het gevraagd wordt"] },
      { question: "Wat laat je je het veiligst voelen in je relatie?", options: ["Regelmatige verbale bevestiging van hun liefde", "Consistente quality time samen doorgebracht", "Doordachte gebaren en betekenisvolle tekens", "Betrouwbare hulp en ondersteuning in het dagelijks leven", "Regelmatige fysieke verbinding en genegenheid"] },
      { question: "Wat zou je je het meest gewaardeerd laten voelen op het werk of thuis?", options: ["Erkenning en lof voor je inspanningen", "Onverdeelde aandacht tijdens gesprekken", "Een doordacht cadeau of teken van waardering", "Hulp bij een moeilijke taak of project", "Een schouderklopje of ondersteunende aanraking"] },
      { question: "Wat is je voorkeursmethode om je te verontschuldigen of het goed te maken?", options: ["Met oprechte woorden en hartelijke excuses", "Door tijd te besteden om dingen uit te praten", "Met een vredesaanbod of verzoeningscadeau", "Door iets nuttigs te doen om het goed te maken", "Met een knuffel en fysieke verzoening"] },
      { question: "Wat is het belangrijkste bij het plannen van een date?", options: ["Dat we praten en emotioneel verbinden", "Dat we ononderbroken tijd samen hebben", "Dat er een doordacht verrassingselement is", "Dat alles georganiseerd is en soepel verloopt", "Dat er gelegenheid is voor nabijheid en genegenheid"] },
      { question: "Wat zou de perfecte manier zijn om een geweldige dag af te sluiten?", options: ["Mijn partner die me vertelt wat hij/zij het leukst vond aan onze dag", "Reflecteren op onze tijd samen tijdens het gesprek", "Een kleine verrassing vinden die op me wacht", "Thuiskomen om te ontdekken dat de karweitjes al gedaan zijn", "In elkaars armen in slaap vallen"] },
      { question: "Welk relatieadvies resoneert het meest met jou?", options: ["'Vertel je partner elke dag dat je van hen houdt'", "'Maak tijd voor regelmatige date nights'", "'Verras je partner met doordachte gebaren'", "'Deel verantwoordelijkheden en ondersteun elkaar'", "'Onderschat nooit de kracht van een knuffel'"] }
    ]
  },
  pt: {
    quiz: {
      title: "Quiz das Linguagens do Amor",
      subtitle: "Descubra como você prefere dar e receber amor",
      questionOf: "Questão",
      of: "de",
      previous: "Questão Anterior",
      restart: "Reiniciar Quiz",
      yourLoveLanguage: "Sua Linguagem do Amor",
      whatThisMeans: "O Que Isso Significa:",
      shareResult: "Compartilhe este resultado com seu parceiro para ajudá-lo a entender como você se sente mais amado(a)",
      encouragePartner: "Incentive seu parceiro a fazer o quiz também para que possam se entender melhor",
      useInsight: "Use esta percepção para fortalecer seu relacionamento e mostrar amor de maneiras que realmente importam",
      takeAgain: "Fazer o Quiz Novamente",
      shareResults: "Compartilhar Resultados"
    },
    loveLanguages: {
      words: { name: "Palavras de Afirmação", description: "Você se sente mais amado(a) quando seu parceiro expressa afeto através de palavras faladas ou escritas de apreciação, encorajamento e elogios." },
      quality: { name: "Tempo de Qualidade", description: "Você se sente mais amado(a) quando seu parceiro lhe dá sua atenção total e passa um tempo significativo juntos sem distrações." },
      gifts: { name: "Receber Presentes", description: "Você se sente mais amado(a) quando seu parceiro lhe dá presentes pensados que mostram que estava pensando em você e entende o que você valoriza." },
      service: { name: "Atos de Serviço", description: "Você se sente mais amado(a) quando seu parceiro faz coisas úteis por você para tornar sua vida mais fácil e mostra amor através de ações." },
      touch: { name: "Toque Físico", description: "Você se sente mais amado(a) através de afeto físico como abraços, beijos, segurar as mãos e outras formas de toque terno." }
    },
    questions: [
      { question: "O que faz você se sentir mais apreciado(a) pelo seu parceiro?", options: ["Quando me dizem que me amam e me apreciam", "Quando reservam tempo apenas para nós", "Quando me surpreendem com um presente pensado", "Quando me ajudam com tarefas ou afazeres", "Quando seguram minha mão ou me dão um abraço"] },
      { question: "O que significaria mais para você?", options: ["Uma carta sincera expressando seu amor", "Um dia planejado apenas para nós dois", "Algo que você queria há um tempo", "Seu parceiro cuidando de uma tarefa que você temia", "Um longo e caloroso abraço"] },
      { question: "O que mais machucaria seus sentimentos?", options: ["Se eles te criticassem ou dissessem algo duro", "Se estivessem muito ocupados para passar tempo com você", "Se esquecessem de uma ocasião importante como seu aniversário", "Se nunca ajudassem em casa", "Se se afastassem quando você tentasse ser carinhoso(a)"] },
      { question: "Como você prefere mostrar amor aos outros?", options: ["Dizendo a eles o quanto significam para mim", "Passando tempo de qualidade com eles", "Dando-lhes presentes significativos", "Fazendo coisas para ajudá-los", "Através de abraços, beijos e proximidade física"] },
      { question: "Qual seria sua noite ideal com seu parceiro?", options: ["Conversa profunda sobre nossos sentimentos e sonhos", "Tempo ininterrupto juntos fazendo algo que ambos gostamos", "Trocando surpresas pensadas", "Enfrentando um projeto ou tarefa juntos como equipe", "Aconchegados no sofá"] },
      { question: "Quando você está se sentindo para baixo, o que ajuda você a se sentir melhor?", options: ["Ouvir palavras encorajadoras e afirmações", "Ter alguém que senta com você e escuta", "Receber um pequeno sinal de cuidado", "Alguém cuidando de tarefas para que você possa descansar", "Um abraço reconfortante ou conforto físico"] },
      { question: "Qual é sua maneira favorita de celebrar uma ocasião especial?", options: ["Trocando mensagens sinceras e brindes", "Passando o dia inteiro juntos", "Dando e recebendo presentes significativos", "Planejando e organizando tudo perfeitamente", "Muitos momentos carinhosos e proximidade"] },
      { question: "Qual ausência mais te incomodaria em um relacionamento?", options: ["Falta de apreciação verbal e elogios", "Não passar tempo de qualidade suficiente juntos", "Nunca receber presentes pensados ou surpresas", "Parceiro não ajudando com responsabilidades", "Falta de afeto físico e toque"] },
      { question: "Como você sabe que seu parceiro realmente se importa com você?", options: ["Quando expressam seus sentimentos com palavras", "Quando fazem tempo para você não importa o quão ocupados estejam", "Quando lembram pequenas coisas que você mencionou querer", "Quando percebem o que precisa ser feito e simplesmente fazem", "Quando são fisicamente carinhosos sem serem solicitados"] },
      { question: "O que faz você se sentir mais seguro(a) no seu relacionamento?", options: ["Reafirmação verbal regular de seu amor", "Tempo de qualidade consistente passado juntos", "Gestos pensados e sinais significativos", "Ajuda e apoio confiáveis na vida diária", "Conexão física regular e afeto"] },
      { question: "O que faria você se sentir mais valorizado(a) no trabalho ou em casa?", options: ["Reconhecimento e elogio pelos seus esforços", "Atenção total durante conversas", "Um presente pensado ou sinal de apreciação", "Ajuda com uma tarefa ou projeto difícil", "Um tapinha nas costas ou toque de apoio"] },
      { question: "Qual é sua maneira preferida de se desculpar ou fazer as pazes?", options: ["Com palavras sinceras e desculpas sentidas", "Dedicando tempo para conversar sobre as coisas", "Com uma oferta de paz ou presente de reconciliação", "Fazendo algo útil para compensar", "Com um abraço e reconciliação física"] },
      { question: "Ao planejar um encontro, o que mais importa para você?", options: ["Que conversemos e nos conectemos emocionalmente", "Que tenhamos tempo ininterrupto juntos", "Que haja um elemento de surpresa pensado", "Que tudo esteja organizado e funcione sem problemas", "Que haja oportunidade para proximidade e afeto"] },
      { question: "Qual seria a maneira perfeita de terminar um ótimo dia?", options: ["Meu parceiro me dizendo o que amou sobre nosso dia", "Refletindo sobre nosso tempo juntos durante a conversa", "Encontrando uma pequena surpresa esperando por mim", "Chegando em casa para encontrar as tarefas já feitas", "Adormecendo nos braços um do outro"] },
      { question: "Qual conselho de relacionamento ressoa mais com você?", options: ["'Diga ao seu parceiro que o ama todos os dias'", "'Faça tempo para encontros regulares'", "'Surpreenda seu parceiro com gestos pensados'", "'Compartilhe responsabilidades e apoiem-se mutuamente'", "'Nunca subestime o poder de um abraço'"] }
    ]
  }
};

export default function LoveLanguageQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { currentLanguage } = useLanguage();
  const { user, refreshUserProfile } = useAuth();
  const t = translations[currentLanguage] || translations.en;

  const loveLanguages = [
    { 
      id: 'words', 
      name: t.loveLanguages.words.name, 
      icon: MessageCircle, 
      color: 'from-blue-500 to-cyan-500',
      description: t.loveLanguages.words.description
    },
    { 
      id: 'quality', 
      name: t.loveLanguages.quality.name, 
      icon: Clock, 
      color: 'from-purple-500 to-pink-500',
      description: t.loveLanguages.quality.description
    },
    { 
      id: 'gifts', 
      name: t.loveLanguages.gifts.name, 
      icon: Gift, 
      color: 'from-pink-500 to-red-500',
      description: t.loveLanguages.gifts.description
    },
    { 
      id: 'service', 
      name: t.loveLanguages.service.name, 
      icon: Hand, 
      color: 'from-green-500 to-emerald-500',
      description: t.loveLanguages.service.description
    },
    { 
      id: 'touch', 
      name: t.loveLanguages.touch.name, 
      icon: Heart, 
      color: 'from-rose-500 to-pink-500',
      description: t.loveLanguages.touch.description
    },
  ];

  const questions = t.questions.map((q, index) => ({
    question: q.question,
    options: [
      { text: q.options[0], value: 'words' },
      { text: q.options[1], value: 'quality' },
      { text: q.options[2], value: 'gifts' },
      { text: q.options[3], value: 'service' },
      { text: q.options[4], value: 'touch' },
    ]
  }));

  const handleAnswer = (value) => {
    const newAnswers = { ...answers, [currentQuestion]: value };
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateResults(newAnswers);
    }
  };

  const calculateResults = (finalAnswers) => {
    setShowResults(true);
  };

  const getTopLanguage = () => {
    const counts = {};
    Object.values(answers).forEach(answer => {
      counts[answer] = (counts[answer] || 0) + 1;
    });
    const topLanguageId = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    return loveLanguages.find(lang => lang.id === topLanguageId);
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
    setIsSaved(false);
  };

  const handleSaveResult = async () => {
    if (!user) {
      toast.error('Please log in to save your results');
      return;
    }

    setIsSaving(true);
    try {
      const topLanguage = getTopLanguage();
      await saveLoveLanguage(user.id, topLanguage.id);
      
      // Refresh user profile to update completion percentage
      await refreshUserProfile();
      
      setIsSaved(true);
      toast.success('Love language saved to your profile!', {
        description: 'Your profile completion has been updated'
      });
    } catch (error) {
      console.error('Error saving love language:', error);
      toast.error('Failed to save love language. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (showResults) {
    const topLanguage = getTopLanguage();
    const LanguageIcon = topLanguage.icon;

    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <Card className="bg-white shadow-2xl">
              <CardContent className="pt-12 pb-8">
                <div className={`w-24 h-24 bg-gradient-to-br ${topLanguage.color} rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl`}>
                  <LanguageIcon className="w-12 h-12 text-white" />
                </div>
                
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  {t.quiz.yourLoveLanguage}
                </h1>
                
                <div className={`inline-block px-8 py-3 bg-gradient-to-r ${topLanguage.color} text-white rounded-full text-2xl font-bold mb-6 shadow-lg`}>
                  {topLanguage.name}
                </div>
                
                <p className="text-lg text-gray-700 leading-relaxed mb-8 max-w-2xl mx-auto">
                  {topLanguage.description}
                </p>

                <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6 mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{t.quiz.whatThisMeans}</h3>
                  <ul className="text-left space-y-3 text-gray-700">
                    <li className="flex items-start">
                      <Heart className="w-5 h-5 text-pink-500 mr-2 mt-1 flex-shrink-0" />
                      <span>{t.quiz.shareResult}</span>
                    </li>
                    <li className="flex items-start">
                      <Heart className="w-5 h-5 text-pink-500 mr-2 mt-1 flex-shrink-0" />
                      <span>{t.quiz.encouragePartner}</span>
                    </li>
                    <li className="flex items-start">
                      <Heart className="w-5 h-5 text-pink-500 mr-2 mt-1 flex-shrink-0" />
                      <span>{t.quiz.useInsight}</span>
                    </li>
                  </ul>
                </div>

                <div className="flex flex-wrap gap-4 justify-center">
                  {user && !isSaved ? (
                    <Button
                      onClick={handleSaveResult}
                      disabled={isSaving}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 px-8 py-6 text-lg"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5 mr-2" />
                          Save to Profile
                        </>
                      )}
                    </Button>
                  ) : user && isSaved ? (
                    <Button
                      disabled
                      className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-6 text-lg"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Saved to Profile
                    </Button>
                  ) : null}
                  
                  <Button
                    onClick={resetQuiz}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 px-8 py-6 text-lg"
                  >
                    <RotateCcw className="w-5 h-5 mr-2" />
                    {t.quiz.takeAgain}
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="px-8 py-6 text-lg"
                  >
                    <Share2 className="w-5 h-5 mr-2" />
                    {t.quiz.shareResults}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full mb-6 shadow-xl">
            <Heart className="w-10 h-10 text-white fill-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            {t.quiz.title}
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            {t.quiz.subtitle}
          </p>
          <Button
            onClick={resetQuiz}
            variant="outline"
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            {t.quiz.restart}
          </Button>
        </motion.div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{t.quiz.questionOf} {currentQuestion + 1} {t.quiz.of} {questions.length}</span>
            <span>{Math.round(((currentQuestion + 1) / questions.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              className="bg-gradient-to-r from-pink-500 to-purple-600 h-3 rounded-full transition-all duration-500"
            />
          </div>
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            <Card className="bg-white shadow-2xl mb-8">
              <CardContent className="pt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-8">
                  {questions[currentQuestion].question}
                </h2>

                <div className="space-y-4">
                  {questions[currentQuestion].options.map((option, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAnswer(option.value)}
                      className="w-full text-left p-4 rounded-xl border-2 border-gray-200 hover:border-pink-500 hover:bg-pink-50 transition-all duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 font-medium">{option.text}</span>
                        <ChevronRight className="w-5 h-5 text-pink-500" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          {currentQuestion > 0 ? (
            <Button
              variant="outline"
              onClick={() => setCurrentQuestion(currentQuestion - 1)}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              {t.quiz.previous}
            </Button>
          ) : (
            <div></div>
          )}
        </div>
      </div>
    </div>
  );
}