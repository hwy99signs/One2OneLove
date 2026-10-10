import React, { useState, useMemo, useEffect } from "react";
import { useLanguage } from "@/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Search, Shuffle, Send, X, MessageSquare, Facebook, Instagram, Twitter, Mail, Linkedin, Settings, Calendar, Loader2, Clock, Trash, Phone, ArrowLeft, AlertCircle, Sparkles, Lock, Coins } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { getLoveNoteDeliveryReadiness, getLoveNotePriceQuote, listSentLoveNotes, recordSentLoveNote, sendLoveNoteSms, scheduleLoveNote } from "@/lib/loveNotesService";
import { trackFeatureAction } from "@/lib/featureUsageService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import ScheduledNotesManager from "../components/lovenotes/ScheduledNotesManager";
import AIPersonalizationModal from "../components/lovenotes/AIPersonalizationModal";



import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { getAiConfig } from "@/lib/aiService";
import { getTokenWallet, isTokensRequiredError, tokenRequiredDetails, listTokenUnlocks, unlockTokenContent } from "@/lib/tokenService";
import { apiRequest } from "@/lib/apiClient";

const LOVE_NOTE_MAX_CHARACTERS = 171;
const clampLoveNote = (value) => Array.from(String(value || '')).slice(0, LOVE_NOTE_MAX_CHARACTERS).join('');
// Total SMS body limit — title + note + signature line + sign-off — mirrored
// from CREDIT_CONFIG.maxSmsBodyCharacters in worker/credit-config.ts; the
// server enforces the same cap on the fully composed body.
const SMS_BODY_MAX_CHARACTERS = 201;
const SMS_SIGNOFF_TEXT = '❤️ One2OneLove';

