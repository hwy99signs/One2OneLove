import React, { useState, useMemo } from "react";
import { useLanguage } from "@/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Search, Shuffle, Send, X, MessageSquare, Facebook, Instagram, Twitter, Mail, Linkedin, Settings, Calendar, Loader2, Clock, Trash, Phone, ArrowLeft, AlertCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import ScheduledNotesManager from "../components/lovenotes/ScheduledNotesManager";
import AIPersonalizationModal from "../components/lovenotes/AIPersonalizationModal";
import { loveNotesData } from "../components/lovenotes/LoveNotesData";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const translations = {
  en: {
    title: "Love Notes Collection",
    subtitle: "Choose from heartfelt love notes to express your feelings perfectly",
    back: "Back",
    searchPlaceholder: "Search love notes by title, content, or tags...",
    randomNote: "Random Note",
    send: "Send",
    showing: "Showing",
    loveNotes: "love notes",
    matching: "matching",
    noNotesFound: "No love notes found",
    tryDifferent: "Try a different search or category",
    sendThisNote: "Send This Note",
    sendLoveNote: "Send Love Note",
    scheduleNote: "Schedule for Later",
    personalizeNotes: "Personalize Your Notes",
    personalizeDesc: "Add personal touches to make your love notes extra special",
    partnerName: "Partner's Name",
    partnerNamePlaceholder: "e.g., Sarah",
    partnerNameDesc: 'Replaces "you" and "your" in notes.',
    petName: "Pet Name / Nickname",
    petNamePlaceholder: "e.g., My Love, Babe",
    petNameDesc: 'Appended to notes containing "love".',
    specialPlace: "Special Place",
    specialPlacePlaceholder: "e.g., Paris, our favorite café",
    specialPlaceDesc: "Appended to 'Memories' notes.",
    cancel: "Cancel",
    save: "Save",
    personalizationSaved: "Personalization saved! 💕",
    personalizedFor: "Personalized for",
    recipientPhone: "Recipient's Phone Number",
    recipientPhonePlaceholder: "(555) 123-4567",
    recipientPhoneDesc: "Standard messaging rates may apply",
    schedulingOptions: "📅 Scheduling Options",
    sendNow: "Send Now",
    scheduleLater: "Schedule for Later",
    scheduleDate: "Schedule Date",
    scheduleTime: "Schedule Time",
    scheduleSuccess: "Love note scheduled successfully! 💕",
    viewScheduled: "View Scheduled Notes",
    howItWorks: "📱 How it works:",
    howItWorksItem1: "• Your love note will be sent as a text message",
    howItWorksItem2: "• The recipient will see it came from Love Notes",
    howItWorksItem3: "• They'll get a link to create their own account",
    howItWorksItem4: "• Perfect for surprising your partner!",
    shareViaSocial: "📱 Or Share Via Social Media",
    pleaseEnterPhone: "Please enter recipient phone number",
    pleaseSelectDateTime: "Please select date and time for scheduling",
    openingText: "Opening text message...",
    openingWhatsApp: "Opening WhatsApp...",
    openingFacebook: "Opening Facebook...",
    copiedInstagram: "Copied! Paste in Instagram",
    openingTwitter: "Opening Twitter...",
    copiedTikTok: "Copied! Paste in TikTok",
    openingLinkedIn: "Opening LinkedIn...",
    openingEmail: "Opening email...",
    sendingLimits: "📊 Your Sending Limits",
    partnerNotes: "Notes to Partner",
    smsNotes: "SMS to Others",
    socialMedia: "Social Media",
    remaining: "remaining",
    limitReached: "Limit Reached!",
    limitPartner: "You've reached the limit of 3 love notes to your partner.",
    limitSMS: "You've reached the limit of 3 SMS love notes to others.",
    limitSocial: "You've already sent a love note to this social platform.",
    aiPersonalize: "AI Personalize",
    aiGeneratedNote: "AI-Generated Note",
    categories: {
      all: "All Notes",
      sweet: "Sweet Messages",
      memories: "Memories",
      future: "Future Plans",
      daily: "Daily Notes",
      morning: "Morning Notes",
      night: "Night Notes",
      special: "Special Occasions",
      romantic: "Romantic",
      playful: "Playful",
      deep: "Deep",
      appreciation: "Appreciation",
      dateIdeas: "Date Ideas",
      milestone: "Milestone Celebrations",
      justBecause: "Just Because",
      encouragement: "Encouragement",
      apology: "Apology",
      family: "Family",
      friends: "Friends",
      heartBroken: "Heart Broken",
      sick: "For Someone Sick",
      goodLuck: "Good Luck",
    }
  },
  es: {
    title: "Colección de Notas de Amor",
    subtitle: "Elige entre sinceras notas de amor para expresar tus sentimientos perfectamente",
    back: "Volver",
    searchPlaceholder: "Buscar notas de amor por título, contenido o etiquetas...",
    randomNote: "Nota Aleatoria",
    send: "Enviar",
    showing: "Mostrando",
    loveNotes: "notas de amor",
    matching: "coincidentes",
    noNotesFound: "No se encontraron notas de amor",
    tryDifferent: "Prueba una búsqueda o categoría diferente",
    sendThisNote: "Enviar Esta Nota",
    sendLoveNote: "Enviar Nota de Amor",
    scheduleNote: "Programar para Después",
    schedulingOptions: "📅 Opciones de Programación",
    sendNow: "Enviar Ahora",
    scheduleLater: "Programar para Después",
    scheduleDate: "Fecha de Programación",
    scheduleTime: "Hora de Programación",
    scheduleSuccess: "¡Nota de amor programada exitosamente! 💕",
    viewScheduled: "Ver Notas Programadas",
    pleaseSelectDateTime: "Por favor selecciona fecha y hora para programar",
    cancel: "Cancelar",
    recipientPhone: "Número de Teléfono del Destinatario",
    recipientPhonePlaceholder: "(555) 123-4567",
    pleaseEnterPhone: "Por favor ingresa el número de teléfono del destinatario",
    save: "Guardar",
    personalizeNotes: "Personaliza Tus Notas",
    personalizeDesc: "Agrega toques personales para hacer tus notas de amor extra especiales",
    partnerName: "Nombre de tu Pareja",
    partnerNamePlaceholder: "ej., Sarah",
    petName: "Apodo Cariñoso",
    petNamePlaceholder: "ej., Mi Amor",
    specialPlace: "Lugar Especial",
    specialPlacePlaceholder: "ej., París",
    personalizedFor: "Personalizado para",
    personalizationSaved: "¡Personalización guardada! 💕",
    howItWorks: "📱 Cómo funciona:",
    howItWorksItem1: "• Tu nota de amor se enviará como mensaje de texto",
    howItWorksItem2: "• El destinatario verá que vino de Love Notes",
    howItWorksItem3: "• Recibirá un enlace para crear su propia cuenta",
    howItWorksItem4: "• ¡Perfecto para sorprender a tu pareja!",
    shareViaSocial: "📱 O Comparte por Redes Sociales",
    openingText: "Abriendo mensaje de texto...",
    openingWhatsApp: "Abriendo WhatsApp...",
    openingFacebook: "Abriendo Facebook...",
    copiedInstagram: "¡Copiado! Pega en Instagram",
    openingTwitter: "Abriendo Twitter...",
    copiedTikTok: "¡Copiado! Pega en TikTok",
    openingLinkedIn: "Abriendo LinkedIn...",
    openingEmail: "Abriendo email...",
    recipientPhoneDesc: "Pueden aplicarse tarifas de mensajería estándar",
    partnerNameDesc: 'Reemplaza "tú" y "tu" en las notas.',
    petNameDesc: 'Añadido a notas que contienen "amor".',
    specialPlaceDesc: "Añadido a notas de 'Recuerdos'.",
    sendingLimits: "📊 Tus Límites de Envío",
    partnerNotes: "Notas a la Pareja",
    smsNotes: "SMS a Otros",
    socialMedia: "Redes Sociales",
    remaining: "restantes",
    limitReached: "¡Límite Alcanzado!",
    limitPartner: "Has alcanzado el límite de 3 notas de amor a tu pareja.",
    limitSMS: "Has alcanzado el límite de 3 SMS de amor a otros.",
    limitSocial: "Ya has enviado una nota de amor a esta plataforma social.",
    aiPersonalize: "Personalización con IA",
    aiGeneratedNote: "Nota Generada por IA",
    categories: {
      all: "Todas las Notas",
      sweet: "Mensajes Dulces",
      memories: "Recuerdos",
      future: "Planes Futuros",
      daily: "Notas Diarias",
      morning: "Notas de Mañana",
      night: "Notas de Noche",
      special: "Occasiones Especiales",
      romantic: "Romántico",
      playful: "Juguetón",
      deep: "Profundo",
      appreciation: "Apreciación",
      dateIdeas: "Ideas de Citas",
      milestone: "Celebraciones de Hitos",
      justBecause: "Solo Porque Sí",
      encouragement: "Ánimo",
      apology: "Disculpa",
      family: "Familia",
      friends: "Amigos",
      heartBroken: "Corazón Roto",
      sick: "Para Alguien Enfermo",
      goodLuck: "Buena Suerte",
    }
  },
  fr: {
    title: "Collection de Notes d'Amour",
    subtitle: "Choisissez parmi des notes d'amour sincères pour exprimer vos sentiments parfaitement",
    back: "Retour",
    searchPlaceholder: "Rechercher des notes d'amour par titre, contenu ou tags...",
    randomNote: "Note Aléatoire",
    send: "Envoyer",
    showing: "Affichage de",
    loveNotes: "notes d'amour",
    matching: "correspondant",
    noNotesFound: "Aucune note d'amour trouvée",
    tryDifferent: "Essayez une recherche ou catégorie différente",
    sendThisNote: "Envoyer Cette Note",
    sendLoveNote: "Envoyer Note d'Amour",
    scheduleNote: "Programmer pour Plus Tard",
    schedulingOptions: "📅 Options de Programmation",
    sendNow: "Envoyer Maintenant",
    scheduleLater: "Programmer pour Plus Tard",
    scheduleDate: "Date de Programmation",
    scheduleTime: "Heure de Programmation",
    scheduleSuccess: "Note d'amour programmée avec succès! 💕",
    viewScheduled: "Voir Notes Programmées",
    pleaseSelectDateTime: "Veuillez sélectionner la date et l'heure de programmation",
    cancel: "Annuler",
    recipientPhone: "Numéro de Téléphone du Destinataire",
    recipientPhonePlaceholder: "(555) 123-4567",
    pleaseEnterPhone: "Veuillez entrer le numéro de téléphone du destinataire",
    save: "Enregistrer",
    personalizeNotes: "Personnalisez Vos Notes",
    personalizeDesc: "Ajoutez des touches personnelles pour rendre vos notes extra spéciales",
    partnerName: "Nom du Partenaire",
    partnerNamePlaceholder: "ex., Sarah",
    petName: "Surnom Affectueux",
    petNamePlaceholder: "ex., Mon Amour",
    specialPlace: "Endroit Spécial",
    specialPlacePlaceholder: "ex., Paris",
    personalizedFor: "Personalizado para",
    personalizationSaved: "Personnalisation sauvegardée! 💕",
    howItWorks: "📱 Comment ça marche:",
    howItWorksItem1: "• Votre note d'amour sera envoyée par SMS",
    howItWorksItem2: "• Le destinataire verra qu'elle vient de Love Notes",
    howItWorksItem3: "• Il recevra un lien pour créer son propre compte",
    howItWorksItem4: "• Parfait pour surprendre votre partenaire!",
    shareViaSocial: "📱 Ou Partager via Réseaux Sociaux",
    openingText: "Ouverture du message texte...",
    openingWhatsApp: "Ouverture de WhatsApp...",
    openingFacebook: "Ouverture de Facebook...",
    copiedInstagram: "Copié! Coller dans Instagram",
    openingTwitter: "Ouverture de Twitter...",
    copiedTikTok: "Copié! Coller dans TikTok",
    openingLinkedIn: "Ouverture de LinkedIn...",
    openingEmail: "Ouverture de l'email...",
    recipientPhoneDesc: "Des frais de messagerie standards peuvent s'appliquer",
    partnerNameDesc: 'Remplace "tu" et "ton" dans les notes.',
    petNameDesc: 'Ajouté aux notes contenant "amour".',
    specialPlaceDesc: "Ajouté aux notes de 'Souvenirs'.",
    sendingLimits: "📊 Vos Limites d'Envoi",
    partnerNotes: "Notes au Partenaire",
    smsNotes: "SMS aux Autres",
    socialMedia: "Réseaux Sociaux",
    remaining: "restantes",
    limitReached: "Limite Atteinte !",
    limitPartner: "Vous avez atteint la limite de 3 notes d'amour à votre partenaire.",
    limitSMS: "Vous avez atteint la limite de 3 SMS d'amour à d'autres.",
    limitSocial: "Vous avez déjà envoyé une note d'amour sur cette plateforme sociale.",
    aiPersonalize: "Personnaliser avec IA",
    aiGeneratedNote: "Note Générée par IA",
    categories: {
      all: "Toutes les Notes",
      sweet: "Messages Doux",
      memories: "Souvenirs",
      future: "Plans Futurs",
      daily: "Notes Quotidiennes",
      morning: "Notes du Matin",
      night: "Notes du Soir",
      special: "Occasions Spéciales",
      romantic: "Romantique",
      playful: "Joueur",
      deep: "Profond",
      appreciation: "Appréciation",
      dateIdeas: "Idées de Rendez-vous",
      milestone: "Célébrations de Jalons",
      justBecause: "Juste Parce Que",
      encouragement: "Encouragement",
      apology: "Excuses",
      family: "Famille",
      friends: "Amis",
      heartBroken: "Cœur Brisé",
      sick: "Pour Quelqu'un Malade",
      goodLuck: "Bonne Chance",
    }
  },
  it: {
    title: "Collezione di Note d'Amore",
    subtitle: "Scegli tra sincere note d'amore per esprimere i tuoi sentimenti perfettamente",
    back: "Indietro",
    searchPlaceholder: "Cerca note d'amore per titolo, contenuto o tag...",
    randomNote: "Nota Casuale",
    send: "Invia",
    showing: "Mostrando",
    loveNotes: "note d'amore",
    matching: "corrispondenti",
    noNotesFound: "Nessuna nota d'amore trovata",
    tryDifferent: "Prova una ricerca o categoria diversa",
    sendThisNote: "Invia Questa Nota",
    sendLoveNote: "Invia Nota d'Amore",
    scheduleNote: "Programma per Dopo",
    schedulingOptions: "📅 Opzioni di Programmazione",
    sendNow: "Invia Ora",
    scheduleLater: "Programma per Dopo",
    scheduleDate: "Data di Programmazione",
    scheduleTime: "Ora di Programmazione",
    scheduleSuccess: "Nota d'amore programmata con successo! 💕",
    viewScheduled: "Vedi Note Programmate",
    pleaseSelectDateTime: "Seleziona data e ora per la programmazione",
    cancel: "Annulla",
    recipientPhone: "Numero di Telefono del Destinatario",
    recipientPhonePlaceholder: "(555) 123-4567",
    pleaseEnterPhone: "Inserisci il numero di telefono del destinatario",
    save: "Salva",
    personalizeNotes: "Personalizza le Tue Note",
    personalizeDesc: "Aggiungi tocchi personali per rendere le tue note extra speciali",
    partnerName: "Nome del Partner",
    partnerNamePlaceholder: "es., Sarah",
    petName: "Soprannome Affettuoso",
    petNamePlaceholder: "es., Amore Mio",
    specialPlace: "Luogo Speciale",
    specialPlacePlaceholder: "es., Parigi",
    personalizedFor: "Personalizzato per",
    personalizationSaved: "Personalizzazione salvata! 💕",
    howItWorks: "📱 Come funziona:",
    howItWorksItem1: "• La tua nota d'amore sarà inviata come SMS",
    howItWorksItem2: "• Il destinatario vedrà che proviene da Love Notes",
    howItWorksItem3: "• Riceverà un link per creare il proprio account",
    howItWorksItem4: "• Perfetto per sorprendere il tuo partner!",
    shareViaSocial: "📱 O Condividi Tramite Social Media",
    openingText: "Apertura messaggio di testo...",
    openingWhatsApp: "Apertura WhatsApp...",
    openingFacebook: "Apertura Facebook...",
    copiedInstagram: "Copiato! Incolla su Instagram",
    openingTwitter: "Apertura Twitter...",
    copiedTikTok: "Copiato! Incolla su TikTok",
    openingLinkedIn: "Apertura LinkedIn...",
    openingEmail: "Apertura email...",
    recipientPhoneDesc: "Potrebbero essere applicate tariffe di messaggistica standard",
    partnerNameDesc: 'Sostituisce "tu" e "tuo" nelle note.',
    petNameDesc: 'Aggiunto alle note contenenti "amore".',
    specialPlaceDesc: "Aggiunto alle note di 'Ricordi'.",
    sendingLimits: "📊 I Tuoi Limiti di Invio",
    partnerNotes: "Note al Partner",
    smsNotes: "SMS ad Altri",
    socialMedia: "Social Media",
    remaining: "rimanenti",
    limitReached: "Limite Raggiunto!",
    limitPartner: "Hai raggiunto il limite di 3 note d'amore al tuo partner.",
    limitSMS: "Hai raggiunto il limite di 3 SMS d'amore ad altri.",
    limitSocial: "Hai già inviato una nota d'amore a questa piattaforma social.",
    aiPersonalize: "Personalizza con AI",
    aiGeneratedNote: "Nota Generata da AI",
    categories: {
      all: "Tutte le Note",
      sweet: "Messaggi Dolci",
      memories: "Ricordi",
      future: "Piani Futuri",
      daily: "Note Giornaliere",
      morning: "Note del Mattino",
      night: "Note della Sera",
      special: "Occasioni Speciali",
      romantic: "Romantico",
      playful: "Giocoso",
      deep: "Profondo",
      appreciation: "Apprezzamento",
      dateIdeas: "Idee per Appuntamenti",
      milestone: "Celebrazioni di Traguardi",
      justBecause: "Semplicemente Perché",
      encouragement: "Incoraggiamento",
      apology: "Scuse",
      family: "Famiglia",
      friends: "Amici",
      heartBroken: "Cuore Spezzato",
      sick: "Per Qualcuno Malato",
      goodLuck: "Buona Fortuna",
    }
  },
  de: {
    title: "Liebesbotschaften Sammlung",
    subtitle: "Wählen Sie aus herzlichen Liebesbotschaften, um Ihre Gefühle perfekt auszudrücken",
    back: "Zurück",
    searchPlaceholder: "Liebesbotschaften nach Titel, Inhalt oder Tags suchen...",
    randomNote: "Zufällige Botschaft",
    send: "Senden",
    showing: "Zeige",
    loveNotes: "liebesbotschaften",
    matching: "passend",
    noNotesFound: "Keine Liebesbotschaften gefunden",
    tryDifferent: "Versuche eine andere Suche oder Kategorie",
    sendThisNote: "Diese Botschaft Senden",
    sendLoveNote: "Liebesbotschaft Senden",
    scheduleNote: "Für Später Planen",
    schedulingOptions: "📅 Planungsoptionen",
    sendNow: "Jetzt Senden",
    scheduleLater: "Für Später Planen",
    scheduleDate: "Planungsdatum",
    scheduleTime: "Planungszeit",
    scheduleSuccess: "Liebesbotschaft erfolgreich geplant! 💕",
    viewScheduled: "Geplante Botschaften Ansehen",
    pleaseSelectDateTime: "Bitte wähle Datum und Uhrzeit für die Planung",
    cancel: "Abbrechen",
    recipientPhone: "Telefonnummer des Empfängers",
    recipientPhonePlaceholder: "(555) 123-4567",
    pleaseEnterPhone: "Bitte gib die Telefonnummer des Empfängers ein",
    save: "Speichern",
    personalizeNotes: "Personalisiere Deine Botschaften",
    personalizeDesc: "Füge persönliche Details hinzu für extra spezielle Liebesbotschaften",
    partnerName: "Name des Partners",
    partnerNamePlaceholder: "z.B., Sarah",
    petName: "Kosename",
    petNamePlaceholder: "z.B., Mein Schatz",
    specialPlace: "Besonderer Ort",
    specialPlacePlaceholder: "z.B., Paris",
    personalizedFor: "Personalisiert für",
    personalizationSaved: "Personalisierung gespeichert! 💕",
    howItWorks: "📱 So funktioniert es:",
    howItWorksItem1: "• Deine Liebesbotschaft wird als SMS gesendet",
    howItWorksItem2: "• Der Empfänger sieht, dass sie von Love Notes kam",
    howItWorksItem3: "• Er erhält einen Link, um sein eigenes Konto zu erstellen",
    howItWorksItem4: "• Perfekt, um deinen Partner zu überraschen!",
    shareViaSocial: "📱 Oder Teilen über Social Media",
    openingText: "Öffne SMS...",
    openingWhatsApp: "Öffne WhatsApp...",
    openingFacebook: "Öffne Facebook...",
    copiedInstagram: "Kopiert! In Instagram einfügen",
    openingTwitter: "Öffne Twitter...",
    copiedTikTok: "Kopiert! In TikTok einfügen",
    openingLinkedIn: "Öffne LinkedIn...",
    openingEmail: "Öffne E-Mail...",
    recipientPhoneDesc: "Es können Standard-Nachrichtengebühren anfallen",
    partnerNameDesc: 'Ersetzt "du" und "dein" in Botschaften.',
    petNameDesc: 'Hinzugefügt zu Botschaften mit "Liebe".',
    specialPlaceDesc: "Hinzugefügt zu 'Erinnerungen' Botschaften.",
    sendingLimits: "📊 Deine Sendelimits",
    partnerNotes: "Nachrichten an den Partner",
    smsNotes: "SMS an Andere",
    socialMedia: "Soziale Medien",
    remaining: "übrig",
    limitReached: "Limit Erreicht!",
    limitPartner: "Du hast das Limit von 3 Liebesbotschaften an deinen Partner erreicht.",
    limitSMS: "Du hast das Limit von 3 SMS-Liebesbotschaften an andere erreicht.",
    limitSocial: "Du hast bereits eine Liebesbotschaft an diese soziale Plattform gesendet.",
    aiPersonalize: "AI Personalisieren",
    aiGeneratedNote: "AI-Generierte Nachricht",
    categories: {
      all: "Alle Botschaften",
      sweet: "Süße Nachrichten",
      memories: "Erinnerungen",
      future: "Zukunftspläne",
      daily: "Tägliche Botschaften",
      morning: "Morgenbotschaften",
      night: "Abendbotschaften",
      special: "Besondere Anlässe",
      romantic: "Romantisch",
      playful: "Verspielt",
      deep: "Tief",
      appreciation: "Wertschätzung",
      dateIdeas: "Date-Ideen",
      milestone: "Meilenstein-Feiern",
      justBecause: "Einfach So",
      encouragement: "Ermutigung",
      apology: "Entschuldigung",
      family: "Familie",
      friends: "Freunde",
      heartBroken: "Gebrochenes Herz",
      sick: "Für Jemanden Kranken",
      goodLuck: "Viel Glück",
    }
  }
};

