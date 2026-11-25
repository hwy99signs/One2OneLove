import React, { useState, useMemo, useEffect } from "react";
import { useLanguage } from "@/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Search, Shuffle, Send, X, MessageSquare, Facebook, Instagram, Twitter, Mail, Linkedin, Settings, Calendar, Loader2, Clock, Trash, Phone, ArrowLeft, AlertCircle, Sparkles, Lock, Coins, UserRound } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { listSentLoveNotes, recordSentLoveNote, scheduleLoveNote } from "@/lib/loveNotesService";
import { trackFeatureAction } from "@/lib/featureUsageService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import ScheduledNotesManager from "../components/lovenotes/ScheduledNotesManager";



import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { apiRequest } from "@/lib/apiClient";


const FREE_CARD_COPY = {
  en: 'Free — tap to read the full note.',
  es: 'Gratis — toca para leer la nota completa.',
  fr: 'Gratuit — touchez pour lire la note entière.',
  it: 'Gratis — tocca per leggere la nota completa.',
  de: 'Kostenlos — tippe, um die ganze Botschaft zu lesen.',
};

const LOVE_NOTE_MAX_CHARACTERS = 171;
const clampLoveNote = (value) => Array.from(String(value || '')).slice(0, LOVE_NOTE_MAX_CHARACTERS).join('');