const translations = {
  en: {
    title: "Love Notes Collection",
    subtitle: "Choose from heartfelt love notes to express your feelings perfectly",
    back: "Back",
    searchPlaceholder: "Search love notes by title, content, or tags...",
    clearSearch: "Clear search",
    closePersonalization: "Close personalization",
    closeNotePreview: "Close note preview",
    closeSendDialog: "Close send love note",
    randomNote: "Random Note",
    chooseNoteCategory: "Choose a Note Category",
    chooseNoteCategoryDesc: "Select a category first. A random note will then be generated from that category.",
    send: "Send",
    showing: "Showing",
    subjectsAria: "Love note subjects",
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
    recipientPhoneDesc: "One2OneLove SMS delivery uses Credit. The Credit cost is shown before sending. Recipient carrier rates may apply.",
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
    anonTitle: "Your name signs your note",
    anonBody: "Your name appears at the foot of your note, so they know it's from you. Rather stay a secret admirer? Check 'Send Anonymous' and your note arrives with no name attached — just your title, your words, and a ❤️ One2OneLove sign-off.",
    senderNameLimitNote: "Your name is included in the character limit of the note.",
    sendAnonymous: "Send Anonymous",
    signatureSignedAs: "Signed with your account first name:",
    signatureSourceNote: "Your note is signed with the first name on your account — not a username.",
    signatureFirstNameRequired: "You need a first name on your account before you can send Love Notes.",
    signatureOverLimit: "With your name, this note is over the 201-character limit. Check Send Anonymous to send it without a signature.",
    shareViaSocial: "📱 Or Share Via Social Media",
    pleaseEnterPhone: "Please enter recipient phone number",
    pleaseSelectDateTime: "Please select date and time for scheduling",
    openingText: "Love Note sent by One2OneLove.",
    smsBillingPending: "Love Note delivered. Credit usage is being finalized.",
    openingWhatsApp: "Opening WhatsApp...",
    openingFacebook: "Opening Facebook...",
    copiedInstagram: "Copied! Paste in Instagram",
    openingTwitter: "Opening Twitter...",
    copiedTikTok: "Copied! Paste in TikTok",
    openingLinkedIn: "Opening LinkedIn...",
    openingEmail: "Opening email...",
    sendingLimits: "📊 Love Note Sending & Billing",
    firstPaidSend: "Credit Wallet",
    freeFirstSend: "No recurring fee",
    firstSendUsed: "Paid with Credit",
    additionalSms: "One2OneLove SMS delivery",
    billedWithSubscription: "Credit cost shown before sending",
    partnerNotes: "Notes to Partner",
    smsNotes: "SMS to Others",
    socialMedia: "Social Media",
    remaining: "remaining",
    limitReached: "Limit Reached!",
    limitPartner: "Your Love Note sending allowance has been reached.",
    limitSMS: "One2OneLove SMS sending is unavailable for this account right now.",
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
      holiday: "Holiday",
      missingYou: "Missing You",
      religious: "Religious",
      service: "Service",
      workplace: "Workplace",
      lgbtqRomantic: "LGBTQ Romantic",
      lgbtqSupport: "LGBTQ Support",
      lgbtqMilestone: "LGBTQ Milestone",
    }
  },
  es: {
    title: "Colección de Notas de Amor",
    subtitle: "Elige entre sinceras notas de amor para expresar tus sentimientos perfectamente",
    back: "Volver",
    searchPlaceholder: "Buscar notas de amor por título, contenido o etiquetas...",
    clearSearch: "Borrar búsqueda",
    closePersonalization: "Cerrar personalización",
    closeNotePreview: "Cerrar vista previa de la nota",
    closeSendDialog: "Cerrar envío de nota de amor",
    randomNote: "Nota Aleatoria",
    chooseNoteCategory: "Elige una Categoría de Nota",
    chooseNoteCategoryDesc: "Primero selecciona una categoría. Luego se generará una nota aleatoria de esa categoría.",
    send: "Enviar",
    showing: "Mostrando",
    subjectsAria: "Temas de notas de amor",
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
    anonTitle: "Tu nombre firma tu nota",
    anonBody: "Tu nombre aparece al final de tu nota, para que sepan que viene de ti. ¿Prefieres seguir siendo un admirador secreto? Marca 'Enviar como anónimo' y tu nota llegará sin ningún nombre: solo tu título, tus palabras y la firma ❤️ One2OneLove.",
    senderNameLimitNote: "Tu nombre está incluido en el límite de caracteres de la nota.",
    sendAnonymous: "Enviar como anónimo",
    signatureSignedAs: "Firmado con el primer nombre de tu cuenta:",
    signatureSourceNote: "Tu nota se firma con el primer nombre de tu cuenta, no con un nombre de usuario.",
    signatureFirstNameRequired: "Necesitas un primer nombre en tu cuenta antes de poder enviar Notas de Amor.",
    signatureOverLimit: "Con tu nombre, esta nota supera el límite de 201 caracteres. Marca Enviar como anónimo para enviarla sin firma.",
    shareViaSocial: "📱 O Comparte por Redes Sociales",
    openingText: "Nota de Amor enviada por One2OneLove.",
    smsBillingPending: "Nota de Amor entregada. El uso de Crédito aún se está finalizando.",
    openingWhatsApp: "Abriendo WhatsApp...",
    openingFacebook: "Abriendo Facebook...",
    copiedInstagram: "¡Copiado! Pega en Instagram",
    openingTwitter: "Abriendo Twitter...",
    copiedTikTok: "¡Copiado! Pega en TikTok",
    openingLinkedIn: "Abriendo LinkedIn...",
    openingEmail: "Abriendo email...",
    recipientPhoneDesc: "La entrega SMS de One2OneLove usa Crédito. El costo en Crédito se muestra antes de enviar. Pueden aplicarse tarifas del operador del destinatario.",
    partnerNameDesc: 'Reemplaza "tú" y "tu" en las notas.',
    petNameDesc: 'Añadido a notas que contienen "amor".',
    specialPlaceDesc: "Añadido a notas de 'Recuerdos'.",
    sendingLimits: "📊 Envío y Facturación de Notas de Amor",
    firstPaidSend: "Billetera de Crédito",
    freeFirstSend: "Sin cuota recurrente",
    firstSendUsed: "Pagado con Crédito",
    additionalSms: "Entrega SMS de One2OneLove",
    billedWithSubscription: "El costo en Crédito se muestra antes de enviar",
    partnerNotes: "Notas a la Pareja",
    smsNotes: "SMS a Otros",
    socialMedia: "Redes Sociales",
    remaining: "restantes",
    limitReached: "¡Límite Alcanzado!",
    limitPartner: "Has alcanzado tu límite de envío de Notas de Amor.",
    limitSMS: "El envío de SMS de One2OneLove no está disponible para esta cuenta en este momento.",
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
      holiday: "Festividades",
      missingYou: "Te Echo de Menos",
      religious: "Religioso",
      service: "Servicio",
      workplace: "Lugar de Trabajo",
      lgbtqRomantic: "Romance LGBTQ",
      lgbtqSupport: "Apoyo LGBTQ",
      lgbtqMilestone: "Hitos LGBTQ",
    }
  },
  fr: {
    title: "Collection de Notes d'Amour",
    subtitle: "Choisissez parmi des notes d'amour sincères pour exprimer vos sentiments parfaitement",
    back: "Retour",
    searchPlaceholder: "Rechercher des notes d'amour par titre, contenu ou tags...",
    clearSearch: "Effacer la recherche",
    closePersonalization: "Fermer la personnalisation",
    closeNotePreview: "Fermer l’aperçu de la note",
    closeSendDialog: "Fermer l’envoi de la note d’amour",
    randomNote: "Note Aléatoire",
    chooseNoteCategory: "Choisissez une Catégorie de Note",
    chooseNoteCategoryDesc: "Sélectionnez d'abord une catégorie. Une note aléatoire sera ensuite générée à partir de cette catégorie.",
    send: "Envoyer",
    showing: "Affichage de",
    subjectsAria: "Thèmes des notes d’amour",
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
    anonTitle: "Votre nom signe votre note",
    anonBody: "Votre nom apparaît au bas de votre note, pour qu’ils sachent qu’elle vient de vous. Vous préférez rester un admirateur secret ? Cochez « Envoyer anonymement » et votre note arrivera sans aucun nom : juste votre titre, vos mots et la signature ❤️ One2OneLove.",
    senderNameLimitNote: "Votre nom est inclus dans la limite de caractères de la note.",
    sendAnonymous: "Envoyer anonymement",
    signatureSignedAs: "Signé avec le prénom de votre compte :",
    signatureSourceNote: "Votre note est signée avec le prénom figurant sur votre compte — pas un nom d’utilisateur.",
    signatureFirstNameRequired: "Vous devez avoir un prénom sur votre compte avant de pouvoir envoyer des Notes d’Amour.",
    signatureOverLimit: "Avec votre nom, cette note dépasse la limite de 201 caractères. Cochez Envoyer anonymement pour l’envoyer sans signature.",
    shareViaSocial: "📱 Ou Partager via Réseaux Sociaux",
    openingText: "Note d’Amour envoyée par One2OneLove.",
    smsBillingPending: "Note d’Amour livrée. L’utilisation du Crédit est en cours de finalisation.",
    openingWhatsApp: "Ouverture de WhatsApp...",
    openingFacebook: "Ouverture de Facebook...",
    copiedInstagram: "Copié! Coller dans Instagram",
    openingTwitter: "Ouverture de Twitter...",
    copiedTikTok: "Copié! Coller dans TikTok",
    openingLinkedIn: "Ouverture de LinkedIn...",
    openingEmail: "Ouverture de l'email...",
    recipientPhoneDesc: "La livraison SMS One2OneLove utilise du Crédit. Le coût en Crédit est affiché avant l’envoi. Des frais opérateur peuvent s’appliquer au destinataire.",
    partnerNameDesc: 'Remplace "tu" et "ton" dans les notes.',
    petNameDesc: 'Ajouté aux notes contenant "amour".',
    specialPlaceDesc: "Ajouté aux notes de 'Souvenirs'.",
    sendingLimits: "📊 Envoi et Facturation des Notes d’Amour",
    firstPaidSend: "Portefeuille de Crédit",
    freeFirstSend: "Aucun frais récurrent",
    firstSendUsed: "Payé avec du Crédit",
    additionalSms: "Livraison SMS One2OneLove",
    billedWithSubscription: "Le coût en Crédit est affiché avant l’envoi",
    partnerNotes: "Notes au Partenaire",
    smsNotes: "SMS aux Autres",
    socialMedia: "Réseaux Sociaux",
    remaining: "restantes",
    limitReached: "Limite Atteinte !",
    limitPartner: "Vous avez atteint votre limite d’envoi de Notes d’Amour.",
    limitSMS: "L’envoi de SMS One2OneLove n’est pas disponible pour ce compte pour le moment.",
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
      holiday: "Fêtes",
      missingYou: "Tu Me Manques",
      religious: "Religieux",
      service: "Service",
      workplace: "Lieu de Travail",
      lgbtqRomantic: "Romance LGBTQ",
      lgbtqSupport: "Soutien LGBTQ",
      lgbtqMilestone: "Étapes LGBTQ",
    }
  },
  it: {
    title: "Collezione di Note d'Amore",
    subtitle: "Scegli tra sincere note d'amore per esprimere i tuoi sentimenti perfettamente",
    back: "Indietro",
    searchPlaceholder: "Cerca note d'amore per titolo, contenuto o tag...",
    clearSearch: "Cancella ricerca",
    closePersonalization: "Chiudi personalizzazione",
    closeNotePreview: "Chiudi anteprima della nota",
    closeSendDialog: "Chiudi invio della nota d’amore",
    randomNote: "Nota Casuale",
    chooseNoteCategory: "Scegli una Categoria di Nota",
    chooseNoteCategoryDesc: "Seleziona prima una categoria. Verrà quindi generata una nota casuale da quella categoria.",
    send: "Invia",
    showing: "Mostrando",
    subjectsAria: "Argomenti delle note d’amore",
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
    anonTitle: "Il tuo nome firma la tua nota",
    anonBody: "Il tuo nome compare in calce alla tua nota, così sapranno che viene da te. Preferisci restare un ammiratore segreto? Seleziona 'Invia in forma anonima' e la tua nota arriverà senza alcun nome: solo il titolo, le tue parole e la firma ❤️ One2OneLove.",
    senderNameLimitNote: "Il tuo nome è incluso nel limite di caratteri della nota.",
    sendAnonymous: "Invia in forma anonima",
    signatureSignedAs: "Firmato con il nome del tuo account:",
    signatureSourceNote: "La tua nota viene firmata con il nome presente sul tuo account, non con un nome utente.",
    signatureFirstNameRequired: "Devi avere un nome sul tuo account prima di poter inviare Note d’amore.",
    signatureOverLimit: "Con il tuo nome, questa nota supera il limite di 201 caratteri. Seleziona Invia in forma anonima per inviarla senza firma.",
    shareViaSocial: "📱 O Condividi Tramite Social Media",
    openingText: "Nota d’Amore inviata da One2OneLove.",
    smsBillingPending: "Nota d’Amore consegnata. L’utilizzo del Credito è in fase di finalizzazione.",
    openingWhatsApp: "Apertura WhatsApp...",
    openingFacebook: "Apertura Facebook...",
    copiedInstagram: "Copiato! Incolla su Instagram",
    openingTwitter: "Apertura Twitter...",
    copiedTikTok: "Copiato! Incolla su TikTok",
    openingLinkedIn: "Apertura LinkedIn...",
    openingEmail: "Apertura email...",
    recipientPhoneDesc: "La consegna SMS One2OneLove usa Credito. Il costo in Credito viene mostrato prima dell’invio. Potrebbero applicarsi tariffe dell’operatore del destinatario.",
    partnerNameDesc: 'Sostituisce "tu" e "tuo" nelle note.',
    petNameDesc: 'Aggiunto alle note contenenti "amore".',
    specialPlaceDesc: "Aggiunto alle note di 'Ricordi'.",
    sendingLimits: "📊 Invio e Fatturazione delle Note d’Amore",
    firstPaidSend: "Portafoglio Credito",
    freeFirstSend: "Nessuna quota ricorrente",
    firstSendUsed: "Pagato con Credito",
    additionalSms: "Consegna SMS One2OneLove",
    billedWithSubscription: "Il costo in Credito viene mostrato prima dell’invio",
    partnerNotes: "Note al Partner",
    smsNotes: "SMS ad Altri",
    socialMedia: "Social Media",
    remaining: "rimanenti",
    limitReached: "Limite Raggiunto!",
    limitPartner: "Hai raggiunto il limite di invio delle Note d’Amore.",
    limitSMS: "L’invio SMS di One2OneLove non è disponibile per questo account in questo momento.",
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
      holiday: "Festività",
      missingYou: "Mi Manchi",
      religious: "Religioso",
      service: "Servizio",
      workplace: "Posto di Lavoro",
      lgbtqRomantic: "Romanticismo LGBTQ",
      lgbtqSupport: "Supporto LGBTQ",
      lgbtqMilestone: "Traguardi LGBTQ",
    }
  },
  de: {
    title: "Liebesbotschaften Sammlung",
    subtitle: "Wählen Sie aus herzlichen Liebesbotschaften, um Ihre Gefühle perfekt auszudrücken",
    back: "Zurück",
    searchPlaceholder: "Liebesbotschaften nach Titel, Inhalt oder Tags suchen...",
    clearSearch: "Suche löschen",
    closePersonalization: "Personalisierung schließen",
    closeNotePreview: "Vorschau der Liebesbotschaft schließen",
    closeSendDialog: "Versand der Liebesbotschaft schließen",
    randomNote: "Zufällige Botschaft",
    chooseNoteCategory: "Wähle eine Nachrichtenkategorie",
    chooseNoteCategoryDesc: "Wähle zuerst eine Kategorie. Danach wird eine zufällige Nachricht aus dieser Kategorie erstellt.",
    send: "Senden",
    showing: "Zeige",
    subjectsAria: "Themen der Liebesbotschaften",
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
    anonTitle: "Dein Name unterschreibt deine Botschaft",
    anonBody: "Dein Name erscheint am Ende deiner Botschaft, damit sie wissen, dass sie von dir kommt. Lieber ein heimlicher Verehrer bleiben? Aktiviere 'Anonym senden', und deine Botschaft kommt ganz ohne Namen an — nur mit deinem Titel, deinen Worten und der Signatur ❤️ One2OneLove.",
    senderNameLimitNote: "Dein Name ist im Zeichenlimit der Botschaft enthalten.",
    sendAnonymous: "Anonym senden",
    signatureSignedAs: "Signiert mit dem Vornamen deines Kontos:",
    signatureSourceNote: "Deine Botschaft wird mit dem Vornamen auf deinem Konto signiert — nicht mit einem Benutzernamen.",
    signatureFirstNameRequired: "Du brauchst einen Vornamen auf deinem Konto, bevor du Liebesbotschaften senden kannst.",
    signatureOverLimit: "Mit deinem Namen überschreitet diese Botschaft das Limit von 201 Zeichen. Aktiviere Anonym senden, um sie ohne Signatur zu senden.",
    shareViaSocial: "📱 Oder Teilen über Social Media",
    openingText: "Liebesnachricht von One2OneLove gesendet.",
    smsBillingPending: "Liebesnachricht zugestellt. Die Credit-Nutzung wird noch abgeschlossen.",
    openingWhatsApp: "Öffne WhatsApp...",
    openingFacebook: "Öffne Facebook...",
    copiedInstagram: "Kopiert! In Instagram einfügen",
    openingTwitter: "Öffne Twitter...",
    copiedTikTok: "Kopiert! In TikTok einfügen",
    openingLinkedIn: "Öffne LinkedIn...",
    openingEmail: "Öffne E-Mail...",
    recipientPhoneDesc: "One2OneLove-SMS verwenden Credit. Die Credit-Kosten werden vor dem Senden angezeigt. Beim Empfänger können Mobilfunkgebühren anfallen.",
    partnerNameDesc: 'Ersetzt "du" und "dein" in Botschaften.',
    petNameDesc: 'Hinzugefügt zu Botschaften mit "Liebe".',
    specialPlaceDesc: "Hinzugefügt zu 'Erinnerungen' Botschaften.",
    sendingLimits: "📊 Versand und Abrechnung von Liebesnachrichten",
    firstPaidSend: "Credit-Wallet",
    freeFirstSend: "Keine laufende Gebühr",
    firstSendUsed: "Mit Credit bezahlt",
    additionalSms: "One2OneLove-SMS-Zustellung",
    billedWithSubscription: "Credit-Kosten werden vor dem Senden angezeigt",
    partnerNotes: "Nachrichten an den Partner",
    smsNotes: "SMS an Andere",
    socialMedia: "Soziale Medien",
    remaining: "übrig",
    limitReached: "Limit Erreicht!",
    limitPartner: "Du hast dein Sendelimit für Liebesbotschaften erreicht.",
    limitSMS: "One2OneLove-SMS sind für dieses Konto derzeit nicht verfügbar.",
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
      holiday: "Feiertage",
      missingYou: "Du Fehlst Mir",
      religious: "Religiös",
      service: "Dienst",
      workplace: "Arbeitsplatz",
      lgbtqRomantic: "LGBTQ Romantik",
      lgbtqSupport: "LGBTQ Unterstützung",
      lgbtqMilestone: "LGBTQ Meilensteine",
    }
  }
};

