import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Globe2,
  Loader2,
  MapPin,
  Mic2,
  Plus,
  Radio,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/Layout";
import {
  submitProfessionalApplication,
  uploadProfessionalProfilePhoto,
} from "@/lib/professionalOnboardingService";
import {
  CUSTOM_JURISDICTION,
  NATIONAL_JURISDICTION,
  WORLD_COUNTRIES,
  getJurisdictionOptions,
} from "@/lib/professionalGeography";

const BROADCAST_LANGUAGES = [
  "Arabic", "Bengali", "Bulgarian", "Burmese", "Cantonese", "Catalan", "Chinese (Mandarin)", "Croatian", "Czech", "Danish", "Dutch", "English", "Estonian", "Filipino / Tagalog", "Finnish", "French", "German", "Greek", "Gujarati", "Haitian Creole", "Hebrew", "Hindi", "Hungarian", "Icelandic", "Indonesian", "Irish", "Italian", "Japanese", "Kannada", "Korean", "Latvian", "Lithuanian", "Malay", "Malayalam", "Marathi", "Nepali", "Norwegian", "Persian / Farsi", "Polish", "Portuguese", "Punjabi", "Romanian", "Russian", "Serbian", "Slovak", "Slovenian", "Somali", "Spanish", "Swahili", "Swedish", "Tamil", "Telugu", "Thai", "Turkish", "Ukrainian", "Urdu", "Vietnamese", "Welsh", "Yoruba", "Zulu", "Other"
].sort((a, b) => a.localeCompare(b));

const MEDIA_TYPES = [
  "television",
  "radio",
  "podcast",
  "social_media",
  "streaming_video",
  "website_blog",
  "newspaper_magazine",
  "newsletter",
  "books_publishing",
  "live_events",
  "syndicated_network",
  "other_media",
];

const SOCIAL_PLATFORMS = [
  "Facebook", "Instagram", "TikTok", "YouTube", "X", "Threads", "LinkedIn", "Pinterest", "Snapchat", "Twitch", "Reddit", "Discord", "Other"
];