const translations = {
  en: {
    title: "Love Notes Collection",
    subtitle: "Choose from heartfelt love notes to express your feelings perfectly",
    back: "Back",
    searchPlaceholder: "Search love notes by title...",
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
    recipientPhoneDesc: "Love Notes are sent in the app and shared from your own apps — always free.",
    schedulingOptions: "📅 Scheduling Options",
    sendNow: "Send Now",
    scheduleLater: "Schedule for Later",
    scheduleDate: "Schedule Date",
    scheduleTime: "Schedule Time",
    scheduleSuccess: "Love note scheduled successfully! 💕",
    sentInApp: "Love note sent! 💕",
    viewScheduled: "View Scheduled Notes",
    howItWorks: "📱 How it works:",
    howItWorksItem1: "• Your love note is saved and sent right here in the app — free",
    howItWorksItem2: "• The recipient will see it came from Love Notes",
    howItWorksItem3: "• Or share it from your own apps — WhatsApp, email and more",
    howItWorksItem4: "• Perfect for surprising your partner!",
    anonTitle: "Your name signs your note",
    anonBody: "Rather stay a secret admirer? Check 'Send Anonymous' and your note arrives with no name attached — just your title, your words, and a ❤️ One2OneLove sign-off.",
    senderNameLimitNote: "Your name is included in the character limit of the note.",
    sendAnonymous: "Send Anonymous",
    signatureSignedAs: "Signed with your account first name:",
    signatureSourceNote: "Your note is signed with the first name on your account — not a username.",
    signatureFirstNameRequired: "You need a first name on your account before you can send Love Notes.",
    phoneVerifyRequired: "Sending Love Notes needs a verified phone number on your account. Verify yours once — it is saved to your account — then come back and send.",
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
    searchPlaceholder: "Buscar notas de amor por título...",
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
    sentInApp: "¡Nota de amor enviada! 💕",
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
    howItWorksItem1: "• Tu nota de amor se guarda y se envía aquí mismo en la app — gratis",
    howItWorksItem2: "• El destinatario verá que vino de Love Notes",
    howItWorksItem3: "• O compártela desde tus propias apps — WhatsApp, correo y más",
    howItWorksItem4: "• ¡Perfecto para sorprender a tu pareja!",
    anonTitle: "Tu nombre firma tu nota",
    anonBody: "Tu nombre aparece al final de tu nota, para que sepan que viene de ti. ¿Prefieres seguir siendo un admirador secreto? Marca 'Enviar como anónimo' y tu nota llegará sin ningún nombre: solo tu título, tus palabras y la firma ❤️ One2OneLove.",
    senderNameLimitNote: "Tu nombre está incluido en el límite de caracteres de la nota.",
    sendAnonymous: "Enviar como anónimo",
    signatureSignedAs: "Firmado con el primer nombre de tu cuenta:",
    signatureSourceNote: "Tu nota se firma con el primer nombre de tu cuenta, no con un nombre de usuario.",
    signatureFirstNameRequired: "Necesitas un primer nombre en tu cuenta antes de poder enviar Notas de Amor.",
    phoneVerifyRequired: "Para enviar Notas de Amor necesitas un número de teléfono verificado en tu cuenta. Verifícalo una vez — queda guardado en tu cuenta — y luego vuelve para enviar.",
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
    recipientPhoneDesc: "Las Notas de Amor se envían en la app y se comparten desde tus propias apps — siempre gratis.",
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
    searchPlaceholder: "Rechercher des notes d'amour par titre...",
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
    sentInApp: "Note d’amour envoyée ! 💕",
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
    howItWorksItem1: "• Votre note d’amour est enregistrée et envoyée ici même dans l’application — gratuitement",
    howItWorksItem2: "• Le destinataire verra qu'elle vient de Love Notes",
    howItWorksItem3: "• Ou partagez-la depuis vos propres applications — WhatsApp, e-mail et plus",
    howItWorksItem4: "• Parfait pour surprendre votre partenaire!",
    anonTitle: "Votre nom signe votre note",
    anonBody: "Votre nom apparaît au bas de votre note, pour qu’ils sachent qu’elle vient de vous. Vous préférez rester un admirateur secret ? Cochez « Envoyer anonymement » et votre note arrivera sans aucun nom : juste votre titre, vos mots et la signature ❤️ One2OneLove.",
    senderNameLimitNote: "Votre nom est inclus dans la limite de caractères de la note.",
    sendAnonymous: "Envoyer anonymement",
    signatureSignedAs: "Signé avec le prénom de votre compte :",
    signatureSourceNote: "Votre note est signée avec le prénom figurant sur votre compte — pas un nom d’utilisateur.",
    signatureFirstNameRequired: "Vous devez avoir un prénom sur votre compte avant de pouvoir envoyer des Notes d’Amour.",
    phoneVerifyRequired: "L’envoi de Notes d’Amour nécessite un numéro de téléphone vérifié sur votre compte. Vérifiez-le une fois — il est enregistré sur votre compte — puis revenez pour envoyer.",
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
    recipientPhoneDesc: "Les Notes d’Amour sont envoyées dans l’application et partagées depuis vos propres applications — toujours gratuitement.",
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
    searchPlaceholder: "Cerca note d'amore per titolo...",
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
    sentInApp: "Nota d’amore inviata! 💕",
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
    howItWorksItem1: "• La tua nota d’amore viene salvata e inviata proprio qui nell’app — gratis",
    howItWorksItem2: "• Il destinatario vedrà che proviene da Love Notes",
    howItWorksItem3: "• Oppure condividila dalle tue app — WhatsApp, email e altro",
    howItWorksItem4: "• Perfetto per sorprendere il tuo partner!",
    anonTitle: "Il tuo nome firma la tua nota",
    anonBody: "Il tuo nome compare in calce alla tua nota, così sapranno che viene da te. Preferisci restare un ammiratore segreto? Seleziona 'Invia in forma anonima' e la tua nota arriverà senza alcun nome: solo il titolo, le tue parole e la firma ❤️ One2OneLove.",
    senderNameLimitNote: "Il tuo nome è incluso nel limite di caratteri della nota.",
    sendAnonymous: "Invia in forma anonima",
    signatureSignedAs: "Firmato con il nome del tuo account:",
    signatureSourceNote: "La tua nota viene firmata con il nome presente sul tuo account, non con un nome utente.",
    signatureFirstNameRequired: "Devi avere un nome sul tuo account prima di poter inviare Note d’amore.",
    phoneVerifyRequired: "Per inviare Note d’Amore serve un numero di telefono verificato sul tuo account. Verificalo una volta — resta salvato sul tuo account — poi torna per inviare.",
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
    recipientPhoneDesc: "Le Note d’Amore si inviano nell’app e si condividono dalle tue app — sempre gratis.",
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
    searchPlaceholder: "Liebesbotschaften nach Titel suchen...",
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
    sentInApp: "Liebesbotschaft gesendet! 💕",
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
    howItWorksItem1: "• Deine Liebesbotschaft wird hier in der App gespeichert und gesendet — kostenlos",
    howItWorksItem2: "• Der Empfänger sieht, dass sie von Love Notes kam",
    howItWorksItem3: "• Oder teile sie aus deinen eigenen Apps — WhatsApp, E-Mail und mehr",
    howItWorksItem4: "• Perfekt, um deinen Partner zu überraschen!",
    anonTitle: "Dein Name unterschreibt deine Botschaft",
    anonBody: "Dein Name erscheint am Ende deiner Botschaft, damit sie wissen, dass sie von dir kommt. Lieber ein heimlicher Verehrer bleiben? Aktiviere 'Anonym senden', und deine Botschaft kommt ganz ohne Namen an — nur mit deinem Titel, deinen Worten und der Signatur ❤️ One2OneLove.",
    senderNameLimitNote: "Dein Name ist im Zeichenlimit der Botschaft enthalten.",
    sendAnonymous: "Anonym senden",
    signatureSignedAs: "Signiert mit dem Vornamen deines Kontos:",
    signatureSourceNote: "Deine Botschaft wird mit dem Vornamen auf deinem Konto signiert — nicht mit einem Benutzernamen.",
    signatureFirstNameRequired: "Du brauchst einen Vornamen auf deinem Konto, bevor du Liebesbotschaften senden kannst.",
    phoneVerifyRequired: "Zum Senden von Liebesbotschaften brauchen Sie eine bestätigte Telefonnummer auf Ihrem Konto. Bestätigen Sie sie einmal — sie wird gespeichert — und kommen Sie dann zum Senden zurück.",
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
    recipientPhoneDesc: "Liebesbotschaften werden in der App gesendet und aus deinen eigenen Apps geteilt — immer kostenlos.",
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
  const freeCardT = FREE_CARD_COPY[currentLanguage] || FREE_CARD_COPY.en;
  const loadPrivateNote = async (note) => {
    const result=await apiRequest('/api/love-note-library/item?lang='+encodeURIComponent(currentLanguage)+'&id='+encodeURIComponent(note.id));
    return personalizeNote(result.note);
  };  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);
  const [sendModalNote, setSendModalNote] = useState(null);
  const [sendAnonymous, setSendAnonymous] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const todayLocalDate = useMemo(() => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 10);
  }, []);
  const [showScheduledNotes, setShowScheduledNotes] = useState(false);
  const [showRandomCategoryPicker, setShowRandomCategoryPicker] = useState(false);

  const [showPersonalization, setShowPersonalization] = useState(false);
  const [partnerName, setPartnerName] = useState(localStorage.getItem('partnerName') || '');
  const [petName, setPetName] = useState(localStorage.getItem('petName') || '');
  const [specialPlace, setSpecialPlace] = useState(localStorage.getItem('specialPlace') || '');


  // Sending is in-app and free for everyone (2026-11-25). The old
  // account-signature rules existed for SMS body composition; SMS is
  // retired, so a send is just the note plus an optional anonymous flag.

  const categories = useMemo(() => allCategories, [allCategories]);

  // Fetch user's partner identifier (email or phone) from profile or localStorage
  const partnerIdentifier = currentUser?.partner_email || localStorage.getItem('partnerEmail') || '';

  // Fetch sent love notes for limit tracking
  const { data: sentNotes = [] } = useQuery({
    queryKey: ['sentLoveNotes', currentUser?.id || 'guest'],
    queryFn: async () => listSentLoveNotes(),
    staleTime: 60 * 1000,
  });


  // Calculate usage limits
  

  const sendNoteMutation = useMutation({
    mutationFn: async (data) => recordSentLoveNote(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sentLoveNotes'] });
      queryClient.invalidateQueries({ queryKey: ['loveNoteUsage'] });
    }
  });

  const scheduleMutation = useMutation({
    mutationFn: async (data) => scheduleLoveNote(data),
    onSuccess: () => {
      trackFeatureAction('Love Notes', `love-note-category:${sendModalNote?.category || 'uncategorized'}`);
      queryClient.invalidateQueries({ queryKey: ['scheduledNotes'] });
      queryClient.invalidateQueries({ queryKey: ['loveNoteUsage'] });
      toast.success(t.scheduleSuccess);
      setSendModalNote(null);
      setIsScheduling(false);
      setScheduleDate('');
      setScheduleTime('');
    },
    onError: (error) => {
      toast.error(error?.message || t.limitSMS);
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
  }, [selectedCategory, selectedSubject, searchQuery, partnerName, petName, specialPlace, allNotes]);

  const handleRandomNote = () => {
    setShowRandomCategoryPicker(true);
  };

  const handleRandomCategorySelect = (categoryId) => {

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

  const handleScheduleNote = () => {
    if (!scheduleDate || !scheduleTime) {
      toast.error(t.pleaseSelectDateTime);
      return;
    }

    scheduleMutation.mutate({
      note_title: sendModalNote.title,
      note_content: sendModalNote.content,
      scheduled_date: scheduleDate,
      scheduled_time: scheduleTime,
      delivery_method: 'in_app',
      note_language: currentLanguage,
      send_anonymous: sendAnonymous,
      status: 'scheduled'
    });
  };

  // Free in-app send + share-from-your-own-apps (2026-11-25). The SMS
  // path is retired: One2OneLove no longer sends text messages. Sharing
  // opens the visitor's own apps, which costs nothing.
  const recordShare = async (note, method) => {
    try {
      await sendNoteMutation.mutateAsync({
        note_title: note.title,
        note_content: note.content,
        recipient_type: method === 'in_app' ? 'in_app' : 'social_media',
        recipient_identifier: method,
        social_platform: method === 'in_app' ? undefined : method,
        sent_date: new Date().toISOString(),
        created_by: currentUser?.id || 'guest',
        send_anonymous: sendAnonymous,
      });
    } catch (error) {
      toast.error(error?.message || t.limitSMS);
      return false;
    }
    trackFeatureAction('Love Notes', `love-note-category:${note.category || 'uncategorized'}`);
    return true;
  };

  const handleSendInApp = async (note) => {
    if (await recordShare(note, 'in_app')) {
      toast.success(t.sentInApp);
      setSendModalNote(null);
      setSendAnonymous(false);
    }
  };

  const handleSendVia = async (note, method) => {
    const text = `${note.title}\n\n${note.content}\n\n❤️ From One 2 One Love`;
    if (!(await recordShare(note, method))) return;

    switch(method) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
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
          <Button
            onClick={handleRandomNote}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 h-12 px-6"
          >
            <Shuffle className="w-5 h-5 mr-2" />
            {t.randomNote}
          </Button>
          {(
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
                          aria-label={category.name}
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
                  aria-label={category.name}
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
            {displayedNotes.map((note) => {
              return (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="h-full hover:shadow-xl transition-all duration-300 border-2 cursor-pointer bg-white border-pink-200"
                      onClick={() => openLibraryNote(note)}>
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-900 font-kalam">
                      {note.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-500 leading-relaxed mb-4">
                      {freeCardT}
                    </p>
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
              );
            })}
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
                    setSendAnonymous(false);
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
                  <p className="text-xs text-gray-500">
                    {t.recipientPhoneDesc}
                  </p>
                  <label htmlFor="love-note-send-anonymous" className="flex items-center gap-2 mt-3 text-sm text-gray-700 cursor-pointer">
                    <input
                      id="love-note-send-anonymous"
                      type="checkbox"
                      checked={sendAnonymous}
                      onChange={(e) => setSendAnonymous(e.target.checked)}
                      className="h-4 w-4 accent-purple-600"
                    />
                    {t.sendAnonymous}
                  </label>
                </div>

                {(
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
                    setSendAnonymous(false);
                    setIsScheduling(false);
                    setScheduleDate('');
                    setScheduleTime('');
                  }}
                  className="flex-1 h-12"
                >
                  {t.cancel}
                </Button>
                <Button
                  onClick={() => isScheduling ? handleScheduleNote() : handleSendInApp(sendModalNote)}
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