const getCategoriesForLanguage = (t, lang = 'en') => {
  const categories = [
  { id: 'all', name: t.categories.all, icon: '💝' },
  { id: 'romantic', name: t.categories.romantic, icon: '🌹' },
  { id: 'lgbtqRomantic', name: t.categories.lgbtqRomantic, icon: '🏳️‍🌈' },
  { id: 'lgbtqSupport', name: t.categories.lgbtqSupport, icon: '🤝' },
  { id: 'lgbtqMilestone', name: t.categories.lgbtqMilestone, icon: '🎉' },
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
  { id: 'holiday', name: t.categories.holiday, icon: '🎊' },
  { id: 'missingYou', name: t.categories.missingYou, icon: '💌' },
  { id: 'religious', name: t.categories.religious, icon: '🕊️' },
  { id: 'service', name: t.categories.service, icon: '🤝' },
  { id: 'workplace', name: t.categories.workplace, icon: '💼' },
];
  const [allCategory, ...noteCategories] = categories;
  const availableCategories = noteCategories;
  return [
    allCategory,
    ...availableCategories.sort((a, b) => a.name.localeCompare(b.name, lang, { sensitivity: 'base' }))
  ];
};

const allSubjectLabels = {
  en: 'All',
  es: 'Todas',
  fr: 'Toutes',
  it: 'Tutte',
  de: 'Alle',
};

