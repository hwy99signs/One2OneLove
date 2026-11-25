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
    accountSettings: { title: "Account Settings", desc: "Manage your profile, security, privacy, and account preferences" },
    features: { title: "Features Guide", desc: "Learn how the main One2OneLove tools are intended to work" },
    troubleshooting: { title: "Troubleshooting", desc: "Work through common account and feature problems" },
    articles: {
      gettingStarted: [
        { title: "How One2OneLove works", desc: "Everything is free — no account or card needed", actionPage: "Home", details: ["One2OneLove is a free relationship platform. Every feature is free for everyone.", "You do not need an account or a payment card to use anything: browse and use the tools, games, Studio, podcasts, Love Notes, Date Ideas, and chat rooms as a guest.", "Guest personal features (Journals, Memories, Milestones, Goals, Calendar) save in your own browser on this device.", "An account is optional and free. It exists only so members can keep saved information and their identity across devices. There are no trials, subscriptions, or purchases."] },
        { title: "Founding Members", desc: "Founder numbers, badges, and what changed", actionPage: "FeaturePricing", details: ["Founding Member numbers #1–200 remain reserved and are not recycled. The Founder badge remains attached to the account.", "One2OneLove is now 100% free for everyone, and Credit has been retired — there is nothing to buy and no metered services.", "Historical subscription and Credit records are kept only for accounting and reconciliation.", "Any future Founding Member perk will be announced on the site before it starts."] },
        { title: "How to create your account", desc: "Sign up and verify the information needed to begin", actionPage: "SignUp", details: ["Select Sign Up and enter the requested account information.", "Use an email address you can access because verification or recovery messages may be sent there.", "After registration, sign in and complete the profile information you want associated with your account.", "Never share your password or verification codes with another person."] },
        { title: "Complete your profile", desc: "Add and review the information connected to your account", actionPage: "Profile", details: ["Open Profile after signing in.", "Add or update the profile fields that are available to you, then save your changes.", "Only share information you are comfortable placing on the platform, especially relationship details, photos, and personal background information."] },
        { title: "Your first love note", desc: "Create and send a Love Note", actionPage: "LoveNotes", details: ["Open Love Notes and choose the type of note you want to create.", "Write your own note or pick one from the free note library, then review the text before sending or saving.", "Confirm the intended recipient and delivery choice before completing the action.", "Love Notes are always free and are sent inside the app or shared through your own apps."] },
        { title: "Invite your partner", desc: "Use the invitation tool to connect with someone you know", actionPage: "Invite", details: ["Open Invite and use the available invitation method.", "Only invite people you know and who you reasonably expect will want to receive the invitation.", "Do not use invitations for spam, harassment, repeated unwanted contact, or solicitation."] }
      ],
      accountSettings: [
        { title: "Update your profile information", desc: "Review or change profile information", actionPage: "Profile", details: ["Open Profile while signed in.", "Edit the fields that are available and save your changes.", "If a field cannot be changed from the profile page, contact support for assistance."] },
        { title: "Notification preferences", desc: "Understand and manage available notifications", actionPage: "Profile", details: ["Check your profile or account controls for notification options that are currently available.", "Browser or device notification permissions may also be controlled in your browser or operating-system settings.", "Some service, security, or legal notices may still be sent when required even if optional notifications are reduced."] },
        { title: "Privacy and account data", desc: "Learn how your information is handled and how to request changes", actionPage: "PrivacyPolicy", details: ["Review the Privacy Policy for the categories of information One2OneLove may collect and how that information may be used.", "Use available account controls to update information you can edit yourself.", "For access, correction, deletion, or other privacy requests that are not available in the interface, contact support or the legal/privacy contact listed in the policy."] },
        { title: "Change or reset your password", desc: "Recover account access and protect your sign-in", actionPage: "ForgotPassword", details: ["Use Forgot Password if you cannot sign in or need to reset your password.", "Follow the reset instructions sent to the email address associated with your account.", "Choose a unique password and do not reuse a password from another service."] }
      ],
      features: [
        { title: "The AI Relationship Coach (retired)", desc: "Amora's AI chat has been retired — everything else is free", actionPage: "Amora", details: ["Amora's AI chat has been retired because it cost money on every message. One2OneLove is now a free platform with no per-use features.", "For relationship guidance, use the free tools instead: quizzes, Communication Practice, Love Notes, Date Ideas, the Studio show, podcasts, and the community chat rooms.", "Nothing on One2OneLove is a therapist, doctor, lawyer, licensed counselor, or crisis service. If you are in danger or in crisis, contact your local emergency number or a crisis service right away."] },
        { title: "Setting up relationship milestones", desc: "Track meaningful dates and events", actionPage: "RelationshipMilestones", details: ["Open Milestones & Anniversaries and add the event information requested by the page.", "Use accurate dates and descriptions that are meaningful to you.", "Save the milestone and return to the page later to review or update it when editing is available."] },
        { title: "Creating shared memories", desc: "Use Memory Lane to preserve relationship moments", actionPage: "MemoryLane", details: ["Open Memory Lane and add the text, date, photo, or other information supported by the page.", "Only upload content you own or have permission to share.", "Avoid posting highly sensitive information that you would not want stored with your account."] },
        { title: "Scheduling love notes", desc: "Prepare a Love Note for a later time when scheduling is available", actionPage: "LoveNotes", details: ["Create the Love Note and review it before choosing a delivery option.", "If Schedule for Later is available, select the intended date and time and confirm the schedule.", "If scheduling is temporarily unavailable or does not save correctly, use an available immediate option or contact support instead of assuming the note is scheduled."] },
        { title: "Exploring date ideas", desc: "Browse date suggestions and related details", actionPage: "DateIdeas", details: ["Open Date Ideas and use the available categories or filters to narrow suggestions.", "Review the details before relying on location, hours, pricing, directions, or availability because third-party information can change.", "Use good judgment regarding travel, weather, physical activity, cost, and personal safety."] },
        { title: "Using relationship quizzes", desc: "Use quizzes for conversation and reflection", actionPage: "RelationshipQuizzes", details: ["Choose a quiz that fits the topic you want to explore.", "Answer honestly and treat results as conversation starters rather than diagnoses or professional assessments.", "Quiz results should not be used to label, pressure, or make high-stakes decisions about another person."] }
      ],
      troubleshooting: [
        { title: "Can't log in to my account", desc: "Reset your password or recover access", actionPage: "ForgotPassword", details: ["Confirm that you are using the email address associated with the account.", "Use Forgot Password and follow the reset message sent to your email.", "Check spam or junk folders if the message does not appear.", "If access still fails, contact support and do not send your password in the support message."] },
        { title: "Love Notes are not sending or saving", desc: "Check the note, recipient, and delivery selection", actionPage: "LoveNotes", details: ["Confirm all required fields are complete and the recipient or delivery method is valid.", "If you used a scheduled option, verify that a date and time were actually saved.", "Refresh the page once and check again before creating duplicates.", "If the problem continues, contact support with the approximate time of the attempt and the feature you were using; do not include private message content unless necessary."] },
        { title: "A page or feature is not loading properly", desc: "Try common browser and connection fixes", actionPage: null, details: ["Refresh the page and confirm your internet connection is working.", "Try a current version of a major browser and temporarily disable extensions that may block scripts or cookies.", "Sign out and back in if the issue appears account-specific.", "If the issue remains, contact support with the page name, device/browser, and a description of what happened."] },
        { title: "Questions about a past charge", desc: "Help with historical billing from before One2OneLove became free", actionPage: "ContactUs", details: ["One2OneLove no longer sells anything: there is no Credit wallet, no Auto-Replenish, and no checkout.", "If you see a past One2OneLove charge you do not recognize, contact support with the account email, date, and amount so it can be investigated.", "Do not send full payment-card numbers by email or through a support message."] },
      ]
    }
  },
  es: {
    title: "Centro de Ayuda", subtitle: "Encuentra respuestas, aprende cómo funciona One2OneLove y obtén soporte", searchPlaceholder: "Buscar ayuda...", categories: "Categorías de Ayuda", searchResults: "Resultados de Búsqueda", noResults: "Ningún artículo de ayuda coincide con tu búsqueda.", stillNeedHelp: "¿Aún necesitas ayuda?", contactUs: "Contáctanos", back: "Volver", openFeature: "Abrir función relacionada",
    gettingStarted: { title: "Primeros Pasos", desc: "Aprende lo básico para usar One2OneLove" }, accountSettings: { title: "Configuración de Cuenta", desc: "Administra perfil, seguridad, privacidad y preferencias" }, features: { title: "Guía de Funciones", desc: "Aprende cómo funcionan las principales herramientas" }, troubleshooting: { title: "Solución de Problemas", desc: "Resuelve problemas comunes de cuenta y funciones" },
    articles: {
      gettingStarted: [
        { title: "Cómo funciona One2OneLove", desc: "Todo es gratis: sin cuenta ni tarjeta", actionPage: "Home", details: ["One2OneLove es una plataforma de relaciones gratuita. Todas las funciones son gratis para todos.", "No necesitas cuenta ni tarjeta de pago para usar nada: explora y usa como invitado las herramientas, juegos, Studio, podcasts, Notas de Amor, Ideas de Citas y salas de chat.", "Las funciones personales de invitado (Diarios, Recuerdos, Hitos, Metas, Calendario) se guardan en tu propio navegador en este dispositivo.", "Una cuenta es opcional y gratuita. Sirve solo para que los miembros conserven su información guardada e identidad entre dispositivos. No hay pruebas, suscripciones ni compras."] },
        { title: "Miembros Fundadores", desc: "Números de Fundador, insignias y qué cambió", actionPage: "FeaturePricing", details: ["Los números de Miembro Fundador #1–200 quedan reservados y no se reciclan. La insignia permanece asociada a la cuenta.", "One2OneLove ahora es 100% gratis para todos y el Crédito se retiró: no hay nada que comprar ni servicios medidos por uso.", "Los registros históricos de suscripciones y Crédito se conservan solo para contabilidad y conciliación.", "Cualquier beneficio futuro para Miembros Fundadores se anunciará en el sitio antes de comenzar."] },
        { title: "Cómo crear tu cuenta", desc: "Regístrate y verifica la información necesaria", actionPage: "SignUp", details: ["Selecciona Registrarse e introduce la información solicitada.", "Usa un correo electrónico al que tengas acceso porque allí pueden llegar mensajes de verificación o recuperación.", "Después del registro, inicia sesión y completa la información de perfil que quieras asociar con tu cuenta.", "Nunca compartas tu contraseña ni códigos de verificación."] },
        { title: "Completa tu perfil", desc: "Añade y revisa la información de tu cuenta", actionPage: "Profile", details: ["Abre Perfil después de iniciar sesión.", "Añade o actualiza los campos disponibles y guarda los cambios.", "Comparte solo la información que te resulte apropiado almacenar en la plataforma."] },
        { title: "Tu primera nota de amor", desc: "Crea y envía una Nota de Amor", actionPage: "LoveNotes", details: ["Abre Notas de Amor y elige el tipo de nota que deseas crear.", "Escribe tu propio mensaje o elige uno de la biblioteca gratuita de notas y revísalo antes de enviarlo o guardarlo.", "Confirma el destinatario y la opción de entrega antes de completar la acción."] },
        { title: "Invita a tu pareja", desc: "Usa la herramienta de invitación para conectar con alguien que conoces", actionPage: "Invite", details: ["Abre Invitar y usa el método disponible.", "Invita solo a personas que conoces y que razonablemente quieran recibir la invitación.", "No uses invitaciones para spam, acoso o contacto repetido no deseado."] }
      ],
      accountSettings: [
        { title: "Actualiza tu información de perfil", desc: "Revisa o cambia datos del perfil", actionPage: "Profile", details: ["Abre Perfil mientras has iniciado sesión.", "Edita los campos disponibles y guarda los cambios.", "Si un dato no puede cambiarse desde el perfil, contacta con soporte."] },
        { title: "Preferencias de notificaciones", desc: "Comprende y administra las notificaciones disponibles", actionPage: "Profile", details: ["Revisa tu perfil o controles de cuenta para las opciones disponibles.", "Los permisos del navegador o del dispositivo también pueden gestionarse en su configuración.", "Los avisos de servicio, seguridad o legales pueden seguir enviándose cuando sea necesario."] },
        { title: "Privacidad y datos de la cuenta", desc: "Conoce cómo se maneja tu información", actionPage: "PrivacyPolicy", details: ["Consulta la Política de Privacidad para conocer qué información puede recopilarse y cómo se utiliza.", "Usa los controles disponibles para actualizar tus datos.", "Para solicitudes de acceso, corrección o eliminación no disponibles en la interfaz, contacta con soporte o con el contacto legal/privacidad indicado en la política."] },
        { title: "Cambiar o restablecer tu contraseña", desc: "Recupera acceso y protege tu inicio de sesión", actionPage: "ForgotPassword", details: ["Usa Olvidé mi contraseña si no puedes iniciar sesión o necesitas cambiarla.", "Sigue las instrucciones enviadas al correo asociado con tu cuenta.", "Usa una contraseña única y no la reutilices en otros servicios."] }
      ],
      features: [
        { title: "El Coach de Relaciones con IA (retirado)", desc: "El chat con IA de Amora se retiró: todo lo demás es gratis", actionPage: "Amora", details: ["El chat con IA de Amora se retiró porque costaba dinero en cada mensaje. One2OneLove ahora es una plataforma gratuita sin funciones de pago por uso.", "Para orientación en tu relación, usa las herramientas gratuitas: cuestionarios, Práctica de Comunicación, Notas de Amor, Ideas de Citas, el programa Studio, podcasts y las salas de chat de la comunidad.", "Nada en One2OneLove es un terapeuta, médico, abogado, consejero licenciado o servicio de crisis. Si estás en peligro o en crisis, contacta de inmediato tu número de emergencia local o un servicio de crisis."] },
        { title: "Configurar hitos de la relación", desc: "Guarda fechas y eventos significativos", actionPage: "RelationshipMilestones", details: ["Abre Hitos y Aniversarios y añade la información solicitada.", "Usa fechas y descripciones correctas.", "Guarda el hito y vuelve más tarde para revisarlo o actualizarlo cuando la edición esté disponible."] },
        { title: "Crear recuerdos compartidos", desc: "Usa Memory Lane para conservar momentos", actionPage: "MemoryLane", details: ["Abre Memory Lane y añade el texto, fecha, foto u otra información admitida.", "Sube solo contenido que sea tuyo o que tengas permiso para compartir.", "Evita guardar información altamente sensible que no quieras asociada con tu cuenta."] },
        { title: "Programar notas de amor", desc: "Prepara una nota para más tarde cuando la programación esté disponible", actionPage: "LoveNotes", details: ["Crea y revisa la nota antes de elegir la entrega.", "Si Programar para más tarde está disponible, selecciona fecha y hora y confirma.", "Si no se guarda correctamente, usa una opción inmediata disponible o contacta con soporte en lugar de asumir que quedó programada."] },
        { title: "Explorar ideas para citas", desc: "Consulta sugerencias y detalles relacionados", actionPage: "DateIdeas", details: ["Abre Ideas para Citas y usa categorías o filtros disponibles.", "Verifica ubicación, horarios, precios, direcciones y disponibilidad porque la información externa puede cambiar.", "Usa buen criterio respecto a viajes, clima, actividad física, costo y seguridad personal."] },
        { title: "Usar cuestionarios de relaciones", desc: "Utiliza los cuestionarios para conversación y reflexión", actionPage: "RelationshipQuizzes", details: ["Elige un cuestionario relacionado con el tema que quieres explorar.", "Responde con honestidad y usa los resultados como inicio de conversación, no como diagnóstico.", "No uses los resultados para etiquetar, presionar o tomar decisiones de alto riesgo sobre otra persona."] }
      ],
      troubleshooting: [
        { title: "No puedo iniciar sesión", desc: "Restablece tu contraseña o recupera el acceso", actionPage: "ForgotPassword", details: ["Confirma que usas el correo asociado con tu cuenta.", "Usa Olvidé mi contraseña y sigue el mensaje de restablecimiento.", "Revisa spam o correo no deseado.", "Si continúa el problema, contacta con soporte sin enviar tu contraseña."] },
        { title: "Las Notas de Amor no se envían o guardan", desc: "Revisa nota, destinatario y opción de entrega", actionPage: "LoveNotes", details: ["Confirma que los campos obligatorios estén completos y que el destinatario o método de entrega sea válido.", "Si programaste la nota, verifica que se haya guardado fecha y hora.", "Actualiza la página una vez antes de crear duplicados.", "Si continúa, contacta con soporte indicando hora aproximada y función utilizada."] },
        { title: "Una página o función no carga correctamente", desc: "Prueba soluciones comunes del navegador y conexión", actionPage: null, details: ["Actualiza la página y confirma tu conexión a internet.", "Usa una versión actual de un navegador principal y desactiva temporalmente extensiones que bloqueen scripts o cookies.", "Cierra sesión y vuelve a iniciarla si parece un problema de cuenta.", "Si persiste, contacta con soporte indicando página, dispositivo/navegador y qué ocurrió."] },
        { title: "Preguntas sobre un cargo anterior", desc: "Ayuda con facturación histórica de antes de que One2OneLove fuera gratis", actionPage: "ContactUs", details: ["One2OneLove ya no vende nada: no hay billetera de Crédito, ni Recarga Automática, ni pagos.", "Si ves un cargo anterior de One2OneLove que no reconoces, contacta a soporte con el correo de la cuenta, la fecha y el importe para investigarlo.", "No envíes números completos de tarjeta por correo ni en mensajes de soporte."] },
      ]
    }
  },
  fr: {
    title: "Centre d'Aide", subtitle: "Trouvez des réponses, découvrez le fonctionnement de One2OneLove et obtenez de l'aide", searchPlaceholder: "Rechercher de l'aide...", categories: "Catégories d'Aide", searchResults: "Résultats de Recherche", noResults: "Aucun article d'aide ne correspond à votre recherche.", stillNeedHelp: "Besoin d'aide supplémentaire ?", contactUs: "Nous Contacter", back: "Retour", openFeature: "Ouvrir la fonction associée",
    gettingStarted: { title: "Premiers Pas", desc: "Apprenez les bases de One2OneLove" }, accountSettings: { title: "Paramètres du Compte", desc: "Gérez profil, sécurité, confidentialité et préférences" }, features: { title: "Guide des Fonctionnalités", desc: "Découvrez le fonctionnement des principaux outils" }, troubleshooting: { title: "Dépannage", desc: "Résolvez les problèmes courants de compte et de fonctions" },
    articles: {
      gettingStarted: [
        { title: "Comment fonctionne One2OneLove", desc: "Tout est gratuit — sans compte ni carte", actionPage: "Home", details: ["One2OneLove est une plateforme relationnelle gratuite. Chaque fonctionnalité est gratuite pour tout le monde.", "Aucun compte ni carte de paiement n’est requis : parcourez et utilisez en invité les outils, les jeux, le Studio, les podcasts, les Notes d’Amour, les Idées de Rendez-vous et les salons de discussion.", "Les fonctionnalités personnelles des invités (Journaux, Souvenirs, Jalons, Objectifs, Calendrier) sont enregistrées dans votre propre navigateur sur cet appareil.", "Un compte est facultatif et gratuit. Il sert uniquement à conserver vos informations enregistrées et votre identité sur plusieurs appareils. Il n’y a ni essais, ni abonnements, ni achats."] },
        { title: "Membres Fondateurs", desc: "Numéros Fondateurs, badges et ce qui a changé", actionPage: "FeaturePricing", details: ["Les numéros de Membre Fondateur #1–200 restent réservés et ne sont pas réattribués. Le badge reste lié au compte.", "One2OneLove est désormais 100 % gratuit pour tout le monde et le Crédit a été retiré — il n’y a rien à acheter et aucun service mesuré à l’usage.", "Les anciens enregistrements d’abonnement et de Crédit sont conservés uniquement pour la comptabilité et le rapprochement.", "Tout futur avantage pour les Membres Fondateurs sera annoncé sur le site avant son lancement."] },
        { title: "Créer votre compte", desc: "Inscrivez-vous et vérifiez les informations nécessaires", actionPage: "SignUp", details: ["Sélectionnez S'inscrire et saisissez les informations demandées.", "Utilisez une adresse e-mail accessible pour recevoir les messages de vérification ou de récupération.", "Après l'inscription, connectez-vous et complétez les informations de profil souhaitées.", "Ne partagez jamais votre mot de passe ni vos codes de vérification."] },
        { title: "Compléter votre profil", desc: "Ajoutez et vérifiez les informations liées au compte", actionPage: "Profile", details: ["Ouvrez Profil après vous être connecté.", "Ajoutez ou modifiez les champs disponibles puis enregistrez.", "Ne partagez que les informations que vous acceptez de conserver sur la plateforme."] },
        { title: "Votre première note d'amour", desc: "Créez et envoyez une Love Note", actionPage: "LoveNotes", details: ["Ouvrez Love Notes et choisissez le type de message à créer.", "Rédigez votre message ou choisissez-en un dans la bibliothèque gratuite de notes, puis relisez-le avant l'envoi ou l'enregistrement.", "Vérifiez le destinataire et le mode d'envoi avant de confirmer."] },
        { title: "Inviter votre partenaire", desc: "Utilisez l'outil d'invitation pour une personne que vous connaissez", actionPage: "Invite", details: ["Ouvrez Inviter et utilisez la méthode proposée.", "N'invitez que des personnes que vous connaissez et susceptibles d'accepter l'invitation.", "N'utilisez pas les invitations pour le spam, le harcèlement ou les contacts répétés non souhaités."] }
      ],
      accountSettings: [
        { title: "Mettre à jour votre profil", desc: "Vérifiez ou modifiez les informations du profil", actionPage: "Profile", details: ["Ouvrez Profil pendant que vous êtes connecté.", "Modifiez les champs disponibles et enregistrez.", "Si une donnée ne peut pas être modifiée depuis le profil, contactez l'assistance."] },
        { title: "Préférences de notification", desc: "Comprenez et gérez les notifications disponibles", actionPage: "Profile", details: ["Consultez le profil ou les contrôles de compte pour les options actuellement disponibles.", "Les autorisations du navigateur ou de l'appareil peuvent aussi être gérées dans leurs réglages.", "Certains avis de service, de sécurité ou juridiques peuvent rester nécessaires."] },
        { title: "Confidentialité et données du compte", desc: "Comprenez le traitement de vos informations", actionPage: "PrivacyPolicy", details: ["Consultez la Politique de confidentialité pour connaître les catégories de données et leurs usages.", "Utilisez les contrôles du compte pour modifier ce que vous pouvez.", "Pour une demande d'accès, correction ou suppression non disponible dans l'interface, contactez l'assistance ou le contact juridique/confidentialité indiqué dans la politique."] },
        { title: "Changer ou réinitialiser votre mot de passe", desc: "Récupérez l'accès et protégez votre connexion", actionPage: "ForgotPassword", details: ["Utilisez Mot de passe oublié si vous ne pouvez plus vous connecter ou souhaitez le réinitialiser.", "Suivez les instructions envoyées à l'adresse e-mail du compte.", "Choisissez un mot de passe unique que vous n'utilisez pas ailleurs."] }
      ],
      features: [
        { title: "Le Coach Relationnel IA (retiré)", desc: "Le chat IA d’Amora a été retiré — tout le reste est gratuit", actionPage: "Amora", details: ["Le chat IA d’Amora a été retiré car il coûtait de l’argent à chaque message. One2OneLove est désormais une plateforme gratuite sans fonctionnalités payantes à l’usage.", "Pour des conseils relationnels, utilisez plutôt les outils gratuits : quiz, Pratique de Communication, Notes d’Amour, Idées de Rendez-vous, l’émission Studio, les podcasts et les salons de discussion de la communauté.", "Rien sur One2OneLove n’est un thérapeute, un médecin, un avocat, un conseiller agréé ou un service de crise. En cas de danger ou de crise, contactez immédiatement votre numéro d’urgence local ou un service de crise."] },
        { title: "Configurer des étapes importantes", desc: "Suivez les dates et événements significatifs", actionPage: "RelationshipMilestones", details: ["Ouvrez Jalons et anniversaires et ajoutez les informations demandées.", "Utilisez des dates et descriptions exactes.", "Enregistrez puis revenez plus tard pour consulter ou modifier lorsque l'édition est disponible."] },
        { title: "Créer des souvenirs partagés", desc: "Utilisez Memory Lane pour conserver vos moments", actionPage: "MemoryLane", details: ["Ouvrez Memory Lane et ajoutez texte, date, photo ou autre contenu pris en charge.", "N'importez que du contenu vous appartenant ou que vous êtes autorisé à partager.", "Évitez d'enregistrer des informations très sensibles que vous ne souhaitez pas associer au compte."] },
        { title: "Planifier des notes d'amour", desc: "Préparez une note pour plus tard lorsque la planification est disponible", actionPage: "LoveNotes", details: ["Créez et relisez la note avant de choisir l'envoi.", "Si Planifier pour plus tard est disponible, choisissez date et heure et confirmez.", "Si la planification ne s'enregistre pas, utilisez une option immédiate disponible ou contactez l'assistance au lieu de supposer qu'elle est programmée."] },
        { title: "Explorer les idées de rendez-vous", desc: "Parcourez des suggestions et leurs détails", actionPage: "DateIdeas", details: ["Ouvrez Idées de rendez-vous et utilisez les catégories ou filtres disponibles.", "Vérifiez lieu, horaires, prix, itinéraire et disponibilité, car les informations tierces peuvent changer.", "Faites preuve de prudence concernant déplacement, météo, activité physique, coût et sécurité."] },
        { title: "Utiliser les quiz relationnels", desc: "Servez-vous des quiz pour échanger et réfléchir", actionPage: "RelationshipQuizzes", details: ["Choisissez un quiz adapté au sujet à explorer.", "Répondez honnêtement et considérez les résultats comme un point de départ de discussion, pas comme un diagnostic.", "N'utilisez pas les résultats pour étiqueter, faire pression ou prendre une décision importante sur quelqu'un."] }
      ],
      troubleshooting: [
        { title: "Impossible de me connecter", desc: "Réinitialisez le mot de passe ou récupérez l'accès", actionPage: "ForgotPassword", details: ["Vérifiez que vous utilisez l'adresse e-mail du compte.", "Utilisez Mot de passe oublié et suivez le message de réinitialisation.", "Consultez les dossiers indésirables si nécessaire.", "Si le problème persiste, contactez l'assistance sans transmettre votre mot de passe."] },
        { title: "Les Love Notes ne s'envoient ou ne s'enregistrent pas", desc: "Vérifiez le message, le destinataire et l'envoi", actionPage: "LoveNotes", details: ["Vérifiez que tous les champs requis sont remplis et que le destinataire ou mode d'envoi est valide.", "Pour une note planifiée, vérifiez qu'une date et une heure ont bien été enregistrées.", "Actualisez une fois la page avant de créer des doublons.", "Si le problème continue, contactez l'assistance en indiquant l'heure approximative et la fonction utilisée."] },
        { title: "Une page ou une fonction ne charge pas correctement", desc: "Essayez des solutions courantes de navigateur et de connexion", actionPage: null, details: ["Actualisez la page et vérifiez votre connexion Internet.", "Utilisez une version récente d'un navigateur principal et désactivez temporairement les extensions bloquant scripts ou cookies.", "Déconnectez-vous puis reconnectez-vous si le problème semble lié au compte.", "Si le problème persiste, contactez l'assistance avec le nom de la page, l'appareil/navigateur et une description."] },
        { title: "Questions sur un ancien débit", desc: "Aide pour la facturation historique d’avant la gratuité de One2OneLove", actionPage: "ContactUs", details: ["One2OneLove ne vend plus rien : il n’y a ni portefeuille Crédit, ni Recharge Automatique, ni paiement.", "Si vous voyez un ancien débit One2OneLove que vous ne reconnaissez pas, contactez l’assistance avec l’e-mail du compte, la date et le montant pour enquête.", "N’envoyez jamais de numéro complet de carte par e-mail ou dans un message d’assistance."] },
      ]
    }
  },
  it: {
    title: "Centro Assistenza", subtitle: "Trova risposte, scopri come funziona One2OneLove e ottieni supporto", searchPlaceholder: "Cerca aiuto...", categories: "Categorie di Aiuto", searchResults: "Risultati di Ricerca", noResults: "Nessun articolo di aiuto corrisponde alla ricerca.", stillNeedHelp: "Hai ancora bisogno di aiuto?", contactUs: "Contattaci", back: "Indietro", openFeature: "Apri funzione collegata",
    gettingStarted: { title: "Iniziare", desc: "Impara le basi di One2OneLove" }, accountSettings: { title: "Impostazioni Account", desc: "Gestisci profilo, sicurezza, privacy e preferenze" }, features: { title: "Guida alle Funzionalità", desc: "Scopri come funzionano gli strumenti principali" }, troubleshooting: { title: "Risoluzione Problemi", desc: "Risolvi problemi comuni di account e funzioni" },
    articles: {
      gettingStarted: [
        { title: "Come funziona One2OneLove", desc: "Tutto è gratis: senza account né carta", actionPage: "Home", details: ["One2OneLove è una piattaforma relazionale gratuita. Ogni funzione è gratuita per tutti.", "Non servono account né carta di pagamento: esplora e usa come ospite strumenti, giochi, Studio, podcast, Note d’Amore, Idee per Appuntamenti e sale chat.", "Le funzioni personali degli ospiti (Diari, Ricordi, Traguardi, Obiettivi, Calendario) si salvano nel tuo browser su questo dispositivo.", "Un account è facoltativo e gratuito. Serve solo a conservare informazioni salvate e identità su più dispositivi. Non ci sono prove, abbonamenti o acquisti."] },
        { title: "Membri Fondatori", desc: "Numeri Fondatore, badge e cosa è cambiato", actionPage: "FeaturePricing", details: ["I numeri di Membro Fondatore #1–200 restano riservati e non vengono riutilizzati. Il badge rimane associato all’account.", "One2OneLove ora è gratuito al 100% per tutti e il Credito è stato ritirato: non c’è nulla da acquistare e nessun servizio a consumo.", "I registri storici di abbonamenti e Credito sono conservati solo per contabilità e riconciliazione.", "Qualsiasi futuro vantaggio per i Membri Fondatori sarà annunciato sul sito prima dell’inizio."] },
        { title: "Come creare il tuo account", desc: "Registrati e verifica le informazioni necessarie", actionPage: "SignUp", details: ["Seleziona Iscriviti e inserisci le informazioni richieste.", "Usa un indirizzo email accessibile per ricevere messaggi di verifica o recupero.", "Dopo la registrazione accedi e completa le informazioni del profilo che desideri associare all'account.", "Non condividere password o codici di verifica."] },
        { title: "Completa il tuo profilo", desc: "Aggiungi e controlla le informazioni dell'account", actionPage: "Profile", details: ["Apri Profilo dopo l'accesso.", "Aggiungi o aggiorna i campi disponibili e salva le modifiche.", "Condividi solo informazioni che ritieni appropriate da conservare sulla piattaforma."] },
        { title: "La tua prima nota d'amore", desc: "Crea e invia una Love Note", actionPage: "LoveNotes", details: ["Apri Love Notes e scegli il tipo di nota da creare.", "Scrivi il messaggio oppure scegline uno dalla biblioteca gratuita di note e rileggilo prima dell'invio o del salvataggio.", "Conferma destinatario e metodo di consegna prima di completare l'azione."] },
        { title: "Invita il tuo partner", desc: "Usa lo strumento di invito con una persona che conosci", actionPage: "Invite", details: ["Apri Invita e usa il metodo disponibile.", "Invita solo persone che conosci e che ragionevolmente desiderano ricevere l'invito.", "Non usare gli inviti per spam, molestie o contatti ripetuti indesiderati."] }
      ],
      accountSettings: [
        { title: "Aggiorna le informazioni del profilo", desc: "Controlla o modifica i dati del profilo", actionPage: "Profile", details: ["Apri Profilo mentre sei connesso.", "Modifica i campi disponibili e salva.", "Se un dato non può essere modificato dal profilo, contatta l'assistenza."] },
        { title: "Preferenze di notifica", desc: "Comprendi e gestisci le notifiche disponibili", actionPage: "Profile", details: ["Controlla profilo o impostazioni account per le opzioni disponibili.", "Le autorizzazioni del browser o del dispositivo possono essere gestite anche nelle relative impostazioni.", "Alcuni avvisi di servizio, sicurezza o legali possono comunque essere necessari."] },
        { title: "Privacy e dati dell'account", desc: "Scopri come vengono gestite le tue informazioni", actionPage: "PrivacyPolicy", details: ["Consulta l'Informativa sulla Privacy per conoscere categorie di dati e finalità d'uso.", "Usa i controlli disponibili per aggiornare i dati modificabili.", "Per richieste di accesso, correzione o cancellazione non disponibili nell'interfaccia, contatta l'assistenza o il contatto legale/privacy indicato nell'informativa."] },
        { title: "Cambia o reimposta la password", desc: "Recupera l'accesso e proteggi il login", actionPage: "ForgotPassword", details: ["Usa Password dimenticata se non riesci ad accedere o devi reimpostarla.", "Segui le istruzioni inviate all'email associata all'account.", "Scegli una password unica e non riutilizzarla su altri servizi."] }
      ],
      features: [
        { title: "Il Coach Relazionale AI (ritirato)", desc: "La chat IA di Amora è stata ritirata: tutto il resto è gratis", actionPage: "Amora", details: ["La chat IA di Amora è stata ritirata perché costava denaro a ogni messaggio. One2OneLove ora è una piattaforma gratuita senza funzioni a pagamento per utilizzo.", "Per orientamento relazionale, usa gli strumenti gratuiti: quiz, Pratica di Comunicazione, Note d’Amore, Idee per Appuntamenti, lo show Studio, i podcast e le sale chat della community.", "Nulla su One2OneLove è un terapeuta, medico, avvocato, consulente abilitato o servizio di crisi. Se sei in pericolo o in crisi, contatta subito il numero di emergenza locale o un servizio di crisi."] },
        { title: "Impostare traguardi della relazione", desc: "Registra date ed eventi significativi", actionPage: "RelationshipMilestones", details: ["Apri Traguardi e Anniversari e aggiungi le informazioni richieste.", "Usa date e descrizioni corrette.", "Salva e torna in seguito per rivedere o modificare quando l'editing è disponibile."] },
        { title: "Creare ricordi condivisi", desc: "Usa Memory Lane per conservare momenti importanti", actionPage: "MemoryLane", details: ["Apri Memory Lane e aggiungi testo, data, foto o altri contenuti supportati.", "Carica solo contenuti tuoi o per cui hai il permesso di condivisione.", "Evita dati altamente sensibili che non desideri associare all'account."] },
        { title: "Programmare note d'amore", desc: "Prepara una nota per più tardi quando la programmazione è disponibile", actionPage: "LoveNotes", details: ["Crea e rileggi la nota prima di scegliere la consegna.", "Se Programma per dopo è disponibile, seleziona data e ora e conferma.", "Se la programmazione non viene salvata correttamente, usa un'opzione immediata disponibile o contatta l'assistenza."] },
        { title: "Esplorare idee per appuntamenti", desc: "Consulta suggerimenti e relativi dettagli", actionPage: "DateIdeas", details: ["Apri Idee per Appuntamenti e usa categorie o filtri disponibili.", "Verifica luogo, orari, prezzi, indicazioni e disponibilità perché le informazioni esterne possono cambiare.", "Usa buon senso per spostamenti, meteo, attività fisica, costo e sicurezza personale."] },
        { title: "Usare i quiz sulle relazioni", desc: "Usa i quiz per conversazione e riflessione", actionPage: "RelationshipQuizzes", details: ["Scegli un quiz adatto all'argomento che vuoi esplorare.", "Rispondi sinceramente e considera i risultati come spunti di conversazione, non diagnosi.", "Non usare i risultati per etichettare, fare pressione o prendere decisioni ad alto rischio su un'altra persona."] }
      ],
      troubleshooting: [
        { title: "Non riesco ad accedere", desc: "Reimposta la password o recupera l'accesso", actionPage: "ForgotPassword", details: ["Controlla di usare l'email associata all'account.", "Usa Password dimenticata e segui il messaggio di reimpostazione.", "Controlla spam o posta indesiderata.", "Se il problema continua, contatta l'assistenza senza inviare la password."] },
        { title: "Le Love Notes non vengono inviate o salvate", desc: "Controlla nota, destinatario e consegna", actionPage: "LoveNotes", details: ["Verifica che tutti i campi obbligatori siano compilati e che destinatario o metodo di consegna siano validi.", "Per una nota programmata, verifica che data e ora siano state salvate.", "Aggiorna una volta la pagina prima di creare duplicati.", "Se continua, contatta l'assistenza indicando orario approssimativo e funzione usata."] },
        { title: "Una pagina o funzione non carica correttamente", desc: "Prova comuni soluzioni di browser e connessione", actionPage: null, details: ["Aggiorna la pagina e verifica la connessione Internet.", "Usa una versione recente di un browser principale e disattiva temporaneamente estensioni che bloccano script o cookie.", "Esci e accedi di nuovo se il problema sembra legato all'account.", "Se persiste, contatta l'assistenza indicando pagina, dispositivo/browser e cosa è successo."] },
        { title: "Domande su un vecchio addebito", desc: "Aiuto per la fatturazione storica di prima che One2OneLove diventasse gratis", actionPage: "ContactUs", details: ["One2OneLove non vende più nulla: non ci sono portafoglio Credito, Ricarica Automatica né pagamenti.", "Se vedi un vecchio addebito One2OneLove che non riconosci, contatta il supporto con e-mail dell’account, data e importo per la verifica.", "Non inviare numeri completi di carta via e-mail o nei messaggi di supporto."] },
      ]
    }
  },
  de: {
    title: "Hilfezentrum", subtitle: "Finden Sie Antworten, lernen Sie One2OneLove kennen und erhalten Sie Unterstützung", searchPlaceholder: "Nach Hilfe suchen...", categories: "Hilfe-Kategorien", searchResults: "Suchergebnisse", noResults: "Keine Hilfeartikel passen zu Ihrer Suche.", stillNeedHelp: "Benötigen Sie weitere Hilfe?", contactUs: "Kontaktieren Sie Uns", back: "Zurück", openFeature: "Zugehörige Funktion öffnen",
    gettingStarted: { title: "Erste Schritte", desc: "Lernen Sie die Grundlagen von One2OneLove" }, accountSettings: { title: "Kontoeinstellungen", desc: "Verwalten Sie Profil, Sicherheit, Datenschutz und Einstellungen" }, features: { title: "Funktionshandbuch", desc: "Erfahren Sie, wie die wichtigsten Werkzeuge funktionieren" }, troubleshooting: { title: "Fehlerbehebung", desc: "Lösen Sie häufige Konto- und Funktionsprobleme" },
    articles: {
      gettingStarted: [
        { title: "So funktioniert One2OneLove", desc: "Alles ist kostenlos — ohne Konto und Karte", actionPage: "Home", details: ["One2OneLove ist eine kostenlose Beziehungsplattform. Jede Funktion ist für alle kostenlos.", "Sie brauchen weder Konto noch Zahlungskarte: Sehen Sie sich Tools, Spiele, Studio, Podcasts, Liebesbotschaften, Date-Ideen und Chaträume als Gast an und nutzen Sie sie.", "Persönliche Gästefunktionen (Tagebücher, Erinnerungen, Meilensteine, Ziele, Kalender) werden in Ihrem eigenen Browser auf diesem Gerät gespeichert.", "Ein Konto ist optional und kostenlos. Es dient nur dazu, gespeicherte Informationen und Ihre Identität geräteübergreifend zu behalten. Es gibt keine Testphasen, Abonnements oder Käufe."] },
        { title: "Gründungsmitglieder", desc: "Gründungsnummern, Abzeichen und was sich geändert hat", actionPage: "FeaturePricing", details: ["Die Gründungsmitglied-Nummern #1–200 bleiben reserviert und werden nicht erneut vergeben. Das Abzeichen bleibt mit dem Konto verbunden.", "One2OneLove ist jetzt für alle 100 % kostenlos und Credit wurde eingestellt — es gibt nichts zu kaufen und keine nutzungsbasierten Dienste.", "Historische Abonnement- und Credit-Datensätze werden nur für Buchhaltung und Abgleich aufbewahrt.", "Jeder künftige Vorteil für Gründungsmitglieder wird vor Beginn auf der Website angekündigt."] },
        { title: "Konto erstellen", desc: "Registrieren und erforderliche Informationen bestätigen", actionPage: "SignUp", details: ["Wählen Sie Registrieren und geben Sie die angeforderten Informationen ein.", "Verwenden Sie eine erreichbare E-Mail-Adresse für Bestätigungs- oder Wiederherstellungsnachrichten.", "Melden Sie sich anschließend an und vervollständigen Sie die gewünschten Profildaten.", "Teilen Sie niemals Passwörter oder Bestätigungscodes."] },
        { title: "Profil vervollständigen", desc: "Kontoinformationen hinzufügen und prüfen", actionPage: "Profile", details: ["Öffnen Sie Profil nach der Anmeldung.", "Ergänzen oder ändern Sie verfügbare Felder und speichern Sie.", "Teilen Sie nur Informationen, die Sie auf der Plattform speichern möchten."] },
        { title: "Ihre erste Liebesbotschaft", desc: "Eine Love Note erstellen und senden", actionPage: "LoveNotes", details: ["Öffnen Sie Love Notes und wählen Sie die Art der Nachricht.", "Schreiben Sie selbst oder nutzen Sie eine Assistenzfunktion und prüfen Sie den Text vor dem Senden oder Speichern.", "Bestätigen Sie Empfänger und Versandoption vor Abschluss."] },
        { title: "Partner einladen", desc: "Einladung an eine bekannte Person senden", actionPage: "Invite", details: ["Öffnen Sie Einladen und nutzen Sie die verfügbare Methode.", "Laden Sie nur Personen ein, die Sie kennen und die die Einladung wahrscheinlich erhalten möchten.", "Nutzen Sie Einladungen nicht für Spam, Belästigung oder wiederholten unerwünschten Kontakt."] }
      ],
      accountSettings: [
        { title: "Profilinformationen aktualisieren", desc: "Profildaten prüfen oder ändern", actionPage: "Profile", details: ["Öffnen Sie Profil, während Sie angemeldet sind.", "Bearbeiten Sie verfügbare Felder und speichern Sie.", "Wenn ein Feld nicht geändert werden kann, wenden Sie sich an den Support."] },
        { title: "Benachrichtigungseinstellungen", desc: "Verfügbare Benachrichtigungen verstehen und verwalten", actionPage: "Profile", details: ["Prüfen Sie Profil oder Kontoeinstellungen auf verfügbare Optionen.", "Browser- oder Geräteberechtigungen können auch in den jeweiligen Systemeinstellungen geändert werden.", "Notwendige Service-, Sicherheits- oder Rechtshinweise können weiterhin versendet werden."] },
        { title: "Datenschutz und Kontodaten", desc: "Erfahren Sie, wie Ihre Informationen behandelt werden", actionPage: "PrivacyPolicy", details: ["Lesen Sie die Datenschutzrichtlinie zu Datenkategorien und Verwendungszwecken.", "Nutzen Sie verfügbare Kontrollen, um selbst änderbare Daten zu aktualisieren.", "Für Zugriffs-, Berichtigungs- oder Löschanfragen außerhalb der Oberfläche wenden Sie sich an Support oder den in der Richtlinie genannten Datenschutz-/Rechtskontakt."] },
        { title: "Passwort ändern oder zurücksetzen", desc: "Kontozugang wiederherstellen und Anmeldung schützen", actionPage: "ForgotPassword", details: ["Nutzen Sie Passwort vergessen, wenn Sie sich nicht anmelden können oder das Passwort zurücksetzen möchten.", "Folgen Sie den Anweisungen an die mit dem Konto verknüpfte E-Mail-Adresse.", "Verwenden Sie ein einzigartiges Passwort, das Sie nirgendwo sonst nutzen."] }
      ],
      features: [
        { title: "KI-Beziehungscoach (eingestellt)", desc: "Amoras KI-Chat wurde eingestellt — alles andere ist kostenlos", actionPage: "Amora", details: ["Amoras KI-Chat wurde eingestellt, weil er bei jeder Nachricht Geld kostete. One2OneLove ist jetzt eine kostenlose Plattform ohne nutzungsbasierte Funktionen.", "Für Beziehungsorientierung nutzen Sie stattdessen die kostenlosen Tools: Quizze, Kommunikationsübung, Liebesbotschaften, Date-Ideen, die Studio-Show, Podcasts und die Community-Chaträume.", "Nichts auf One2OneLove ist ein Therapeut, Arzt, Anwalt, lizenzierter Berater oder Krisendienst. Wenn Sie in Gefahr oder in einer Krise sind, wenden Sie sich sofort an Ihre örtliche Notrufnummer oder einen Krisendienst."] },
        { title: "Beziehungsmeilensteine einrichten", desc: "Bedeutende Daten und Ereignisse festhalten", actionPage: "RelationshipMilestones", details: ["Öffnen Sie Meilensteine & Jahrestage und tragen Sie die angeforderten Informationen ein.", "Verwenden Sie korrekte Daten und Beschreibungen.", "Speichern Sie und kehren Sie später zur Überprüfung oder Bearbeitung zurück, wenn diese verfügbar ist."] },
        { title: "Gemeinsame Erinnerungen erstellen", desc: "Memory Lane zum Festhalten von Momenten nutzen", actionPage: "MemoryLane", details: ["Öffnen Sie Memory Lane und fügen Sie unterstützten Text, Datum, Foto oder andere Inhalte hinzu.", "Laden Sie nur Inhalte hoch, die Ihnen gehören oder für die Sie eine Freigabe haben.", "Vermeiden Sie besonders sensible Informationen, die Sie nicht mit dem Konto speichern möchten."] },
        { title: "Liebesbotschaften planen", desc: "Eine Nachricht für später vorbereiten, wenn Planung verfügbar ist", actionPage: "LoveNotes", details: ["Erstellen und prüfen Sie die Nachricht vor Auswahl der Zustellung.", "Wenn Später planen verfügbar ist, wählen Sie Datum und Uhrzeit und bestätigen Sie.", "Wenn die Planung nicht korrekt gespeichert wird, nutzen Sie eine verfügbare Sofortoption oder wenden Sie sich an den Support."] },
        { title: "Date-Ideen erkunden", desc: "Vorschläge und Details ansehen", actionPage: "DateIdeas", details: ["Öffnen Sie Date-Ideen und nutzen Sie verfügbare Kategorien oder Filter.", "Prüfen Sie Ort, Öffnungszeiten, Preise, Wegbeschreibung und Verfügbarkeit, da externe Informationen sich ändern können.", "Achten Sie auf Reise, Wetter, körperliche Aktivität, Kosten und persönliche Sicherheit."] },
        { title: "Beziehungsquiz verwenden", desc: "Quiz für Gespräch und Reflexion nutzen", actionPage: "RelationshipQuizzes", details: ["Wählen Sie ein Quiz zum gewünschten Thema.", "Antworten Sie ehrlich und verstehen Sie Ergebnisse als Gesprächsanstoß, nicht als Diagnose.", "Nutzen Sie Ergebnisse nicht, um andere zu etikettieren, unter Druck zu setzen oder Hochrisikoentscheidungen zu treffen."] }
      ],
      troubleshooting: [
        { title: "Ich kann mich nicht anmelden", desc: "Passwort zurücksetzen oder Zugang wiederherstellen", actionPage: "ForgotPassword", details: ["Prüfen Sie, ob Sie die mit dem Konto verknüpfte E-Mail verwenden.", "Nutzen Sie Passwort vergessen und folgen Sie der Reset-Nachricht.", "Prüfen Sie Spam- oder Junk-Ordner.", "Wenn das Problem bleibt, kontaktieren Sie den Support und senden Sie niemals Ihr Passwort."] },
        { title: "Love Notes werden nicht gesendet oder gespeichert", desc: "Nachricht, Empfänger und Versand prüfen", actionPage: "LoveNotes", details: ["Prüfen Sie, ob alle Pflichtfelder ausgefüllt sind und Empfänger oder Versandmethode gültig sind.", "Bei geplanter Zustellung prüfen Sie, ob Datum und Uhrzeit wirklich gespeichert wurden.", "Aktualisieren Sie die Seite einmal, bevor Sie Duplikate erstellen.", "Wenn das Problem bleibt, nennen Sie dem Support ungefähr Zeitpunkt und verwendete Funktion."] },
        { title: "Eine Seite oder Funktion lädt nicht richtig", desc: "Übliche Browser- und Verbindungsprobleme beheben", actionPage: null, details: ["Aktualisieren Sie die Seite und prüfen Sie die Internetverbindung.", "Nutzen Sie eine aktuelle Version eines gängigen Browsers und deaktivieren Sie vorübergehend Erweiterungen, die Skripte oder Cookies blockieren.", "Melden Sie sich ab und wieder an, wenn das Problem kontobezogen erscheint.", "Wenn es bleibt, kontaktieren Sie den Support mit Seitenname, Gerät/Browser und Beschreibung."] },
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