const getCategoriesForLanguage = (t) => [
  { id: 'all', name: t.categories.all, icon: '💝' },
  { id: 'romantic', name: t.categories.romantic, icon: '🌹' },
  { id: 'sweet', name: t.categories.sweet, icon: '💕' },
  { id: 'playful', name: t.categories.playful, icon: '😄' },
  { id: 'deep', name: t.categories.deep, icon: '💭' },
  { id: 'appreciation', name: t.categories.appreciation, icon: '🙏' },
  { id: 'memories', name: t.categories.memories, icon: '📸' },
  { id: 'future', name: t.categories.future, icon: '✨' },
  { id: 'morning', name: t.categories.morning, icon: '☀️' },
  { id: 'night', name: t.categories.night, icon: '🌙' },
  { id: 'daily', name: t.categories.daily, icon: '💖' },
  { id: 'special', name: t.categories.special, icon: '🎉' },
  { id: 'dateIdeas', name: t.categories.dateIdeas, icon: '💐' },
  { id: 'milestone', name: t.categories.milestone, icon: '🏆' },
  { id: 'justBecause', name: t.categories.justBecause, icon: '🎁' },
  { id: 'encouragement', name: t.categories.encouragement, icon: '💪' },
  { id: 'apology', name: t.categories.apology, icon: '😔' },
  { id: 'family', name: t.categories.family, icon: '👨‍👩‍👧‍👦' },
  { id: 'friends', name: t.categories.friends, icon: '👫' },
  { id: 'heartBroken', name: t.categories.heartBroken, icon: '💔' },
  { id: 'sick', name: t.categories.sick, icon: '🌸' },
  { id: 'goodLuck', name: t.categories.goodLuck, icon: '🍀' },
];