const COPY = {
  en: {
    back: "Back to Professional Options",
    title: "Creator, Podcaster, Writer or Influencer",
    subtitle: "Tell us where you are based, the languages you create or broadcast in, and where your work is published, aired or distributed.",
    basic: "Account & Identity", firstName: "First Name", lastName: "Last Name", displayName: "Creator / Public Name", email: "Email Address", password: "Password", confirmPassword: "Confirm Password", phone: "Phone Number", photo: "Profile Photo", photoHint: "Optional. Used on your contributor profile after approval.",
    location: "Profile Location", locationHint: "Your country and city help members discover contributors by geography. A street address is not required.", country: "Country", region: "State / Province / Region", city: "City", timezone: "Time Zone", selectCountry: "Select country", selectRegion: "Select region", national: "National / Countrywide", otherRegion: "Other / Enter region", customRegion: "Enter exact state, province or region",
    languages: "Broadcast / Content Languages — ALL THAT APPLY", languagesHint: "Choose every language in which you actually create, publish, present, interview or broadcast.", selectLanguages: "Select languages", selected: "selected", otherLanguage: "Other Language(s)", otherLanguageHint: "If a language is not listed, enter it here. Separate multiple languages with commas.",
    creatorType: "Contributor Type — ALL THAT APPLY", creatorTypes: ["Creator", "Podcaster", "Writer / Blogger", "Influencer", "Author", "Speaker", "YouTuber / Video Creator", "Relationship Commentator", "Other Media Contributor"],
    distribution: "Where Your Content Is Published, Broadcast or Distributed", distributionHint: "Select every avenue you use, then add the specific stations, networks, platforms, shows, publications or outlets below.",
    mediaLabels: { television: "Television / Cable / Broadcast", radio: "Radio / Satellite Radio", podcast: "Podcast", social_media: "Social Media", streaming_video: "Streaming / Video Platform", website_blog: "Website / Blog", newspaper_magazine: "Newspaper / Magazine / Digital Publication", newsletter: "Newsletter / Email Publication", books_publishing: "Books / Publishing", live_events: "Live Events / Speaking / Panels", syndicated_network: "Syndicated / Network Content", other_media: "Other Media Outlet" },
    addOutlet: "Add Outlet", outletName: "Outlet / Platform / Network", programName: "Program / Show / Handle / Publication", url: "URL / Profile Link", market: "Market / Coverage Area", outletCountry: "Outlet Country", audience: "Audience / Followers for This Outlet", socialPlatform: "Social Media Platform", remove: "Remove",
    reach: "Audience / Service Reach — ALL THAT APPLY", reachOptions: ["Local", "Regional", "National", "International", "Global"],
    serviceLocations: "Service / Appearance Locations — OPTIONAL", serviceHint: "Add locations where you regularly provide appearances, speaking, workshops, events or other in-person services.", addServiceLocation: "Add Service / Appearance Location",
    topics: "Content Topics — ALL THAT APPLY", topicOptions: ["Marriage", "Dating", "Communication", "Family", "Intimacy", "LGBTQ+ Relationships", "Faith & Relationships", "Divorce / Separation", "Personal Growth", "Relationship Culture", "Humor / Commentary", "Other"],
    collaborations: "Collaboration Interests — ALL THAT APPLY", collaborationOptions: ["Podcast / Interview Guest", "Articles / Written Contributions", "Video Contributions", "Live Discussions", "Events / Panels", "Campaign Collaborations", "Educational Content", "Other"],
    profile: "Creator / Contributor Profile", website: "Primary Website", followers: "Approximate Combined Audience / Followers", mediaKit: "Media Kit URL", samples: "Sample Work Links", samplesHint: "One link per line.", bio: "Professional / Creator Bio", bioHint: "Minimum 100 characters.",
    agreement: "Verification & Agreement", pending: "Contributor applications remain Pending Review until approved.", accurate: "I certify that the information I provided is accurate and current.", contributorAck: "I understand that contributor approval does not present me as a licensed mental-health professional unless I separately complete and pass the licensed-professional verification process.", terms: "I agree to the One2One Love Terms of Service and Privacy Policy.",
    incomplete: "Please complete all required fields, select at least one distribution avenue, add at least one outlet for every selected avenue, and complete all acknowledgments.", mismatch: "Passwords do not match.", submit: "Submit Contributor Application", submitting: "Submitting Application...", successTitle: "Application Received", successBody: "Your contributor application is pending review. Nothing is published as approved until review is completed.", emailVerify: "Please also complete any email verification message sent to you.", home: "Return Home"
  },
  es: {
    back: "Volver a Opciones Profesionales", title: "Creador, Podcaster, Escritor o Influencer", subtitle: "Indique dónde se encuentra, los idiomas en los que crea o transmite y dónde se publica, emite o distribuye su trabajo.",
    basic: "Cuenta e Identidad", firstName: "Nombre", lastName: "Apellido", displayName: "Nombre de Creador / Público", email: "Correo Electrónico", password: "Contraseña", confirmPassword: "Confirmar Contraseña", phone: "Teléfono", photo: "Foto de Perfil", photoHint: "Opcional. Se usará en su perfil después de la aprobación.",
    location: "Ubicación del Perfil", locationHint: "El país y la ciudad ayudan a los miembros a encontrar colaboradores por ubicación. No se requiere dirección física.", country: "País", region: "Estado / Provincia / Región", city: "Ciudad", timezone: "Zona Horaria", selectCountry: "Seleccionar país", selectRegion: "Seleccionar región", national: "Nacional / Todo el País", otherRegion: "Otra / Ingresar región", customRegion: "Ingrese el estado, provincia o región exacta",
    languages: "Idiomas de Transmisión / Contenido — TODOS LOS QUE APLIQUEN", languagesHint: "Seleccione todos los idiomas en los que realmente crea, publica, presenta, entrevista o transmite.", selectLanguages: "Seleccionar idiomas", selected: "seleccionados", otherLanguage: "Otro(s) Idioma(s)", otherLanguageHint: "Si un idioma no aparece, ingréselo aquí. Separe varios idiomas con comas.",
    creatorType: "Tipo de Colaborador — TODOS LOS QUE APLIQUEN", creatorTypes: ["Creador", "Podcaster", "Escritor / Blogger", "Influencer", "Autor", "Conferencista", "YouTuber / Creador de Video", "Comentarista de Relaciones", "Otro Colaborador de Medios"],
    distribution: "Dónde se Publica, Transmite o Distribuye Su Contenido", distributionHint: "Seleccione todos los medios que utiliza y luego agregue las estaciones, redes, plataformas, programas, publicaciones o medios específicos.",
    mediaLabels: { television: "Televisión / Cable / Emisión", radio: "Radio / Radio Satelital", podcast: "Podcast", social_media: "Redes Sociales", streaming_video: "Streaming / Plataforma de Video", website_blog: "Sitio Web / Blog", newspaper_magazine: "Periódico / Revista / Publicación Digital", newsletter: "Boletín / Publicación por Email", books_publishing: "Libros / Editorial", live_events: "Eventos en Vivo / Conferencias / Paneles", syndicated_network: "Contenido Sindicado / Red", other_media: "Otro Medio" },
    addOutlet: "Agregar Medio", outletName: "Medio / Plataforma / Red", programName: "Programa / Show / Usuario / Publicación", url: "URL / Enlace de Perfil", market: "Mercado / Área de Cobertura", outletCountry: "País del Medio", audience: "Audiencia / Seguidores de Este Medio", socialPlatform: "Plataforma Social", remove: "Eliminar",
    reach: "Alcance de Audiencia / Servicios — TODOS LOS QUE APLIQUEN", reachOptions: ["Local", "Regional", "Nacional", "Internacional", "Global"],
    serviceLocations: "Ubicaciones de Servicios / Apariciones — OPCIONAL", serviceHint: "Agregue lugares donde regularmente realiza apariciones, charlas, talleres, eventos u otros servicios presenciales.", addServiceLocation: "Agregar Ubicación",
    topics: "Temas de Contenido — TODOS LOS QUE APLIQUEN", topicOptions: ["Matrimonio", "Citas", "Comunicación", "Familia", "Intimidad", "Relaciones LGBTQ+", "Fe y Relaciones", "Divorcio / Separación", "Crecimiento Personal", "Cultura de Relaciones", "Humor / Comentario", "Otro"],
    collaborations: "Intereses de Colaboración — TODOS LOS QUE APLIQUEN", collaborationOptions: ["Invitado de Podcast / Entrevista", "Artículos / Contribuciones Escritas", "Contribuciones de Video", "Conversaciones en Vivo", "Eventos / Paneles", "Colaboraciones de Campaña", "Contenido Educativo", "Otro"],
    profile: "Perfil de Creador / Colaborador", website: "Sitio Web Principal", followers: "Audiencia / Seguidores Combinados Aproximados", mediaKit: "URL del Media Kit", samples: "Enlaces de Trabajo", samplesHint: "Un enlace por línea.", bio: "Biografía Profesional / del Creador", bioHint: "Mínimo 100 caracteres.",
    agreement: "Verificación y Acuerdo", pending: "Las solicitudes de colaboradores permanecen Pendientes de Revisión hasta su aprobación.", accurate: "Certifico que la información proporcionada es correcta y actual.", contributorAck: "Entiendo que la aprobación como colaborador no me presenta como profesional de salud mental con licencia a menos que complete por separado el proceso de verificación profesional.", terms: "Acepto los Términos de Servicio y la Política de Privacidad de One2One Love.",
    incomplete: "Complete todos los campos obligatorios, seleccione al menos un medio de distribución, agregue al menos un medio específico para cada selección y complete todas las confirmaciones.", mismatch: "Las contraseñas no coinciden.", submit: "Enviar Solicitud de Colaborador", submitting: "Enviando Solicitud...", successTitle: "Solicitud Recibida", successBody: "Su solicitud está pendiente de revisión. Nada se publica como aprobado hasta completar la revisión.", emailVerify: "Complete también cualquier verificación enviada a su correo.", home: "Volver al Inicio"
  },
  fr: {
    back: "Retour aux Options Professionnelles", title: "Créateur, Podcasteur, Auteur ou Influenceur", subtitle: "Indiquez où vous êtes basé, les langues dans lesquelles vous créez ou diffusez et où votre travail est publié ou distribué.",
    basic: "Compte et Identité", firstName: "Prénom", lastName: "Nom", displayName: "Nom de Créateur / Public", email: "Adresse E-mail", password: "Mot de Passe", confirmPassword: "Confirmer le Mot de Passe", phone: "Téléphone", photo: "Photo de Profil", photoHint: "Facultatif. Utilisée sur votre profil après approbation.",
    location: "Localisation du Profil", locationHint: "Le pays et la ville aident les membres à trouver des contributeurs par zone géographique. Une adresse postale n’est pas requise.", country: "Pays", region: "État / Province / Région", city: "Ville", timezone: "Fuseau Horaire", selectCountry: "Sélectionner un pays", selectRegion: "Sélectionner une région", national: "National / Tout le Pays", otherRegion: "Autre / Saisir la région", customRegion: "Saisissez l’état, la province ou la région exacte",
    languages: "Langues de Diffusion / Contenu — TOUTES CELLES QUI S’APPLIQUENT", languagesHint: "Sélectionnez toutes les langues dans lesquelles vous créez, publiez, présentez, interviewez ou diffusez réellement.", selectLanguages: "Sélectionner les langues", selected: "sélectionnées", otherLanguage: "Autre(s) Langue(s)", otherLanguageHint: "Si une langue n’est pas listée, saisissez-la ici. Séparez plusieurs langues par des virgules.",
    creatorType: "Type de Contributeur — TOUS CEUX QUI S’APPLIQUENT", creatorTypes: ["Créateur", "Podcasteur", "Auteur / Blogueur", "Influenceur", "Auteur de Livre", "Conférencier", "YouTubeur / Créateur Vidéo", "Commentateur Relationnel", "Autre Contributeur Média"],
    distribution: "Où Votre Contenu Est Publié, Diffusé ou Distribué", distributionHint: "Sélectionnez tous les canaux utilisés, puis ajoutez les stations, réseaux, plateformes, émissions, publications ou médias précis.",
    mediaLabels: { television: "Télévision / Câble / Diffusion", radio: "Radio / Radio Satellite", podcast: "Podcast", social_media: "Réseaux Sociaux", streaming_video: "Streaming / Plateforme Vidéo", website_blog: "Site Web / Blog", newspaper_magazine: "Journal / Magazine / Publication Numérique", newsletter: "Newsletter / Publication E-mail", books_publishing: "Livres / Édition", live_events: "Événements / Conférences / Panels", syndicated_network: "Contenu Syndiqué / Réseau", other_media: "Autre Média" },
    addOutlet: "Ajouter un Média", outletName: "Média / Plateforme / Réseau", programName: "Programme / Émission / Identifiant / Publication", url: "URL / Lien de Profil", market: "Marché / Zone de Couverture", outletCountry: "Pays du Média", audience: "Audience / Abonnés de ce Média", socialPlatform: "Plateforme Sociale", remove: "Supprimer",
    reach: "Portée de l’Audience / Services — TOUTES CELLES QUI S’APPLIQUENT", reachOptions: ["Locale", "Régionale", "Nationale", "Internationale", "Mondiale"],
    serviceLocations: "Lieux de Services / Apparitions — FACULTATIF", serviceHint: "Ajoutez les lieux où vous intervenez régulièrement pour des apparitions, conférences, ateliers, événements ou autres services en personne.", addServiceLocation: "Ajouter un Lieu",
    topics: "Thèmes de Contenu — TOUS CEUX QUI S’APPLIQUENT", topicOptions: ["Mariage", "Rencontres", "Communication", "Famille", "Intimité", "Relations LGBTQ+", "Foi et Relations", "Divorce / Séparation", "Développement Personnel", "Culture Relationnelle", "Humour / Commentaire", "Autre"],
    collaborations: "Intérêts de Collaboration — TOUS CEUX QUI S’APPLIQUENT", collaborationOptions: ["Invité Podcast / Interview", "Articles / Contributions Écrites", "Contributions Vidéo", "Discussions en Direct", "Événements / Panels", "Campagnes", "Contenu Éducatif", "Autre"],
    profile: "Profil Créateur / Contributeur", website: "Site Web Principal", followers: "Audience / Abonnés Combinés Approximatifs", mediaKit: "URL du Kit Média", samples: "Liens d’Exemples", samplesHint: "Un lien par ligne.", bio: "Biographie Professionnelle / Créateur", bioHint: "Minimum 100 caractères.",
    agreement: "Vérification et Accord", pending: "Les candidatures de contributeurs restent En Attente d’Examen jusqu’à leur approbation.", accurate: "Je certifie que les informations fournies sont exactes et à jour.", contributorAck: "Je comprends que l’approbation comme contributeur ne me présente pas comme professionnel de santé mentale agréé sauf vérification séparée.", terms: "J’accepte les Conditions d’utilisation et la Politique de confidentialité de One2One Love.",
    incomplete: "Veuillez remplir les champs obligatoires, sélectionner au moins un canal de distribution, ajouter au moins un média pour chaque canal et accepter toutes les confirmations.", mismatch: "Les mots de passe ne correspondent pas.", submit: "Envoyer la Candidature", submitting: "Envoi en Cours...", successTitle: "Candidature Reçue", successBody: "Votre candidature est en attente d’examen. Rien n’est publié comme approuvé avant la fin de l’examen.", emailVerify: "Veuillez également effectuer toute vérification reçue par e-mail.", home: "Retour à l’Accueil"
  },
  it: {
    back: "Torna alle Opzioni Professionali", title: "Creator, Podcaster, Scrittore o Influencer", subtitle: "Indica dove ti trovi, le lingue in cui crei o trasmetti e dove il tuo lavoro viene pubblicato, trasmesso o distribuito.",
    basic: "Account e Identità", firstName: "Nome", lastName: "Cognome", displayName: "Nome Creator / Pubblico", email: "Email", password: "Password", confirmPassword: "Conferma Password", phone: "Telefono", photo: "Foto Profilo", photoHint: "Opzionale. Utilizzata sul profilo dopo l’approvazione.",
    location: "Località del Profilo", locationHint: "Paese e città aiutano gli utenti a trovare contributor per area geografica. Non è richiesto un indirizzo stradale.", country: "Paese", region: "Stato / Provincia / Regione", city: "Città", timezone: "Fuso Orario", selectCountry: "Seleziona paese", selectRegion: "Seleziona regione", national: "Nazionale / Tutto il Paese", otherRegion: "Altro / Inserisci regione", customRegion: "Inserisci stato, provincia o regione esatta",
    languages: "Lingue di Trasmissione / Contenuto — TUTTE QUELLE APPLICABILI", languagesHint: "Seleziona tutte le lingue in cui crei, pubblichi, presenti, intervisti o trasmetti realmente.", selectLanguages: "Seleziona lingue", selected: "selezionate", otherLanguage: "Altra/e Lingua/e", otherLanguageHint: "Se una lingua non è elencata, inseriscila qui. Separa più lingue con virgole.",
    creatorType: "Tipo di Contributor — TUTTI QUELLI APPLICABILI", creatorTypes: ["Creator", "Podcaster", "Scrittore / Blogger", "Influencer", "Autore", "Speaker", "YouTuber / Video Creator", "Commentatore Relazionale", "Altro Contributor Media"],
    distribution: "Dove i Tuoi Contenuti Sono Pubblicati, Trasmessi o Distribuiti", distributionHint: "Seleziona tutti i canali usati, quindi aggiungi stazioni, reti, piattaforme, programmi, pubblicazioni o media specifici.",
    mediaLabels: { television: "Televisione / Cavo / Broadcast", radio: "Radio / Radio Satellitare", podcast: "Podcast", social_media: "Social Media", streaming_video: "Streaming / Piattaforma Video", website_blog: "Sito Web / Blog", newspaper_magazine: "Giornale / Rivista / Pubblicazione Digitale", newsletter: "Newsletter / Pubblicazione Email", books_publishing: "Libri / Editoria", live_events: "Eventi Live / Conferenze / Panel", syndicated_network: "Contenuto Sindacato / Network", other_media: "Altro Media" },
    addOutlet: "Aggiungi Media", outletName: "Media / Piattaforma / Network", programName: "Programma / Show / Handle / Pubblicazione", url: "URL / Link Profilo", market: "Mercato / Area di Copertura", outletCountry: "Paese del Media", audience: "Pubblico / Follower di Questo Media", socialPlatform: "Piattaforma Social", remove: "Rimuovi",
    reach: "Portata Pubblico / Servizi — TUTTE QUELLE APPLICABILI", reachOptions: ["Locale", "Regionale", "Nazionale", "Internazionale", "Globale"],
    serviceLocations: "Località di Servizi / Apparizioni — OPZIONALE", serviceHint: "Aggiungi località dove partecipi regolarmente ad apparizioni, conferenze, workshop, eventi o altri servizi di persona.", addServiceLocation: "Aggiungi Località",
    topics: "Temi — TUTTI QUELLI APPLICABILI", topicOptions: ["Matrimonio", "Dating", "Comunicazione", "Famiglia", "Intimità", "Relazioni LGBTQ+", "Fede e Relazioni", "Divorzio / Separazione", "Crescita Personale", "Cultura Relazionale", "Umorismo / Commento", "Altro"],
    collaborations: "Interessi di Collaborazione — TUTTI QUELLI APPLICABILI", collaborationOptions: ["Ospite Podcast / Intervista", "Articoli / Contributi Scritti", "Contributi Video", "Discussioni Live", "Eventi / Panel", "Collaborazioni Campagna", "Contenuto Educativo", "Altro"],
    profile: "Profilo Creator / Contributor", website: "Sito Web Principale", followers: "Pubblico / Follower Combinati Approssimativi", mediaKit: "URL Media Kit", samples: "Link a Lavori", samplesHint: "Un link per riga.", bio: "Biografia Professionale / Creator", bioHint: "Minimo 100 caratteri.",
    agreement: "Verifica e Accordo", pending: "Le candidature contributor restano In Attesa di Revisione fino all’approvazione.", accurate: "Certifico che le informazioni fornite sono accurate e aggiornate.", contributorAck: "Comprendo che l’approvazione come contributor non mi presenta come professionista della salute mentale abilitato senza verifica separata.", terms: "Accetto i Termini di Servizio e la Privacy Policy di One2One Love.",
    incomplete: "Completa i campi obbligatori, seleziona almeno un canale di distribuzione, aggiungi almeno un media per ogni canale e completa tutte le conferme.", mismatch: "Le password non corrispondono.", submit: "Invia Candidatura Contributor", submitting: "Invio in Corso...", successTitle: "Candidatura Ricevuta", successBody: "La candidatura è in attesa di revisione. Nulla viene pubblicato come approvato prima della revisione.", emailVerify: "Completa anche l’eventuale verifica ricevuta via email.", home: "Torna alla Home"
  },
  de: {
    back: "Zurück zu Professionellen Optionen", title: "Creator, Podcaster, Autor oder Influencer", subtitle: "Geben Sie an, wo Sie ansässig sind, in welchen Sprachen Sie Inhalte erstellen oder senden und wo Ihre Arbeit veröffentlicht, ausgestrahlt oder verbreitet wird.",
    basic: "Konto & Identität", firstName: "Vorname", lastName: "Nachname", displayName: "Creator- / Öffentlicher Name", email: "E-Mail-Adresse", password: "Passwort", confirmPassword: "Passwort Bestätigen", phone: "Telefonnummer", photo: "Profilfoto", photoHint: "Optional. Wird nach Genehmigung im Profil verwendet.",
    location: "Profilstandort", locationHint: "Land und Stadt helfen Mitgliedern, Contributors nach Region zu finden. Eine Straßenadresse ist nicht erforderlich.", country: "Land", region: "Bundesland / Provinz / Region", city: "Stadt", timezone: "Zeitzone", selectCountry: "Land auswählen", selectRegion: "Region auswählen", national: "National / Landesweit", otherRegion: "Andere / Region eingeben", customRegion: "Bundesland, Provinz oder Region eingeben",
    languages: "Sende- / Inhaltssprachen — ALLE ZUTREFFENDEN", languagesHint: "Wählen Sie alle Sprachen, in denen Sie tatsächlich erstellen, veröffentlichen, präsentieren, interviewen oder senden.", selectLanguages: "Sprachen auswählen", selected: "ausgewählt", otherLanguage: "Andere Sprache(n)", otherLanguageHint: "Wenn eine Sprache nicht aufgeführt ist, geben Sie sie hier ein. Mehrere Sprachen durch Kommas trennen.",
    creatorType: "Contributor-Typ — ALLE ZUTREFFENDEN", creatorTypes: ["Creator", "Podcaster", "Autor / Blogger", "Influencer", "Buchautor", "Redner", "YouTuber / Video-Creator", "Beziehungskommentator", "Anderer Medien-Contributor"],
    distribution: "Wo Ihre Inhalte Veröffentlicht, Gesendet oder Verbreitet Werden", distributionHint: "Wählen Sie alle verwendeten Kanäle und fügen Sie anschließend die konkreten Sender, Netzwerke, Plattformen, Sendungen, Publikationen oder Medien hinzu.",
    mediaLabels: { television: "Fernsehen / Kabel / Broadcast", radio: "Radio / Satellitenradio", podcast: "Podcast", social_media: "Social Media", streaming_video: "Streaming / Videoplattform", website_blog: "Website / Blog", newspaper_magazine: "Zeitung / Magazin / Digitale Publikation", newsletter: "Newsletter / E-Mail-Publikation", books_publishing: "Bücher / Verlage", live_events: "Live-Events / Vorträge / Panels", syndicated_network: "Syndizierte / Netzwerk-Inhalte", other_media: "Anderes Medium" },
    addOutlet: "Medium Hinzufügen", outletName: "Medium / Plattform / Netzwerk", programName: "Programm / Show / Handle / Publikation", url: "URL / Profillink", market: "Markt / Abdeckungsgebiet", outletCountry: "Land des Mediums", audience: "Publikum / Follower Dieses Mediums", socialPlatform: "Social-Media-Plattform", remove: "Entfernen",
    reach: "Publikums- / Service-Reichweite — ALLE ZUTREFFENDEN", reachOptions: ["Lokal", "Regional", "National", "International", "Global"],
    serviceLocations: "Service- / Auftrittsorte — OPTIONAL", serviceHint: "Fügen Sie Orte hinzu, an denen Sie regelmäßig Auftritte, Vorträge, Workshops, Veranstaltungen oder andere persönliche Leistungen anbieten.", addServiceLocation: "Ort Hinzufügen",
    topics: "Inhaltsthemen — ALLE ZUTREFFENDEN", topicOptions: ["Ehe", "Dating", "Kommunikation", "Familie", "Intimität", "LGBTQ+ Beziehungen", "Glaube & Beziehungen", "Scheidung / Trennung", "Persönliches Wachstum", "Beziehungskultur", "Humor / Kommentar", "Andere"],
    collaborations: "Kooperationsinteressen — ALLE ZUTREFFENDEN", collaborationOptions: ["Podcast- / Interviewgast", "Artikel / Schriftliche Beiträge", "Videobeiträge", "Live-Diskussionen", "Events / Panels", "Kampagnenkooperationen", "Bildungsinhalte", "Andere"],
    profile: "Creator- / Contributor-Profil", website: "Hauptwebsite", followers: "Ungefähre Kombinierte Zielgruppe / Follower", mediaKit: "Media-Kit-URL", samples: "Arbeitsproben-Links", samplesHint: "Ein Link pro Zeile.", bio: "Professionelle / Creator-Biografie", bioHint: "Mindestens 100 Zeichen.",
    agreement: "Verifizierung & Vereinbarung", pending: "Contributor-Bewerbungen bleiben bis zur Genehmigung Zur Prüfung Ausstehend.", accurate: "Ich bestätige, dass meine Angaben korrekt und aktuell sind.", contributorAck: "Ich verstehe, dass die Contributor-Genehmigung mich nicht als lizenzierte Fachkraft der psychischen Gesundheit darstellt, sofern ich nicht separat verifiziert wurde.", terms: "Ich akzeptiere die Nutzungsbedingungen und Datenschutzrichtlinie von One2One Love.",
    incomplete: "Bitte füllen Sie alle Pflichtfelder aus, wählen Sie mindestens einen Verbreitungskanal, fügen Sie für jeden gewählten Kanal mindestens ein Medium hinzu und bestätigen Sie alle Erklärungen.", mismatch: "Die Passwörter stimmen nicht überein.", submit: "Contributor-Bewerbung Absenden", submitting: "Bewerbung Wird Gesendet...", successTitle: "Bewerbung Eingegangen", successBody: "Ihre Bewerbung wird geprüft. Nichts wird vor Abschluss der Prüfung als genehmigt veröffentlicht.", emailVerify: "Bitte führen Sie auch jede per E-Mail zugesandte Verifizierung durch.", home: "Zur Startseite"
  },
};