const casualSubjectLabels = {
  en: 'Casual',
  es: 'Casual',
  fr: 'Amical',
  it: 'Informale',
  de: 'Locker',
};

const getSearchWords = (value) =>
  String(value || '')
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .match(/[a-z0-9]+/g) || [];

const matchesLoveNoteSearch = (note, query) => {
  const queryWords = getSearchWords(query);
  if (queryWords.length === 0) return true;

  const searchableWords = getSearchWords([
    note.title,
    ...(Array.isArray(note.tags) ? note.tags : []),
  ].join(' '));

  const getSearchForms = (term) => {
    const forms = new Set([term, term + 's', term + 'es', term + 'ed', term + 'ing']);
    if (term.endsWith('e') && term.length > 2) {
      forms.add(term + 'd');
      forms.add(term.slice(0, -1) + 'ing');
    }
    if (term.endsWith('y') && term.length > 2) {
      forms.add(term.slice(0, -1) + 'ies');
      forms.add(term.slice(0, -1) + 'ied');
    }
    return forms;
  };

  return queryWords.every(queryWord => {
    const forms = getSearchForms(queryWord);
    return searchableWords.some(word => forms.has(word));
  });
};

const OPEN_HOUSE_LOVE_NOTE_CATEGORIES = new Set([
  'morning',
  'playful',
  'appreciation',
  'encouragement',
  'goodLuck',
  'holiday',
  'workplace',
]);

const OPEN_HOUSE_LOVE_NOTES_COPY = {
  en: {
    badge: 'LIMITED-TIME OPEN HOUSE',
    locked: 'LOCKED',
    membersOnly: 'Members Only',
    categoryTitle: 'More Love Notes are waiting inside',
    categoryBody: 'Create a free verified One2OneLove account to unlock the complete Love Notes collection.',
    sendTitle: 'Ready to send it?',
    sendBody: 'Create a free verified account to participate. One2OneLove SMS delivery uses Credit; sharing through your own apps remains free.',
    unlock: 'Create FREE Account',
    signIn: 'Sign In',
  },
  es: {
    badge: 'PUERTAS ABIERTAS POR TIEMPO LIMITADO',
    locked: 'BLOQUEADO',
    membersOnly: 'Solo miembros',
    categoryTitle: 'Hay más Notas de Amor esperando dentro',
    categoryBody: 'Crea una cuenta One2OneLove gratuita y verificada para desbloquear toda la colección de Notas de Amor.',
    sendTitle: '¿Listo para enviarla?',
    sendBody: 'Crea una cuenta gratuita y verificada para participar. El envío SMS de One2OneLove usa Crédito; compartir desde tus propias aplicaciones sigue siendo gratis.',
    unlock: 'Crear Cuenta GRATIS',
    signIn: 'Iniciar sesión',
  },
  fr: {
    badge: 'PORTES OUVERTES À DURÉE LIMITÉE',
    locked: 'VERROUILLÉ',
    membersOnly: 'Membres uniquement',
    categoryTitle: 'D’autres Notes d’Amour vous attendent',
    categoryBody: 'Créez un compte One2OneLove gratuit et vérifié pour débloquer toute la collection de Notes d’Amour.',
    sendTitle: 'Prêt à l’envoyer ?',
    sendBody: 'Créez un compte gratuit et vérifié pour participer. L’envoi SMS One2OneLove utilise du Crédit; le partage via vos propres applications reste gratuit.',
    unlock: 'Créer un Compte GRATUIT',
    signIn: 'Se connecter',
  },
  it: {
    badge: 'PORTE APERTE A TEMPO LIMITATO',
    locked: 'BLOCCATO',
    membersOnly: 'Solo membri',
    categoryTitle: 'Ci sono altre Note d’Amore da scoprire',
    categoryBody: 'Crea un account One2OneLove gratuito e verificato per sbloccare l’intera raccolta di Note d’Amore.',
    sendTitle: 'Pronto a inviarla?',
    sendBody: 'Crea un account gratuito e verificato per partecipare. L’invio SMS One2OneLove usa Credito; la condivisione tramite le tue app resta gratuita.',
    unlock: 'Crea Account GRATUITO',
    signIn: 'Accedi',
  },
  de: {
    badge: 'ZEITLICH BEGRENZTER TAG DER OFFENEN TÜR',
    locked: 'GESPERRT',
    membersOnly: 'Nur für Mitglieder',
    categoryTitle: 'Weitere Liebesnachrichten warten auf dich',
    categoryBody: 'Erstelle ein kostenloses verifiziertes One2OneLove-Konto, um die vollständige Liebesnachrichten-Sammlung freizuschalten.',
    sendTitle: 'Bereit zum Senden?',
    sendBody: 'Erstelle ein kostenloses verifiziertes Konto. One2OneLove-SMS verwenden Credit; das Teilen über deine eigenen Apps bleibt kostenlos.',
    unlock: 'KOSTENLOSES Konto Erstellen',
    signIn: 'Anmelden',
  },
};

function loveNotesCategoryTeaser(name) {
  return String(name || '').trim() || '•••';
}

