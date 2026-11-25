import React, { useMemo, useState } from "react";
import { useLanguage } from "@/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, HelpCircle, Book, Mail, ArrowLeft, Settings, Wrench, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

const translations = {
  en: {
    title: "Help Center",
    subtitle: "Find answers, learn how One2OneLove works, and get support",
    searchPlaceholder: "Search for help...",
    categories: "Help Categories",
    searchResults: "Search Results",
    noResults: "No help articles matched your search.",
    stillNeedHelp: "Still need help?",
    contactUs: "Contact Us",
    back: "Back",
    openFeature: "Open related feature",
    gettingStarted: { title: "Getting Started", desc: "Learn the basics of using One2OneLove" },
    accountSettings: { title: "Accounts & Privacy", desc: "Why there are no accounts, and how your information is handled" },
    features: { title: "Features Guide", desc: "Learn how the main One2OneLove tools are intended to work" },
    troubleshooting: { title: "Troubleshooting", desc: "Work through common problems" },
    articles: {
      gettingStarted: [
        { title: "How One2OneLove works", desc: "Everything is free — no account or card needed", actionPage: "Home", details: ["One2OneLove is a free relationship platform. Every feature is free for everyone.", "You do not need an account or a payment card to use anything: browse and use the tools, games, Studio, podcasts, Love Notes, Date Ideas, and chat rooms as a guest.", "Guest personal features (Journals, Memories, Milestones, Goals, Calendar) save in your own browser on this device.", "There are no accounts on One2OneLove right now: member accounts are switched off, there is no sign-up or sign-in, and there are no trials, subscriptions, or purchases."] },
        { title: "Founding Members", desc: "The Founding Member Giveaway has ended", actionPage: "FeaturePricing", details: ["The Founding Member Giveaway is retired. One2OneLove no longer has member accounts or Credit, so the giveaway cannot run and there is nothing to claim.", "There are no credit prizes or offers on One2OneLove. The site is 100% free for everyone — every feature is free, with no signup, no card, and no purchases.", "Historical subscription and Credit records are kept only for accounting and reconciliation."] },
        { title: "Do I need an account?", desc: "No — One2OneLove has no accounts right now", actionPage: "FeaturePricing", details: ["One2OneLove is a free platform with no accounts: there is no sign-up and no sign-in, and every feature is open to everyone as a guest.", "Member accounts are switched off for now. They have not been deleted, and they may be re-activated in the future.", "Your personal features (Journals, Memories, Milestones, Goals, Calendar, Love Notes) save in your own browser on this device instead of an account.", "Because nothing is tied to an account, there are no passwords, verification emails, or recovery messages to worry about."] },
        { title: "Where is my information saved?", desc: "Your entries stay in your browser on this device", actionPage: "Home", details: ["There are no profiles on One2OneLove right now — profiles belong to member accounts, which are switched off.", "What you create in Journals, Memories, Milestones, Goals, Calendar, and Love Notes is saved in your own browser on this device.", "Your entries do not follow you to another device or browser, and clearing your browser storage removes them.", "Only add information you are comfortable keeping on this device."] },
        { title: "Your first love note", desc: "Create and send a Love Note", actionPage: "LoveNotes", details: ["Open Love Notes and choose the type of note you want to create.", "Write your own note or pick one from the free note library, then review the text before sending or saving.", "Confirm the intended recipient and delivery choice before completing the action.", "Love Notes are always free and are sent inside the app or shared through your own apps."] },
        { title: "Share One2OneLove with your partner", desc: "Just send them the link — no account needed", actionPage: "Home", details: ["There is no invitation tool right now: invitations belonged to member accounts, which are switched off.", "To share One2OneLove, simply send your partner the link to the site or to any page you enjoyed.", "They can open it and use everything right away — no account, no card, nothing to install.", "Please share respectfully: only with people you know, and never for spam or repeated unwanted contact."] }
      ],
      accountSettings: [
        { title: "Your information on this device", desc: "Edit or remove what you have saved here", actionPage: "Home", details: ["There is no profile page right now — profiles belong to member accounts, which are switched off.", "To change something you saved, open the feature (Journals, Memories, Milestones, Goals, Calendar, Love Notes) and edit or delete it there.", "To remove everything at once, clear this site's storage in your browser settings."] },
        { title: "Notifications", desc: "One2OneLove does not send account notifications", actionPage: null, details: ["There are no accounts, so there are no account emails, sign-in alerts, or notification settings to manage.", "One2OneLove does not email or text you from the site.", "If your browser asks whether this site may show notifications, that permission is controlled in your browser or operating-system settings."] },
        { title: "Privacy and your data", desc: "Learn how your information is handled and how to request changes", actionPage: "PrivacyPolicy", details: ["Review the Privacy Policy for the categories of information One2OneLove may collect and how that information may be used.", "Your personal entries live in your own browser — edit or delete them inside each feature, or clear them by clearing this site's browser storage.", "For access, correction, deletion, or other privacy requests that are not available in the interface, contact support or the legal/privacy contact listed in the policy."] },
        { title: "Passwords and sign-in", desc: "There are no passwords — there is no sign-in", actionPage: null, details: ["One2OneLove has no sign-in right now, so there is no password to change, reset, or recover.", "If you had an account before, it is switched off — not deleted — and may be re-activated in the future.", "Never share passwords or verification codes with anyone claiming to be One2OneLove support; support will never ask for them."] }
      ],
      features: [
        { title: "The AI Relationship Coach (retired)", desc: "Amora's AI chat has been retired — everything else is free", actionPage: "Amora", details: ["Amora's AI chat has been retired because it cost money on every message. One2OneLove is now a free platform with no per-use features.", "For relationship guidance, use the free tools instead: quizzes, Communication Practice, Love Notes, Date Ideas, the Studio show, podcasts, and the community chat rooms.", "Nothing on One2OneLove is a therapist, doctor, lawyer, licensed counselor, or crisis service. If you are in danger or in crisis, contact your local emergency number or a crisis service right away."] },
        { title: "Setting up relationship milestones", desc: "Track meaningful dates and events", actionPage: "RelationshipMilestones", details: ["Open Milestones & Anniversaries and add the event information requested by the page.", "Use accurate dates and descriptions that are meaningful to you.", "Save the milestone and return to the page later to review or update it when editing is available."] },
        { title: "Creating shared memories", desc: "Use Memory Lane to preserve relationship moments", actionPage: "MemoryLane", details: ["Open Memory Lane and add the text, date, photo, or other information supported by the page.", "Only upload content you own or have permission to share.", "Avoid posting highly sensitive information that you would not want stored in your browser."] },
        { title: "Scheduling love notes", desc: "Prepare a Love Note for a later time when scheduling is available", actionPage: "LoveNotes", details: ["Create the Love Note and review it before choosing a delivery option.", "If Schedule for Later is available, select the intended date and time and confirm the schedule.", "If scheduling is temporarily unavailable or does not save correctly, use an available immediate option or contact support instead of assuming the note is scheduled."] },
        { title: "Exploring date ideas", desc: "Browse date suggestions and related details", actionPage: "DateIdeas", details: ["Open Date Ideas and use the available categories or filters to narrow suggestions.", "Review the details before relying on location, hours, pricing, directions, or availability because third-party information can change.", "Use good judgment regarding travel, weather, physical activity, cost, and personal safety."] },
        { title: "Using relationship quizzes", desc: "Use quizzes for conversation and reflection", actionPage: "RelationshipQuizzes", details: ["Choose a quiz that fits the topic you want to explore.", "Answer honestly and treat results as conversation starters rather than diagnoses or professional assessments.", "Quiz results should not be used to label, pressure, or make high-stakes decisions about another person."] }
      ],
      troubleshooting: [
        { title: "There is no sign-in anymore", desc: "Accounts are off — everything is open as a guest", actionPage: null, details: ["You are not doing anything wrong: sign-in and accounts are switched off on One2OneLove right now.", "Every feature is open to you as a guest — just open it and use it, no account or password needed.", "Your personal entries save in this browser on this device instead of an account."] },
        { title: "Love Notes are not sending or saving", desc: "Check the note, recipient, and delivery selection", actionPage: "LoveNotes", details: ["Confirm all required fields are complete and the recipient or delivery method is valid.", "If you used a scheduled option, verify that a date and time were actually saved.", "Refresh the page once and check again before creating duplicates.", "If the problem continues, contact support with the approximate time of the attempt and the feature you were using; do not include private message content unless necessary."] },
        { title: "A page or feature is not loading properly", desc: "Try common browser and connection fixes", actionPage: null, details: ["Refresh the page and confirm your internet connection is working.", "Try a current version of a major browser and temporarily disable extensions that may block scripts or cookies.", "Clear this site's browser storage and reload if the issue seems tied to your saved entries.", "If the issue remains, contact support with the page name, device/browser, and a description of what happened."] },
        { title: "Questions about a past charge", desc: "Help with historical billing from before One2OneLove became free", actionPage: "ContactUs", details: ["One2OneLove no longer sells anything: there is no Credit wallet, no Auto-Replenish, and no checkout.", "If you see a past One2OneLove charge you do not recognize, contact support with the account email, date, and amount so it can be investigated.", "Do not send full payment-card numbers by email or through a support message."] },
      ]
    }
  },
  es: {
    title: "Centro de Ayuda", subtitle: "Encuentra respuestas, aprende cómo funciona One2OneLove y obtén soporte", searchPlaceholder: "Buscar ayuda...", categories: "Categorías de Ayuda", searchResults: "Resultados de Búsqueda", noResults: "Ningún artículo de ayuda coincide con tu búsqueda.", stillNeedHelp: "¿Aún necesitas ayuda?", contactUs: "Contáctanos", back: "Volver", openFeature: "Abrir función relacionada",
    gettingStarted: { title: "Primeros Pasos", desc: "Aprende lo básico para usar One2OneLove" }, accountSettings: { title: "Cuentas y Privacidad", desc: "Por qué no hay cuentas y cómo se maneja tu información" }, features: { title: "Guía de Funciones", desc: "Aprende cómo funcionan las principales herramientas" }, troubleshooting: { title: "Solución de Problemas", desc: "Resuelve problemas comunes" },
    articles: {
      gettingStarted: [
        { title: "Cómo funciona One2OneLove", desc: "Todo es gratis: sin cuenta ni tarjeta", actionPage: "Home", details: ["One2OneLove es una plataforma de relaciones gratuita. Todas las funciones son gratis para todos.", "No necesitas cuenta ni tarjeta de pago para usar nada: explora y usa como invitado las herramientas, juegos, Studio, podcasts, Notas de Amor, Ideas de Citas y salas de chat.", "Las funciones personales de invitado (Diarios, Recuerdos, Hitos, Metas, Calendario) se guardan en tu propio navegador en este dispositivo.", "Ahora mismo no hay cuentas en One2OneLove: las cuentas de miembro están desactivadas, no hay registro ni inicio de sesión, y no hay pruebas, suscripciones ni compras."] },
        { title: "Miembros Fundadores", desc: "El Obsequio para Miembros Fundadores terminó", actionPage: "FeaturePricing", details: ["El Obsequio para Miembros Fundadores se retiró. One2OneLove ya no tiene cuentas de miembro ni Crédito, por lo que el obsequio no puede funcionar y no hay nada que reclamar.", "No hay premios ni ofertas de crédito en One2OneLove. El sitio es 100% gratis para todos: cada función es gratuita, sin registro, sin tarjeta y sin compras.", "Los registros históricos de suscripciones y Crédito se conservan solo para contabilidad y conciliación."] },
        { title: "¿Necesito una cuenta?", desc: "No: One2OneLove no tiene cuentas por ahora", actionPage: "FeaturePricing", details: ["One2OneLove es una plataforma gratuita sin cuentas: no hay registro ni inicio de sesión, y todas las funciones están abiertas para todos como invitados.", "Las cuentas de miembro están desactivadas por ahora. No se han eliminado y podrían reactivarse en el futuro.", "Tus funciones personales (Diarios, Recuerdos, Hitos, Metas, Calendario, Notas de Amor) se guardan en tu propio navegador en este dispositivo en lugar de una cuenta.", "Como nada está vinculado a una cuenta, no hay contraseñas, correos de verificación ni mensajes de recuperación de los que preocuparse."] },
        { title: "¿Dónde se guarda mi información?", desc: "Tus entradas permanecen en tu navegador en este dispositivo", actionPage: "Home", details: ["Ahora mismo no hay perfiles en One2OneLove: los perfiles pertenecen a las cuentas de miembro, que están desactivadas.", "Lo que creas en Diarios, Recuerdos, Hitos, Metas, Calendario y Notas de Amor se guarda en tu propio navegador en este dispositivo.", "Tus entradas no te siguen a otro dispositivo o navegador, y al borrar el almacenamiento de tu navegador se eliminan.", "Añade solo información que te sientas cómodo guardando en este dispositivo."] },
        { title: "Tu primera nota de amor", desc: "Crea y envía una Nota de Amor", actionPage: "LoveNotes", details: ["Abre Notas de Amor y elige el tipo de nota que deseas crear.", "Escribe tu propio mensaje o elige uno de la biblioteca gratuita de notas y revísalo antes de enviarlo o guardarlo.", "Confirma el destinatario y la opción de entrega antes de completar la acción."] },
        { title: "Comparte One2OneLove con tu pareja", desc: "Solo envíale el enlace: no necesita cuenta", actionPage: "Home", details: ["Ahora mismo no hay herramienta de invitación: las invitaciones pertenecían a las cuentas de miembro, que están desactivadas.", "Para compartir One2OneLove, simplemente envía a tu pareja el enlace del sitio o de cualquier página que te haya gustado.", "Podrá abrirlo y usar todo de inmediato: sin cuenta, sin tarjeta y sin instalar nada.", "Comparte con respeto: solo con personas que conoces y nunca para spam o contacto repetido no deseado."] }
      ],
      accountSettings: [
        { title: "Tu información en este dispositivo", desc: "Edita o elimina lo que has guardado aquí", actionPage: "Home", details: ["Ahora mismo no hay página de perfil: los perfiles pertenecen a las cuentas de miembro, que están desactivadas.", "Para cambiar algo que guardaste, abre la función (Diarios, Recuerdos, Hitos, Metas, Calendario, Notas de Amor) y edítalo o elimínalo allí.", "Para eliminarlo todo de una vez, borra el almacenamiento de este sitio en los ajustes de tu navegador."] },
        { title: "Notificaciones", desc: "One2OneLove no envía notificaciones de cuenta", actionPage: null, details: ["No hay cuentas, así que no hay correos de cuenta, alertas de inicio de sesión ni ajustes de notificaciones que gestionar.", "One2OneLove no te envía correos ni mensajes de texto desde el sitio.", "Si tu navegador pregunta si este sitio puede mostrar notificaciones, ese permiso se controla en los ajustes de tu navegador o sistema operativo."] },
        { title: "Privacidad y tus datos", desc: "Conoce cómo se maneja tu información", actionPage: "PrivacyPolicy", details: ["Consulta la Política de Privacidad para conocer qué información puede recopilarse y cómo se utiliza.", "Tus entradas personales viven en tu propio navegador: edítalas o elimínalas dentro de cada función, o bórralas limpiando el almacenamiento de este sitio en tu navegador.", "Para solicitudes de acceso, corrección o eliminación no disponibles en la interfaz, contacta con soporte o con el contacto legal/privacidad indicado en la política."] },
        { title: "Contraseñas e inicio de sesión", desc: "No hay contraseñas: no hay inicio de sesión", actionPage: null, details: ["One2OneLove no tiene inicio de sesión por ahora, así que no hay contraseña que cambiar, restablecer o recuperar.", "Si antes tenías una cuenta, está desactivada —no eliminada— y podría reactivarse en el futuro.", "Nunca compartas contraseñas ni códigos de verificación con nadie que diga ser soporte de One2OneLove; el soporte nunca te los pedirá."] }
      ],
      features: [
        { title: "El Coach de Relaciones con IA (retirado)", desc: "El chat con IA de Amora se retiró: todo lo demás es gratis", actionPage: "Amora", details: ["El chat con IA de Amora se retiró porque costaba dinero en cada mensaje. One2OneLove ahora es una plataforma gratuita sin funciones de pago por uso.", "Para orientación en tu relación, usa las herramientas gratuitas: cuestionarios, Práctica de Comunicación, Notas de Amor, Ideas de Citas, el programa Studio, podcasts y las salas de chat de la comunidad.", "Nada en One2OneLove es un terapeuta, médico, abogado, consejero licenciado o servicio de crisis. Si estás en peligro o en crisis, contacta de inmediato tu número de emergencia local o un servicio de crisis."] },
        { title: "Configurar hitos de la relación", desc: "Guarda fechas y eventos significativos", actionPage: "RelationshipMilestones", details: ["Abre Hitos y Aniversarios y añade la información solicitada.", "Usa fechas y descripciones correctas.", "Guarda el hito y vuelve más tarde para revisarlo o actualizarlo cuando la edición esté disponible."] },
        { title: "Crear recuerdos compartidos", desc: "Usa Memory Lane para conservar momentos", actionPage: "MemoryLane", details: ["Abre Memory Lane y añade el texto, fecha, foto u otra información admitida.", "Sube solo contenido que sea tuyo o que tengas permiso para compartir.", "Evita guardar información altamente sensible que no quieras guardar en tu navegador."] },
        { title: "Programar notas de amor", desc: "Prepara una nota para más tarde cuando la programación esté disponible", actionPage: "LoveNotes", details: ["Crea y revisa la nota antes de elegir la entrega.", "Si Programar para más tarde está disponible, selecciona fecha y hora y confirma.", "Si no se guarda correctamente, usa una opción inmediata disponible o contacta con soporte en lugar de asumir que quedó programada."] },
        { title: "Explorar ideas para citas", desc: "Consulta sugerencias y detalles relacionados", actionPage: "DateIdeas", details: ["Abre Ideas para Citas y usa categorías o filtros disponibles.", "Verifica ubicación, horarios, precios, direcciones y disponibilidad porque la información externa puede cambiar.", "Usa buen criterio respecto a viajes, clima, actividad física, costo y seguridad personal."] },
        { title: "Usar cuestionarios de relaciones", desc: "Utiliza los cuestionarios para conversación y reflexión", actionPage: "RelationshipQuizzes", details: ["Elige un cuestionario relacionado con el tema que quieres explorar.", "Responde con honestidad y usa los resultados como inicio de conversación, no como diagnóstico.", "No uses los resultados para etiquetar, presionar o tomar decisiones de alto riesgo sobre otra persona."] }
      ],
      troubleshooting: [
        { title: "Ya no hay inicio de sesión", desc: "Las cuentas están desactivadas: todo está abierto como invitado", actionPage: null, details: ["No estás haciendo nada mal: el inicio de sesión y las cuentas están desactivados en One2OneLove por ahora.", "Todas las funciones están abiertas para ti como invitado: solo ábrelas y úsalas, sin cuenta ni contraseña.", "Tus entradas personales se guardan en este navegador, en este dispositivo, en lugar de una cuenta."] },
        { title: "Las Notas de Amor no se envían o guardan", desc: "Revisa nota, destinatario y opción de entrega", actionPage: "LoveNotes", details: ["Confirma que los campos obligatorios estén completos y que el destinatario o método de entrega sea válido.", "Si programaste la nota, verifica que se haya guardado fecha y hora.", "Actualiza la página una vez antes de crear duplicados.", "Si continúa, contacta con soporte indicando hora aproximada y función utilizada."] },
        { title: "Una página o función no carga correctamente", desc: "Prueba soluciones comunes del navegador y conexión", actionPage: null, details: ["Actualiza la página y confirma tu conexión a internet.", "Usa una versión actual de un navegador principal y desactiva temporalmente extensiones que bloqueen scripts o cookies.", "Borra el almacenamiento de este sitio en tu navegador y recarga si el problema parece relacionado con tus datos guardados.", "Si persiste, contacta con soporte indicando página, dispositivo/navegador y qué ocurrió."] },
        { title: "Preguntas sobre un cargo anterior", desc: "Ayuda con facturación histórica de antes de que One2OneLove fuera gratis", actionPage: "ContactUs", details: ["One2OneLove ya no vende nada: no hay billetera de Crédito, ni Recarga Automática, ni pagos.", "Si ves un cargo anterior de One2OneLove que no reconoces, contacta a soporte con el correo de la cuenta, la fecha y el importe para investigarlo.", "No envíes números completos de tarjeta por correo ni en mensajes de soporte."] },
      ]
    }
  },
  fr: {
    title: "Centre d'Aide", subtitle: "Trouvez des réponses, découvrez le fonctionnement de One2OneLove et obtenez de l'aide", searchPlaceholder: "Rechercher de l'aide...", categories: "Catégories d'Aide", searchResults: "Résultats de Recherche", noResults: "Aucun article d'aide ne correspond à votre recherche.", stillNeedHelp: "Besoin d'aide supplémentaire ?", contactUs: "Nous Contacter", back: "Retour", openFeature: "Ouvrir la fonction associée",
    gettingStarted: { title: "Premiers Pas", desc: "Apprenez les bases de One2OneLove" }, accountSettings: { title: "Comptes et Confidentialité", desc: "Pourquoi il n’y a pas de comptes et comment vos informations sont traitées" }, features: { title: "Guide des Fonctionnalités", desc: "Découvrez le fonctionnement des principaux outils" }, troubleshooting: { title: "Dépannage", desc: "Résolvez les problèmes courants" },
    articles: {
      gettingStarted: [
        { title: "Comment fonctionne One2OneLove", desc: "Tout est gratuit — sans compte ni carte", actionPage: "Home", details: ["One2OneLove est une plateforme relationnelle gratuite. Chaque fonctionnalité est gratuite pour tout le monde.", "Aucun compte ni carte de paiement n’est requis : parcourez et utilisez en invité les outils, les jeux, le Studio, les podcasts, les Notes d’Amour, les Idées de Rendez-vous et les salons de discussion.", "Les fonctionnalités personnelles des invités (Journaux, Souvenirs, Jalons, Objectifs, Calendrier) sont enregistrées dans votre propre navigateur sur cet appareil.", "Il n’y a actuellement aucun compte sur One2OneLove : les comptes membres sont désactivés, il n’y a ni inscription ni connexion, et il n’y a ni essais, ni abonnements, ni achats."] },
        { title: "Membres Fondateurs", desc: "Le Cadeau Membres Fondateurs a pris fin", actionPage: "FeaturePricing", details: ["Le Cadeau Membres Fondateurs est retiré. One2OneLove n’a plus de comptes membres ni de Crédit, donc le cadeau ne peut pas fonctionner et il n’y a rien à réclamer.", "Il n’y a aucun prix ni offre de crédit sur One2OneLove. Le site est 100 % gratuit pour tout le monde — chaque fonction est gratuite, sans inscription, sans carte et sans achat.", "Les anciens enregistrements d’abonnement et de Crédit sont conservés uniquement pour la comptabilité et le rapprochement."] },
        { title: "Ai-je besoin d’un compte ?", desc: "Non — One2OneLove n’a pas de comptes pour le moment", actionPage: "FeaturePricing", details: ["One2OneLove est une plateforme gratuite sans comptes : aucune inscription, aucune connexion, et chaque fonction est ouverte à tous en tant qu’invité.", "Les comptes membres sont désactivés pour le moment. Ils n’ont pas été supprimés et pourront être réactivés à l’avenir.", "Vos fonctions personnelles (Journaux, Souvenirs, Jalons, Objectifs, Calendrier, Notes d’Amour) sont enregistrées dans votre propre navigateur sur cet appareil au lieu d’un compte.", "Comme rien n’est lié à un compte, il n’y a ni mots de passe, ni e-mails de vérification, ni messages de récupération à gérer."] },
        { title: "Où sont enregistrées mes informations ?", desc: "Vos entrées restent dans votre navigateur sur cet appareil", actionPage: "Home", details: ["Il n’y a actuellement aucun profil sur One2OneLove — les profils appartiennent aux comptes membres, qui sont désactivés.", "Ce que vous créez dans Journaux, Souvenirs, Jalons, Objectifs, Calendrier et Notes d’Amour est enregistré dans votre propre navigateur sur cet appareil.", "Vos entrées ne vous suivent pas sur un autre appareil ou navigateur, et l’effacement du stockage de votre navigateur les supprime.", "N’ajoutez que des informations que vous acceptez de conserver sur cet appareil."] },
        { title: "Votre première note d'amour", desc: "Créez et envoyez une Love Note", actionPage: "LoveNotes", details: ["Ouvrez Love Notes et choisissez le type de message à créer.", "Rédigez votre message ou choisissez-en un dans la bibliothèque gratuite de notes, puis relisez-le avant l'envoi ou l'enregistrement.", "Vérifiez le destinataire et le mode d'envoi avant de confirmer."] },
        { title: "Partager One2OneLove avec votre partenaire", desc: "Envoyez-lui simplement le lien — aucun compte requis", actionPage: "Home", details: ["Il n’y a actuellement aucun outil d’invitation : les invitations appartenaient aux comptes membres, qui sont désactivés.", "Pour partager One2OneLove, envoyez simplement à votre partenaire le lien du site ou de n’importe quelle page que vous avez appréciée.", "Il pourra l’ouvrir et tout utiliser immédiatement — aucun compte, aucune carte, rien à installer.", "Partagez avec respect : uniquement avec des personnes que vous connaissez, et jamais pour du spam ou des contacts répétés non souhaités."] }
      ],
      accountSettings: [
        { title: "Vos informations sur cet appareil", desc: "Modifiez ou supprimez ce que vous avez enregistré ici", actionPage: "Home", details: ["Il n’y a actuellement aucune page de profil — les profils appartiennent aux comptes membres, qui sont désactivés.", "Pour modifier quelque chose que vous avez enregistré, ouvrez la fonction (Journaux, Souvenirs, Jalons, Objectifs, Calendrier, Notes d’Amour) et modifiez-le ou supprimez-le à cet endroit.", "Pour tout supprimer d’un coup, effacez le stockage de ce site dans les réglages de votre navigateur."] },
        { title: "Notifications", desc: "One2OneLove n’envoie pas de notifications de compte", actionPage: null, details: ["Il n’y a aucun compte, donc aucun e-mail de compte, aucune alerte de connexion et aucun réglage de notification à gérer.", "One2OneLove ne vous envoie ni e-mail ni SMS depuis le site.", "Si votre navigateur demande si ce site peut afficher des notifications, cette autorisation se contrôle dans les réglages de votre navigateur ou de votre système d’exploitation."] },
        { title: "Confidentialité et vos données", desc: "Comprenez le traitement de vos informations", actionPage: "PrivacyPolicy", details: ["Consultez la Politique de confidentialité pour connaître les catégories de données et leurs usages.", "Vos entrées personnelles vivent dans votre propre navigateur — modifiez-les ou supprimez-les dans chaque fonction, ou effacez-les en vidant le stockage de ce site dans votre navigateur.", "Pour une demande d'accès, correction ou suppression non disponible dans l'interface, contactez l'assistance ou le contact juridique/confidentialité indiqué dans la politique."] },
        { title: "Mots de passe et connexion", desc: "Il n’y a pas de mots de passe — il n’y a pas de connexion", actionPage: null, details: ["One2OneLove n’a actuellement aucune connexion, donc aucun mot de passe à modifier, réinitialiser ou récupérer.", "Si vous aviez un compte auparavant, il est désactivé — pas supprimé — et pourra être réactivé à l’avenir.", "Ne partagez jamais mots de passe ni codes de vérification avec quiconque prétend être l’assistance One2OneLove ; l’assistance ne vous les demandera jamais."] }
      ],
      features: [
        { title: "Le Coach Relationnel IA (retiré)", desc: "Le chat IA d’Amora a été retiré — tout le reste est gratuit", actionPage: "Amora", details: ["Le chat IA d’Amora a été retiré car il coûtait de l’argent à chaque message. One2OneLove est désormais une plateforme gratuite sans fonctionnalités payantes à l’usage.", "Pour des conseils relationnels, utilisez plutôt les outils gratuits : quiz, Pratique de Communication, Notes d’Amour, Idées de Rendez-vous, l’émission Studio, les podcasts et les salons de discussion de la communauté.", "Rien sur One2OneLove n’est un thérapeute, un médecin, un avocat, un conseiller agréé ou un service de crise. En cas de danger ou de crise, contactez immédiatement votre numéro d’urgence local ou un service de crise."] },
        { title: "Configurer des étapes importantes", desc: "Suivez les dates et événements significatifs", actionPage: "RelationshipMilestones", details: ["Ouvrez Jalons et anniversaires et ajoutez les informations demandées.", "Utilisez des dates et descriptions exactes.", "Enregistrez puis revenez plus tard pour consulter ou modifier lorsque l'édition est disponible."] },
        { title: "Créer des souvenirs partagés", desc: "Utilisez Memory Lane pour conserver vos moments", actionPage: "MemoryLane", details: ["Ouvrez Memory Lane et ajoutez texte, date, photo ou autre contenu pris en charge.", "N'importez que du contenu vous appartenant ou que vous êtes autorisé à partager.", "Évitez d'enregistrer des informations très sensibles que vous ne souhaitez pas conserver dans votre navigateur."] },
        { title: "Planifier des notes d'amour", desc: "Préparez une note pour plus tard lorsque la planification est disponible", actionPage: "LoveNotes", details: ["Créez et relisez la note avant de choisir l'envoi.", "Si Planifier pour plus tard est disponible, choisissez date et heure et confirmez.", "Si la planification ne s'enregistre pas, utilisez une option immédiate disponible ou contactez l'assistance au lieu de supposer qu'elle est programmée."] },
        { title: "Explorer les idées de rendez-vous", desc: "Parcourez des suggestions et leurs détails", actionPage: "DateIdeas", details: ["Ouvrez Idées de rendez-vous et utilisez les catégories ou filtres disponibles.", "Vérifiez lieu, horaires, prix, itinéraire et disponibilité, car les informations tierces peuvent changer.", "Faites preuve de prudence concernant déplacement, météo, activité physique, coût et sécurité."] },
        { title: "Utiliser les quiz relationnels", desc: "Servez-vous des quiz pour échanger et réfléchir", actionPage: "RelationshipQuizzes", details: ["Choisissez un quiz adapté au sujet à explorer.", "Répondez honnêtement et considérez les résultats comme un point de départ de discussion, pas comme un diagnostic.", "N'utilisez pas les résultats pour étiqueter, faire pression ou prendre une décision importante sur quelqu'un."] }
      ],
      troubleshooting: [
        { title: "Il n’y a plus de connexion", desc: "Les comptes sont désactivés — tout est ouvert en tant qu’invité", actionPage: null, details: ["Vous ne faites rien de mal : la connexion et les comptes sont désactivés sur One2OneLove pour le moment.", "Chaque fonction vous est ouverte en tant qu’invité — ouvrez-la et utilisez-la, sans compte ni mot de passe.", "Vos entrées personnelles sont enregistrées dans ce navigateur, sur cet appareil, au lieu d’un compte."] },
        { title: "Les Love Notes ne s'envoient ou ne s'enregistrent pas", desc: "Vérifiez le message, le destinataire et l'envoi", actionPage: "LoveNotes", details: ["Vérifiez que tous les champs requis sont remplis et que le destinataire ou mode d'envoi est valide.", "Pour une note planifiée, vérifiez qu'une date et une heure ont bien été enregistrées.", "Actualisez une fois la page avant de créer des doublons.", "Si le problème continue, contactez l'assistance en indiquant l'heure approximative et la fonction utilisée."] },
        { title: "Une page ou une fonction ne charge pas correctement", desc: "Essayez des solutions courantes de navigateur et de connexion", actionPage: null, details: ["Actualisez la page et vérifiez votre connexion Internet.", "Utilisez une version récente d'un navigateur principal et désactivez temporairement les extensions bloquant scripts ou cookies.", "Effacez le stockage de ce site dans votre navigateur puis rechargez si le problème semble lié à vos données enregistrées.", "Si le problème persiste, contactez l'assistance avec le nom de la page, l'appareil/navigateur et une description."] },
        { title: "Questions sur un ancien débit", desc: "Aide pour la facturation historique d’avant la gratuité de One2OneLove", actionPage: "ContactUs", details: ["One2OneLove ne vend plus rien : il n’y a ni portefeuille Crédit, ni Recharge Automatique, ni paiement.", "Si vous voyez un ancien débit One2OneLove que vous ne reconnaissez pas, contactez l’assistance avec l’e-mail du compte, la date et le montant pour enquête.", "N’envoyez jamais de numéro complet de carte par e-mail ou dans un message d’assistance."] },
      ]
    }
  },
  it: {
    title: "Centro Assistenza", subtitle: "Trova risposte, scopri come funziona One2OneLove e ottieni supporto", searchPlaceholder: "Cerca aiuto...", categories: "Categorie di Aiuto", searchResults: "Risultati di Ricerca", noResults: "Nessun articolo di aiuto corrisponde alla ricerca.", stillNeedHelp: "Hai ancora bisogno di aiuto?", contactUs: "Contattaci", back: "Indietro", openFeature: "Apri funzione collegata",
    gettingStarted: { title: "Iniziare", desc: "Impara le basi di One2OneLove" }, accountSettings: { title: "Account e Privacy", desc: "Perché non ci sono account e come vengono gestite le tue informazioni" }, features: { title: "Guida alle Funzionalità", desc: "Scopri come funzionano gli strumenti principali" }, troubleshooting: { title: "Risoluzione Problemi", desc: "Risolvi problemi comuni" },
    articles: {
      gettingStarted: [
        { title: "Come funziona One2OneLove", desc: "Tutto è gratis: senza account né carta", actionPage: "Home", details: ["One2OneLove è una piattaforma relazionale gratuita. Ogni funzione è gratuita per tutti.", "Non servono account né carta di pagamento: esplora e usa come ospite strumenti, giochi, Studio, podcast, Note d’Amore, Idee per Appuntamenti e sale chat.", "Le funzioni personali degli ospiti (Diari, Ricordi, Traguardi, Obiettivi, Calendario) si salvano nel tuo browser su questo dispositivo.", "Al momento non ci sono account su One2OneLove: gli account dei membri sono disattivati, non c'è registrazione né accesso, e non ci sono prove, abbonamenti o acquisti."] },
        { title: "Membri Fondatori", desc: "L’Omaggio Membri Fondatori è terminato", actionPage: "FeaturePricing", details: ["L’Omaggio Membri Fondatori è stato ritirato. One2OneLove non ha più account membro né Credito, quindi l’omaggio non può funzionare e non c’è nulla da richiedere.", "Non ci sono premi né offerte di credito su One2OneLove. Il sito è gratuito al 100% per tutti: ogni funzione è gratuita, senza registrazione, senza carta e senza acquisti.", "I registri storici di abbonamenti e Credito sono conservati solo per contabilità e riconciliazione."] },
        { title: "Mi serve un account?", desc: "No: One2OneLove non ha account al momento", actionPage: "FeaturePricing", details: ["One2OneLove è una piattaforma gratuita senza account: non c'è registrazione né accesso, e ogni funzione è aperta a tutti come ospite.", "Gli account dei membri sono disattivati per ora. Non sono stati eliminati e potrebbero essere riattivati in futuro.", "Le tue funzioni personali (Diari, Ricordi, Traguardi, Obiettivi, Calendario, Note d'Amore) si salvano nel tuo browser su questo dispositivo invece che in un account.", "Poiché nulla è legato a un account, non ci sono password, email di verifica o messaggi di recupero di cui preoccuparsi."] },
        { title: "Dove vengono salvate le mie informazioni?", desc: "Le tue voci restano nel tuo browser su questo dispositivo", actionPage: "Home", details: ["Al momento non ci sono profili su One2OneLove: i profili appartengono agli account dei membri, che sono disattivati.", "Ciò che crei in Diari, Ricordi, Traguardi, Obiettivi, Calendario e Note d'Amore viene salvato nel tuo browser su questo dispositivo.", "Le tue voci non ti seguono su un altro dispositivo o browser, e cancellando l'archiviazione del browser vengono eliminate.", "Aggiungi solo informazioni che sei a tuo agio a conservare su questo dispositivo."] },
        { title: "La tua prima nota d'amore", desc: "Crea e invia una Love Note", actionPage: "LoveNotes", details: ["Apri Love Notes e scegli il tipo di nota da creare.", "Scrivi il messaggio oppure scegline uno dalla biblioteca gratuita di note e rileggilo prima dell'invio o del salvataggio.", "Conferma destinatario e metodo di consegna prima di completare l'azione."] },
        { title: "Condividi One2OneLove con il tuo partner", desc: "Inviagli semplicemente il link: non serve un account", actionPage: "Home", details: ["Al momento non esiste uno strumento di invito: gli inviti appartenevano agli account dei membri, che sono disattivati.", "Per condividere One2OneLove, invia semplicemente al tuo partner il link del sito o di qualsiasi pagina che ti è piaciuta.", "Potrà aprirlo e usare tutto subito: senza account, senza carta e senza installare nulla.", "Condividi con rispetto: solo con persone che conosci e mai per spam o contatti ripetuti indesiderati."] }
      ],
      accountSettings: [
        { title: "Le tue informazioni su questo dispositivo", desc: "Modifica o rimuovi ciò che hai salvato qui", actionPage: "Home", details: ["Al momento non esiste una pagina profilo: i profili appartengono agli account dei membri, che sono disattivati.", "Per modificare qualcosa che hai salvato, apri la funzione (Diari, Ricordi, Traguardi, Obiettivi, Calendario, Note d'Amore) e modificala o eliminala lì.", "Per rimuovere tutto in una volta, cancella l'archiviazione di questo sito nelle impostazioni del browser."] },
        { title: "Notifiche", desc: "One2OneLove non invia notifiche account", actionPage: null, details: ["Non ci sono account, quindi non ci sono email account, avvisi di accesso o impostazioni di notifica da gestire.", "One2OneLove non ti invia email né SMS dal sito.", "Se il browser chiede se questo sito può mostrare notifiche, tale autorizzazione si controlla nelle impostazioni del browser o del sistema operativo."] },
        { title: "Privacy e i tuoi dati", desc: "Scopri come vengono gestite le tue informazioni", actionPage: "PrivacyPolicy", details: ["Consulta l'Informativa sulla Privacy per conoscere categorie di dati e finalità d'uso.", "Le tue voci personali vivono nel tuo browser: modificale o eliminale dentro ogni funzione, oppure cancellale svuotando l'archiviazione di questo sito nel browser.", "Per richieste di accesso, correzione o cancellazione non disponibili nell'interfaccia, contatta l'assistenza o il contatto legale/privacy indicato nell'informativa."] },
        { title: "Password e accesso", desc: "Non ci sono password: non c'è accesso", actionPage: null, details: ["One2OneLove al momento non ha accesso, quindi non c'è password da cambiare, reimpostare o recuperare.", "Se prima avevi un account, è disattivato — non eliminato — e potrebbe essere riattivato in futuro.", "Non condividere mai password o codici di verifica con chiunque affermi di essere l'assistenza One2OneLove; l'assistenza non te li chiederà mai."] }
      ],
      features: [
        { title: "Il Coach Relazionale AI (ritirato)", desc: "La chat IA di Amora è stata ritirata: tutto il resto è gratis", actionPage: "Amora", details: ["La chat IA di Amora è stata ritirata perché costava denaro a ogni messaggio. One2OneLove ora è una piattaforma gratuita senza funzioni a pagamento per utilizzo.", "Per orientamento relazionale, usa gli strumenti gratuiti: quiz, Pratica di Comunicazione, Note d’Amore, Idee per Appuntamenti, lo show Studio, i podcast e le sale chat della community.", "Nulla su One2OneLove è un terapeuta, medico, avvocato, consulente abilitato o servizio di crisi. Se sei in pericolo o in crisi, contatta subito il numero di emergenza locale o un servizio di crisi."] },
        { title: "Impostare traguardi della relazione", desc: "Registra date ed eventi significativi", actionPage: "RelationshipMilestones", details: ["Apri Traguardi e Anniversari e aggiungi le informazioni richieste.", "Usa date e descrizioni corrette.", "Salva e torna in seguito per rivedere o modificare quando l'editing è disponibile."] },
        { title: "Creare ricordi condivisi", desc: "Usa Memory Lane per conservare momenti importanti", actionPage: "MemoryLane", details: ["Apri Memory Lane e aggiungi testo, data, foto o altri contenuti supportati.", "Carica solo contenuti tuoi o per cui hai il permesso di condivisione.", "Evita dati altamente sensibili che non desideri salvare nel tuo browser."] },
        { title: "Programmare note d'amore", desc: "Prepara una nota per più tardi quando la programmazione è disponibile", actionPage: "LoveNotes", details: ["Crea e rileggi la nota prima di scegliere la consegna.", "Se Programma per dopo è disponibile, seleziona data e ora e conferma.", "Se la programmazione non viene salvata correttamente, usa un'opzione immediata disponibile o contatta l'assistenza."] },
        { title: "Esplorare idee per appuntamenti", desc: "Consulta suggerimenti e relativi dettagli", actionPage: "DateIdeas", details: ["Apri Idee per Appuntamenti e usa categorie o filtri disponibili.", "Verifica luogo, orari, prezzi, indicazioni e disponibilità perché le informazioni esterne possono cambiare.", "Usa buon senso per spostamenti, meteo, attività fisica, costo e sicurezza personale."] },
        { title: "Usare i quiz sulle relazioni", desc: "Usa i quiz per conversazione e riflessione", actionPage: "RelationshipQuizzes", details: ["Scegli un quiz adatto all'argomento che vuoi esplorare.", "Rispondi sinceramente e considera i risultati come spunti di conversazione, non diagnosi.", "Non usare i risultati per etichettare, fare pressione o prendere decisioni ad alto rischio su un'altra persona."] }
      ],
      troubleshooting: [
        { title: "Non esiste più l'accesso", desc: "Gli account sono disattivati: tutto è aperto come ospite", actionPage: null, details: ["Non stai sbagliando nulla: accesso e account sono disattivati su One2OneLove al momento.", "Ogni funzione è aperta per te come ospite: aprila e usala, senza account né password.", "Le tue voci personali si salvano in questo browser, su questo dispositivo, invece che in un account."] },
        { title: "Le Love Notes non vengono inviate o salvate", desc: "Controlla nota, destinatario e consegna", actionPage: "LoveNotes", details: ["Verifica che tutti i campi obbligatori siano compilati e che destinatario o metodo di consegna siano validi.", "Per una nota programmata, verifica che data e ora siano state salvate.", "Aggiorna una volta la pagina prima di creare duplicati.", "Se continua, contatta l'assistenza indicando orario approssimativo e funzione usata."] },
        { title: "Una pagina o funzione non carica correttamente", desc: "Prova comuni soluzioni di browser e connessione", actionPage: null, details: ["Aggiorna la pagina e verifica la connessione Internet.", "Usa una versione recente di un browser principale e disattiva temporaneamente estensioni che bloccano script o cookie.", "Cancella l'archiviazione di questo sito nel browser e ricarica se il problema sembra legato ai tuoi dati salvati.", "Se persiste, contatta l'assistenza indicando pagina, dispositivo/browser e cosa è successo."] },
        { title: "Domande su un vecchio addebito", desc: "Aiuto per la fatturazione storica di prima che One2OneLove diventasse gratis", actionPage: "ContactUs", details: ["One2OneLove non vende più nulla: non ci sono portafoglio Credito, Ricarica Automatica né pagamenti.", "Se vedi un vecchio addebito One2OneLove che non riconosci, contatta il supporto con e-mail dell’account, data e importo per la verifica.", "Non inviare numeri completi di carta via e-mail o nei messaggi di supporto."] },
      ]
    }
  },
  de: {
    title: "Hilfezentrum", subtitle: "Finden Sie Antworten, lernen Sie One2OneLove kennen und erhalten Sie Unterstützung", searchPlaceholder: "Nach Hilfe suchen...", categories: "Hilfe-Kategorien", searchResults: "Suchergebnisse", noResults: "Keine Hilfeartikel passen zu Ihrer Suche.", stillNeedHelp: "Benötigen Sie weitere Hilfe?", contactUs: "Kontaktieren Sie Uns", back: "Zurück", openFeature: "Zugehörige Funktion öffnen",
    gettingStarted: { title: "Erste Schritte", desc: "Lernen Sie die Grundlagen von One2OneLove" }, accountSettings: { title: "Konten & Datenschutz", desc: "Warum es keine Konten gibt und wie Ihre Informationen behandelt werden" }, features: { title: "Funktionshandbuch", desc: "Erfahren Sie, wie die wichtigsten Werkzeuge funktionieren" }, troubleshooting: { title: "Fehlerbehebung", desc: "Lösen Sie häufige Probleme" },
    articles: {
      gettingStarted: [
        { title: "So funktioniert One2OneLove", desc: "Alles ist kostenlos — ohne Konto und Karte", actionPage: "Home", details: ["One2OneLove ist eine kostenlose Beziehungsplattform. Jede Funktion ist für alle kostenlos.", "Sie brauchen weder Konto noch Zahlungskarte: Sehen Sie sich Tools, Spiele, Studio, Podcasts, Liebesbotschaften, Date-Ideen und Chaträume als Gast an und nutzen Sie sie.", "Persönliche Gästefunktionen (Tagebücher, Erinnerungen, Meilensteine, Ziele, Kalender) werden in Ihrem eigenen Browser auf diesem Gerät gespeichert.", "Derzeit gibt es auf One2OneLove keine Konten: Mitgliederkonten sind deaktiviert, es gibt keine Registrierung und keine Anmeldung, und es gibt keine Testphasen, Abonnements oder Käufe."] },
        { title: "Gründungsmitglieder", desc: "Das Gründungsmitglieder-Geschenk ist beendet", actionPage: "FeaturePricing", details: ["Das Gründungsmitglieder-Geschenk wurde eingestellt. One2OneLove hat keine Mitgliedskonten und keinen Credit mehr, daher kann das Geschenk nicht laufen und es gibt nichts einzulösen.", "Es gibt auf One2OneLove keine Credit-Preise oder -Angebote. Die Website ist für alle 100 % kostenlos — jede Funktion ist gratis, ohne Anmeldung, ohne Karte und ohne Käufe.", "Historische Abonnement- und Credit-Datensätze werden nur für Buchhaltung und Abgleich aufbewahrt."] },
        { title: "Brauche ich ein Konto?", desc: "Nein — One2OneLove hat derzeit keine Konten", actionPage: "FeaturePricing", details: ["One2OneLove ist eine kostenlose Plattform ohne Konten: Es gibt keine Registrierung und keine Anmeldung, und jede Funktion ist für alle als Gast offen.", "Mitgliederkonten sind vorerst deaktiviert. Sie wurden nicht gelöscht und können in Zukunft wieder aktiviert werden.", "Ihre persönlichen Funktionen (Tagebücher, Erinnerungen, Meilensteine, Ziele, Kalender, Liebesbotschaften) werden statt in einem Konto in Ihrem eigenen Browser auf diesem Gerät gespeichert.", "Da nichts an ein Konto gebunden ist, gibt es keine Passwörter, Bestätigungs-E-Mails oder Wiederherstellungsnachrichten, um die Sie sich kümmern müssten."] },
        { title: "Wo werden meine Informationen gespeichert?", desc: "Ihre Einträge bleiben in Ihrem Browser auf diesem Gerät", actionPage: "Home", details: ["Derzeit gibt es auf One2OneLove keine Profile — Profile gehören zu Mitgliederkonten, die deaktiviert sind.", "Was Sie in Tagebüchern, Erinnerungen, Meilensteinen, Zielen, Kalender und Liebesbotschaften erstellen, wird in Ihrem eigenen Browser auf diesem Gerät gespeichert.", "Ihre Einträge folgen Ihnen nicht auf ein anderes Gerät oder einen anderen Browser, und das Löschen Ihres Browser-Speichers entfernt sie.", "Fügen Sie nur Informationen hinzu, die Sie auf diesem Gerät speichern möchten."] },
        { title: "Ihre erste Liebesbotschaft", desc: "Eine Love Note erstellen und senden", actionPage: "LoveNotes", details: ["Öffnen Sie Love Notes und wählen Sie die Art der Nachricht.", "Schreiben Sie selbst oder nutzen Sie eine Assistenzfunktion und prüfen Sie den Text vor dem Senden oder Speichern.", "Bestätigen Sie Empfänger und Versandoption vor Abschluss."] },
        { title: "One2OneLove mit Ihrem Partner teilen", desc: "Senden Sie einfach den Link — kein Konto nötig", actionPage: "Home", details: ["Derzeit gibt es kein Einladungstool: Einladungen gehörten zu Mitgliederkonten, die deaktiviert sind.", "Um One2OneLove zu teilen, senden Sie Ihrem Partner einfach den Link zur Website oder zu einer Seite, die Ihnen gefallen hat.", "Er kann sie öffnen und alles sofort nutzen — kein Konto, keine Karte, nichts zu installieren.", "Teilen Sie respektvoll: nur mit Personen, die Sie kennen, und niemals für Spam oder wiederholten unerwünschten Kontakt."] }
      ],
      accountSettings: [
        { title: "Ihre Informationen auf diesem Gerät", desc: "Bearbeiten oder entfernen Sie, was Sie hier gespeichert haben", actionPage: "Home", details: ["Derzeit gibt es keine Profilseite — Profile gehören zu Mitgliederkonten, die deaktiviert sind.", "Um etwas zu ändern, das Sie gespeichert haben, öffnen Sie die Funktion (Tagebücher, Erinnerungen, Meilensteine, Ziele, Kalender, Liebesbotschaften) und bearbeiten oder löschen Sie es dort.", "Um alles auf einmal zu entfernen, löschen Sie den Speicher dieser Website in Ihren Browser-Einstellungen."] },
        { title: "Benachrichtigungen", desc: "One2OneLove sendet keine Konto-Benachrichtigungen", actionPage: null, details: ["Es gibt keine Konten, also keine Konto-E-Mails, Anmeldewarnungen oder zu verwaltenden Benachrichtigungseinstellungen.", "One2OneLove sendet Ihnen von der Website keine E-Mails oder SMS.", "Wenn Ihr Browser fragt, ob diese Website Benachrichtigungen anzeigen darf, wird diese Berechtigung in den Einstellungen Ihres Browsers oder Betriebssystems gesteuert."] },
        { title: "Datenschutz und Ihre Daten", desc: "Erfahren Sie, wie Ihre Informationen behandelt werden", actionPage: "PrivacyPolicy", details: ["Lesen Sie die Datenschutzrichtlinie zu Datenkategorien und Verwendungszwecken.", "Ihre persönlichen Einträge leben in Ihrem eigenen Browser — bearbeiten oder löschen Sie sie in jeder Funktion oder löschen Sie sie, indem Sie den Browser-Speicher dieser Website leeren.", "Für Zugriffs-, Berichtigungs- oder Löschanfragen außerhalb der Oberfläche wenden Sie sich an Support oder den in der Richtlinie genannten Datenschutz-/Rechtskontakt."] },
        { title: "Passwörter und Anmeldung", desc: "Es gibt keine Passwörter — es gibt keine Anmeldung", actionPage: null, details: ["One2OneLove hat derzeit keine Anmeldung, also gibt es kein Passwort zu ändern, zurückzusetzen oder wiederherzustellen.", "Wenn Sie früher ein Konto hatten, ist es deaktiviert — nicht gelöscht — und kann in Zukunft wieder aktiviert werden.", "Teilen Sie niemals Passwörter oder Bestätigungscodes mit jemandem, der behauptet, One2OneLove-Support zu sein; der Support wird Sie nie danach fragen."] }
      ],
      features: [
        { title: "KI-Beziehungscoach (eingestellt)", desc: "Amoras KI-Chat wurde eingestellt — alles andere ist kostenlos", actionPage: "Amora", details: ["Amoras KI-Chat wurde eingestellt, weil er bei jeder Nachricht Geld kostete. One2OneLove ist jetzt eine kostenlose Plattform ohne nutzungsbasierte Funktionen.", "Für Beziehungsorientierung nutzen Sie stattdessen die kostenlosen Tools: Quizze, Kommunikationsübung, Liebesbotschaften, Date-Ideen, die Studio-Show, Podcasts und die Community-Chaträume.", "Nichts auf One2OneLove ist ein Therapeut, Arzt, Anwalt, lizenzierter Berater oder Krisendienst. Wenn Sie in Gefahr oder in einer Krise sind, wenden Sie sich sofort an Ihre örtliche Notrufnummer oder einen Krisendienst."] },
        { title: "Beziehungsmeilensteine einrichten", desc: "Bedeutende Daten und Ereignisse festhalten", actionPage: "RelationshipMilestones", details: ["Öffnen Sie Meilensteine & Jahrestage und tragen Sie die angeforderten Informationen ein.", "Verwenden Sie korrekte Daten und Beschreibungen.", "Speichern Sie und kehren Sie später zur Überprüfung oder Bearbeitung zurück, wenn diese verfügbar ist."] },
        { title: "Gemeinsame Erinnerungen erstellen", desc: "Memory Lane zum Festhalten von Momenten nutzen", actionPage: "MemoryLane", details: ["Öffnen Sie Memory Lane und fügen Sie unterstützten Text, Datum, Foto oder andere Inhalte hinzu.", "Laden Sie nur Inhalte hoch, die Ihnen gehören oder für die Sie eine Freigabe haben.", "Vermeiden Sie besonders sensible Informationen, die Sie nicht in Ihrem Browser speichern möchten."] },
        { title: "Liebesbotschaften planen", desc: "Eine Nachricht für später vorbereiten, wenn Planung verfügbar ist", actionPage: "LoveNotes", details: ["Erstellen und prüfen Sie die Nachricht vor Auswahl der Zustellung.", "Wenn Später planen verfügbar ist, wählen Sie Datum und Uhrzeit und bestätigen Sie.", "Wenn die Planung nicht korrekt gespeichert wird, nutzen Sie eine verfügbare Sofortoption oder wenden Sie sich an den Support."] },
        { title: "Date-Ideen erkunden", desc: "Vorschläge und Details ansehen", actionPage: "DateIdeas", details: ["Öffnen Sie Date-Ideen und nutzen Sie verfügbare Kategorien oder Filter.", "Prüfen Sie Ort, Öffnungszeiten, Preise, Wegbeschreibung und Verfügbarkeit, da externe Informationen sich ändern können.", "Achten Sie auf Reise, Wetter, körperliche Aktivität, Kosten und persönliche Sicherheit."] },
        { title: "Beziehungsquiz verwenden", desc: "Quiz für Gespräch und Reflexion nutzen", actionPage: "RelationshipQuizzes", details: ["Wählen Sie ein Quiz zum gewünschten Thema.", "Antworten Sie ehrlich und verstehen Sie Ergebnisse als Gesprächsanstoß, nicht als Diagnose.", "Nutzen Sie Ergebnisse nicht, um andere zu etikettieren, unter Druck zu setzen oder Hochrisikoentscheidungen zu treffen."] }
      ],
      troubleshooting: [
        { title: "Es gibt keine Anmeldung mehr", desc: "Konten sind deaktiviert — alles ist als Gast offen", actionPage: null, details: ["Sie machen nichts falsch: Anmeldung und Konten sind auf One2OneLove derzeit deaktiviert.", "Jede Funktion ist für Sie als Gast offen — öffnen Sie sie einfach und nutzen Sie sie, ohne Konto oder Passwort.", "Ihre persönlichen Einträge werden statt in einem Konto in diesem Browser auf diesem Gerät gespeichert."] },
        { title: "Love Notes werden nicht gesendet oder gespeichert", desc: "Nachricht, Empfänger und Versand prüfen", actionPage: "LoveNotes", details: ["Prüfen Sie, ob alle Pflichtfelder ausgefüllt sind und Empfänger oder Versandmethode gültig sind.", "Bei geplanter Zustellung prüfen Sie, ob Datum und Uhrzeit wirklich gespeichert wurden.", "Aktualisieren Sie die Seite einmal, bevor Sie Duplikate erstellen.", "Wenn das Problem bleibt, nennen Sie dem Support ungefähr Zeitpunkt und verwendete Funktion."] },
        { title: "Eine Seite oder Funktion lädt nicht richtig", desc: "Übliche Browser- und Verbindungsprobleme beheben", actionPage: null, details: ["Aktualisieren Sie die Seite und prüfen Sie die Internetverbindung.", "Nutzen Sie eine aktuelle Version eines gängigen Browsers und deaktivieren Sie vorübergehend Erweiterungen, die Skripte oder Cookies blockieren.", "Löschen Sie den Browser-Speicher dieser Website und laden Sie neu, wenn das Problem mit Ihren gespeicherten Einträgen zusammenzuhängen scheint.", "Wenn es bleibt, kontaktieren Sie den Support mit Seitenname, Gerät/Browser und Beschreibung."] },
        { title: "Fragen zu einer früheren Belastung", desc: "Hilfe bei früherer Abrechnung aus der Zeit vor dem kostenlosen One2OneLove", actionPage: "ContactUs", details: ["One2OneLove verkauft nichts mehr: Es gibt keine Credit-Wallet, keine automatische Aufladung und keine Kaufabwicklung.", "Wenn Sie eine frühere One2OneLove-Belastung sehen, die Sie nicht erkennen, wenden Sie sich mit Konto-E-Mail, Datum und Betrag an den Support, damit sie geprüft werden kann.", "Senden Sie vollständige Kartennummern niemals per E-Mail oder in einer Support-Nachricht."] },
      ]
    }
  }
};