const generateNotes = (lang) => {
  const notes = [];
  let id = 1;
  const data = loveNotesData[lang] || loveNotesData.en;

  const categoryOrder = [
    'romantic', 'sweet', 'playful', 'deep', 'appreciation',
    'memories', 'future', 'morning', 'night', 'daily', 'special',
    'dateIdeas', 'milestone', 'justBecause', 'encouragement', 'apology',
    'family', 'friends', 'heartBroken', 'sick', 'goodLuck'
  ];

  categoryOrder.forEach(category => {
    if (data[category] && data[category].length > 0) {
      data[category].forEach(note => {
        notes.push({ id: id++, ...note, category: category });
      });
    }
  });

  return notes;
};

export default function LoveNotes() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const categories = getCategoriesForLanguage(t);
  const queryClient = useQueryClient();
  
  const allNotes = useMemo(() => generateNotes(currentLanguage), [currentLanguage]);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);
  const [sendModalNote, setSendModalNote] = useState(null);
  const [recipientPhone, setRecipientPhone] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [showScheduledNotes, setShowScheduledNotes] = useState(false);
  const [showAIPersonalization, setShowAIPersonalization] = useState(false);


  const [showPersonalization, setShowPersonalization] = useState(false);
  const [partnerName, setPartnerName] = useState(localStorage.getItem('partnerName') || '');
  const [petName, setPetName] = useState(localStorage.getItem('petName') || '');
  const [specialPlace, setSpecialPlace] = useState(localStorage.getItem('specialPlace') || '');

  // Fetch current user
  const { user: currentUser } = useAuth();

  // Fetch user's partner identifier (email or phone) from profile or localStorage
  const partnerIdentifier = currentUser?.partner_email || localStorage.getItem('partnerEmail') || '';

  // Fetch sent love notes for limit tracking
  const { data: sentNotes = [] } = useQuery({
    queryKey: ['sentLoveNotes', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const { data, error } = await supabase
        .from('sent_love_notes')
        .select('*')
        .eq('user_id', currentUser.id);
      if (error) {
        console.error('Error fetching sent notes:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!currentUser?.id,
    initialData: [],
    staleTime: 60 * 1000,
  });

  // Calculate usage limits
  const partnerNotesSent = useMemo(() => sentNotes.filter(n => n.recipient_type === 'partner').length, [sentNotes]);
  const smsNotesSent = useMemo(() => sentNotes.filter(n => n.recipient_type === 'sms').length, [sentNotes]);
  
  const distinctSocialPlatformsUsed = useMemo(() => {
    const platforms = new Set();
    sentNotes.forEach(note => {
      if (note.recipient_type === 'social_media' && note.social_platform) {
        platforms.add(note.social_platform);
      }
    });
    return platforms;
  }, [sentNotes]);
  
  const partnerNotesRemaining = Math.max(0, 3 - partnerNotesSent);
  const smsNotesRemaining = Math.max(0, 3 - smsNotesSent);
  const totalSocialPlatforms = 7; // whatsapp, facebook, instagram, twitter, tiktok, linkedin, email
  const socialPlatformsRemainingCount = Math.max(0, totalSocialPlatforms - distinctSocialPlatformsUsed.size);

  const sendNoteMutation = useMutation({
    mutationFn: async (data) => {
      if (!currentUser?.id) throw new Error('User not authenticated');
      const { data: result, error } = await supabase
        .from('sent_love_notes')
        .insert({ ...data, user_id: currentUser.id })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sentLoveNotes'] });
    }
  });

  const scheduleMutation = useMutation({
    mutationFn: async (data) => {
      if (!currentUser?.id) throw new Error('User not authenticated');
      const { data: result, error } = await supabase
        .from('scheduled_love_notes')
        .insert({ ...data, user_id: currentUser.id })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledNotes'] });
      toast.success(t.scheduleSuccess);
      setSendModalNote(null);
      setRecipientPhone('');
      setIsScheduling(false);
      setScheduleDate('');
      setScheduleTime('');
    }
  });

  const savePersonalization = () => {
    localStorage.setItem('partnerName', partnerName);
    localStorage.setItem('petName', petName);
    localStorage.setItem('specialPlace', specialPlace);
    toast.success(t.personalizationSaved);
    setShowPersonalization(false);
  };

  const personalizeNote = (note) => {
    let personalizedContent = note.content;
    let personalizedTitle = note.title;

    if (partnerName) {
        personalizedContent = personalizedContent.replace(/\b(you)\b/gi, partnerName);
        personalizedContent = personalizedContent.replace(/\b(your)\b/gi, `${partnerName}'s`);
        personalizedTitle = personalizedTitle.replace(/\b(you)\b/gi, partnerName);
        personalizedTitle = personalizedTitle.replace(/\b(your)\b/gi, `${partnerName}'s`);
    }

    if (petName && personalizedContent.toLowerCase().includes('love')) {
      personalizedContent += ` ${petName} 💕`;
    }

    if (specialPlace && note.category === 'memories') {
      personalizedContent += ` Remember our time at ${specialPlace}? ✨`;
    }

    return { ...note, title: personalizedTitle, content: personalizedContent };
  };

  const displayedNotes = useMemo(() => {
    let filtered = allNotes;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(note => note.category === selectedCategory);
    }

    const personalizedNotes = filtered.map(note => personalizeNote(note));

    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      filtered = personalizedNotes.filter(note =>
        note.title.toLowerCase().includes(searchLower) ||
        note.content.toLowerCase().includes(searchLower) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    } else {
        filtered = personalizedNotes;
    }

    return filtered;
  }, [selectedCategory, searchQuery, partnerName, petName, specialPlace, allNotes]);

  const handleRandomNote = () => {
    const randomNoteIndex = Math.floor(Math.random() * allNotes.length);
    const randomNote = allNotes[randomNoteIndex];
    setSelectedNote(randomNote);
  };

  const handleAIGeneratedNote = (generatedNote) => {
    // Add a unique ID and category for the AI-generated note
    const aiNote = {
      id: `ai-${Date.now()}`,
      title: t.aiGeneratedNote,
      content: generatedNote,
      category: 'special', // Or a new 'ai' category if desired
      tags: ['AI', 'Generated'],
    };
    setSelectedNote(aiNote);
    setShowAIPersonalization(false);
  };

  const handleScheduleNote = () => {
    if (!recipientPhone.trim()) {
      toast.error(t.pleaseEnterPhone);
      return;
    }

    if (!scheduleDate || !scheduleTime) {
      toast.error(t.pleaseSelectDateTime);
      return;
    }

    scheduleMutation.mutate({
      note_title: sendModalNote.title,
      note_content: sendModalNote.content,
      scheduled_date: scheduleDate,
      scheduled_time: scheduleTime,
      recipient_phone: recipientPhone,
      delivery_method: 'sms',
      note_language: currentLanguage,
      status: 'scheduled'
    });
  };

  const checkLimitBeforeSend = (method, currentRecipientPhoneInput, targetPlatformIdentifier) => {
    if (!currentUser) {
      // Guest sending (no limits, but also no tracking in backend)
      return { type: 'guest', identifier: currentRecipientPhoneInput || targetPlatformIdentifier };
    }

    let recipientType = 'other';
    let recipientIdentifier = currentRecipientPhoneInput || targetPlatformIdentifier;
    let socialPlatform = undefined;

    // 1. Check for Partner (if partnerIdentifier is defined and currentRecipientPhoneInput matches it)
    // This is a placeholder logic as partnerIdentifier might be an email, not a phone.
    // In a real app, you'd verify if the recipientPhone matches a linked partner's phone.
    if (partnerIdentifier && currentRecipientPhoneInput === partnerIdentifier) {
        recipientType = 'partner';
        if (partnerNotesSent >= 3) {
            toast.error(t.limitPartner, { icon: <AlertCircle className="w-5 h-5" /> });
            return null;
        }
    } else if (method === 'text') {
        // 2. Check for SMS to others (if not identified as partner)
        recipientType = 'sms';
        if (smsNotesSent >= 3) {
            toast.error(t.limitSMS, { icon: <AlertCircle className="w-5 h-5" /> });
            return null;
        }
    } else {
        // 3. Check for Social Media
        const socialPlatforms = ['whatsapp', 'facebook', 'instagram', 'twitter', 'tiktok', 'linkedin', 'email'];
        if (socialPlatforms.includes(method)) {
            recipientType = 'social_media';
            socialPlatform = method;
            if (distinctSocialPlatformsUsed.has(method)) {
                toast.error(t.limitSocial, { icon: <AlertCircle className="w-5 h-5" /> });
                return null;
            }
        }
    }

    return { type: recipientType, identifier: recipientIdentifier, social_platform: socialPlatform };
  };

  const handleSendVia = async (note, method) => {
    const text = `${note.title}\n\n${note.content}\n\n❤️ From One 2 One Love`;
    let currentRecipientPhoneInput = ''; // Used for text/whatsapp
    let targetPlatformIdentifier = method; // Used for social media methods

    if (method === 'text' || (method === 'whatsapp' && recipientPhone.trim())) {
      if (method === 'text' && !recipientPhone.trim()) {
        toast.error(t.pleaseEnterPhone);
        return;
      }
      currentRecipientPhoneInput = recipientPhone;
    }

    const limitCheckResult = checkLimitBeforeSend(method, currentRecipientPhoneInput, targetPlatformIdentifier);

    if (limitCheckResult === null) {
      return; // Limit reached, do not proceed
    }

    // Record the sent note if user is logged in and not a guest send
    if (currentUser && limitCheckResult.type !== 'guest') {
      await sendNoteMutation.mutateAsync({
        note_title: note.title,
        note_content: note.content,
        recipient_type: limitCheckResult.type,
        recipient_identifier: limitCheckResult.identifier,
        social_platform: limitCheckResult.social_platform, // Will be undefined if not social_media type
        sent_date: new Date().toISOString(),
        created_by: currentUser.id,
      });
    }

    // Proceed with sending
    switch(method) {
      case 'text':
        window.open(`sms:${recipientPhone}?body=${encodeURIComponent(text)}`);
        toast.success(t.openingText);
        setSendModalNote(null);
        setRecipientPhone('');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/${recipientPhone ? recipientPhone : ''}?text=${encodeURIComponent(text)}`);
        toast.success(t.openingWhatsApp);
        setSendModalNote(null);
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(text)}`);
        toast.success(t.openingFacebook);
        setSendModalNote(null);
        break;
      case 'instagram':
        navigator.clipboard.writeText(text);
        toast.success(t.copiedInstagram);
        setSendModalNote(null);
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`);
        toast.success(t.openingTwitter);
        setSendModalNote(null);
        break;
      case 'tiktok':
        navigator.clipboard.writeText(text);
        toast.success(t.copiedTikTok);
        setSendModalNote(null);
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`);
        toast.success(t.openingLinkedIn);
        setSendModalNote(null);
        break;
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent(note.title)}&body=${encodeURIComponent(text)}`);
        toast.success(t.openingEmail);
        setSendModalNote(null);
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            to={createPageUrl("Home")}
            className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all"
          >
            <ArrowLeft size={20} className="mr-2" />
            {t.back}
          </Link>
        </div>

        <div className="text-center mb-12">
          <div className="flex flex-col items-center mb-6">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691277042e7df273d4135492/19ffc2fa2_ONE2ONELOVELOGO.png" 
              alt="One2One Love Logo" 
              className="h-24 w-auto mb-4"
            />
            <div className="flex items-center gap-4">
              <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 font-dancing">
                {t.title}
              </h1>
              <Button
                onClick={() => setShowPersonalization(true)}
                variant="outline"
                size="icon"
                className="border-pink-300 hover:bg-pink-50"
              >
                <Settings className="w-5 h-5 text-pink-600" />
              </Button>
            </div>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t.subtitle}
          </p>
          {(partnerName || petName || specialPlace) && ( 
            <p className="text-sm text-pink-600 mt-2">
              ✨ {t.personalizedFor} {partnerName || 'your love'} {petName && `(${petName})`} {specialPlace && `at ${specialPlace}`}
            </p>
          )}
        </div>

        {/* Sending Limits Display */}
        {currentUser && (
          <Card className="max-w-3xl mx-auto mb-8 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
            <CardContent className="pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-purple-500" />
                {t.sendingLimits}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">{t.partnerNotes}</span>
                    <Heart className="w-5 h-5 text-pink-500" />
                  </div>
                  <div className="text-2xl font-bold text-pink-600">{partnerNotesRemaining}/3</div>
                  <div className="text-xs text-gray-500">{t.remaining}</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">{t.smsNotes}</span>
                    <Phone className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{smsNotesRemaining}/3</div>
                  <div className="text-xs text-gray-500">{t.remaining}</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">{t.socialMedia}</span>
                    <MessageSquare className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="text-2xl font-bold text-purple-600">{socialPlatformsRemainingCount}/{totalSocialPlatforms}</div>
                  <div className="text-xs text-gray-500">1 per platform</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-lg"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <Button
            onClick={() => setShowAIPersonalization(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-12 px-6"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            {t.aiPersonalize || 'AI Personalize'}
          </Button>
          <Button
            onClick={handleRandomNote}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 h-12 px-6"
          >
            <Shuffle className="w-5 h-5 mr-2" />
            {t.randomNote}
          </Button>
          <Button
            onClick={() => setShowScheduledNotes(!showScheduledNotes)}
            variant="outline"
            className="h-12 px-6 border-pink-300 hover:bg-pink-50"
          >
            <Calendar className="w-5 h-5 mr-2" />
            {t.viewScheduled}
          </Button>
        </div>

        <AnimatePresence>
          {showScheduledNotes && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <ScheduledNotesManager />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.id);
                  setSearchQuery('');
                }}
                className={`px-4 py-2 rounded-full font-medium transition-all ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-50 shadow'
                }`}
              >
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="text-center mb-8">
          <p className="text-gray-600">
            {t.showing} <span className="font-bold text-pink-600">{displayedNotes.length}</span> {t.loveNotes}
            {searchQuery && (
              <span> {t.matching} "<span className="font-semibold">{searchQuery}</span>"</span>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <AnimatePresence>
            {displayedNotes.map((note) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="h-full hover:shadow-2xl transition-all duration-300 bg-white/80 backdrop-blur-sm border-2 border-transparent hover:border-pink-200 cursor-pointer"
                      onClick={() => setSelectedNote(note)}>
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-900 font-kalam">
                      {note.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed mb-4 line-clamp-3">
                      {note.content}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {note.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gradient-to-r from-pink-100 to-purple-100 text-pink-700 rounded-full text-xs font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <Button
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSendModalNote(note);
                      }}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {t.send}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {displayedNotes.length === 0 && (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">{t.noNotesFound}</h3>
            <p className="text-gray-500">{t.tryDifferent}</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAIPersonalization && (
          <AIPersonalizationModal
            onClose={() => setShowAIPersonalization(false)}
            onNoteGenerated={handleAIGeneratedNote}
            currentLanguage={currentLanguage}
            t={t}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPersonalization && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPersonalization(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative"
            >
              <button
                onClick={() => setShowPersonalization(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="mb-6">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 mb-2 font-dancing">
                  {t.personalizeNotes}
                </h2>
                <p className="text-gray-600">
                  {t.personalizeDesc}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="partner-name" className="block text-sm font-medium text-gray-700 mb-2">
                    {t.partnerName}
                  </label>
                  <Input
                    id="partner-name"
                    placeholder={t.partnerNamePlaceholder}
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">{t.partnerNameDesc}</p>
                </div>

                <div>
                  <label htmlFor="pet-name" className="block text-sm font-medium text-gray-700 mb-2">
                    {t.petName}
                  </label>
                  <Input
                    id="pet-name"
                    placeholder={t.petNamePlaceholder}
                    value={petName}
                    onChange={(e) => setPetName(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">{t.petNameDesc}</p>
                </div>

                <div>
                  <label htmlFor="special-place" className="block text-sm font-medium text-gray-700 mb-2">
                    {t.specialPlace}
                  </label>
                  <Input
                    id="special-place"
                    placeholder={t.specialPlacePlaceholder}
                    value={specialPlace}
                    onChange={(e) => setSpecialPlace(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">{t.specialPlaceDesc}</p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowPersonalization(false)}
                >
                  {t.cancel}
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                  onClick={savePersonalization}
                >
                  {t.save}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedNote && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedNote(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative"
            >
              <button
                onClick={() => setSelectedNote(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="mb-6">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 mb-4 font-dancing">
                  {selectedNote.title}
                </h2>
                <p className="text-lg text-gray-700 leading-relaxed">
                  {selectedNote.content}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {selectedNote.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gradient-to-r from-pink-100 to-purple-100 text-pink-700 rounded-full text-sm font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <Button
                onClick={() => {
                  setSendModalNote(selectedNote); 
                  setSelectedNote(null);
                }}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-lg py-6"
              >
                <Send className="w-5 h-5 mr-2" />
                {t.sendThisNote}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {sendModalNote && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setSendModalNote(null);
              setRecipientPhone('');
              setIsScheduling(false);
              setScheduleDate('');
              setScheduleTime('');
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full relative overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <Heart className="w-6 h-6 text-pink-500" />
                  <h2 className="text-xl font-bold text-gray-900">
                    {t.sendLoveNote}
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setSendModalNote(null);
                    setRecipientPhone('');
                    setIsScheduling(false);
                    setScheduleDate('');
                    setScheduleTime('');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="bg-pink-50 rounded-2xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-gray-900">
                      {sendModalNote.title}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {sendModalNote.content}
                  </p>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Phone className="w-4 h-4" />
                    {t.recipientPhone}
                  </label>
                  <Input
                    type="tel"
                    placeholder={t.recipientPhonePlaceholder}
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    className="h-12"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t.recipientPhoneDesc}
                  </p>
                </div>

                <div className="bg-purple-50 rounded-xl p-4">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-purple-900 mb-3">
                    {t.schedulingOptions}
                  </h4>
                  <div className="flex gap-2 mb-4">
                    <Button
                      type="button"
                      variant={!isScheduling ? "default" : "outline"}
                      className={!isScheduling ? "flex-1 bg-gradient-to-r from-pink-500 to-purple-600" : "flex-1"}
                      onClick={() => setIsScheduling(false)}
                    >
                      {t.sendNow}
                    </Button>
                    <Button
                      type="button"
                      variant={isScheduling ? "default" : "outline"}
                      className={isScheduling ? "flex-1 bg-gradient-to-r from-pink-500 to-purple-600" : "flex-1"}
                      onClick={() => setIsScheduling(true)}
                    >
                      <Calendar className="w-4 h-4 mr-1" />
                      {t.scheduleLater}
                    </Button>
                  </div>

                  <AnimatePresence>
                    {isScheduling && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3"
                      >
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            {t.scheduleDate}
                          </label>
                          <Input
                            type="date"
                            value={scheduleDate}
                            onChange={(e) => setScheduleDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="h-10"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            {t.scheduleTime}
                          </label>
                          <Input
                            type="time"
                            value={scheduleTime}
                            onChange={(e) => setScheduleTime(e.target.value)}
                            className="h-10"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="bg-purple-50 rounded-xl p-4">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-purple-900 mb-2">
                    {t.howItWorks}
                  </h4>
                  <ul className="space-y-1 text-xs text-purple-800">
                    <li>{t.howItWorksItem1}</li>
                    <li>{t.howItWorksItem2}</li>
                    <li>{t.howItWorksItem3}</li>
                    <li>{t.howItWorksItem4}</li>
                  </ul>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    {t.shareViaSocial}
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => handleSendVia(sendModalNote, 'facebook')}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 hover:border-blue-600 hover:bg-blue-50 transition-all"
                    >
                      <Facebook className="w-6 h-6 text-blue-600" />
                      <span className="text-xs font-medium text-gray-900">Facebook</span>
                    </button>

                    <button
                      onClick={() => handleSendVia(sendModalNote, 'instagram')}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 hover:border-pink-600 hover:bg-pink-50 transition-all"
                    >
                      <Instagram className="w-6 h-6 text-pink-600" />
                      <span className="text-xs font-medium text-gray-900">Instagram</span>
                    </button>

                    <button
                      onClick={() => handleSendVia(sendModalNote, 'tiktok')}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 hover:border-cyan-400 hover:bg-cyan-50 transition-all"
                    >
                      <div className="w-6 h-6 bg-gradient-to-br from-black to-cyan-400 rounded-lg flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                        </svg>
                      </div>
                      <span className="text-xs font-medium text-gray-900">TikTok</span>
                    </button>

                    <button
                      onClick={() => handleSendVia(sendModalNote, 'twitter')}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all"
                    >
                      <Twitter className="w-6 h-6 text-blue-400" />
                      <span className="text-xs font-medium text-gray-900">Twitter</span>
                    </button>

                    <button
                      onClick={() => handleSendVia(sendModalNote, 'linkedin')}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 hover:border-blue-700 hover:bg-blue-50 transition-all"
                    >
                      <Linkedin className="w-6 h-6 text-blue-700" />
                      <span className="text-xs font-medium text-gray-900">LinkedIn</span>
                    </button>

                    <button
                      onClick={() => handleSendVia(sendModalNote, 'email')}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 hover:border-gray-600 hover:bg-gray-50 transition-all"
                    >
                      <Mail className="w-6 h-6 text-gray-600" />
                      <span className="text-xs font-medium text-gray-900">Email</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSendModalNote(null);
                    setRecipientPhone('');
                    setIsScheduling(false);
                    setScheduleDate('');
                    setScheduleTime('');
                  }}
                  className="flex-1 h-12"
                >
                  {t.cancel}
                </Button>
                <Button
                  onClick={() => isScheduling ? handleScheduleNote() : handleSendVia(sendModalNote, 'text')}
                  disabled={scheduleMutation.isPending}
                  className="flex-1 h-12 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                >
                  {scheduleMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <>
                      {isScheduling ? <Calendar className="w-4 h-4 mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                      {isScheduling ? t.scheduleNote : t.sendLoveNote}
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}