export default function LoveNotes() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const { data: publicNoteCatalog } = useQuery({
    queryKey:['love-note-library',currentLanguage],
    queryFn:()=>apiRequest('/api/love-note-library?lang='+encodeURIComponent(currentLanguage)),
  });
  const allCategories = getCategoriesForLanguage(t, currentLanguage);
  const subjectTabs = [
    {
      id: 'all',
      name: allSubjectLabels[currentLanguage] || allSubjectLabels.en,
      neonClass: 'border-cyan-300 bg-cyan-50 text-cyan-700 shadow-[0_0_8px_rgba(34,211,238,0.95),0_0_18px_rgba(34,211,238,0.65)]',
      activeClass: 'border-cyan-200 bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(34,211,238,1),0_0_26px_rgba(34,211,238,0.9)]',
    },
    {
      id: 'romantic',
      name: t.categories.romantic,
      neonClass: 'border-fuchsia-300 bg-fuchsia-50 text-fuchsia-700 shadow-[0_0_8px_rgba(232,121,249,0.95),0_0_18px_rgba(217,70,239,0.65)]',
      activeClass: 'border-fuchsia-200 bg-fuchsia-400 text-slate-950 shadow-[0_0_12px_rgba(232,121,249,1),0_0_26px_rgba(217,70,239,0.9)]',
    },
    {
      id: 'family',
      name: t.categories.family,
      neonClass: 'border-lime-300 bg-lime-50 text-lime-700 shadow-[0_0_8px_rgba(163,230,53,0.95),0_0_18px_rgba(132,204,22,0.65)]',
      activeClass: 'border-lime-200 bg-lime-400 text-slate-950 shadow-[0_0_12px_rgba(163,230,53,1),0_0_26px_rgba(132,204,22,0.9)]',
    },
    {
      id: 'casual',
      name: casualSubjectLabels[currentLanguage] || casualSubjectLabels.en,
      neonClass: 'border-violet-300 bg-violet-50 text-violet-700 shadow-[0_0_8px_rgba(196,181,253,0.95),0_0_18px_rgba(139,92,246,0.65)]',
      activeClass: 'border-violet-200 bg-violet-400 text-white shadow-[0_0_12px_rgba(196,181,253,1),0_0_26px_rgba(139,92,246,0.9)]',
    },
  ];
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  
  const allNotes = publicNoteCatalog?.notes || [];
  const { data: purchasedNoteData } = useQuery({
    queryKey:['love-note-purchases',currentLanguage,currentUser?.id],
    queryFn:()=>listTokenUnlocks('love_note_template_unlock'),
    enabled:Boolean(currentUser?.id),
  });
  const purchasedNoteKeys = new Set((purchasedNoteData?.unlocks||[]).map(x=>String(x.content_key)));
  const [noteToUnlock,setNoteToUnlock] = useState(null);
  const [noteUnlockError,setNoteUnlockError] = useState('');
  const [noteUnlockBusy,setNoteUnlockBusy] = useState(false);
  const notePriceCents = 49;
  const loadPrivateNote = async (note) => {
    const result=await apiRequest('/api/love-note-library/item?lang='+encodeURIComponent(currentLanguage)+'&id='+encodeURIComponent(note.id));
    return personalizeNote(result.note);
  };
  const openLibraryNote = async (note, send=false) => {
    if(!purchasedNoteKeys.has(String(note.id))){
      setNoteToUnlock(note);setNoteUnlockError('');return;
    }
    try{
      const full=await loadPrivateNote(note);
      if(send)setSendModalNote(full);else setSelectedNote(full);
    }catch(e){setNoteUnlockError(e?.message||'Unable to open Love Note.');setNoteToUnlock(note);}
  };
  const purchaseLibraryNote = async () => {
    if(!noteToUnlock||noteUnlockBusy)return;
    if(!currentUser?.id){window.location.href='/SignUp?return=/LoveNotes';return;}
    setNoteUnlockBusy(true);setNoteUnlockError('');
    try{
      const note=noteToUnlock;
      await unlockTokenContent({featureCode:'love_note_template_unlock',contentKey:String(note.id),source:'love_notes',idempotencyKey:'love-note:'+currentUser.id+':'+note.id});
      await queryClient.invalidateQueries({queryKey:['love-note-purchases',currentLanguage,currentUser?.id]});
      const full=await loadPrivateNote(note);
      setNoteToUnlock(null);setSelectedNote(full);
    }catch(e){
      if(isTokensRequiredError(e))setNoteUnlockError('Add $0.49 Credit to unlock this Love Note.');
      else setNoteUnlockError(e?.message||'Unable to unlock Love Note.');
    }finally{setNoteUnlockBusy(false);}
  };

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);
  const [sendModalNote, setSendModalNote] = useState(null);
  const [recipientPhone, setRecipientPhone] = useState('');
  const [sendAnonymous, setSendAnonymous] = useState(false);
  const [signatureError, setSignatureError] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const todayLocalDate = useMemo(() => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 10);
  }, []);
  const [showScheduledNotes, setShowScheduledNotes] = useState(false);
  const [showAIPersonalization, setShowAIPersonalization] = useState(false);
  const [showRandomCategoryPicker, setShowRandomCategoryPicker] = useState(false);

  const [showPersonalization, setShowPersonalization] = useState(false);
  const [partnerName, setPartnerName] = useState(localStorage.getItem('partnerName') || '');
  const [petName, setPetName] = useState(localStorage.getItem('petName') || '');
  const [specialPlace, setSpecialPlace] = useState(localStorage.getItem('specialPlace') || '');

  // Fetch current user
  const hasMemberAccess = Boolean(currentUser?.id);

  // Account first name — the ONLY signature source (owner, 2026-10-08).
  // Signup collects one full-name field ("Your Name"); the first name is
  // its first whitespace-delimited token. It is never a username and never
  // derived from the email: mergeUser() in AuthContext falls back to the
  // email prefix, and then to the literal 'Member', when no genuine name
  // exists — both count as NO first name here, as does a stored value that
  // is itself an email address. The server derives the same first name
  // from the account record (public.users.name) and enforces the same
  // rule, so this display always matches what will actually print.
  const accountFirstName = useMemo(() => {
    const fullName = String(currentUser?.name || '').replace(/\s+/g, ' ').trim();
    if (!fullName || fullName.includes('@')) return '';
    const emailPrefix = String(currentUser?.email || '').split('@')[0].trim();
    if (emailPrefix && fullName.toLowerCase() === emailPrefix.toLowerCase()) return '';
    if (fullName === 'Member') return '';
    return fullName.split(' ')[0] || '';
  }, [currentUser]);

  useEffect(() => {
    if (sendModalNote) {
      setSendAnonymous(false);
      setSignatureError('');
    }
  }, [sendModalNote]);

  // Signature math — the same composed-body count the server enforces
  // (worker/credit-config.ts smsBodyFor, code points via Array.from):
  // signing adds the name plus 3 characters ("—", the space after it, and
  // the line break before the ❤️ sign-off). The "\n\n" separators and the
  // sign-off are part of every body, signed or not; Send Anonymous adds 0.
  const effectiveSenderName = sendAnonymous ? '' : accountFirstName;
  const signatureShare = !effectiveSenderName
    ? 0
    : Array.from(effectiveSenderName).length + 3;
  const dialogBodyCharacters = sendModalNote
    ? Array.from(sendModalNote.title || '').length + 2
      + Array.from(sendModalNote.content || '').length + signatureShare + 2
      + Array.from(SMS_SIGNOFF_TEXT).length
    : 0;

  const validateSignatureForSend = () => {
    // HARD RULE (owner, 2026-10-08): "They cannot send messages without a
    // first name." No first name on the account blocks the send outright —
    // Send Anonymous does NOT bypass it — and the server rejects the same
    // sends (403 first_name_required). This is the same rule, applied in
    // the dialog before the request is made.
    if (!accountFirstName) {
      setSignatureError(t.signatureFirstNameRequired);
      toast.error(t.signatureFirstNameRequired);
      return false;
    }
    if (dialogBodyCharacters > SMS_BODY_MAX_CHARACTERS) {
      setSignatureError(t.signatureOverLimit);
      return false;
    }
    setSignatureError('');
    return true;
  };
  const openHouseCopy = OPEN_HOUSE_LOVE_NOTES_COPY[currentLanguage] || OPEN_HOUSE_LOVE_NOTES_COPY.en;
  const [showOpenHouseLock, setShowOpenHouseLock] = useState(false);
  const [openHouseLockReason, setOpenHouseLockReason] = useState('category');

  const aiPlanEligible = hasMemberAccess;

  const { data: aiConfig } = useQuery({
    queryKey: ['loveNotesAiConfig', currentUser?.id],
    queryFn: getAiConfig,
    enabled: !!currentUser?.id && aiPlanEligible,
    staleTime: 5 * 60 * 1000,
  });

  const categories = useMemo(() => allCategories, [allCategories]);
  const aiPersonalizationReady = aiPlanEligible && aiConfig?.configured === true;

  // Fetch user's partner identifier (email or phone) from profile or localStorage
  const partnerIdentifier = currentUser?.partner_email || localStorage.getItem('partnerEmail') || '';

  // Fetch sent love notes for limit tracking
  const { data: sentNotes = [] } = useQuery({
    queryKey: ['sentLoveNotes', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      return await listSentLoveNotes();
    },
    enabled: !!currentUser?.id,
    staleTime: 60 * 1000,
  });

  const { data: deliveryReadiness } = useQuery({
    queryKey: ['loveNoteDeliveryReadiness', currentUser?.id],
    queryFn: getLoveNoteDeliveryReadiness,
    enabled: !!currentUser?.id,
    staleTime: 5 * 60 * 1000,
  });
  const scheduledSmsReady = deliveryReadiness?.scheduledSmsReady === true;

  const { data: tokenWallet } = useQuery({
    queryKey: ['o2olTokenWallet', currentUser?.id],
    queryFn: getTokenWallet,
    enabled: !!currentUser?.id,
    staleTime: 10 * 1000,
  });
  const tokenBalance = Number(tokenWallet?.wallet?.balance || 0);
  const formatCredit = (cents) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(cents||0)/100);
  const quotePhone = String(recipientPhone || '').replace(/[\s().-]/g, '');
  const { data: priceQuote } = useQuery({
    queryKey: ['loveNotePriceQuote', quotePhone],
    queryFn: () => getLoveNotePriceQuote(quotePhone),
    enabled: !!currentUser?.id && /^\+[1-9]\d{7,14}$/.test(quotePhone),
    staleTime: 15 * 1000,
    retry: false,
  });
  const tokenAccessError = (error) => {
    if (!isTokensRequiredError(error)) return false;
    const info = tokenRequiredDetails(error);
    setOpenHouseLockReason('send');
    setShowOpenHouseLock(true);
    toast.message(`Add Credit to send — this Love Note requires ${formatCredit(info.required)} Credit. Your Credit balance is ${formatCredit(info.balance)}.`);
    return true;
  };



  // Calculate usage limits
  
  const distinctSocialPlatformsUsed = useMemo(() => {
    const platforms = new Set();
    sentNotes.forEach(note => {
      if (note.recipient_type === 'social_media' && note.social_platform) {
        platforms.add(note.social_platform);
      }
    });
    return platforms;
  }, [sentNotes]);
  
  const totalSocialPlatforms = 7; // whatsapp, facebook, instagram, twitter, tiktok, linkedin, email
  const socialPlatformsRemainingCount = Math.max(0, totalSocialPlatforms - distinctSocialPlatformsUsed.size);

  const sendNoteMutation = useMutation({
    mutationFn: async (data) => {
      if (!currentUser?.id) throw new Error('User not authenticated');
      return await recordSentLoveNote(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sentLoveNotes'] });
      queryClient.invalidateQueries({ queryKey: ['loveNoteUsage'] });
    }
  });

  const scheduleMutation = useMutation({
    mutationFn: async (data) => {
      if (!currentUser?.id) throw new Error('User not authenticated');
      return await scheduleLoveNote(data);
    },
    onSuccess: () => {
      trackFeatureAction('Love Notes', `love-note-category:${sendModalNote?.category || 'uncategorized'}`);
      queryClient.invalidateQueries({ queryKey: ['scheduledNotes'] });
      queryClient.invalidateQueries({ queryKey: ['loveNoteUsage'] });
      queryClient.invalidateQueries({ queryKey: ['o2olTokenWallet'] });
      toast.success(t.scheduleSuccess);
      setSendModalNote(null);
      setRecipientPhone('');
      setIsScheduling(false);
      setScheduleDate('');
      setScheduleTime('');
    },
    onError: (error) => {
      if (!tokenAccessError(error)) toast.error(error?.message || t.limitSMS);
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
      personalizedContent += ` ${petName}.`;
    }

    if (specialPlace && note.category === 'memories') {
      personalizedContent += ` Remember our time at ${specialPlace}?`;
    }

    return { ...note, title: personalizedTitle, content: clampLoveNote(personalizedContent) };
  };

  const displayedNotes = useMemo(() => {
    let filtered = allNotes;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(note => note.category === selectedCategory);
    }

    if (selectedSubject !== 'all') {
      filtered = filtered.filter(note => {
        if (note.subject !== selectedSubject) return false;
        if (selectedSubject === 'family') {
          return !['romantic', 'lgbtqRomantic', 'dateIdeas'].includes(note.category);
        }
        return true;
      });
    }

    const personalizedNotes = filtered;

    if (searchQuery.trim()) {
      filtered = personalizedNotes.filter(note => matchesLoveNoteSearch(note, searchQuery));
    } else {
        filtered = personalizedNotes;
    }

    return filtered;
  }, [selectedCategory, selectedSubject, searchQuery, partnerName, petName, specialPlace, allNotes, hasMemberAccess]);

  const handleRandomNote = () => {
    setShowRandomCategoryPicker(true);
  };

  const handleRandomCategorySelect = (categoryId) => {
    if (!hasMemberAccess && !OPEN_HOUSE_LOVE_NOTE_CATEGORIES.has(categoryId)) {
      setOpenHouseLockReason('category');
      setShowOpenHouseLock(true);
      return;
    }

    const categoryNotes = allNotes.filter(note => note.category === categoryId);

    if (categoryNotes.length === 0) {
      toast.error(t.noNotesFound);
      return;
    }

    const randomNoteIndex = Math.floor(Math.random() * categoryNotes.length);
    const randomNote = categoryNotes[randomNoteIndex];

    setSelectedCategory(categoryId);
    setSelectedSubject('all');
    setSearchQuery('');
    setShowRandomCategoryPicker(false);
    openLibraryNote(randomNote);
  };

  const handleAIGeneratedNote = (generatedNote) => {
    const rawContent = typeof generatedNote === 'string' ? generatedNote : generatedNote?.content || '';
    const sanitizedContent = clampLoveNote(rawContent.replace(/\p{Extended_Pictographic}/gu, '').trim());
    const aiNote = {
      id: `ai-${Date.now()}`,
      title: t.aiGeneratedNote,
      content: sanitizedContent,
      category: 'special',
      tags: ['AI', 'Generated'],
    };
    setSelectedNote(aiNote);
    setShowAIPersonalization(false);
  };

  const handleScheduleNote = () => {
    if (!hasMemberAccess) {
      setOpenHouseLockReason('send');
      setShowOpenHouseLock(true);
      return;
    }

    if (!recipientPhone.trim()) {
      toast.error(t.pleaseEnterPhone);
      return;
    }

    if (!scheduleDate || !scheduleTime) {
      toast.error(t.pleaseSelectDateTime);
      return;
    }

    if (!validateSignatureForSend()) {
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
      send_anonymous: sendAnonymous,
      status: 'scheduled'
    });
  };

  const checkLimitBeforeSend = (method, currentRecipientPhoneInput, targetPlatformIdentifier) => {
    if (!hasMemberAccess || !currentUser) return null;

    let recipientType = 'other';
    let recipientIdentifier = currentRecipientPhoneInput || targetPlatformIdentifier;
    let socialPlatform = undefined;

    // 1. Check for Partner (if partnerIdentifier is defined and currentRecipientPhoneInput matches it)
    // This is a placeholder logic as partnerIdentifier might be an email, not a phone.
    // In a real app, you'd verify if the recipientPhone matches a linked partner's phone.
    if (partnerIdentifier && currentRecipientPhoneInput === partnerIdentifier) {
        recipientType = 'partner';
    } else if (method === 'text') {
        // SMS allowance is enforced server-side from the member's paid plan.
        recipientType = 'sms';
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
    if (!hasMemberAccess) {
      setOpenHouseLockReason('send');
      setShowOpenHouseLock(true);
      return;
    }

    const text = `${note.title}\n\n${note.content}\n\n❤️ From One 2 One Love`;
    let currentRecipientPhoneInput = '';
    const targetPlatformIdentifier = method;

    if (method === 'text' || (method === 'whatsapp' && recipientPhone.trim())) {
      if (method === 'text' && !recipientPhone.trim()) {
        toast.error(t.pleaseEnterPhone);
        return;
      }
      currentRecipientPhoneInput = recipientPhone;
    }

    const limitCheckResult = checkLimitBeforeSend(method, currentRecipientPhoneInput, targetPlatformIdentifier);
    if (limitCheckResult === null) return;

    if (method === 'text') {
      if (!validateSignatureForSend()) return;
      try {
        const result = await sendLoveNoteSms({
          note_title: note.title,
          note_content: note.content,
          recipient_phone: recipientPhone,
          send_anonymous: sendAnonymous,
        });
        queryClient.invalidateQueries({ queryKey: ['sentLoveNotes'] });
        queryClient.invalidateQueries({ queryKey: ['loveNoteUsage'] });
        queryClient.invalidateQueries({ queryKey: ['o2olTokenWallet'] });
        trackFeatureAction('Love Notes', `love-note-category:${note.category || 'uncategorized'}`);
        toast.success(t.openingText);
        setSendModalNote(null);
        setRecipientPhone('');
      } catch (error) {
        if (!tokenAccessError(error)) toast.error(error?.message || t.limitSMS);
      }
      return;
    }

    if (currentUser) {
      await sendNoteMutation.mutateAsync({
        note_title: note.title,
        note_content: note.content,
        recipient_type: limitCheckResult.type,
        recipient_identifier: limitCheckResult.identifier,
        social_platform: limitCheckResult.social_platform,
        sent_date: new Date().toISOString(),
        created_by: currentUser.id,
      });
      trackFeatureAction('Love Notes', `love-note-category:${note.category || 'uncategorized'}`);
    }

    switch(method) {
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
              src="/assets/o2ol-approved-logo.png" 
              alt="One2One Love Logo" 
              className="h-24 w-auto mb-4"
            />
            <div className="flex items-center gap-4">
              <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 font-dancing">
                {t.title}
              </h1>
              <Button
                type="button"
                onClick={() => setShowPersonalization(true)}
                aria-label={t.personalizeNotes}
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

        {/* Love Note Credit */}
        {currentUser && (
          <Card className="max-w-3xl mx-auto mb-8 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
            <CardContent className="pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Coins className="w-5 h-5 text-purple-500" />
                One2OneLove Credit
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="text-sm font-semibold text-gray-700">Credit Balance</div>
                  <div className="mt-2 text-3xl font-black text-purple-600">{formatCredit(tokenBalance)}</div>
                  <Link to="/Credit?return=/LoveNotes" className="mt-2 inline-flex text-xs font-black text-purple-700 hover:underline">Add Credit</Link>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="text-sm font-semibold text-gray-700">One2OneLove SMS</div>
                  {priceQuote ? (
                    priceQuote.excluded ? (
                      <>
                        <div className="mt-2 text-3xl font-black text-gray-500">—</div>
                        <div className="mt-1 text-xs text-gray-500">SMS is not offered to this destination. Sharing from your own apps below is free.</div>
                      </>
                    ) : (
                      <>
                        <div className="mt-2 text-3xl font-black text-blue-600">{formatCredit(Number(priceQuote.tokenCost || 0))} <span className="text-sm">Credit / send</span></div>
                        <div className="mt-1 text-xs text-gray-500">{priceQuote.regionLabel || 'Supported destination'} — the Credit cost is confirmed before One2OneLove sends the SMS.</div>
                      </>
                    )
                  ) : (
                    <>
                      <div className="mt-2 text-xl font-black text-blue-600">Enter recipient number</div>
                      <div className="mt-1 text-xs text-gray-500">The Credit cost will be shown before you send.</div>
                    </>
                  )}
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="text-sm font-semibold text-gray-700">Share from Your Apps</div>
                  <div className="mt-2 text-3xl font-black text-emerald-600">FREE</div>
                  <div className="mt-1 text-xs text-gray-500">WhatsApp, email, social sharing and copy actions do not spend Credit.</div>
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
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label={t.clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          {aiPersonalizationReady && (
            <Button
              onClick={() => setShowAIPersonalization(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-12 px-6"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              {t.aiPersonalize || 'AI Personalize'}
            </Button>
          )}
          <Button
            onClick={handleRandomNote}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 h-12 px-6"
          >
            <Shuffle className="w-5 h-5 mr-2" />
            {t.randomNote}
          </Button>
          {currentUser && (
            <Button
              onClick={() => setShowScheduledNotes(!showScheduledNotes)}
              variant="outline"
              className="h-12 px-6 border-pink-300 hover:bg-pink-50"
            >
              <Calendar className="w-5 h-5 mr-2" />
              {t.viewScheduled}
            </Button>
          )}
        </div>

        <AnimatePresence>
          {showRandomCategoryPicker && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl mx-auto mb-8"
            >
              <Card className="border-2 border-pink-200 bg-white/95 shadow-xl">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">
                    {t.chooseNoteCategory}
                  </CardTitle>
                  <p className="text-gray-600 mt-2">
                    {t.chooseNoteCategoryDesc}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {categories.filter(category => category.id !== 'all').map((category) => {
                      const locked = false;
                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => handleRandomCategorySelect(category.id)}
                          aria-label={locked ? `${openHouseCopy.locked}: ${openHouseCopy.membersOnly}` : category.name}
                          className={`px-4 py-2 rounded-full font-medium border shadow-sm transition-all ${
                            locked
                              ? 'bg-slate-50 text-slate-600 border-slate-300 hover:border-purple-300'
                              : 'bg-white text-gray-700 hover:bg-pink-50 hover:text-pink-700 border-pink-200'
                          }`}
                        >
                          <span className="mr-2">{category.icon}</span>
                          {locked ? (
                            <span className="inline-flex items-center gap-1.5">
                              <span>{loveNotesCategoryTeaser(category.name)}</span>
                              <span aria-hidden="true" className="inline-block h-3 w-10 rounded bg-slate-300 blur-[2px]" />
                              <Lock className="h-3.5 w-3.5" />
                            </span>
                          ) : category.name}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-6 flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowRandomCategoryPicker(false)}
                      className="border-pink-300 hover:bg-pink-50"
                    >
                      {t.cancel}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

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
            {categories.map((category) => {
              const locked = false;
              return (
                <button
                  key={category.id}
                  onClick={() => {
                    if (locked) {
                      setOpenHouseLockReason('category');
                      setShowOpenHouseLock(true);
                      return;
                    }
                    setSelectedCategory(category.id);
                    setSelectedSubject('all');
                    setSearchQuery('');
                  }}
                  aria-label={locked ? `${openHouseCopy.locked}: ${openHouseCopy.membersOnly}` : category.name}
                  className={`px-4 py-2 rounded-full font-medium transition-all border ${
                    locked
                      ? 'bg-slate-50 text-slate-600 border-slate-300 hover:border-purple-300 shadow-sm'
                      : selectedCategory === category.id
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-transparent shadow-lg scale-105'
                        : 'bg-white text-gray-700 border-transparent hover:bg-gray-50 shadow'
                  }`}
                >
                  <span className="mr-2">{category.icon}</span>
                  {locked ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span>{loveNotesCategoryTeaser(category.name)}</span>
                      <span aria-hidden="true" className="inline-block h-3 w-10 rounded bg-slate-300 blur-[2px]" />
                      <Lock className="h-3.5 w-3.5" />
                    </span>
                  ) : category.name}
                </button>
              );
            })}
          </div>

        </div>

        {(
          <div className="mb-5 flex justify-center">
            <div
              className="inline-flex flex-wrap items-center justify-center gap-1.5 rounded-xl border border-pink-100 bg-white/80 p-1.5 shadow-sm"
              role="tablist"
              aria-label={t.subjectsAria}
            >
              {subjectTabs.map((subcategory) => (
                <button
                  key={subcategory.id}
                  type="button"
                  role="tab"
                  aria-selected={selectedSubject === subcategory.id}
                  onClick={() => {
                    setSelectedSubject(subcategory.id);
                    setSearchQuery('');
                  }}
                  className={`px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-extrabold tracking-wide transition-all animate-pulse motion-reduce:animate-none hover:scale-105 ${
                    selectedSubject === subcategory.id
                      ? subcategory.activeClass
                      : subcategory.neonClass
                  }`}
                  style={{ animationDuration: '0.9s' }}
                >
                  {subcategory.name}
                </button>
              ))}
            </div>
          </div>
        )}

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
                <Card className="h-full hover:shadow-xl transition-all duration-300 bg-slate-100 border-2 border-slate-200 cursor-pointer"
                      onClick={() => openLibraryNote(note)}>
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-900 font-kalam">
                      {note.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-500 leading-relaxed mb-4">
                      🔒 Unlock for $0.49 to read this Love Note.
                    </p>
                    <div className="flex items-center gap-2 mb-4 text-sm text-gray-500"><Lock className="w-4 h-4" /> Locked until $0.49 unlock</div>
                    <Button
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        openLibraryNote(note,true);
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

        {noteToUnlock && (
          <div className="fixed inset-0 z-[90] bg-black/60 flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div className="max-w-md w-full rounded-2xl bg-white shadow-2xl p-6">
              <h2 className="text-2xl font-bold">{noteToUnlock.title}</h2>
              <p className="mt-3 text-gray-500">The Love Note text is locked. Unlock this note for $0.49 Credit to read, copy, or share it. You will not be charged for viewing the title.</p>
              <p className="mt-2 text-sm font-semibold">Each note is a one-time purchase for your account.</p>
              {noteUnlockError && <p role="alert" className="mt-3 text-red-700">{noteUnlockError}</p>}
              <div className="mt-5 flex gap-3">
                <Button disabled={noteUnlockBusy} onClick={purchaseLibraryNote}>{noteUnlockBusy?'Unlocking…':'Unlock for $0.49'}</Button>
                <Button variant="outline" onClick={()=>{setNoteToUnlock(null);setNoteUnlockError('');}}>Cancel</Button>
              </div>
            </div>
          </div>
        )}
        {displayedNotes.length === 0 && (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">{t.noNotesFound}</h3>
            <p className="text-gray-500">{t.tryDifferent}</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showOpenHouseLock && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowOpenHouseLock(false)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 10 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-purple-100"
              role="dialog"
              aria-modal="true"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-purple-100">
                {openHouseLockReason === 'send'
                  ? <Coins className="h-7 w-7 text-purple-700" />
                  : <Lock className="h-7 w-7 text-purple-700" />}
              </div>
              <div className="text-center">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-purple-700">{openHouseCopy.badge}</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {openHouseLockReason === 'send' ? openHouseCopy.sendTitle : openHouseCopy.categoryTitle}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                  {openHouseLockReason === 'send' ? openHouseCopy.sendBody : openHouseCopy.categoryBody}
                </p>
              </div>
              <div className="mt-6 flex flex-col gap-2">
                <Link
                  to={currentUser ? '/Credit?return=/LoveNotes' : '/SignUp?open-house=love-notes&type=individual'}
                  onClick={() => setShowOpenHouseLock(false)}
                >
                  <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
                    <Coins className="mr-2 h-4 w-4" />
                    {currentUser ? 'Add Credit To Send' : openHouseCopy.unlock}
                  </Button>
                </Link>
                <Link to="/SignIn" onClick={() => setShowOpenHouseLock(false)}>
                  <Button variant="outline" className="w-full">{openHouseCopy.signIn}</Button>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showAIPersonalization && aiPersonalizationReady && (
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
              role="dialog"
              aria-modal="true"
              aria-labelledby="love-notes-personalization-title"
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative"
            >
              <button
                type="button"
                onClick={() => setShowPersonalization(false)}
                aria-label={t.closePersonalization}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="mb-6">
                <h2 id="love-notes-personalization-title" className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 mb-2 font-dancing">
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
              role="dialog"
              aria-modal="true"
              aria-labelledby="love-note-preview-title"
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative"
            >
              <button
                type="button"
                onClick={() => setSelectedNote(null)}
                aria-label={t.closeNotePreview}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="mb-6">
                <h2 id="love-note-preview-title" className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 mb-4 font-dancing">
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
              role="dialog"
              aria-modal="true"
              aria-labelledby="love-note-send-dialog-title"
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full relative overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <Heart className="w-6 h-6 text-pink-500" />
                  <h2 id="love-note-send-dialog-title" className="text-xl font-bold text-gray-900">
                    {t.sendLoveNote}
                  </h2>
                </div>
                <button
                  type="button"
                  aria-label={t.closeSendDialog}
                  onClick={() => {
                    setSendModalNote(null);
                    setRecipientPhone('');
                    setSendAnonymous(false);
                    setSignatureError('');
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
                  <div className={`mt-2 text-right text-xs ${dialogBodyCharacters > SMS_BODY_MAX_CHARACTERS ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                    {dialogBodyCharacters}/{SMS_BODY_MAX_CHARACTERS}
                  </div>
                </div>

                <div>
                  <label htmlFor="love-note-recipient-phone" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Phone className="w-4 h-4" />
                    {t.recipientPhone}
                  </label>
                  <Input
                    id="love-note-recipient-phone"
                    type="tel"
                    placeholder={t.recipientPhonePlaceholder}
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    className="h-12"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {hasMemberAccess ? t.recipientPhoneDesc : openHouseCopy.sendBody}
                  </p>
                </div>

                <div>
                  {accountFirstName ? (
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold text-gray-900">{t.signatureSignedAs}</span>{' '}
                      <span className={sendAnonymous ? 'line-through opacity-60' : 'font-semibold text-gray-900'}>{accountFirstName}</span>
                    </p>
                  ) : (
                    <p className="flex items-start gap-1.5 text-sm font-medium text-red-600">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      {t.signatureFirstNameRequired}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {t.signatureSourceNote}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t.senderNameLimitNote}
                  </p>
                  <label htmlFor="love-note-send-anonymous" className="flex items-center gap-2 mt-3 text-sm text-gray-700 cursor-pointer">
                    <input
                      id="love-note-send-anonymous"
                      type="checkbox"
                      checked={sendAnonymous}
                      onChange={(e) => {
                        setSendAnonymous(e.target.checked);
                        if (signatureError) setSignatureError('');
                      }}
                      className="h-4 w-4 accent-purple-600"
                    />
                    {t.sendAnonymous}
                  </label>
                  {signatureError && accountFirstName && (
                    <p className="flex items-center gap-1 text-xs text-red-600 mt-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {signatureError}
                    </p>
                  )}
                </div>

                {scheduledSmsReady && (
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
                          <label htmlFor="love-note-schedule-date" className="block text-xs font-medium text-gray-700 mb-1">
                            {t.scheduleDate}
                          </label>
                          <Input
                            id="love-note-schedule-date"
                            type="date"
                            value={scheduleDate}
                            onChange={(e) => setScheduleDate(e.target.value)}
                            min={todayLocalDate}
                            className="h-10"
                          />
                        </div>
                        <div>
                          <label htmlFor="love-note-schedule-time" className="block text-xs font-medium text-gray-700 mb-1">
                            {t.scheduleTime}
                          </label>
                          <Input
                            id="love-note-schedule-time"
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
                )}

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

                <div className="bg-purple-50 rounded-xl p-4">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-purple-900 mb-2">
                    {t.anonTitle}
                  </h4>
                  <p className="text-xs text-purple-800">
                    {t.anonBody}
                  </p>
                </div>

                <div>
                  <p className="block text-sm font-semibold text-gray-700 mb-3">
                    {t.shareViaSocial}
                  </p>
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
                    setSendAnonymous(false);
                    setSignatureError('');
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