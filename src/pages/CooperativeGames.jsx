import React from "react";
import { useLanguage } from "@/Layout";
import { Gamepad2, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import GameCard from "../components/activities/GameCard";

const translations = {
  en: {
    title: "Cooperative Games",
    subtitle: "Play together, laugh together, and build teamwork without turning connection into competition.",
    back: "Back to Activities",
    featured: "Games & Conversation Activities",
    intro: "Conversation Cards is available now. Additional cooperative games are shown as coming soon until their interactive gameplay is fully built and verified.",
    play: "Open Activity",
    comingSoon: "Coming Soon",
    difficulty: { easy: "Easy", medium: "Medium", hard: "More Involved" },
    games: [
      ["trivia", "Couple Trivia", "Test how well you know each other with lighthearted questions and discoveries.", "easy", "🎯", null],
      ["word_builder", "Word Builder", "Work as a team to build words and solve language challenges together.", "medium", "📝", null],
      ["memory_match", "Memory Match", "Find matching pairs together in a cooperative memory challenge.", "easy", "🧩", null],
      ["story_creator", "Story Creator", "Create one story together by taking turns adding ideas and sentences.", "easy", "📖", null],
      ["challenge_quest", "Challenge Quest", "Complete a sequence of playful teamwork challenges together.", "hard", "🏆", null],
      ["conversation_cards", "Conversation Cards", "Choose a deck and take turns answering prompts designed to deepen connection.", "medium", "💬", "/ConversationCards"]
    ]
  },
  es: {
    title: "Juegos Cooperativos",
    subtitle: "Jueguen juntos, rían juntos y fortalezcan el trabajo en equipo sin convertir la conexión en competencia.",
    back: "Volver a Actividades",
    featured: "Juegos y Actividades de Conversación",
    intro: "Las Tarjetas de Conversación ya están disponibles. Los demás juegos cooperativos aparecen como próximos hasta que su experiencia interactiva esté completamente desarrollada y verificada.",
    play: "Abrir Actividad",
    comingSoon: "Próximamente",
    difficulty: { easy: "Fácil", medium: "Intermedio", hard: "Más Elaborado" },
    games: [
      ["trivia", "Trivia para Parejas", "Descubran cuánto saben el uno del otro con preguntas ligeras y divertidas.", "easy", "🎯", null],
      ["word_builder", "Constructor de Palabras", "Trabajen en equipo para formar palabras y resolver retos de lenguaje juntos.", "medium", "📝", null],
      ["memory_match", "Memoria en Pareja", "Encuentren pares coincidentes juntos en un reto cooperativo de memoria.", "easy", "🧩", null],
      ["story_creator", "Creador de Historias", "Creen una historia juntos turnándose para agregar ideas y frases.", "easy", "📖", null],
      ["challenge_quest", "Misión de Retos", "Completen juntos una secuencia de retos divertidos de trabajo en equipo.", "hard", "🏆", null],
      ["conversation_cards", "Tarjetas de Conversación", "Elijan un grupo de preguntas y túrnense para responder ideas que profundizan la conexión.", "medium", "💬", "/ConversationCards"]
    ]
  },
  fr: {
    title: "Jeux Coopératifs",
    subtitle: "Jouez ensemble, riez ensemble et renforcez votre esprit d’équipe sans transformer la connexion en compétition.",
    back: "Retour aux Activités",
    featured: "Jeux et Activités de Conversation",
    intro: "Les Cartes de Conversation sont disponibles dès maintenant. Les autres jeux coopératifs restent indiqués comme à venir jusqu’à ce que leur expérience interactive soit entièrement développée et vérifiée.",
    play: "Ouvrir l’Activité",
    comingSoon: "Bientôt Disponible",
    difficulty: { easy: "Facile", medium: "Intermédiaire", hard: "Plus Impliqué" },
    games: [
      ["trivia", "Quiz de Couple", "Découvrez à quel point vous vous connaissez grâce à des questions légères et amusantes.", "easy", "🎯", null],
      ["word_builder", "Constructeur de Mots", "Travaillez en équipe pour créer des mots et résoudre des défis de langage.", "medium", "📝", null],
      ["memory_match", "Mémoire en Duo", "Trouvez ensemble des paires dans un défi de mémoire coopératif.", "easy", "🧩", null],
      ["story_creator", "Créateur d’Histoire", "Créez une histoire ensemble en ajoutant à tour de rôle des idées et des phrases.", "easy", "📖", null],
      ["challenge_quest", "Quête de Défis", "Réalisez ensemble une série de défis ludiques basés sur le travail d’équipe.", "hard", "🏆", null],
      ["conversation_cards", "Cartes de Conversation", "Choisissez un jeu de questions et répondez à tour de rôle à des invitations qui approfondissent la connexion.", "medium", "💬", "/ConversationCards"]
    ]
  },
  it: {
    title: "Giochi Cooperativi",
    subtitle: "Giocate insieme, ridete insieme e rafforzate il lavoro di squadra senza trasformare la connessione in competizione.",
    back: "Torna alle Attività",
    featured: "Giochi e Attività di Conversazione",
    intro: "Le Carte di Conversazione sono disponibili ora. Gli altri giochi cooperativi restano indicati come in arrivo finché l’esperienza interattiva non sarà completamente sviluppata e verificata.",
    play: "Apri Attività",
    comingSoon: "Prossimamente",
    difficulty: { easy: "Facile", medium: "Intermedio", hard: "Più Impegnativo" },
    games: [
      ["trivia", "Quiz di Coppia", "Scoprite quanto vi conoscete con domande leggere e divertenti.", "easy", "🎯", null],
      ["word_builder", "Costruttore di Parole", "Lavorate in squadra per creare parole e risolvere sfide linguistiche insieme.", "medium", "📝", null],
      ["memory_match", "Memoria di Coppia", "Trovate insieme le coppie corrispondenti in una sfida cooperativa di memoria.", "easy", "🧩", null],
      ["story_creator", "Creatore di Storie", "Create una storia insieme alternandovi nell’aggiungere idee e frasi.", "easy", "📖", null],
      ["challenge_quest", "Missione di Sfide", "Completate insieme una serie di sfide giocose basate sul lavoro di squadra.", "hard", "🏆", null],
      ["conversation_cards", "Carte di Conversazione", "Scegliete un mazzo e rispondete a turno a spunti pensati per approfondire la connessione.", "medium", "💬", "/ConversationCards"]
    ]
  },
  de: {
    title: "Kooperative Spiele",
    subtitle: "Spielt zusammen, lacht zusammen und stärkt Teamarbeit, ohne Verbindung in Wettbewerb zu verwandeln.",
    back: "Zurück zu Aktivitäten",
    featured: "Spiele und Gesprächsaktivitäten",
    intro: "Die Gesprächskarten sind bereits verfügbar. Weitere kooperative Spiele werden als demnächst verfügbar angezeigt, bis ihre interaktive Spielfunktion vollständig gebaut und geprüft ist.",
    play: "Aktivität Öffnen",
    comingSoon: "Demnächst",
    difficulty: { easy: "Einfach", medium: "Mittel", hard: "Aufwendiger" },
    games: [
      ["trivia", "Paar-Quiz", "Findet mit lockeren Fragen heraus, wie gut ihr euch gegenseitig kennt.", "easy", "🎯", null],
      ["word_builder", "Wort-Baukasten", "Arbeitet als Team, bildet Wörter und löst gemeinsam Sprachaufgaben.", "medium", "📝", null],
      ["memory_match", "Gemeinsames Memory", "Findet gemeinsam passende Paare in einer kooperativen Gedächtnisaufgabe.", "easy", "🧩", null],
      ["story_creator", "Geschichten-Werkstatt", "Erschafft gemeinsam eine Geschichte, indem ihr abwechselnd Ideen und Sätze ergänzt.", "easy", "📖", null],
      ["challenge_quest", "Team-Challenge", "Bewältigt gemeinsam eine Reihe spielerischer Teamaufgaben.", "hard", "🏆", null],
      ["conversation_cards", "Gesprächskarten", "Wählt ein Fragenset und beantwortet abwechselnd Impulse, die eure Verbindung vertiefen.", "medium", "💬", "/ConversationCards"]
    ]
  }
};

export default function CooperativeGames() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const availableGames = t.games.map(([id, name, description, difficulty, icon, href]) => ({ id, name, description, difficulty, icon, href }));

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-6">
          <Link to={createPageUrl("CoupleActivities")} className="inline-flex items-center text-gray-600 hover:text-green-700">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />{t.back}
          </Link>
        </div>

        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-xl">
            <Gamepad2 className="h-10 w-10 text-white" aria-hidden="true" />
          </div>
          <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">{t.title}</h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600 md:text-xl">{t.subtitle}</p>
          <p className="mx-auto mt-4 max-w-3xl text-sm leading-6 text-gray-500">{t.intro}</p>
        </motion.header>

        <section aria-labelledby="cooperative-games-heading">
          <h2 id="cooperative-games-heading" className="mb-6 text-2xl font-bold text-gray-900">{t.featured}</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {availableGames.map((game, index) => (
              <GameCard
                key={game.id}
                game={game}
                index={index}
                difficultyLabels={t.difficulty}
                playLabel={t.play}
                comingSoonLabel={t.comingSoon}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
