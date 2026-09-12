import React from "react";
import { useLanguage } from "@/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

const translations = {
  en: {
    title: "Privacy Policy",
    subtitle: "How One2OneLove handles information and protects your privacy",
    back: "Back",
    lastUpdated: "Last Updated: September 12, 2026",
    sections: [
      { title: "1. Scope of This Policy", content: "This Privacy Policy explains how One2OneLove collects, uses, stores, shares, and protects information when you visit our website, create an account, use relationship tools, participate in community features, communicate with us, or use other One2OneLove services. By using the platform, you acknowledge the practices described in this policy." },
      { title: "2. Information You Provide", content: "We may collect information you choose to provide, such as your name, email address, account credentials, profile details, relationship preferences or status, Love Notes, goals, milestones, memories, quiz responses, community posts, messages, support requests, reviews, suggestions, and other content you submit. Please avoid entering highly sensitive information unless it is necessary for the feature you are using." },
      { title: "3. Information Collected Automatically", content: "When you use One2OneLove, we may automatically receive technical and usage information such as IP address, browser and device type, operating system, pages or features viewed, timestamps, referring pages, crash information, and similar logs. We may use cookies or similar technologies for sign-in, security, preferences, analytics, and service performance." },
      { title: "4. Location Information", content: "Some features, such as local date ideas or directions, may use location information if you choose to enable location access or enter a location. We use location information only as needed to provide the requested feature and subject to your device and browser permissions." },
      { title: "5. AI-Assisted Features", content: "If you use an AI-assisted feature, the prompts, instructions, and content you submit may be processed by One2OneLove and technology providers that help generate the requested output. AI-generated results may be incomplete or inaccurate. Do not submit information to an AI feature that you would not want processed for that purpose, and do not rely on AI output for emergencies, medical decisions, legal decisions, or other high-stakes matters." },
      { title: "6. How We Use Information", content: "We use information to create and manage accounts; provide, personalize, secure, and improve platform features; save user-requested content; deliver communications; respond to support requests; prevent fraud, abuse, and security incidents; understand platform performance; enforce our Terms of Service; comply with law; and develop new or improved features." },
      { title: "7. Payments", content: "If you purchase a paid feature or subscription, payment information may be collected and processed by a third-party payment processor. One2OneLove does not need to store your full payment-card number when payments are handled by the processor. The processor's own privacy terms may also apply to payment information." },
      { title: "8. When Information May Be Shared", content: "We may share information with service providers that help us operate the platform, such as hosting, authentication, database, email, analytics, AI, mapping, customer-support, security, and payment providers. We may also disclose information when you direct us to do so, when reasonably necessary to protect users or the platform, in connection with a business transaction, or when required by law or valid legal process." },
      { title: "9. Sale of Personal Information", content: "One2OneLove does not sell personal information for money. If our practices change in a way that creates additional rights under applicable privacy law, we will update this policy and provide any notices or choices required by law." },
      { title: "10. User Content and Community Features", content: "Content you choose to post in public or community areas may be visible to other users. Private account content is handled according to the feature in which it is stored. Before sharing relationship details, photos, messages, or other personal content, consider whether the intended audience is appropriate." },
      { title: "11. Data Retention and Deletion", content: "We keep information for as long as reasonably necessary to provide the service, maintain records, resolve disputes, enforce agreements, meet legal obligations, and protect the platform. Retention periods can vary by data type. Where available, you may delete certain content through the platform or request account or data deletion through our Contact Us page." },
      { title: "12. Security", content: "We use reasonable administrative, technical, and organizational safeguards designed to protect information. No internet service or storage system can be guaranteed to be completely secure, so users should also protect their passwords, devices, and account access." },
      { title: "13. Your Privacy Choices and Rights", content: "Depending on where you live, you may have rights to request access to, correction of, deletion of, or a copy of certain personal information, and to object to or limit certain processing. You may also control some cookies, device permissions, and communications through your browser, device, or account settings. We may need to verify your identity before completing a privacy request." },
      { title: "14. Age Restrictions", content: "One2OneLove is intended for adults. You must be at least 18 years old, or the age of majority where you live if higher, to create an account unless One2OneLove expressly provides a separate experience permitted by law. We do not knowingly seek to collect personal information from children through the adult platform." },
      { title: "15. International Users", content: "If you access One2OneLove from outside the country where our systems or providers are located, your information may be processed in other countries. Privacy and data-protection laws may differ across jurisdictions, and we use service providers subject to their own legal and contractual obligations." },
      { title: "16. Changes and Contact", content: "We may update this Privacy Policy as the platform, technology, or legal requirements change. The updated date will appear at the top of this page. For privacy questions or requests, please use the One2OneLove Contact Us page so your request can be directed appropriately." }
    ]
  },
  es: {
    title: "Política de Privacidad", subtitle: "Cómo One2OneLove maneja la información y protege tu privacidad", back: "Volver", lastUpdated: "Última Actualización: 12 de Septiembre de 2026",
    sections: [
      { title: "1. Alcance de Esta Política", content: "Esta Política de Privacidad explica cómo One2OneLove recopila, usa, almacena, comparte y protege información cuando visitas el sitio, creas una cuenta, utilizas herramientas de relación, participas en funciones de comunidad o utilizas otros servicios de One2OneLove." },
      { title: "2. Información que Proporcionas", content: "Podemos recopilar información que eliges proporcionar, como nombre, correo electrónico, credenciales, perfil, preferencias o estado de relación, Love Notes, metas, hitos, recuerdos, respuestas de cuestionarios, publicaciones, mensajes, solicitudes de soporte, reseñas, sugerencias y otro contenido que envíes." },
      { title: "3. Información Recopilada Automáticamente", content: "Podemos recibir información técnica y de uso como dirección IP, navegador, dispositivo, sistema operativo, funciones visitadas, marcas de tiempo, páginas de referencia, errores y registros similares. Podemos usar cookies o tecnologías similares para inicio de sesión, seguridad, preferencias, análisis y rendimiento." },
      { title: "4. Información de Ubicación", content: "Algunas funciones, como ideas de citas locales o direcciones, pueden usar tu ubicación si decides habilitar el acceso o introducir una ubicación. La usamos solo según sea necesario para ofrecer la función solicitada y de acuerdo con los permisos de tu dispositivo o navegador." },
      { title: "5. Funciones Asistidas por IA", content: "Si utilizas una función con IA, los prompts, instrucciones y contenido que envíes pueden ser procesados por One2OneLove y proveedores tecnológicos que ayudan a generar la respuesta. Los resultados pueden ser incompletos o inexactos. No uses la IA para emergencias ni decisiones médicas, legales u otras de alto riesgo." },
      { title: "6. Cómo Usamos la Información", content: "Usamos información para crear y administrar cuentas; ofrecer, personalizar, proteger y mejorar funciones; guardar contenido solicitado; comunicarnos; responder soporte; prevenir fraude o abuso; comprender el rendimiento; aplicar nuestros Términos; cumplir la ley y mejorar el servicio." },
      { title: "7. Pagos", content: "Si compras una función o suscripción, un procesador de pagos externo puede recopilar y procesar la información de pago. One2OneLove no necesita almacenar el número completo de tu tarjeta cuando el procesador gestiona el pago." },
      { title: "8. Cuándo Podemos Compartir Información", content: "Podemos compartir información con proveedores que nos ayudan con alojamiento, autenticación, bases de datos, correo, análisis, IA, mapas, soporte, seguridad y pagos; cuando tú lo indiques; para proteger a usuarios o la plataforma; en una transacción comercial; o cuando lo exija la ley." },
      { title: "9. Venta de Información Personal", content: "One2OneLove no vende información personal por dinero. Si nuestras prácticas cambian de forma que genere derechos adicionales bajo la ley aplicable, actualizaremos esta política y ofreceremos los avisos o controles requeridos." },
      { title: "10. Contenido de Usuario y Comunidad", content: "El contenido que publiques en áreas públicas o comunitarias puede ser visible para otros usuarios. Antes de compartir detalles de relaciones, fotos, mensajes u otro contenido personal, considera si la audiencia es apropiada." },
      { title: "11. Conservación y Eliminación", content: "Conservamos información durante el tiempo razonablemente necesario para prestar el servicio, mantener registros, resolver disputas, cumplir obligaciones y proteger la plataforma. Puedes eliminar ciertos contenidos cuando la función lo permita o solicitar eliminación mediante Contact Us." },
      { title: "12. Seguridad", content: "Utilizamos medidas administrativas, técnicas y organizativas razonables para proteger la información. Ningún servicio de Internet o sistema de almacenamiento puede garantizar seguridad absoluta." },
      { title: "13. Tus Opciones y Derechos", content: "Según dónde vivas, puedes tener derechos de acceso, corrección, eliminación, copia, oposición o limitación de ciertos tratamientos. También puedes controlar algunas cookies, permisos del dispositivo y comunicaciones. Podemos verificar tu identidad antes de completar una solicitud." },
      { title: "14. Restricciones de Edad", content: "One2OneLove está destinado a adultos. Debes tener al menos 18 años, o la mayoría de edad donde vivas si es superior, para crear una cuenta, salvo que se ofrezca expresamente una experiencia separada permitida por la ley." },
      { title: "15. Usuarios Internacionales", content: "Si accedes desde otro país, tu información puede procesarse en jurisdicciones diferentes. Las leyes de privacidad pueden variar y nuestros proveedores están sujetos a sus propias obligaciones legales y contractuales." },
      { title: "16. Cambios y Contacto", content: "Podemos actualizar esta Política cuando cambien la plataforma, la tecnología o los requisitos legales. La fecha actualizada aparecerá arriba. Para preguntas o solicitudes de privacidad, utiliza la página Contact Us de One2OneLove." }
    ]
  },
  fr: {
    title: "Politique de Confidentialité", subtitle: "Comment One2OneLove traite les informations et protège votre vie privée", back: "Retour", lastUpdated: "Dernière Mise à Jour : 12 Septembre 2026",
    sections: [
      { title: "1. Champ d’Application", content: "Cette politique explique comment One2OneLove collecte, utilise, conserve, partage et protège les informations lorsque vous visitez le site, créez un compte, utilisez les outils relationnels ou participez aux fonctions communautaires." },
      { title: "2. Informations que Vous Fournissez", content: "Nous pouvons collecter les informations que vous choisissez de fournir : nom, e-mail, identifiants, profil, informations relationnelles, Love Notes, objectifs, étapes, souvenirs, réponses aux quiz, publications, messages, demandes d’assistance, avis, suggestions et autres contenus." },
      { title: "3. Informations Collectées Automatiquement", content: "Nous pouvons recevoir des données techniques et d’utilisation : adresse IP, navigateur, appareil, système d’exploitation, fonctionnalités consultées, horodatage, pages référentes, erreurs et journaux similaires. Des cookies ou technologies comparables peuvent servir à la connexion, la sécurité, les préférences, l’analyse et les performances." },
      { title: "4. Données de Localisation", content: "Certaines fonctions, comme les idées de rendez-vous locales ou les itinéraires, peuvent utiliser la localisation si vous l’autorisez ou saisissez un lieu. Nous l’utilisons uniquement pour fournir la fonction demandée et selon les permissions de votre appareil ou navigateur." },
      { title: "5. Fonctions Assistées par IA", content: "Lorsque vous utilisez une fonction d’IA, les prompts, instructions et contenus soumis peuvent être traités par One2OneLove et des prestataires technologiques. Les résultats peuvent être incomplets ou inexacts. N’utilisez pas l’IA pour les urgences ni pour des décisions médicales, juridiques ou autres décisions à haut risque." },
      { title: "6. Utilisation des Informations", content: "Nous utilisons les informations pour gérer les comptes, fournir et personnaliser les fonctionnalités, sécuriser et améliorer le service, enregistrer le contenu demandé, communiquer, assurer l’assistance, prévenir la fraude et les abus, analyser les performances, appliquer les Conditions et respecter la loi." },
      { title: "7. Paiements", content: "Si vous achetez une fonctionnalité ou un abonnement payant, un prestataire de paiement peut traiter vos informations de paiement. One2OneLove n’a pas besoin de stocker le numéro complet de votre carte lorsque le paiement est traité par ce prestataire." },
      { title: "8. Partage des Informations", content: "Nous pouvons partager des informations avec des prestataires d’hébergement, authentification, base de données, e-mail, analyse, IA, cartographie, support, sécurité et paiement; selon vos instructions; pour protéger les utilisateurs ou la plateforme; lors d’une opération commerciale; ou lorsque la loi l’exige." },
      { title: "9. Vente de Données Personnelles", content: "One2OneLove ne vend pas les données personnelles contre de l’argent. Si nos pratiques évoluent et créent de nouveaux droits, nous mettrons cette politique à jour et fournirons les avis ou choix requis." },
      { title: "10. Contenu Utilisateur et Communauté", content: "Le contenu publié dans des espaces publics ou communautaires peut être visible par d’autres utilisateurs. Réfléchissez à l’audience avant de partager des informations relationnelles, photos, messages ou autres contenus personnels." },
      { title: "11. Conservation et Suppression", content: "Nous conservons les informations aussi longtemps que raisonnablement nécessaire pour fournir le service, conserver des dossiers, résoudre des litiges, respecter nos obligations et protéger la plateforme. Certaines données peuvent être supprimées via la plateforme ou sur demande par Contact Us." },
      { title: "12. Sécurité", content: "Nous utilisons des mesures administratives, techniques et organisationnelles raisonnables. Aucun service Internet ni système de stockage ne peut garantir une sécurité absolue." },
      { title: "13. Vos Choix et Vos Droits", content: "Selon votre lieu de résidence, vous pouvez disposer de droits d’accès, rectification, suppression, copie, opposition ou limitation. Vous pouvez également contrôler certains cookies, permissions de l’appareil et communications. Une vérification d’identité peut être nécessaire." },
      { title: "14. Restrictions d’Âge", content: "One2OneLove est destiné aux adultes. Vous devez avoir au moins 18 ans, ou l’âge de la majorité là où vous vivez s’il est supérieur, pour créer un compte, sauf expérience distincte expressément autorisée par la loi." },
      { title: "15. Utilisateurs Internationaux", content: "Si vous accédez au service depuis un autre pays, vos informations peuvent être traitées dans d’autres juridictions. Les lois de protection des données varient selon les pays." },
      { title: "16. Modifications et Contact", content: "Nous pouvons mettre cette politique à jour lorsque la plateforme, la technologie ou la loi évolue. Pour toute question ou demande relative à la vie privée, utilisez la page Contact Us de One2OneLove." }
    ]
  },
  it: {
    title: "Informativa sulla Privacy", subtitle: "Come One2OneLove gestisce le informazioni e protegge la tua privacy", back: "Indietro", lastUpdated: "Ultimo Aggiornamento: 12 Settembre 2026",
    sections: [
      { title: "1. Ambito dell’Informativa", content: "Questa informativa spiega come One2OneLove raccoglie, usa, conserva, condivide e protegge le informazioni quando visiti il sito, crei un account, usi strumenti relazionali o partecipi alle funzioni della community." },
      { title: "2. Informazioni Fornite da Te", content: "Possiamo raccogliere informazioni che scegli di fornire, come nome, e-mail, credenziali, profilo, informazioni relazionali, Love Notes, obiettivi, traguardi, ricordi, risposte ai quiz, post, messaggi, richieste di supporto, recensioni, suggerimenti e altri contenuti." },
      { title: "3. Informazioni Raccolte Automaticamente", content: "Possiamo ricevere dati tecnici e di utilizzo come indirizzo IP, browser, dispositivo, sistema operativo, funzionalità visualizzate, orari, pagine di provenienza, errori e registri simili. Cookie o tecnologie analoghe possono essere usati per accesso, sicurezza, preferenze, analisi e prestazioni." },
      { title: "4. Informazioni sulla Posizione", content: "Alcune funzioni, come idee per appuntamenti locali o indicazioni stradali, possono utilizzare la posizione se abiliti il permesso o inserisci un luogo. La usiamo solo per fornire la funzione richiesta e secondo i permessi del dispositivo o browser." },
      { title: "5. Funzioni Assistite dall’IA", content: "Se utilizzi una funzione IA, prompt, istruzioni e contenuti inviati possono essere elaborati da One2OneLove e fornitori tecnologici. I risultati possono essere incompleti o inesatti. Non affidarti all’IA per emergenze o decisioni mediche, legali o ad alto rischio." },
      { title: "6. Come Usiamo le Informazioni", content: "Usiamo le informazioni per gestire account, fornire e personalizzare funzionalità, proteggere e migliorare il servizio, salvare contenuti richiesti, comunicare, offrire supporto, prevenire frodi e abusi, analizzare prestazioni, applicare i Termini e rispettare la legge." },
      { title: "7. Pagamenti", content: "Se acquisti una funzione o un abbonamento, un elaboratore di pagamenti esterno può trattare le informazioni di pagamento. One2OneLove non deve conservare il numero completo della carta quando il pagamento è gestito dal fornitore." },
      { title: "8. Condivisione delle Informazioni", content: "Possiamo condividere dati con fornitori di hosting, autenticazione, database, e-mail, analisi, IA, mappe, supporto, sicurezza e pagamenti; su tua indicazione; per proteggere utenti o piattaforma; in operazioni aziendali; o quando richiesto dalla legge." },
      { title: "9. Vendita di Informazioni Personali", content: "One2OneLove non vende informazioni personali in cambio di denaro. Se le pratiche cambiano creando nuovi diritti legali, aggiorneremo l’informativa e offriremo gli avvisi o le scelte richieste." },
      { title: "10. Contenuti Utente e Community", content: "I contenuti pubblicati in aree pubbliche o della community possono essere visibili ad altri utenti. Valuta l’audience prima di condividere dettagli relazionali, foto, messaggi o altri contenuti personali." },
      { title: "11. Conservazione e Cancellazione", content: "Conserviamo le informazioni per il tempo ragionevolmente necessario a fornire il servizio, mantenere registri, risolvere controversie, rispettare obblighi e proteggere la piattaforma. Alcuni contenuti possono essere eliminati dalla piattaforma o su richiesta tramite Contact Us." },
      { title: "12. Sicurezza", content: "Usiamo misure amministrative, tecniche e organizzative ragionevoli. Nessun servizio Internet o sistema di archiviazione può garantire sicurezza assoluta." },
      { title: "13. Le Tue Scelte e i Tuoi Diritti", content: "A seconda del luogo in cui vivi, puoi avere diritti di accesso, correzione, cancellazione, copia, opposizione o limitazione. Puoi inoltre gestire cookie, permessi del dispositivo e alcune comunicazioni. Potremmo dover verificare la tua identità." },
      { title: "14. Limiti di Età", content: "One2OneLove è destinato agli adulti. Devi avere almeno 18 anni, o la maggiore età del luogo in cui vivi se superiore, per creare un account salvo un’esperienza separata espressamente consentita dalla legge." },
      { title: "15. Utenti Internazionali", content: "Se accedi da un altro paese, le informazioni possono essere trattate in altre giurisdizioni. Le leggi sulla privacy possono variare." },
      { title: "16. Modifiche e Contatti", content: "Possiamo aggiornare questa informativa quando cambiano piattaforma, tecnologia o requisiti legali. Per domande o richieste sulla privacy, usa la pagina Contact Us di One2OneLove." }
    ]
  },
  de: {
    title: "Datenschutzrichtlinie", subtitle: "Wie One2OneLove Informationen verarbeitet und Ihre Privatsphäre schützt", back: "Zurück", lastUpdated: "Letzte Aktualisierung: 12. September 2026",
    sections: [
      { title: "1. Geltungsbereich", content: "Diese Datenschutzrichtlinie erklärt, wie One2OneLove Informationen erhebt, nutzt, speichert, weitergibt und schützt, wenn Sie die Website besuchen, ein Konto erstellen, Beziehungstools nutzen oder an Community-Funktionen teilnehmen." },
      { title: "2. Von Ihnen Bereitgestellte Informationen", content: "Wir können Informationen erfassen, die Sie freiwillig angeben, etwa Name, E-Mail, Zugangsdaten, Profil, Beziehungsangaben, Love Notes, Ziele, Meilensteine, Erinnerungen, Quizantworten, Beiträge, Nachrichten, Supportanfragen, Bewertungen, Vorschläge und andere Inhalte." },
      { title: "3. Automatisch Erfasste Informationen", content: "Wir können technische und Nutzungsdaten wie IP-Adresse, Browser, Gerät, Betriebssystem, besuchte Funktionen, Zeitstempel, verweisende Seiten, Fehlerdaten und ähnliche Protokolle erhalten. Cookies oder vergleichbare Technologien können für Anmeldung, Sicherheit, Präferenzen, Analyse und Leistung eingesetzt werden." },
      { title: "4. Standortinformationen", content: "Einige Funktionen wie lokale Date-Ideen oder Wegbeschreibungen können Standortdaten nutzen, wenn Sie die Berechtigung aktivieren oder einen Ort eingeben. Wir verwenden diese Daten nur zur Bereitstellung der angeforderten Funktion und entsprechend Ihren Geräte- oder Browserberechtigungen." },
      { title: "5. KI-gestützte Funktionen", content: "Bei KI-Funktionen können Prompts, Anweisungen und Inhalte von One2OneLove und unterstützenden Technologieanbietern verarbeitet werden. Ergebnisse können unvollständig oder ungenau sein. Nutzen Sie KI nicht für Notfälle oder medizinische, rechtliche oder andere Entscheidungen mit hohem Risiko." },
      { title: "6. Verwendung der Informationen", content: "Wir nutzen Informationen zur Konto- und Funktionsverwaltung, Personalisierung, Sicherheit, Verbesserung, Speicherung angeforderter Inhalte, Kommunikation, Support, Betrugs- und Missbrauchsprävention, Leistungsanalyse, Durchsetzung der Nutzungsbedingungen und Einhaltung gesetzlicher Pflichten." },
      { title: "7. Zahlungen", content: "Bei kostenpflichtigen Funktionen oder Abonnements kann ein externer Zahlungsdienstleister Zahlungsinformationen verarbeiten. One2OneLove muss die vollständige Kartennummer nicht speichern, wenn der Dienstleister die Zahlung verarbeitet." },
      { title: "8. Weitergabe von Informationen", content: "Wir können Informationen mit Anbietern für Hosting, Authentifizierung, Datenbanken, E-Mail, Analyse, KI, Karten, Support, Sicherheit und Zahlungen teilen; auf Ihre Anweisung; zum Schutz von Nutzern oder Plattform; bei Unternehmenstransaktionen; oder wenn dies gesetzlich erforderlich ist." },
      { title: "9. Verkauf Personenbezogener Daten", content: "One2OneLove verkauft personenbezogene Daten nicht gegen Geld. Wenn sich unsere Praktiken ändern und zusätzliche Rechte entstehen, aktualisieren wir diese Richtlinie und stellen erforderliche Hinweise oder Wahlmöglichkeiten bereit." },
      { title: "10. Nutzerinhalte und Community", content: "In öffentlichen oder Community-Bereichen veröffentlichte Inhalte können für andere Nutzer sichtbar sein. Prüfen Sie die Zielgruppe, bevor Sie Beziehungsdetails, Fotos, Nachrichten oder andere persönliche Inhalte teilen." },
      { title: "11. Aufbewahrung und Löschung", content: "Wir bewahren Informationen so lange auf, wie dies vernünftigerweise für Service, Aufzeichnungen, Streitbeilegung, Pflichten und Plattformschutz erforderlich ist. Bestimmte Inhalte können über die Plattform oder auf Anfrage über Contact Us gelöscht werden." },
      { title: "12. Sicherheit", content: "Wir verwenden angemessene administrative, technische und organisatorische Schutzmaßnahmen. Kein Internetdienst oder Speichersystem kann vollständige Sicherheit garantieren." },
      { title: "13. Ihre Wahlmöglichkeiten und Rechte", content: "Je nach Wohnort können Sie Rechte auf Auskunft, Berichtigung, Löschung, Kopie, Widerspruch oder Einschränkung haben. Sie können außerdem bestimmte Cookies, Geräteberechtigungen und Mitteilungen steuern. Zur Bearbeitung können wir Ihre Identität überprüfen." },
      { title: "14. Altersbeschränkungen", content: "One2OneLove richtet sich an Erwachsene. Sie müssen mindestens 18 Jahre alt sein oder das höhere Volljährigkeitsalter Ihres Wohnorts erreicht haben, um ein Konto zu erstellen, sofern nicht ausdrücklich eine separate gesetzlich zulässige Erfahrung angeboten wird." },
      { title: "15. Internationale Nutzer", content: "Wenn Sie aus einem anderen Land zugreifen, können Ihre Informationen in anderen Rechtsordnungen verarbeitet werden. Datenschutzgesetze unterscheiden sich zwischen Ländern." },
      { title: "16. Änderungen und Kontakt", content: "Wir können diese Richtlinie bei Änderungen an Plattform, Technologie oder Rechtslage aktualisieren. Für Datenschutzfragen oder -anfragen nutzen Sie bitte die Contact Us-Seite von One2OneLove." }
    ]
  }
};

export default function PrivacyPolicy() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-6">
          <Link to={createPageUrl("Home")} className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
            <ArrowLeft size={20} className="mr-2" />
            {t.back}
          </Link>
        </div>

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6 shadow-xl">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">{t.title}</h1>
          <p className="text-xl text-gray-600">{t.subtitle}</p>
          <p className="text-sm text-gray-500 mt-4">{t.lastUpdated}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="shadow-2xl">
            <CardContent className="p-8">
              <div className="prose prose-lg max-w-none">
                {t.sections.map((section, index) => (
                  <div key={index} className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">{section.title}</h2>
                    <p className="text-gray-700 leading-relaxed">{section.content}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}