export default function HelpCenter() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);

  const categories = [
    { id: "gettingStarted", icon: Book, title: t.gettingStarted.title, desc: t.gettingStarted.desc, color: "from-blue-500 to-cyan-500" },
    { id: "accountSettings", icon: Settings, title: t.accountSettings.title, desc: t.accountSettings.desc, color: "from-purple-500 to-pink-500" },
    { id: "features", icon: Sparkles, title: t.features.title, desc: t.features.desc, color: "from-green-500 to-emerald-500" },
    { id: "troubleshooting", icon: Wrench, title: t.troubleshooting.title, desc: t.troubleshooting.desc, color: "from-orange-500 to-red-500" }
  ];

  const allArticles = useMemo(() => {
    return categories.flatMap((category) =>
      (t.articles?.[category.id] || []).map((article, index) => ({ ...article, categoryId: category.id, articleIndex: index }))
    );
  }, [t]);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return allArticles.filter((article) => {
      const haystack = [article.title, article.desc, ...(article.details || [])].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [allArticles, searchQuery]);

  const openArticle = (categoryId, article) => {
    const category = categories.find((item) => item.id === categoryId);
    setSelectedCategory(category || null);
    setSelectedArticle(article);
    setSearchQuery("");
  };

  const handleBack = () => {
    if (selectedArticle) {
      setSelectedArticle(null);
      return;
    }
    if (selectedCategory) {
      setSelectedCategory(null);
    }
  };

  const SelectedIcon = selectedCategory?.icon;

  const ArticleCard = ({ article, categoryId, index }) => (
    <motion.div key={`${categoryId}-${index}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.05, 0.25) }}>
      <Card
        onClick={() => openArticle(categoryId, article)}
        className="hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-purple-200 h-full"
      >
        <CardHeader>
          <CardTitle className="text-lg">{article.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">{article.desc}</p>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-6">
          {selectedCategory || selectedArticle ? (
            <button onClick={handleBack} className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
              <ArrowLeft size={20} className="mr-2" />
              {t.back}
            </button>
          ) : (
            <Link to={createPageUrl("Home")} className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
              <ArrowLeft size={20} className="mr-2" />
              {t.back}
            </Link>
          )}
        </div>

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6 shadow-xl">
            <HelpCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">{t.title}</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">{t.subtitle}</p>
        </motion.div>

        {!selectedArticle && (
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input aria-label={t.searchPlaceholder} placeholder={t.searchPlaceholder} value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setSelectedCategory(null); }} className="pl-12 h-14 text-lg shadow-lg" />
            </div>
          </div>
        )}

        {selectedArticle ? (
          <div className="max-w-4xl mx-auto mb-16">
            {selectedCategory && SelectedIcon && (
              <div className={`inline-flex items-center gap-3 px-5 py-3 bg-gradient-to-br ${selectedCategory.color} rounded-2xl shadow-lg mb-6`}>
                <SelectedIcon className="w-7 h-7 text-white" />
                <span className="font-bold text-white">{selectedCategory.title}</span>
              </div>
            )}
            <Card className="shadow-2xl border-2 border-purple-100">
              <CardHeader>
                <CardTitle className="text-3xl">{selectedArticle.title}</CardTitle>
                <p className="text-gray-600 mt-2">{selectedArticle.desc}</p>
              </CardHeader>
              <CardContent className="space-y-4 text-gray-700 leading-relaxed">
                {(selectedArticle.details || []).map((detail, index) => (
                  <p key={index}>{detail}</p>
                ))}
                {selectedArticle.actionPage && (
                  <Link to={createPageUrl(selectedArticle.actionPage)} className="inline-flex mt-4 px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-colors">
                    {t.openFeature}
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>
        ) : searchQuery.trim() ? (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">{t.searchResults}</h2>
            {searchResults.length ? (
              <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                {searchResults.map((article, index) => <ArticleCard key={`${article.categoryId}-${article.articleIndex}`} article={article} categoryId={article.categoryId} index={index} />)}
              </div>
            ) : (
              <p className="text-center text-gray-600 text-lg">{t.noResults}</p>
            )}
          </div>
        ) : !selectedCategory ? (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">{t.categories}</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((category, index) => {
                const Icon = category.icon;
                return (
                  <motion.div key={category.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.1 }}>
                    <Card onClick={() => { setSelectedCategory(category); setSelectedArticle(null); }} className="h-full hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-blue-200">
                      <CardContent className="p-6">
                        <div className={`w-14 h-14 bg-gradient-to-br ${category.color} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{category.title}</h3>
                        <p className="text-sm text-gray-600">{category.desc}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mb-16">
            <div className="mb-8">
              <div className={`inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-br ${selectedCategory.color} rounded-2xl shadow-xl`}>
                {SelectedIcon && <SelectedIcon className="w-8 h-8 text-white" />}
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedCategory.title}</h2>
                  <p className="text-white/90 text-sm">{selectedCategory.desc}</p>
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
              {(t.articles?.[selectedCategory.id] || []).map((article, index) => <ArticleCard key={`${selectedCategory.id}-${index}`} article={article} categoryId={selectedCategory.id} index={index} />)}
            </div>
          </div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-center text-white shadow-2xl">
          <Mail className="w-16 h-16 mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-4">{t.stillNeedHelp}</h2>
          <Link to={createPageUrl("ContactUs")}>
            <button className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all shadow-lg inline-flex items-center gap-2">
              <Mail className="w-5 h-5" />
              {t.contactUs}
            </button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