const emptyOutlet = (type) => ({ type, outletName: "", programName: "", url: "", market: "", country: "", audience: "" });
const emptyServiceLocation = () => ({ country: "", region: "", city: "" });

export default function ContributorProfessionalApplication() {
  const { currentLanguage } = useLanguage();
  const language = COPY[currentLanguage] ? currentLanguage : "en";
  const t = COPY[language];
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "", lastName: "", displayName: "", email: "", password: "", confirmPassword: "", phone: "",
    country: "", region: "", city: "", timeZone: "", otherLanguages: "", websiteUrl: "", followerCount: "", mediaKitUrl: "", sampleLinksText: "", bio: "",
  });
  const [roles, setRoles] = useState([]);
  const [broadcastLanguages, setBroadcastLanguages] = useState([]);
  const [mediaAvenues, setMediaAvenues] = useState([]);
  const [distributionOutlets, setDistributionOutlets] = useState([]);
  const [audienceReach, setAudienceReach] = useState([]);
  const [serviceLocations, setServiceLocations] = useState([]);
  const [contentCategories, setContentCategories] = useState([]);
  const [collaborationTypes, setCollaborationTypes] = useState([]);
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [accurate, setAccurate] = useState(false);
  const [contributorAcknowledged, setContributorAcknowledged] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [requiresEmailVerification, setRequiresEmailVerification] = useState(false);

  const selectedLanguageSummary = useMemo(() => {
    if (!broadcastLanguages.length) return t.selectLanguages;
    return `${broadcastLanguages.join(", ")} (${broadcastLanguages.length} ${t.selected})`;
  }, [broadcastLanguages, t]);

  const update = (field, value) => setForm((previous) => ({ ...previous, [field]: value }));
  const toggle = (value, values, setter) => setter(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);

  const toggleMediaAvenue = (type) => {
    if (mediaAvenues.includes(type)) {
      setMediaAvenues((items) => items.filter((item) => item !== type));
      setDistributionOutlets((items) => items.filter((item) => item.type !== type));
    } else {
      setMediaAvenues((items) => [...items, type]);
      setDistributionOutlets((items) => [...items, emptyOutlet(type)]);
    }
  };

  const addOutlet = (type) => setDistributionOutlets((items) => [...items, emptyOutlet(type)]);
  const updateOutlet = (index, field, value) => setDistributionOutlets((items) => items.map((item, i) => i === index ? { ...item, [field]: value } : item));
  const removeOutlet = (index) => setDistributionOutlets((items) => items.filter((_, i) => i !== index));
  const addServiceLocation = () => setServiceLocations((items) => [...items, emptyServiceLocation()]);
  const updateServiceLocation = (index, field, value) => setServiceLocations((items) => items.map((item, i) => i === index ? { ...item, [field]: value } : item));
  const removeServiceLocation = (index) => setServiceLocations((items) => items.filter((_, i) => i !== index));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (form.password !== form.confirmPassword) {
      setErrorMessage(t.mismatch);
      return;
    }

    const allBroadcastLanguages = [
      ...broadcastLanguages.filter((item) => item !== "Other"),
      ...form.otherLanguages.split(",").map((item) => item.trim()).filter(Boolean),
    ];
    const allSelectedAvenuesHaveOutlet = mediaAvenues.length > 0 && mediaAvenues.every((type) => distributionOutlets.some((outlet) => outlet.type === type && outlet.outletName.trim()));
    const baseComplete = form.firstName && form.lastName && form.email && form.password.length >= 8 && form.phone && form.country && form.city && roles.length && allBroadcastLanguages.length && audienceReach.length && contentCategories.length && collaborationTypes.length && form.bio.trim().length >= 100;

    if (!baseComplete || !allSelectedAvenuesHaveOutlet || !accurate || !contributorAcknowledged || !termsAccepted) {
      setErrorMessage(t.incomplete);
      return;
    }

    setIsLoading(true);
    try {
      let profilePhotoUrl = null;
      if (profilePhotoFile) {
        try {
          profilePhotoUrl = await uploadProfessionalProfilePhoto(profilePhotoFile, "contributor");
        } catch (uploadError) {
          console.warn("Contributor photo upload failed; continuing without photo:", uploadError);
        }
      }

      const platformLinksText = distributionOutlets
        .filter((outlet) => outlet.url.trim())
        .map((outlet, index) => `${t.mediaLabels[outlet.type] || "Outlet"} ${index + 1}: ${outlet.url.trim()}`)
        .join("\n");

      const application = {
        professionalKind: "contributor",
        professionalDisplayName: form.displayName,
        phone: form.phone,
        country: form.country,
        region: form.region,
        city: form.city,
        timeZone: form.timeZone,
        languages: allBroadcastLanguages,
        broadcastLanguages: allBroadcastLanguages,
        contributorRoles: roles,
        mediaAvenues,
        distributionOutlets,
        audienceReach,
        serviceLocations,
        contentCategories,
        collaborationTypes,
        websiteUrl: form.websiteUrl,
        platformLinksText,
        followerCount: form.followerCount,
        mediaKitUrl: form.mediaKitUrl,
        sampleLinksText: form.sampleLinksText,
        profilePhotoUrl,
        bio: form.bio.trim(),
        applicationStatus: "pending",
        attestedAccurate: true,
        categoryAcknowledged: true,
      };

      const result = await submitProfessionalApplication("contributor", {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
      }, application);

      if (!result.success) {
        setErrorMessage(result.error || t.incomplete);
        return;
      }

      setRequiresEmailVerification(Boolean(result.requiresEmailVerification));
      setSuccess(true);
    } catch (error) {
      setErrorMessage(error?.message || t.incomplete);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-fuchsia-50 via-purple-50 to-blue-50 px-4 py-14 flex items-center justify-center">
        <Card className="max-w-2xl w-full shadow-2xl border-2 border-emerald-100">
          <CardContent className="p-10 text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto mb-5" />
            <h1 className="text-4xl font-black text-gray-900 mb-3">{t.successTitle}</h1>
            <p className="text-lg text-gray-600 mb-4">{t.successBody}</p>
            {requiresEmailVerification && <p className="text-sm text-purple-700 bg-purple-50 rounded-xl p-4 mb-6">{t.emailVerify}</p>}
            <Button onClick={() => navigate(createPageUrl("Home"))} className="bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white">{t.home}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-50 via-purple-50 to-blue-50 px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <Link to={createPageUrl("ProfessionalSignup")} className="inline-flex items-center text-gray-600 hover:text-purple-700 mb-7"><ArrowLeft className="w-5 h-5 mr-2" />{t.back}</Link>
        <div className="text-center mb-9">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg"><Mic2 className="w-8 h-8" /></div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-3">{t.title}</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">{t.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Section title={t.basic} icon={UserRound}>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label={t.firstName} required><input className="field" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} required /></Field>
              <Field label={t.lastName} required><input className="field" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} required /></Field>
              <Field label={t.displayName}><input className="field" value={form.displayName} onChange={(e) => update("displayName", e.target.value)} /></Field>
              <Field label={t.phone} required><input className="field" type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} required /></Field>
              <Field label={t.email} required><input className="field" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required /></Field>
              <Field label={t.password} required><input className="field" type="password" minLength={8} value={form.password} onChange={(e) => update("password", e.target.value)} required /></Field>
              <Field label={t.confirmPassword} required><input className="field" type="password" minLength={8} value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} required /></Field>
              <Field label={t.photo}><input type="file" accept="image/*" onChange={(e) => setProfilePhotoFile(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-600" /><p className="hint">{t.photoHint}</p></Field>
            </div>
          </Section>

          <Section title={t.location} icon={MapPin}>
            <p className="text-sm text-gray-600 mb-5">{t.locationHint}</p>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label={t.country} required><CountrySelect value={form.country} onChange={(value) => { update("country", value); update("region", ""); }} t={t} required /></Field>
              <Field label={t.region}><JurisdictionSelect country={form.country} value={form.region} onChange={(value) => update("region", value)} t={t} /></Field>
              <Field label={t.city} required><input className="field" value={form.city} onChange={(e) => update("city", e.target.value)} required /></Field>
              <Field label={t.timezone}><input className="field" value={form.timeZone} onChange={(e) => update("timeZone", e.target.value)} placeholder="e.g., Europe/Berlin" /></Field>
            </div>
          </Section>

          <Section title={t.languages} icon={Globe2}>
            <LanguageDropdown summary={selectedLanguageSummary} languages={broadcastLanguages} setLanguages={setBroadcastLanguages} t={t} />
            <p className="hint mt-2">{t.languagesHint}</p>
            {broadcastLanguages.includes("Other") && <div className="mt-4"><Field label={t.otherLanguage} required><input className="field" value={form.otherLanguages} onChange={(e) => update("otherLanguages", e.target.value)} required /><p className="hint">{t.otherLanguageHint}</p></Field></div>}
          </Section>

          <Section title={t.creatorType} icon={Mic2}>
            <ChoiceGrid options={t.creatorTypes} values={roles} onToggle={(value) => toggle(value, roles, setRoles)} />
          </Section>

          <Section title={t.distribution} icon={Radio}>
            <p className="text-sm text-gray-600 mb-5">{t.distributionHint}</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              {MEDIA_TYPES.map((type) => <label key={type} className={`rounded-xl border p-3 flex items-start gap-2 cursor-pointer ${mediaAvenues.includes(type) ? "border-fuchsia-400 bg-fuchsia-50" : "border-gray-200 bg-white"}`}><input type="checkbox" checked={mediaAvenues.includes(type)} onChange={() => toggleMediaAvenue(type)} className="mt-1 h-4 w-4" /><span className="text-sm font-medium text-gray-800">{t.mediaLabels[type]}</span></label>)}
            </div>
            <div className="space-y-6">
              {mediaAvenues.map((type) => (
                <div key={type} className="rounded-2xl border border-purple-100 bg-white p-5">
                  <div className="flex items-center justify-between gap-3 mb-4"><h3 className="text-lg font-black text-gray-900">{t.mediaLabels[type]}</h3><Button type="button" variant="outline" onClick={() => addOutlet(type)}><Plus className="w-4 h-4 mr-2" />{t.addOutlet}</Button></div>
                  <div className="space-y-4">
                    {distributionOutlets.map((outlet, index) => outlet.type === type ? <OutletEditor key={index} outlet={outlet} index={index} updateOutlet={updateOutlet} removeOutlet={removeOutlet} t={t} /> : null)}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title={t.reach} icon={Globe2}>
            <ChoiceGrid options={t.reachOptions} values={audienceReach} onToggle={(value) => toggle(value, audienceReach, setAudienceReach)} />
          </Section>

          <Section title={t.serviceLocations} icon={MapPin}>
            <p className="text-sm text-gray-600 mb-4">{t.serviceHint}</p>
            <Button type="button" variant="outline" onClick={addServiceLocation}><Plus className="w-4 h-4 mr-2" />{t.addServiceLocation}</Button>
            <div className="space-y-4 mt-4">
              {serviceLocations.map((location, index) => (
                <div key={index} className="rounded-2xl border border-purple-100 bg-purple-50/40 p-4">
                  <div className="flex justify-end mb-3"><button type="button" onClick={() => removeServiceLocation(index)} className="text-sm text-red-600 inline-flex items-center"><Trash2 className="w-4 h-4 mr-1" />{t.remove}</button></div>
                  <ServiceLocationFields value={location} update={(field, value) => updateServiceLocation(index, field, value)} t={t} />
                </div>
              ))}
            </div>
          </Section>

          <Section title={t.topics} icon={Mic2}>
            <ChoiceGrid options={t.topicOptions} values={contentCategories} onToggle={(value) => toggle(value, contentCategories, setContentCategories)} />
          </Section>

          <Section title={t.collaborations} icon={Mic2}>
            <ChoiceGrid options={t.collaborationOptions} values={collaborationTypes} onToggle={(value) => toggle(value, collaborationTypes, setCollaborationTypes)} />
          </Section>

          <Section title={t.profile} icon={Globe2}>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <Field label={t.website}><input className="field" type="url" value={form.websiteUrl} onChange={(e) => update("websiteUrl", e.target.value)} /></Field>
              <Field label={t.followers}><input className="field" type="number" min="0" value={form.followerCount} onChange={(e) => update("followerCount", e.target.value)} /></Field>
              <Field label={t.mediaKit}><input className="field" type="url" value={form.mediaKitUrl} onChange={(e) => update("mediaKitUrl", e.target.value)} /></Field>
              <Field label={t.samples}><textarea className="field min-h-[100px]" value={form.sampleLinksText} onChange={(e) => update("sampleLinksText", e.target.value)} /><p className="hint">{t.samplesHint}</p></Field>
            </div>
            <Field label={t.bio} required><textarea className="field min-h-[150px]" value={form.bio} onChange={(e) => update("bio", e.target.value)} required /><p className="hint">{t.bioHint} ({form.bio.length})</p></Field>
          </Section>

          <Section title={t.agreement} icon={ShieldCheck}>
            <p className="text-sm text-gray-600 mb-4">{t.pending}</p>
            <CheckRow checked={accurate} setChecked={setAccurate} label={t.accurate} />
            <CheckRow checked={contributorAcknowledged} setChecked={setContributorAcknowledged} label={t.contributorAck} />
            <label className="flex items-start gap-3 mt-3 rounded-xl border border-gray-200 p-4"><input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="h-5 w-5 mt-0.5" /><span className="text-gray-700">{t.terms} <Link to={createPageUrl("TermsOfService")} className="text-purple-700 underline">Terms</Link> · <Link to={createPageUrl("PrivacyPolicy")} className="text-purple-700 underline">Privacy</Link></span></label>
          </Section>

          {errorMessage && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 font-medium">{errorMessage}</div>}
          <Button type="submit" disabled={isLoading} className="w-full py-6 text-lg font-bold bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 text-white">{isLoading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />{t.submitting}</> : t.submit}</Button>
        </form>
      </div>
      <style>{`.field{width:100%;border:1px solid #d1d5db;border-radius:.75rem;padding:.7rem .85rem;background:white;outline:none}.field:focus{border-color:#a855f7;box-shadow:0 0 0 2px rgba(168,85,247,.15)}.hint{font-size:.75rem;color:#6b7280;margin-top:.35rem}`}</style>
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return <Card className="shadow-lg border border-purple-100"><CardContent className="p-6 md:p-7"><h2 className="text-2xl font-black text-gray-900 mb-5 flex items-center gap-2"><Icon className="w-6 h-6 text-purple-600" />{title}</h2>{children}</CardContent></Card>;
}

function Field({ label, required, children }) {
  return <label className="block"><span className="block text-sm font-semibold text-gray-700 mb-2">{label}{required ? " *" : ""}</span>{children}</label>;
}

function ChoiceGrid({ options, values, onToggle }) {
  return <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{options.map((option) => <label key={option} className={`rounded-xl border p-3 flex items-start gap-2 cursor-pointer ${values.includes(option) ? "border-fuchsia-400 bg-fuchsia-50" : "border-gray-200 bg-white"}`}><input type="checkbox" checked={values.includes(option)} onChange={() => onToggle(option)} className="mt-1 h-4 w-4" /><span className="text-sm font-medium text-gray-800">{option}</span></label>)}</div>;
}

function CountrySelect({ value, onChange, t, required = false }) {
  return <select className="field" value={value} onChange={(e) => onChange(e.target.value)} required={required}><option value="">{t.selectCountry}</option>{WORLD_COUNTRIES.map((country) => <option key={country} value={country}>{country}</option>)}</select>;
}

function JurisdictionSelect({ country, value, onChange, t }) {
  const options = getJurisdictionOptions(country);
  const known = [NATIONAL_JURISDICTION, ...options];
  const isCustom = value === CUSTOM_JURISDICTION || Boolean(value && !known.includes(value));
  const selectValue = isCustom ? CUSTOM_JURISDICTION : value;
  return <div className="space-y-2"><select className="field" value={selectValue} onChange={(e) => onChange(e.target.value)} disabled={!country}><option value="">{t.selectRegion}</option><option value={NATIONAL_JURISDICTION}>{t.national}</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}<option value={CUSTOM_JURISDICTION}>{t.otherRegion}</option></select>{isCustom && <input className="field" value={value === CUSTOM_JURISDICTION ? "" : value} onChange={(e) => onChange(e.target.value || CUSTOM_JURISDICTION)} placeholder={t.customRegion} />}</div>;
}

function LanguageDropdown({ summary, languages, setLanguages, t }) {
  return <details className="relative rounded-xl border border-gray-300 bg-white"><summary className="list-none cursor-pointer px-4 py-3 font-medium text-gray-800">{summary}</summary><div className="absolute z-30 mt-1 max-h-80 overflow-y-auto w-full rounded-xl border border-gray-200 bg-white p-2 shadow-xl">{BROADCAST_LANGUAGES.map((language) => <label key={language} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-fuchsia-50 cursor-pointer"><input type="checkbox" checked={languages.includes(language)} onChange={() => setLanguages((current) => current.includes(language) ? current.filter((item) => item !== language) : [...current, language])} className="h-4 w-4" /><span className="text-sm font-medium text-gray-800">{language}</span></label>)}</div></details>;
}

function OutletEditor({ outlet, index, updateOutlet, removeOutlet, t }) {
  const isSocial = outlet.type === "social_media";
  return <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
    <div className="flex justify-end mb-3"><button type="button" onClick={() => removeOutlet(index)} className="text-sm text-red-600 inline-flex items-center"><Trash2 className="w-4 h-4 mr-1" />{t.remove}</button></div>
    <div className="grid md:grid-cols-2 gap-4">
      <Field label={isSocial ? t.socialPlatform : t.outletName} required>{isSocial ? <select className="field" value={outlet.outletName} onChange={(e) => updateOutlet(index, "outletName", e.target.value)} required><option value="">—</option>{SOCIAL_PLATFORMS.map((platform) => <option key={platform} value={platform}>{platform}</option>)}</select> : <input className="field" value={outlet.outletName} onChange={(e) => updateOutlet(index, "outletName", e.target.value)} required />}</Field>
      <Field label={t.programName}><input className="field" value={outlet.programName} onChange={(e) => updateOutlet(index, "programName", e.target.value)} /></Field>
      <Field label={t.url}><input className="field" type="url" value={outlet.url} onChange={(e) => updateOutlet(index, "url", e.target.value)} /></Field>
      <Field label={t.audience}><input className="field" value={outlet.audience} onChange={(e) => updateOutlet(index, "audience", e.target.value)} /></Field>
      <Field label={t.market}><input className="field" value={outlet.market} onChange={(e) => updateOutlet(index, "market", e.target.value)} /></Field>
      <Field label={t.outletCountry}><CountrySelect value={outlet.country} onChange={(value) => updateOutlet(index, "country", value)} t={t} /></Field>
    </div>
  </div>;
}

function ServiceLocationFields({ value, update, t }) {
  return <div className="grid md:grid-cols-3 gap-4"><Field label={t.country}><CountrySelect value={value.country} onChange={(country) => { update("country", country); update("region", ""); }} t={t} /></Field><Field label={t.region}><JurisdictionSelect country={value.country} value={value.region} onChange={(region) => update("region", region)} t={t} /></Field><Field label={t.city}><input className="field" value={value.city} onChange={(e) => update("city", e.target.value)} /></Field></div>;
}

function CheckRow({ checked, setChecked, label }) {
  return <label className="flex items-start gap-3 mt-3 rounded-xl border border-gray-200 p-4"><input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="h-5 w-5 mt-0.5" /><span className="text-gray-700">{label}</span></label>;
}
