import React, { useMemo, useState } from 'react';
import { BookOpen, ChevronDown, Heart, HelpCircle, KeyRound, MessageCircle, Search, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/Layout';

const COPY = {
  en: {
    title: 'Help Center', subtitle: 'Straight answers about the One2OneLove relaunch.', search: 'Search help…', noResults: 'No matching help topics were found.', beta: 'This Help Center documents the relaunch features we have actually reviewed. It does not promise legacy contests, calls, partner-account linking, or other unfinished features.', open: 'Open', close: 'Close',
    groups: {
      account: { title: 'Account & Security', items: [
        ['Why do I have to confirm my email?', 'Email confirmation protects private Love Note reveals and member-only experiences. An unconfirmed session is not treated as an authenticated One2OneLove member.'],
        ['I forgot my password. What should I do?', 'Use Forgot Password from the sign-in screen. One2OneLove uses the Supabase recovery-email flow; a successful recovery session is required before a new password is accepted.'],
        ['Does creating a free account start a paid membership?', 'No. Free-account signup does not collect payment information and does not start a paid membership.'],
        ['What profile information is private?', 'Your full account/profile record is private. Member discovery uses a separate privacy-limited directory instead of exposing your account email or billing information.'],
      ]},
      loveNotes: { title: 'Love Notes', items: [
        ['Does the notification contain my Love Note?', 'No. The secure invitation identifies the individual sender and contains a reveal link, but the Love Note body stays private until the recipient opens it through One2OneLove.'],
        ['Can I write my own Love Note?', 'Yes. You can choose from the collection or write a custom Love Note up to 500 characters and continue to the secure send flow.'],
        ['Can recipients save a Love Note?', 'The relaunch includes a recipient-only Saved Love Notes flow after secure reveal. The backend protections are staged and are activated only through the controlled rollout.'],
        ['Can I schedule a Love Note?', 'Scheduling is designated as a paid membership feature. It remains disabled until the membership backend and delivery worker complete controlled testing.'],
      ]},
      community: { title: 'Community & Chat', items: [
        ['Are the Live Community room counts real?', 'Yes. Human-presence counts are intended to reflect signed-in people currently present. If no humans are talking, the room uses an AI Host topic instead of pretending people are there.'],
        ['What does the AI Host do?', 'The AI Host is a short public-room conversation catalyst. It is not a therapist or emergency service and is designed to step back when members are talking.'],
        ['Can I privately message another member?', 'Private text chat is part of the free-account foundation. Sender/receiver identity and conversation membership are being protected at the database layer.'],
        ['What about images, files and voice notes in private Chat?', 'Private attachments are being rebuilt around a private-storage model. Text chat is the safe baseline until the attachment migration is deliberately activated and tested.'],
      ]},
      tools: { title: 'Relationship Tools', items: [
        ['Is the Love Language Quiz free?', 'Yes. The informal reflection quiz is a free engagement tool. It is not a clinical or validated assessment.'],
        ['Are Date Ideas free?', 'Yes. Built-in Date Ideas remain free. Signed-in members can save and manage their own ideas when the private persistence layer is available.'],
        ['Are Relationship Goals free?', 'No. Relationship Goals are part of paid membership once membership gating is intentionally activated.'],
        ['Does partner information automatically link two accounts?', 'No. A partner name or email stored in your profile does not automatically create a couple account, grant access, or link two One2OneLove profiles.'],
      ]},
      membership: { title: 'Membership', items: [
        ['What is the relaunch price?', 'The approved relaunch path is $1.99 per month for the first six months, then $5.99 per month unless canceled.'],
        ['Is there a separate free trial?', 'No. The relaunch uses the introductory $1.99 monthly price for six months instead of an additional free trial.'],
        ['What stays free?', 'The free-account foundation includes Love Notes, core Live Community participation, Love Language Quiz, Date Ideas, profile/member discovery, friend requests and private text chat.'],
        ['When will I be charged?', 'Live billing is still off during development and controlled testing. Returning from a Stripe checkout page alone will never be treated as proof that payment succeeded.'],
      ]},
    },
    links: { signIn: 'Sign In', forgot: 'Forgot Password', loveNotes: 'Love Notes', community: 'Live Community', profile: 'Profile', membership: 'Membership' },
  },
  es: {
    title: 'Centro de Ayuda', subtitle: 'Respuestas claras sobre el relanzamiento de One2OneLove.', search: 'Buscar ayuda…', noResults: 'No se encontraron temas de ayuda coincidentes.', beta: 'Este Centro de Ayuda documenta las funciones del relanzamiento que realmente hemos revisado. No promete concursos antiguos, llamadas, vinculación de cuentas de pareja ni otras funciones inacabadas.', open: 'Abrir', close: 'Cerrar',
    groups: {
      account: { title: 'Cuenta y Seguridad', items: [
        ['¿Por qué debo confirmar mi correo?', 'La confirmación protege las Love Notes privadas y las experiencias para miembros. Una sesión sin confirmar no se trata como una cuenta autenticada de One2OneLove.'],
        ['Olvidé mi contraseña. ¿Qué hago?', 'Usa Olvidé mi contraseña desde la pantalla de inicio de sesión. One2OneLove usa el flujo de recuperación por correo de Supabase.'],
        ['¿Crear una cuenta gratis inicia una membresía pagada?', 'No. El registro gratuito no recopila datos de pago ni inicia una membresía pagada.'],
        ['¿Qué información del perfil es privada?', 'El registro completo de tu cuenta es privado. El descubrimiento de miembros usa un directorio separado con datos limitados para privacidad.'],
      ]},
      loveNotes: { title: 'Love Notes', items: [
        ['¿La notificación contiene mi Love Note?', 'No. La invitación identifica al remitente y contiene un enlace seguro, pero el contenido de la Love Note permanece privado hasta abrirlo en One2OneLove.'],
        ['¿Puedo escribir mi propia Love Note?', 'Sí. Puedes elegir una de la colección o escribir una personalizada de hasta 500 caracteres.'],
        ['¿El destinatario puede guardar una Love Note?', 'El relanzamiento incluye un flujo de Love Notes guardadas para el destinatario después de la revelación segura.'],
        ['¿Puedo programar una Love Note?', 'La programación está definida como función de membresía pagada y permanece desactivada hasta completar las pruebas controladas.'],
      ]},
      community: { title: 'Comunidad y Chat', items: [
        ['¿Los conteos de Live Community son reales?', 'Sí. Los conteos humanos deben reflejar personas conectadas. Si no hay conversación humana, se muestra un tema del AI Host en lugar de actividad falsa.'],
        ['¿Qué hace el AI Host?', 'Es un catalizador breve de conversación pública. No es terapeuta ni servicio de emergencia.'],
        ['¿Puedo enviar mensajes privados?', 'El chat privado de texto forma parte de la base gratuita y la identidad de participantes se protege en la base de datos.'],
        ['¿Qué pasa con imágenes, archivos y notas de voz?', 'Los adjuntos privados se están reconstruyendo con almacenamiento privado. El texto es la base segura hasta activar y probar esa migración.'],
      ]},
      tools: { title: 'Herramientas de Relación', items: [
        ['¿El Quiz de Lenguajes del Amor es gratis?', 'Sí. Es una herramienta informal de reflexión, no una evaluación clínica validada.'],
        ['¿Las Ideas para Citas son gratis?', 'Sí. Las ideas integradas permanecen gratis.'],
        ['¿Las Metas de Relación son gratis?', 'No. Forman parte de la membresía pagada cuando se active intencionalmente el control de membresía.'],
        ['¿El correo de mi pareja vincula dos cuentas?', 'No. Guardar nombre o correo de pareja no crea una cuenta conjunta ni concede acceso.'],
      ]},
      membership: { title: 'Membresía', items: [
        ['¿Cuál es el precio de relanzamiento?', '$1.99 al mes durante los primeros seis meses y luego $5.99 al mes salvo cancelación.'],
        ['¿Hay una prueba gratuita adicional?', 'No. El precio introductorio sustituye una prueba gratuita adicional.'],
        ['¿Qué permanece gratis?', 'Love Notes, Live Community principal, Quiz de Lenguajes del Amor, Ideas para Citas, perfil/descubrimiento, solicitudes de amistad y chat privado de texto.'],
        ['¿Cuándo me cobrarán?', 'La facturación real sigue desactivada durante desarrollo y pruebas controladas.'],
      ]},
    },
    links: { signIn: 'Iniciar Sesión', forgot: 'Olvidé mi Contraseña', loveNotes: 'Love Notes', community: 'Live Community', profile: 'Perfil', membership: 'Membresía' },
  },
  fr: {
    title: "Centre d'Aide", subtitle: 'Des réponses claires sur la relance One2OneLove.', search: "Rechercher de l'aide…", noResults: "Aucun sujet d'aide correspondant.", beta: "Ce Centre d'Aide documente uniquement les fonctions de relance réellement examinées. Il ne promet pas les anciens concours, appels, liaison automatique des comptes de couple ou autres fonctions inachevées.", open: 'Ouvrir', close: 'Fermer',
    groups: {
      account: { title: 'Compte et Sécurité', items: [['Pourquoi confirmer mon e-mail ?', "La confirmation protège les Love Notes privées et les expériences membres. Une session non confirmée n'est pas traitée comme authentifiée."], ['J’ai oublié mon mot de passe.', "Utilisez Mot de passe oublié depuis l'écran de connexion. La récupération passe par l'e-mail Supabase."], ['Un compte gratuit démarre-t-il une adhésion payante ?', "Non. L'inscription gratuite ne collecte aucune information de paiement et ne démarre aucune adhésion."], ['Quelles données de profil sont privées ?', "Le dossier complet du compte est privé. La découverte des membres utilise un annuaire séparé limité pour la confidentialité."]]},
      loveNotes: { title: 'Love Notes', items: [['La notification contient-elle ma Love Note ?', "Non. Elle identifie l'expéditeur et contient un lien sécurisé; le texte reste privé jusqu'à l'ouverture dans One2OneLove."], ['Puis-je écrire ma propre Love Note ?', "Oui, jusqu'à 500 caractères."], ['Le destinataire peut-il enregistrer une Love Note ?', "La relance prévoit un espace Saved Love Notes après révélation sécurisée."], ['Puis-je planifier une Love Note ?', "La planification est une fonction d'adhésion payante et reste désactivée jusqu'aux tests contrôlés."]]},
      community: { title: 'Communauté et Chat', items: [['Les compteurs Live Community sont-ils réels ?', "Oui. Les compteurs humains doivent refléter les personnes présentes. Sans conversation humaine, l'AI Host propose un sujet au lieu de simuler de l'activité."], ["Que fait l'AI Host ?", "C'est un catalyseur bref de conversation publique, pas un thérapeute ni un service d'urgence."], ['Puis-je envoyer un message privé ?', 'Le chat texte privé fait partie de la base gratuite avec des protections de participants au niveau base de données.'], ['Et les images/fichiers/notes vocales ?', "Les pièces jointes privées sont en cours de reconstruction avec stockage privé. Le texte reste la base sûre jusqu'à activation et test."]]},
      tools: { title: 'Outils Relationnels', items: [['Le quiz Love Language est-il gratuit ?', "Oui. C'est un outil de réflexion informel, pas une évaluation clinique validée."], ['Les Date Ideas sont-elles gratuites ?', 'Oui. Les idées intégrées restent gratuites.'], ['Les Relationship Goals sont-ils gratuits ?', "Non. Ils font partie de l'adhésion payante quand le contrôle d'adhésion sera activé."], ['L’e-mail de mon partenaire relie-t-il deux comptes ?', "Non. Enregistrer un nom ou e-mail partenaire ne crée pas de compte partagé et ne donne aucun accès."]]},
      membership: { title: 'Adhésion', items: [['Quel est le prix de relance ?', '1,99 $/mois pendant les six premiers mois, puis 5,99 $/mois sauf annulation.'], ['Y a-t-il un essai gratuit séparé ?', "Non. Le prix d'introduction remplace un essai gratuit supplémentaire."], ['Qu’est-ce qui reste gratuit ?', 'Love Notes, Live Community principale, quiz Love Language, Date Ideas, profil/découverte, demandes d’amis et chat texte privé.'], ['Quand serai-je facturé ?', 'La facturation réelle reste désactivée pendant le développement et les tests contrôlés.']]},
    },
    links: { signIn: 'Se Connecter', forgot: 'Mot de Passe Oublié', loveNotes: 'Love Notes', community: 'Live Community', profile: 'Profil', membership: 'Adhésion' },
  },
  it: {
    title: 'Centro Assistenza', subtitle: 'Risposte chiare sul rilancio di One2OneLove.', search: 'Cerca assistenza…', noResults: 'Nessun argomento corrispondente.', beta: 'Questo Centro Assistenza documenta solo le funzioni del rilancio realmente revisionate. Non promette vecchi concorsi, chiamate, collegamento automatico di account di coppia o altre funzioni incomplete.', open: 'Apri', close: 'Chiudi',
    groups: {
      account: { title: 'Account e Sicurezza', items: [['Perché devo confermare la mia email?', 'La conferma protegge Love Notes private ed esperienze per membri. Una sessione non confermata non viene trattata come autenticata.'], ['Ho dimenticato la password.', 'Usa Password dimenticata dalla schermata di accesso; il recupero usa il flusso email Supabase.'], ['Creare un account gratuito avvia un abbonamento?', 'No. La registrazione gratuita non raccoglie dati di pagamento e non avvia un abbonamento.'], ['Quali dati del profilo sono privati?', 'Il record completo dell’account è privato; la scoperta membri usa una directory separata e limitata.']]},
      loveNotes: { title: 'Love Notes', items: [['La notifica contiene la Love Note?', 'No. Identifica il mittente e contiene un link sicuro, ma il testo resta privato fino all’apertura su One2OneLove.'], ['Posso scrivere una Love Note personalizzata?', 'Sì, fino a 500 caratteri.'], ['Il destinatario può salvarla?', 'Il rilancio include Saved Love Notes dopo la rivelazione sicura.'], ['Posso programmarla?', 'La programmazione è una funzione a pagamento e resta disattivata fino ai test controllati.']]},
      community: { title: 'Community e Chat', items: [['I conteggi Live Community sono reali?', 'Sì. Devono riflettere persone realmente presenti; senza conversazione umana viene mostrato un tema AI Host invece di attività finta.'], ['Cosa fa AI Host?', 'È un breve catalizzatore di conversazione pubblica, non un terapeuta o servizio di emergenza.'], ['Posso inviare messaggi privati?', 'Il chat di testo privato fa parte della base gratuita con protezioni dei partecipanti nel database.'], ['E immagini/file/note vocali?', 'Gli allegati privati vengono ricostruiti su storage privato; il testo resta la base sicura fino all’attivazione testata.']]},
      tools: { title: 'Strumenti di Relazione', items: [['Il quiz Love Language è gratis?', 'Sì. È uno strumento informale di riflessione, non una valutazione clinica validata.'], ['Le Date Ideas sono gratis?', 'Sì. Le idee integrate restano gratuite.'], ['Relationship Goals è gratis?', 'No. Fa parte dell’abbonamento quando il gating verrà attivato intenzionalmente.'], ['L’email del partner collega due account?', 'No. Salvare nome/email del partner non crea un account condiviso né concede accesso.']]},
      membership: { title: 'Abbonamento', items: [['Qual è il prezzo di rilancio?', '$1.99/mese per i primi sei mesi, poi $5.99/mese salvo cancellazione.'], ['C’è una prova gratuita separata?', 'No. Il prezzo introduttivo sostituisce una prova gratuita aggiuntiva.'], ['Cosa resta gratis?', 'Love Notes, Live Community principale, quiz Love Language, Date Ideas, profilo/scoperta, richieste di amicizia e chat testuale privata.'], ['Quando verrò addebitato?', 'La fatturazione reale resta disattivata durante sviluppo e test controllati.']]},
    },
    links: { signIn: 'Accedi', forgot: 'Password Dimenticata', loveNotes: 'Love Notes', community: 'Live Community', profile: 'Profilo', membership: 'Abbonamento' },
  },
  de: {
    title: 'Hilfezentrum', subtitle: 'Klare Antworten zum One2OneLove-Relaunch.', search: 'Hilfe durchsuchen…', noResults: 'Keine passenden Hilfethemen gefunden.', beta: 'Dieses Hilfezentrum dokumentiert nur tatsächlich geprüfte Relaunch-Funktionen. Es verspricht keine alten Wettbewerbe, Anrufe, automatische Paar-Kontoverknüpfung oder andere unfertige Funktionen.', open: 'Öffnen', close: 'Schließen',
    groups: {
      account: { title: 'Konto & Sicherheit', items: [['Warum muss ich meine E-Mail bestätigen?', 'Die Bestätigung schützt private Love Notes und Mitgliederfunktionen. Eine unbestätigte Sitzung gilt nicht als authentifiziertes One2OneLove-Mitglied.'], ['Ich habe mein Passwort vergessen.', 'Nutzen Sie Passwort vergessen auf der Anmeldeseite; die Wiederherstellung nutzt den Supabase-E-Mail-Flow.'], ['Startet ein kostenloses Konto eine bezahlte Mitgliedschaft?', 'Nein. Die kostenlose Registrierung erfasst keine Zahlungsdaten und startet keine Mitgliedschaft.'], ['Welche Profildaten sind privat?', 'Der vollständige Kontodatensatz ist privat. Die Mitgliedersuche nutzt ein getrenntes datenschutzreduziertes Verzeichnis.']]},
      loveNotes: { title: 'Love Notes', items: [['Enthält die Benachrichtigung meine Love Note?', 'Nein. Sie nennt den Absender und enthält einen sicheren Link; der Text bleibt bis zur Öffnung in One2OneLove privat.'], ['Kann ich meine eigene Love Note schreiben?', 'Ja, bis zu 500 Zeichen.'], ['Kann der Empfänger sie speichern?', 'Der Relaunch umfasst Saved Love Notes nach sicherer Enthüllung.'], ['Kann ich eine Love Note planen?', 'Planung ist eine bezahlte Mitgliedschaftsfunktion und bleibt bis zu kontrollierten Tests deaktiviert.']]},
      community: { title: 'Community & Chat', items: [['Sind Live-Community-Zähler echt?', 'Ja. Menschliche Zähler sollen echte anwesende Personen zeigen; ohne menschliches Gespräch erscheint ein AI-Host-Thema statt vorgetäuschter Aktivität.'], ['Was macht der AI Host?', 'Er ist ein kurzer Impulsgeber für öffentliche Gespräche, kein Therapeut oder Notfalldienst.'], ['Kann ich privat chatten?', 'Privater Textchat gehört zur kostenlosen Basis und erhält Datenbankschutz für Teilnehmer.'], ['Was ist mit Bildern/Dateien/Sprachnachrichten?', 'Private Anhänge werden mit privatem Speicher neu aufgebaut; Text bleibt die sichere Basis bis zur getesteten Aktivierung.']]},
      tools: { title: 'Beziehungswerkzeuge', items: [['Ist das Love-Language-Quiz kostenlos?', 'Ja. Es ist ein informelles Reflexionswerkzeug, keine validierte klinische Bewertung.'], ['Sind Date Ideas kostenlos?', 'Ja. Integrierte Ideen bleiben kostenlos.'], ['Sind Relationship Goals kostenlos?', 'Nein. Sie gehören zur Mitgliedschaft, sobald das Gating bewusst aktiviert wird.'], ['Verknüpft die Partner-E-Mail zwei Konten?', 'Nein. Gespeicherte Partnerdaten erstellen kein gemeinsames Konto und gewähren keinen Zugriff.']]},
      membership: { title: 'Mitgliedschaft', items: [['Wie lautet der Relaunch-Preis?', '$1.99/Monat für die ersten sechs Monate, danach $5.99/Monat sofern nicht gekündigt.'], ['Gibt es eine separate Gratis-Testphase?', 'Nein. Der Einführungspreis ersetzt eine zusätzliche Gratis-Testphase.'], ['Was bleibt kostenlos?', 'Love Notes, Kern-Live-Community, Love-Language-Quiz, Date Ideas, Profil/Entdeckung, Freundschaftsanfragen und privater Textchat.'], ['Wann werde ich belastet?', 'Live-Abrechnung bleibt während Entwicklung und kontrollierten Tests deaktiviert.']]},
    },
    links: { signIn: 'Anmelden', forgot: 'Passwort Vergessen', loveNotes: 'Love Notes', community: 'Live Community', profile: 'Profil', membership: 'Mitgliedschaft' },
  },
  nl: {
    title: 'Helpcentrum', subtitle: 'Duidelijke antwoorden over de One2OneLove-herlancering.', search: 'Zoek hulp…', noResults: 'Geen passende helponderwerpen gevonden.', beta: 'Dit Helpcentrum documenteert alleen herlanceringsfuncties die werkelijk zijn beoordeeld. Het belooft geen oude wedstrijden, gesprekken, automatische koppeling van partneraccounts of andere onvoltooide functies.', open: 'Openen', close: 'Sluiten',
    groups: {
      account: { title: 'Account & Beveiliging', items: [['Waarom moet ik mijn e-mail bevestigen?', 'E-mailbevestiging beschermt privé Love Notes en ledenfuncties. Een onbevestigde sessie telt niet als geauthenticeerd lid.'], ['Ik ben mijn wachtwoord vergeten.', 'Gebruik Wachtwoord vergeten op het inlogscherm; herstel loopt via de Supabase e-mailflow.'], ['Start een gratis account een betaald lidmaatschap?', 'Nee. Gratis registratie verzamelt geen betaalgegevens en start geen betaald lidmaatschap.'], ['Welke profielgegevens zijn privé?', 'Het volledige accountrecord is privé; leden zoeken gebruikt een aparte privacybeperkte directory.']]},
      loveNotes: { title: 'Love Notes', items: [['Bevat de melding mijn Love Note?', 'Nee. De uitnodiging noemt de afzender en bevat een veilige link; de tekst blijft privé tot openen in One2OneLove.'], ['Kan ik mijn eigen Love Note schrijven?', 'Ja, maximaal 500 tekens.'], ['Kan de ontvanger de Love Note bewaren?', 'De herlancering omvat Saved Love Notes na veilige onthulling.'], ['Kan ik een Love Note plannen?', 'Planning is een betaalde lidmaatschapsfunctie en blijft uit tot gecontroleerde tests klaar zijn.']]},
      community: { title: 'Community & Chat', items: [['Zijn Live Community-aantallen echt?', 'Ja. Menselijke aantallen horen echte aanwezigen te tonen; zonder gesprek verschijnt een AI Host-onderwerp in plaats van nepactiviteit.'], ['Wat doet de AI Host?', 'Een korte gespreksstarter in openbare kamers, geen therapeut of nooddienst.'], ['Kan ik privé chatten?', 'Privé tekstchat hoort bij de gratis basis en krijgt deelnemerbescherming in de database.'], ['En afbeeldingen/bestanden/spraak?', 'Privébijlagen worden herbouwd op private opslag; tekst blijft de veilige basis tot geteste activering.']]},
      tools: { title: 'Relatietools', items: [['Is de Love Language Quiz gratis?', 'Ja. Het is een informele reflectietool, geen gevalideerde klinische test.'], ['Zijn Date Ideas gratis?', 'Ja. Ingebouwde ideeën blijven gratis.'], ['Zijn Relationship Goals gratis?', 'Nee. Ze horen bij lidmaatschap zodra gating bewust wordt ingeschakeld.'], ['Koppelt partner-e-mail twee accounts?', 'Nee. Partnergegevens opslaan maakt geen gedeeld account en geeft geen toegang.']]},
      membership: { title: 'Lidmaatschap', items: [['Wat is de herlanceringsprijs?', '$1.99/maand gedurende de eerste zes maanden, daarna $5.99/maand tenzij opgezegd.'], ['Is er een aparte gratis proefperiode?', 'Nee. De introductieprijs vervangt een extra gratis proefperiode.'], ['Wat blijft gratis?', 'Love Notes, kern-Live Community, Love Language Quiz, Date Ideas, profiel/ontdekking, vriendschapsverzoeken en privé tekstchat.'], ['Wanneer word ik belast?', 'Live facturatie blijft uit tijdens ontwikkeling en gecontroleerde tests.']]},
    },
    links: { signIn: 'Inloggen', forgot: 'Wachtwoord Vergeten', loveNotes: 'Love Notes', community: 'Live Community', profile: 'Profiel', membership: 'Lidmaatschap' },
  },
};

const LINK_CARDS = [
  { key: 'signIn', path: '/SignIn', icon: UserRound },
  { key: 'forgot', path: '/ForgotPassword', icon: KeyRound },
  { key: 'loveNotes', path: '/LoveNotes', icon: Heart },
  { key: 'community', path: '/Community', icon: MessageCircle },
  { key: 'profile', path: '/Profile', icon: ShieldCheck },
  { key: 'membership', path: '/PremiumFeatures', icon: Sparkles },
];

export default function HelpCenterRelaunch() {
  const { currentLanguage } = useLanguage();
  const t = COPY[currentLanguage] || COPY.en;
  const [query, setQuery] = useState('');
  const [openKey, setOpenKey] = useState(null);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const all = Object.entries(t.groups).flatMap(([groupKey, group]) =>
      group.items.map(([question, answer], index) => ({ groupKey, groupTitle: group.title, question, answer, key: `${groupKey}-${index}` }))
    );
    if (!needle) return all;
    return all.filter((row) => `${row.groupTitle} ${row.question} ${row.answer}`.toLowerCase().includes(needle));
  }, [query, t]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg"><HelpCircle className="h-8 w-8" /></div>
          <h1 className="text-4xl font-black text-gray-900 sm:text-5xl">{t.title}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-gray-600">{t.subtitle}</p>
        </div>

        <div className="mx-auto mt-8 max-w-2xl">
          <div className="relative"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search} className="h-13 pl-12" /></div>
        </div>

        <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900"><BookOpen className="mr-2 inline h-4 w-4" />{t.beta}</div>

        <div className="mt-8 grid gap-3">
          {rows.length ? rows.map((row) => {
            const open = openKey === row.key;
            return (
              <Card key={row.key} className="overflow-hidden border-gray-200 shadow-sm">
                <button type="button" onClick={() => setOpenKey(open ? null : row.key)} className="flex w-full items-start justify-between gap-4 p-5 text-left">
                  <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-purple-600">{row.groupTitle}</p><h2 className="mt-1 font-bold text-gray-900">{row.question}</h2></div>
                  <ChevronDown className={`mt-1 h-5 w-5 flex-none text-gray-500 transition ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
                {open && <CardContent className="border-t bg-gray-50 px-5 py-4 text-sm leading-7 text-gray-700">{row.answer}</CardContent>}
              </Card>
            );
          }) : <p className="py-10 text-center text-gray-500">{t.noResults}</p>}
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LINK_CARDS.map(({ key, path, icon: Icon }) => (
            <Link key={key} to={path} className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 font-semibold text-gray-800 shadow-sm transition hover:border-purple-200 hover:text-purple-700"><Icon className="h-5 w-5 text-purple-600" />{t.links[key]}</Link>
          ))}
        </div>
      </div>
    </div>
  );
}
