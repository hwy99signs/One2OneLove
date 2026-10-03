import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  Globe2,
  Loader2,
  MapPin,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
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
  PLATFORM_PROFESSIONAL_LANGUAGES,
  WORLD_COUNTRIES,
  getJurisdictionOptions,
} from "@/lib/professionalGeography";

const COPY = {
  en: {
    back: "Back to Professional Options",
    title: "Licensed Therapist or Counselor",
    subtitle: "Credential-verification application for licensed mental-health professionals.",
    basic: "Account & Identity",
    firstName: "First Name", lastName: "Last Name", displayName: "Professional / Display Name", email: "Email Address", password: "Password", confirmPassword: "Confirm Password", phone: "Phone Number", photo: "Profile Photo", photoOptional: "Optional. Used on your professional profile after approval.",
    location: "Primary Practice Location", address: "Street / Practice Address", country: "Country", region: "State / Province / Region", city: "City", postal: "ZIP / Postal Code", timezone: "Time Zone", additionalLocations: "Additional Practice Locations", addLocation: "Add Another Location", remove: "Remove",
    languages: "Languages — ALL THAT APPLY", languagesHint: "Select only from the languages currently supported by One2One Love for professional discovery.", selectLanguages: "Select languages", selectedLanguages: "selected",
    licenseSection: "Professional License", typeLabel: "Licensed Professional Type", typeOptions: ["Licensed Therapist", "Licensed Professional Counselor", "Marriage & Family Therapist", "Licensed Clinical Social Worker", "Psychologist", "Psychiatrist", "Other Licensed Mental Health Professional"], licenseType: "License Type / Credential", licenseNumber: "License Number", licenseCountry: "Issuing Country", licenseRegion: "Issuing State / Province / Jurisdiction", issueDate: "Original Issue Date", expiryDate: "Expiration / Renewal Date", licenseStatus: "Current License Status", statusOptions: ["Active / Good Standing", "Active — Renewal Pending", "Other"], selectCountry: "Select country", selectRegion: "Select jurisdiction", national: "National / Countrywide", otherRegion: "Other / Enter jurisdiction", customRegion: "Enter exact state, province, region or jurisdiction",
    experienceSection: "Experience", practiceStart: "Professional Practice Start — Month & Year", calculatedExperience: "Calculated Experience", years: "years", months: "months", experienceHint: "Years of experience are calculated automatically from the month and year you began professional practice.",
    specialties: "Specialties — REQUIRED, ALL THAT APPLY", otherSpecialty: "Other Specialty", services: "Services & Session Formats — ALL THAT APPLY",
    profile: "Professional Profile", website: "Website", social: "Professional / Social Links", socialHint: "One per line. Platform: URL or just the URL.", bio: "Professional Bio", bioHint: "Minimum 100 characters.", consultationFee: "Consultation / Session Fee", availability: "Availability / Typical Hours", accepting: "Currently Accepting New Clients", certifications: "Certifications / Specialized Training", education: "Education & Credentials", rates: "Rates, Insurance & Payment Information", cancellation: "Cancellation Policy", approach: "Therapeutic Approach / Philosophy", howHelp: "How I Help Couples / Clients",
    verification: "Verification & Agreement", accurate: "I certify that the information I provided is accurate and current.", verifyConsent: "I authorize One2One Love to verify my professional credentials and understand that approval does not occur until verification is completed.", terms: "I agree to the One2One Love Terms of Service and Privacy Policy.", pending: "This application remains Pending Verification until reviewed and approved.", secureDocs: "Credential documents are required before approval. Secure document upload will occur after account/email verification; sensitive license documents will not be stored in a public profile-photo bucket.",
    submit: "Submit Credential Application", submitting: "Submitting Application...", mismatch: "Passwords do not match.", incomplete: "Please complete all required fields and acknowledgments.", futureStart: "Practice start month cannot be in the future.", successTitle: "Application Received", successBody: "Your licensed-professional application is pending credential review. Nothing is published as verified until review is completed.", emailVerify: "Please also complete any email verification message sent to you.", home: "Return Home",
  },
  es: {
    back: "Volver a Opciones Profesionales", title: "Terapeuta o Consejero con Licencia", subtitle: "Solicitud de verificación de credenciales para profesionales de salud mental con licencia.", basic: "Cuenta e Identidad", firstName: "Nombre", lastName: "Apellido", displayName: "Nombre Profesional / Público", email: "Correo Electrónico", password: "Contraseña", confirmPassword: "Confirmar Contraseña", phone: "Teléfono", photo: "Foto de Perfil", photoOptional: "Opcional. Se usará en su perfil después de la aprobación.", location: "Ubicación Principal de Práctica", address: "Dirección / Consultorio", country: "País", region: "Estado / Provincia / Región", city: "Ciudad", postal: "Código Postal", timezone: "Zona Horaria", additionalLocations: "Ubicaciones Adicionales", addLocation: "Agregar Otra Ubicación", remove: "Eliminar", languages: "Idiomas — TODOS LOS QUE APLIQUEN", languagesHint: "Seleccione solo los idiomas que One2One Love admite actualmente para descubrir profesionales.", selectLanguages: "Seleccionar idiomas", selectedLanguages: "seleccionados", licenseSection: "Licencia Profesional", typeLabel: "Tipo de Profesional con Licencia", typeOptions: ["Terapeuta con Licencia", "Consejero Profesional con Licencia", "Terapeuta Matrimonial y Familiar", "Trabajador Social Clínico con Licencia", "Psicólogo", "Psiquiatra", "Otro Profesional de Salud Mental con Licencia"], licenseType: "Tipo de Licencia / Credencial", licenseNumber: "Número de Licencia", licenseCountry: "País Emisor", licenseRegion: "Estado / Provincia / Jurisdicción Emisora", issueDate: "Fecha de Emisión Original", expiryDate: "Fecha de Vencimiento / Renovación", licenseStatus: "Estado Actual de la Licencia", statusOptions: ["Activa / En Buen Estado", "Activa — Renovación Pendiente", "Otro"], selectCountry: "Seleccionar país", selectRegion: "Seleccionar jurisdicción", national: "Nacional / Todo el País", otherRegion: "Otra / Ingresar jurisdicción", customRegion: "Ingrese el estado, provincia, región o jurisdicción exacta", experienceSection: "Experiencia", practiceStart: "Inicio de Práctica Profesional — Mes y Año", calculatedExperience: "Experiencia Calculada", years: "años", months: "meses", experienceHint: "La experiencia se calcula automáticamente desde el mes y año en que comenzó la práctica profesional.", specialties: "Especialidades — OBLIGATORIAS, TODAS LAS QUE APLIQUEN", otherSpecialty: "Otra Especialidad", services: "Servicios y Formatos — TODOS LOS QUE APLIQUEN", profile: "Perfil Profesional", website: "Sitio Web", social: "Enlaces Profesionales / Sociales", socialHint: "Uno por línea. Plataforma: URL o solo URL.", bio: "Biografía Profesional", bioHint: "Mínimo 100 caracteres.", consultationFee: "Tarifa de Consulta / Sesión", availability: "Disponibilidad / Horarios", accepting: "Acepta Nuevos Clientes", certifications: "Certificaciones / Formación Especializada", education: "Educación y Credenciales", rates: "Tarifas, Seguro y Pagos", cancellation: "Política de Cancelación", approach: "Enfoque / Filosofía Terapéutica", howHelp: "Cómo Ayudo a Parejas / Clientes", verification: "Verificación y Acuerdo", accurate: "Certifico que la información proporcionada es correcta y actual.", verifyConsent: "Autorizo a One2One Love a verificar mis credenciales profesionales y entiendo que la aprobación no ocurre hasta completar la verificación.", terms: "Acepto los Términos de Servicio y la Política de Privacidad de One2One Love.", pending: "Esta solicitud permanece Pendiente de Verificación hasta ser revisada y aprobada.", secureDocs: "Los documentos de credenciales son obligatorios antes de la aprobación. La carga segura ocurrirá después de verificar la cuenta/correo; los documentos sensibles no se almacenarán en un depósito público de fotos.", submit: "Enviar Solicitud de Credenciales", submitting: "Enviando Solicitud...", mismatch: "Las contraseñas no coinciden.", incomplete: "Complete todos los campos y confirmaciones obligatorios.", futureStart: "El mes de inicio de práctica no puede ser futuro.", successTitle: "Solicitud Recibida", successBody: "Su solicitud profesional está pendiente de revisión de credenciales. Nada se publica como verificado hasta completar la revisión.", emailVerify: "Complete también cualquier verificación enviada a su correo.", home: "Volver al Inicio",
  },
  fr: {
    back: "Retour aux Options Professionnelles", title: "Thérapeute ou Conseiller Agréé", subtitle: "Candidature avec vérification des qualifications pour les professionnels agréés de santé mentale.", basic: "Compte et Identité", firstName: "Prénom", lastName: "Nom", displayName: "Nom Professionnel / Public", email: "Adresse E-mail", password: "Mot de Passe", confirmPassword: "Confirmer le Mot de Passe", phone: "Téléphone", photo: "Photo de Profil", photoOptional: "Facultatif. Utilisée sur votre profil après approbation.", location: "Lieu Principal d’Exercice", address: "Adresse / Cabinet", country: "Pays", region: "État / Province / Région", city: "Ville", postal: "Code Postal", timezone: "Fuseau Horaire", additionalLocations: "Lieux d’Exercice Supplémentaires", addLocation: "Ajouter un Emplacement", remove: "Supprimer", languages: "Langues — TOUTES CELLES QUI S’APPLIQUENT", languagesHint: "Sélectionnez uniquement les langues actuellement prises en charge par One2One Love pour la recherche de professionnels.", selectLanguages: "Sélectionner les langues", selectedLanguages: "sélectionnées", licenseSection: "Licence Professionnelle", typeLabel: "Type de Professionnel Agréé", typeOptions: ["Thérapeute Agréé", "Conseiller Professionnel Agréé", "Thérapeute Conjugal et Familial", "Travailleur Social Clinique Agréé", "Psychologue", "Psychiatre", "Autre Professionnel de Santé Mentale Agréé"], licenseType: "Type de Licence / Qualification", licenseNumber: "Numéro de Licence", licenseCountry: "Pays Émetteur", licenseRegion: "État / Province / Juridiction Émettrice", issueDate: "Date d’Émission Initiale", expiryDate: "Date d’Expiration / Renouvellement", licenseStatus: "Statut Actuel de la Licence", statusOptions: ["Active / En Règle", "Active — Renouvellement en Cours", "Autre"], selectCountry: "Sélectionner un pays", selectRegion: "Sélectionner une juridiction", national: "National / Tout le Pays", otherRegion: "Autre / Saisir la juridiction", customRegion: "Saisissez l’état, la province, la région ou la juridiction exacte", experienceSection: "Expérience", practiceStart: "Début de Pratique Professionnelle — Mois et Année", calculatedExperience: "Expérience Calculée", years: "ans", months: "mois", experienceHint: "L’expérience est calculée automatiquement à partir du mois et de l’année du début de pratique.", specialties: "SPÉCIALITÉS — OBLIGATOIRES, TOUTES CELLES QUI S’APPLIQUENT", otherSpecialty: "Autre Spécialité", services: "Services et Formats — TOUS CEUX QUI S’APPLIQUENT", profile: "Profil Professionnel", website: "Site Web", social: "Liens Professionnels / Sociaux", socialHint: "Un par ligne. Plateforme : URL ou URL seule.", bio: "Biographie Professionnelle", bioHint: "Minimum 100 caractères.", consultationFee: "Tarif Consultation / Séance", availability: "Disponibilités / Horaires", accepting: "Accepte de Nouveaux Clients", certifications: "Certifications / Formations Spécialisées", education: "Formation et Diplômes", rates: "Tarifs, Assurance et Paiement", cancellation: "Politique d’Annulation", approach: "Approche / Philosophie Thérapeutique", howHelp: "Comment J’Aide les Couples / Clients", verification: "Vérification et Accord", accurate: "Je certifie que les informations fournies sont exactes et à jour.", verifyConsent: "J’autorise One2One Love à vérifier mes qualifications professionnelles et comprends que l’approbation n’intervient qu’après vérification.", terms: "J’accepte les Conditions d’utilisation et la Politique de confidentialité de One2One Love.", pending: "Cette candidature reste En Attente de Vérification jusqu’à son approbation.", secureDocs: "Les justificatifs sont requis avant approbation. Le dépôt sécurisé aura lieu après vérification du compte/e-mail; les documents sensibles ne seront pas stockés dans un espace public de photos.", submit: "Envoyer la Candidature", submitting: "Envoi en Cours...", mismatch: "Les mots de passe ne correspondent pas.", incomplete: "Veuillez remplir tous les champs et confirmations obligatoires.", futureStart: "Le mois de début de pratique ne peut pas être dans le futur.", successTitle: "Candidature Reçue", successBody: "Votre candidature professionnelle est en attente de vérification. Rien n’est publié comme vérifié avant la fin de l’examen.", emailVerify: "Veuillez également effectuer toute vérification reçue par e-mail.", home: "Retour à l’Accueil",
  },
  it: {
    back: "Torna alle Opzioni Professionali", title: "Terapeuta o Consulente Abilitato", subtitle: "Candidatura con verifica delle credenziali per professionisti della salute mentale abilitati.", basic: "Account e Identità", firstName: "Nome", lastName: "Cognome", displayName: "Nome Professionale / Pubblico", email: "Email", password: "Password", confirmPassword: "Conferma Password", phone: "Telefono", photo: "Foto Profilo", photoOptional: "Opzionale. Utilizzata sul profilo dopo l’approvazione.", location: "Sede Principale di Pratica", address: "Indirizzo / Studio", country: "Paese", region: "Stato / Provincia / Regione", city: "Città", postal: "CAP / Codice Postale", timezone: "Fuso Orario", additionalLocations: "Sedi Aggiuntive", addLocation: "Aggiungi Altra Sede", remove: "Rimuovi", languages: "Lingue — TUTTE QUELLE APPLICABILI", languagesHint: "Seleziona solo le lingue attualmente supportate da One2One Love per la ricerca dei professionisti.", selectLanguages: "Seleziona lingue", selectedLanguages: "selezionate", licenseSection: "Licenza Professionale", typeLabel: "Tipo di Professionista Abilitato", typeOptions: ["Terapeuta Abilitato", "Consulente Professionale Abilitato", "Terapeuta Matrimoniale e Familiare", "Assistente Sociale Clinico Abilitato", "Psicologo", "Psichiatra", "Altro Professionista della Salute Mentale Abilitato"], licenseType: "Tipo di Licenza / Credenziale", licenseNumber: "Numero di Licenza", licenseCountry: "Paese Emittente", licenseRegion: "Stato / Provincia / Giurisdizione Emittente", issueDate: "Data di Prima Emissione", expiryDate: "Data di Scadenza / Rinnovo", licenseStatus: "Stato Attuale della Licenza", statusOptions: ["Attiva / In Regola", "Attiva — Rinnovo in Corso", "Altro"], selectCountry: "Seleziona paese", selectRegion: "Seleziona giurisdizione", national: "Nazionale / Intero Paese", otherRegion: "Altro / Inserisci giurisdizione", customRegion: "Inserisci stato, provincia, regione o giurisdizione esatta", experienceSection: "Esperienza", practiceStart: "Inizio Pratica Professionale — Mese e Anno", calculatedExperience: "Esperienza Calcolata", years: "anni", months: "mesi", experienceHint: "L’esperienza viene calcolata automaticamente dal mese e anno di inizio della pratica professionale.", specialties: "SPECIALITÀ — OBBLIGATORIE, TUTTE QUELLE APPLICABILI", otherSpecialty: "Altra Specialità", services: "Servizi e Formati — TUTTI QUELLI APPLICABILI", profile: "Profilo Professionale", website: "Sito Web", social: "Link Professionali / Social", socialHint: "Uno per riga. Piattaforma: URL oppure solo URL.", bio: "Biografia Professionale", bioHint: "Minimo 100 caratteri.", consultationFee: "Tariffa Consultazione / Sessione", availability: "Disponibilità / Orari", accepting: "Accetta Nuovi Clienti", certifications: "Certificazioni / Formazione Specialistica", education: "Istruzione e Credenziali", rates: "Tariffe, Assicurazione e Pagamenti", cancellation: "Politica di Cancellazione", approach: "Approccio / Filosofia Terapeutica", howHelp: "Come Aiuto Coppie / Clienti", verification: "Verifica e Accordo", accurate: "Certifico che le informazioni fornite sono accurate e aggiornate.", verifyConsent: "Autorizzo One2One Love a verificare le mie credenziali professionali e comprendo che l’approvazione avviene solo dopo la verifica.", terms: "Accetto i Termini di Servizio e la Privacy Policy di One2One Love.", pending: "Questa candidatura resta In Attesa di Verifica fino all’approvazione.", secureDocs: "I documenti delle credenziali sono obbligatori prima dell’approvazione. Il caricamento sicuro avverrà dopo la verifica dell’account/email; i documenti sensibili non saranno inseriti in archivi pubblici di foto.", submit: "Invia Candidatura", submitting: "Invio in Corso...", mismatch: "Le password non corrispondono.", incomplete: "Completa tutti i campi e le conferme obbligatorie.", futureStart: "Il mese di inizio pratica non può essere nel futuro.", successTitle: "Candidatura Ricevuta", successBody: "La candidatura professionale è in attesa di verifica. Nulla viene pubblicato come verificato prima della revisione.", emailVerify: "Completa anche l’eventuale verifica ricevuta via email.", home: "Torna alla Home",
  },
  de: {
    back: "Zurück zu Professionellen Optionen", title: "Lizenzierter Therapeut oder Berater", subtitle: "Bewerbung mit Qualifikationsprüfung für lizenzierte Fachkräfte der psychischen Gesundheit.", basic: "Konto & Identität", firstName: "Vorname", lastName: "Nachname", displayName: "Professioneller / Öffentlicher Name", email: "E-Mail-Adresse", password: "Passwort", confirmPassword: "Passwort Bestätigen", phone: "Telefonnummer", photo: "Profilfoto", photoOptional: "Optional. Wird nach Genehmigung im Profil verwendet.", location: "Hauptpraxisstandort", address: "Adresse / Praxis", country: "Land", region: "Bundesland / Provinz / Region", city: "Stadt", postal: "PLZ", timezone: "Zeitzone", additionalLocations: "Weitere Praxisstandorte", addLocation: "Weiteren Standort Hinzufügen", remove: "Entfernen", languages: "Sprachen — ALLE ZUTREFFENDEN", languagesHint: "Wählen Sie nur Sprachen aus, die One2One Love derzeit für die Suche nach Fachkräften unterstützt.", selectLanguages: "Sprachen auswählen", selectedLanguages: "ausgewählt", licenseSection: "Berufslizenz", typeLabel: "Art der Lizenzierten Fachkraft", typeOptions: ["Lizenzierter Therapeut", "Lizenzierter Professioneller Berater", "Ehe- und Familientherapeut", "Lizenzierter Klinischer Sozialarbeiter", "Psychologe", "Psychiater", "Andere Lizenzierte Fachkraft für Psychische Gesundheit"], licenseType: "Lizenztyp / Qualifikation", licenseNumber: "Lizenznummer", licenseCountry: "Ausstellungsland", licenseRegion: "Ausstellendes Bundesland / Provinz / Gebiet", issueDate: "Erstausstellungsdatum", expiryDate: "Ablauf- / Verlängerungsdatum", licenseStatus: "Aktueller Lizenzstatus", statusOptions: ["Aktiv / Ordnungsgemäß", "Aktiv — Verlängerung Läuft", "Andere"], selectCountry: "Land auswählen", selectRegion: "Jurisdiktion auswählen", national: "National / Landesweit", otherRegion: "Andere / Jurisdiktion eingeben", customRegion: "Genaues Bundesland, Provinz, Region oder Jurisdiktion eingeben", experienceSection: "Erfahrung", practiceStart: "Beginn der Berufspraxis — Monat & Jahr", calculatedExperience: "Berechnete Erfahrung", years: "Jahre", months: "Monate", experienceHint: "Die Erfahrung wird automatisch aus dem Monat und Jahr des Beginns Ihrer Berufspraxis berechnet.", specialties: "SCHWERPUNKTE — ERFORDERLICH, ALLE ZUTREFFENDEN", otherSpecialty: "Anderer Schwerpunkt", services: "Dienstleistungen & Formate — ALLE ZUTREFFENDEN", profile: "Professionelles Profil", website: "Website", social: "Professionelle / Social Links", socialHint: "Einer pro Zeile. Plattform: URL oder nur URL.", bio: "Professionelle Biografie", bioHint: "Mindestens 100 Zeichen.", consultationFee: "Beratungs- / Sitzungsgebühr", availability: "Verfügbarkeit / Übliche Zeiten", accepting: "Nimmt Neue Klienten An", certifications: "Zertifikate / Spezialausbildung", education: "Ausbildung & Qualifikationen", rates: "Gebühren, Versicherung & Zahlung", cancellation: "Stornierungsbedingungen", approach: "Therapeutischer Ansatz / Philosophie", howHelp: "Wie Ich Paaren / Klienten Helfe", verification: "Verifizierung & Vereinbarung", accurate: "Ich bestätige, dass meine Angaben korrekt und aktuell sind.", verifyConsent: "Ich ermächtige One2One Love zur Prüfung meiner beruflichen Qualifikationen und verstehe, dass die Genehmigung erst nach Abschluss der Prüfung erfolgt.", terms: "Ich akzeptiere die Nutzungsbedingungen und Datenschutzrichtlinie von One2One Love.", pending: "Diese Bewerbung bleibt bis zur Prüfung und Genehmigung Zur Verifizierung Ausstehend.", secureDocs: "Nachweise sind vor Genehmigung erforderlich. Der sichere Upload erfolgt nach Konto-/E-Mail-Verifizierung; sensible Lizenzdokumente werden nicht in öffentlichen Foto-Speichern abgelegt.", submit: "Bewerbung Absenden", submitting: "Bewerbung Wird Gesendet...", mismatch: "Die Passwörter stimmen nicht überein.", incomplete: "Bitte füllen Sie alle Pflichtfelder und Bestätigungen aus.", futureStart: "Der Beginn der Berufspraxis darf nicht in der Zukunft liegen.", successTitle: "Bewerbung Eingegangen", successBody: "Ihre Bewerbung wird auf Qualifikationen geprüft. Nichts wird vor Abschluss der Prüfung als verifiziert veröffentlicht.", emailVerify: "Bitte führen Sie auch jede per E-Mail zugesandte Verifizierung durch.", home: "Zur Startseite",
  },
};

const SPECIALTIES = {
  en: ["Couples / Marriage Counseling", "Premarital Counseling", "Communication Issues", "Conflict Resolution", "Infidelity / Affair Recovery", "Intimacy / Sexual Health", "Divorce / Separation", "LGBTQ+ Relationships", "Trauma / PTSD", "Grief / Loss", "Anxiety / Depression", "Blended Families / Parenting", "Trust / Rebuilding", "Cultural / Interracial Relationships", "Faith-Based Relationships"],
  es: ["Consejería de Parejas / Matrimonio", "Consejería Prematrimonial", "Problemas de Comunicación", "Resolución de Conflictos", "Infidelidad / Recuperación", "Intimidad / Salud Sexual", "Divorcio / Separación", "Relaciones LGBTQ+", "Trauma / TEPT", "Duelo / Pérdida", "Ansiedad / Depresión", "Familias Mixtas / Crianza", "Confianza / Reconstrucción", "Relaciones Culturales / Interraciales", "Relaciones Basadas en la Fe"],
  fr: ["Couples / Mariage", "Conseil Prénuptial", "Communication", "Résolution de Conflits", "Infidélité / Reconstruction", "Intimité / Santé Sexuelle", "Divorce / Séparation", "Relations LGBTQ+", "Traumatisme / TSPT", "Deuil / Perte", "Anxiété / Dépression", "Familles Recomposées / Parentalité", "Confiance / Reconstruction", "Relations Culturelles / Interraciales", "Relations Basées sur la Foi"],
  it: ["Coppie / Matrimonio", "Consulenza Prematrimoniale", "Comunicazione", "Risoluzione dei Conflitti", "Infedeltà / Recupero", "Intimità / Salute Sessuale", "Divorzio / Separazione", "Relazioni LGBTQ+", "Trauma / PTSD", "Lutto / Perdita", "Ansia / Depressione", "Famiglie Ricomposte / Genitorialità", "Fiducia / Ricostruzione", "Relazioni Culturali / Interrazziali", "Relazioni Basate sulla Fede"],
  de: ["Paar- / Eheberatung", "Ehevorbereitung", "Kommunikationsprobleme", "Konfliktlösung", "Untreue / Wiederaufbau", "Intimität / Sexuelle Gesundheit", "Scheidung / Trennung", "LGBTQ+ Beziehungen", "Trauma / PTBS", "Trauer / Verlust", "Angst / Depression", "Patchworkfamilien / Elternschaft", "Vertrauen / Wiederaufbau", "Kulturelle / Interrassische Beziehungen", "Glaubensbasierte Beziehungen"],
};

const SERVICE_FORMATS = {
  en: ["Individual", "Couples", "Family", "Group / Workshop", "In-Person", "Video / Telehealth", "Telephone"],
  es: ["Individual", "Parejas", "Familia", "Grupo / Taller", "Presencial", "Video / Telesalud", "Teléfono"],
  fr: ["Individuel", "Couples", "Famille", "Groupe / Atelier", "En Personne", "Vidéo / Téléconsultation", "Téléphone"],
  it: ["Individuale", "Coppie", "Famiglia", "Gruppo / Workshop", "In Presenza", "Video / Telehealth", "Telefono"],
  de: ["Einzel", "Paare", "Familie", "Gruppe / Workshop", "Vor Ort", "Video / Telemedizin", "Telefon"],
};

const emptyLocation = () => ({ address: "", city: "", region: "", postalCode: "", country: "" });

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function calculateExperience(startMonth) {
  if (!startMonth || !/^\d{4}-\d{2}$/.test(startMonth)) return null;
  const [year, month] = startMonth.split("-").map(Number);
  const now = new Date();
  const totalMonths = (now.getFullYear() - year) * 12 + (now.getMonth() - (month - 1));
  if (totalMonths < 0) return null;
  return { years: Math.floor(totalMonths / 12), months: totalMonths % 12, totalMonths };
}

export default function LicensedProfessionalApplication() {
  const { currentLanguage } = useLanguage();
  const language = COPY[currentLanguage] ? currentLanguage : "en";
  const t = COPY[language];
  const navigate = useNavigate();
  const specialtiesForLanguage = SPECIALTIES[language] || SPECIALTIES.en;
  const serviceFormatsForLanguage = SERVICE_FORMATS[language] || SERVICE_FORMATS.en;

  const [form, setForm] = useState({
    firstName: "", lastName: "", professionalDisplayName: "", email: "", password: "", confirmPassword: "", phone: "",
    address: "", country: "", region: "", city: "", postalCode: "", timeZone: "",
    licenseType: "", licenseNumber: "", licenseCountry: "", licenseRegion: "", licenseIssueDate: "", licenseExpiryDate: "", licenseStatus: "", professionalTitle: "",
    practiceStartMonth: "", websiteUrl: "", platformLinksText: "", bio: "", consultationFee: "", availability: "", acceptingNewClients: true,
    certificationsText: "", education: "", ratesInsurance: "", cancellationPolicy: "", otherSpecialty: "", approach: "", howHelp: "",
  });
  const [languages, setLanguages] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [serviceFormats, setServiceFormats] = useState([]);
  const [additionalLocations, setAdditionalLocations] = useState([]);
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [accurate, setAccurate] = useState(false);
  const [verificationAccepted, setVerificationAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [requiresEmailVerification, setRequiresEmailVerification] = useState(false);

  const experience = useMemo(() => calculateExperience(form.practiceStartMonth), [form.practiceStartMonth]);
  const update = (field, value) => setForm((previous) => ({ ...previous, [field]: value }));
  const toggle = (value, values, setter) => setter(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  const addLocation = () => setAdditionalLocations((items) => [...items, emptyLocation()]);
  const updateLocation = (index, field, value) => setAdditionalLocations((items) => items.map((item, i) => i === index ? { ...item, [field]: value } : item));
  const removeLocation = (index) => setAdditionalLocations((items) => items.filter((_, i) => i !== index));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (form.password !== form.confirmPassword) {
      setErrorMessage(t.mismatch);
      return;
    }
    if (form.practiceStartMonth && !experience) {
      setErrorMessage(t.futureStart);
      return;
    }

    const baseComplete = form.firstName && form.lastName && form.email && form.password.length >= 8 && form.phone && form.country && form.region && form.city && languages.length && form.bio.trim().length >= 100;
    const licenseComplete = form.professionalTitle && form.licenseType && form.licenseNumber && form.licenseCountry && form.licenseRegion && form.licenseStatus && form.practiceStartMonth && experience && specialties.length && serviceFormats.length;
    const hasCustomSentinel = [form.region, form.licenseRegion, ...additionalLocations.map((item) => item.region)].includes(CUSTOM_JURISDICTION);

    if (!baseComplete || !licenseComplete || hasCustomSentinel || !accurate || !verificationAccepted || !termsAccepted) {
      setErrorMessage(t.incomplete);
      return;
    }

    setIsLoading(true);
    try {
      let profilePhotoUrl = null;
      if (profilePhotoFile) {
        try {
          profilePhotoUrl = await uploadProfessionalProfilePhoto(profilePhotoFile, "licensed");
        } catch (uploadError) {
          console.warn("Licensed professional photo upload failed; continuing without photo:", uploadError);
        }
      }

      const certifications = form.certificationsText.split(",").map((item) => item.trim()).filter(Boolean);
      const allSpecialties = [...specialties, ...(form.otherSpecialty.trim() ? [form.otherSpecialty.trim()] : [])];

      const application = {
        professionalKind: "licensed",
        professionalDisplayName: form.professionalDisplayName,
        phone: form.phone,
        address: form.address,
        country: form.country,
        region: form.region,
        city: form.city,
        postalCode: form.postalCode,
        timeZone: form.timeZone,
        languages,
        additionalLocations,
        websiteUrl: form.websiteUrl,
        platformLinksText: form.platformLinksText,
        profilePhotoUrl,
        bio: form.bio.trim(),
        practiceStartDate: `${form.practiceStartMonth}-01`,
        yearsExperience: String(experience.years),
        experienceMonthsTotal: experience.totalMonths,
        consultationFee: form.consultationFee,
        availability: form.availability,
        acceptingNewClients: form.acceptingNewClients,
        certifications,
        education: form.education,
        ratesInsurance: form.ratesInsurance,
        cancellationPolicy: form.cancellationPolicy,
        specialties: allSpecialties,
        serviceFormats,
        professionalTitle: form.professionalTitle,
        approach: form.approach,
        howHelp: form.howHelp,
        licenseType: form.licenseType,
        licenseNumber: form.licenseNumber,
        licenseCountry: form.licenseCountry,
        licenseRegion: form.licenseRegion,
        licenseIssueDate: form.licenseIssueDate,
        licenseExpiryDate: form.licenseExpiryDate,
        licenseStatus: form.licenseStatus,
        credentialDocumentRequired: true,
        applicationStatus: "pending",
        attestedAccurate: true,
        categoryAcknowledged: true,
      };

      const result = await submitProfessionalApplication("licensed", {
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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 px-4 py-14 flex items-center justify-center">
        <Card className="max-w-2xl w-full shadow-2xl border-2 border-emerald-100">
          <CardContent className="p-10 text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto mb-5" />
            <h1 className="text-4xl font-black text-gray-900 mb-3">{t.successTitle}</h1>
            <p className="text-lg text-gray-600 mb-4">{t.successBody}</p>
            {requiresEmailVerification && <p className="text-sm text-teal-800 bg-teal-50 rounded-xl p-4 mb-6">{t.emailVerify}</p>}
            <Button onClick={() => navigate(createPageUrl("Home"))} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">{t.home}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <Link to={createPageUrl("ProfessionalSignup")} className="inline-flex items-center text-gray-600 hover:text-teal-700 mb-7">
          <ArrowLeft className="w-5 h-5 mr-2" />{t.back}
        </Link>

        <div className="text-center mb-9">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg"><BadgeCheck className="w-8 h-8" /></div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-3">{t.title}</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">{t.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Section title={t.basic} icon={UserRound}>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label={t.firstName} required><input className="field" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} required /></Field>
              <Field label={t.lastName} required><input className="field" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} required /></Field>
              <Field label={t.displayName}><input className="field" value={form.professionalDisplayName} onChange={(e) => update("professionalDisplayName", e.target.value)} /></Field>
              <Field label={t.phone} required><input className="field" type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} required /></Field>
              <Field label={t.email} required><input className="field" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required /></Field>
              <Field label={t.password} required><input className="field" type="password" minLength={8} value={form.password} onChange={(e) => update("password", e.target.value)} required /></Field>
              <Field label={t.confirmPassword} required><input className="field" type="password" minLength={8} value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} required /></Field>
              <Field label={t.photo}><input type="file" accept="image/*" onChange={(e) => setProfilePhotoFile(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-600" /><p className="hint">{t.photoOptional}</p></Field>
            </div>
          </Section>

          <Section title={t.location} icon={MapPin}>
            <LocationFields value={form} update={update} t={t} required />
            <div className="grid md:grid-cols-2 gap-4 mt-5">
              <Field label={t.timezone}><input className="field" value={form.timeZone} onChange={(e) => update("timeZone", e.target.value)} placeholder="e.g., Europe/Berlin" /></Field>
              <Field label={t.languages} required>
                <LanguageDropdown languages={languages} setLanguages={setLanguages} t={t} />
                <p className="hint">{t.languagesHint}</p>
              </Field>
            </div>
            <div className="mt-5 flex items-center justify-between gap-3">
              <h3 className="font-bold text-gray-900">{t.additionalLocations}</h3>
              <Button type="button" variant="outline" onClick={addLocation}><Plus className="w-4 h-4 mr-2" />{t.addLocation}</Button>
            </div>
            <div className="space-y-4 mt-4">
              {additionalLocations.map((location, index) => (
                <div key={index} className="rounded-2xl border border-teal-100 bg-teal-50/50 p-4">
                  <div className="flex justify-end mb-3"><button type="button" onClick={() => removeLocation(index)} className="text-sm text-red-600 inline-flex items-center"><Trash2 className="w-4 h-4 mr-1" />{t.remove}</button></div>
                  <LocationFields value={location} update={(field, value) => updateLocation(index, field, value)} t={t} />
                </div>
              ))}
            </div>
          </Section>

          <Section title={t.licenseSection} icon={ShieldCheck}>
            <div className="grid md:grid-cols-2 gap-4">
              <SelectField label={t.typeLabel} value={form.professionalTitle} onChange={(value) => update("professionalTitle", value)} options={t.typeOptions} required />
              <Field label={t.licenseType} required><input className="field" value={form.licenseType} onChange={(e) => update("licenseType", e.target.value)} required /></Field>
              <Field label={t.licenseNumber} required><input className="field" value={form.licenseNumber} onChange={(e) => update("licenseNumber", e.target.value)} required /></Field>
              <Field label={t.licenseCountry} required><CountrySelect value={form.licenseCountry} onChange={(value) => { update("licenseCountry", value); update("licenseRegion", ""); }} t={t} required /></Field>
              <Field label={t.licenseRegion} required><JurisdictionSelect country={form.licenseCountry} value={form.licenseRegion} onChange={(value) => update("licenseRegion", value)} t={t} required /></Field>
              <SelectField label={t.licenseStatus} value={form.licenseStatus} onChange={(value) => update("licenseStatus", value)} options={t.statusOptions} required />
              <Field label={t.issueDate}><input className="field" type="date" value={form.licenseIssueDate} onChange={(e) => update("licenseIssueDate", e.target.value)} /></Field>
              <Field label={t.expiryDate}><input className="field" type="date" value={form.licenseExpiryDate} onChange={(e) => update("licenseExpiryDate", e.target.value)} /></Field>
            </div>
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 flex gap-3"><Upload className="w-5 h-5 flex-none mt-0.5" /><span>{t.secureDocs}</span></div>
          </Section>

          <Section title={t.experienceSection} icon={CalendarClock}>
            <div className="grid md:grid-cols-2 gap-4 items-end">
              <Field label={t.practiceStart} required><input className="field" type="month" max={currentMonthValue()} value={form.practiceStartMonth} onChange={(e) => update("practiceStartMonth", e.target.value)} required /></Field>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="text-sm font-semibold text-emerald-900">{t.calculatedExperience}</div>
                <div className="text-2xl font-black text-emerald-700 mt-1">{experience ? `${experience.years} ${t.years}, ${experience.months} ${t.months}` : "—"}</div>
              </div>
            </div>
            <p className="hint mt-3">{t.experienceHint}</p>
          </Section>

          <Section title={t.specialties} icon={BriefcaseBusiness}>
            <ChoiceGrid options={specialtiesForLanguage} values={specialties} onToggle={(value) => toggle(value, specialties, setSpecialties)} />
            <div className="mt-4"><Field label={t.otherSpecialty}><input className="field" value={form.otherSpecialty} onChange={(e) => update("otherSpecialty", e.target.value)} /></Field></div>
            <div className="mt-6"><h3 className="font-bold text-gray-900 mb-3">{t.services}</h3><ChoiceGrid options={serviceFormatsForLanguage} values={serviceFormats} onToggle={(value) => toggle(value, serviceFormats, setServiceFormats)} /></div>
          </Section>

          <Section title={t.profile} icon={Globe2}>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <Field label={t.website}><input className="field" type="url" value={form.websiteUrl} onChange={(e) => update("websiteUrl", e.target.value)} /></Field>
              <Field label={t.social}><textarea className="field min-h-[88px]" value={form.platformLinksText} onChange={(e) => update("platformLinksText", e.target.value)} /><p className="hint">{t.socialHint}</p></Field>
            </div>
            <Field label={t.bio} required><textarea className="field min-h-[150px]" value={form.bio} onChange={(e) => update("bio", e.target.value)} required /><p className="hint">{t.bioHint} ({form.bio.length})</p></Field>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <Field label={t.consultationFee}><input className="field" value={form.consultationFee} onChange={(e) => update("consultationFee", e.target.value)} /></Field>
              <Field label={t.certifications}><textarea className="field min-h-[90px]" value={form.certificationsText} onChange={(e) => update("certificationsText", e.target.value)} /></Field>
              <Field label={t.education}><textarea className="field min-h-[90px]" value={form.education} onChange={(e) => update("education", e.target.value)} /></Field>
              <Field label={t.approach}><textarea className="field min-h-[110px]" value={form.approach} onChange={(e) => update("approach", e.target.value)} /></Field>
              <Field label={t.howHelp}><textarea className="field min-h-[110px]" value={form.howHelp} onChange={(e) => update("howHelp", e.target.value)} /></Field>
              <Field label={t.availability}><textarea className="field min-h-[90px]" value={form.availability} onChange={(e) => update("availability", e.target.value)} /></Field>
              <Field label={t.rates}><textarea className="field min-h-[90px]" value={form.ratesInsurance} onChange={(e) => update("ratesInsurance", e.target.value)} /></Field>
              <Field label={t.cancellation}><textarea className="field min-h-[90px]" value={form.cancellationPolicy} onChange={(e) => update("cancellationPolicy", e.target.value)} /></Field>
              <label className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 mt-6 md:mt-0"><input type="checkbox" checked={form.acceptingNewClients} onChange={(e) => update("acceptingNewClients", e.target.checked)} className="h-5 w-5" /><span className="font-medium text-gray-800">{t.accepting}</span></label>
            </div>
          </Section>

          <Section title={t.verification} icon={ShieldCheck}>
            <p className="text-sm text-gray-600 mb-4">{t.pending}</p>
            <CheckRow checked={accurate} setChecked={setAccurate} label={t.accurate} />
            <CheckRow checked={verificationAccepted} setChecked={setVerificationAccepted} label={t.verifyConsent} />
            <label className="flex items-start gap-3 mt-3 rounded-xl border border-gray-200 p-4"><input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="h-5 w-5 mt-0.5" /><span className="text-gray-700">{t.terms} <Link to={createPageUrl("TermsOfService")} className="text-teal-700 underline">Terms</Link> · <Link to={createPageUrl("PrivacyPolicy")} className="text-teal-700 underline">Privacy</Link></span></label>
          </Section>

          {errorMessage && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 font-medium">{errorMessage}</div>}

          <Button type="submit" disabled={isLoading} className="w-full py-6 text-lg font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">
            {isLoading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />{t.submitting}</> : t.submit}
          </Button>
        </form>
      </div>
      <style>{`.field{width:100%;border:1px solid #d1d5db;border-radius:.75rem;padding:.7rem .85rem;background:white;outline:none}.field:focus{border-color:#0d9488;box-shadow:0 0 0 2px rgba(13,148,136,.15)}.hint{font-size:.75rem;color:#6b7280;margin-top:.35rem}`}</style>
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return <Card className="shadow-lg border border-teal-100"><CardContent className="p-6 md:p-7"><h2 className="text-2xl font-black text-gray-900 mb-5 flex items-center gap-2"><Icon className="w-6 h-6 text-teal-600" />{title}</h2>{children}</CardContent></Card>;
}

function Field({ label, required, children }) {
  return <label className="block"><span className="block text-sm font-semibold text-gray-700 mb-2">{label}{required ? " *" : ""}</span>{children}</label>;
}

function SelectField({ label, value, onChange, options, required }) {
  return <Field label={label} required={required}><select className="field" value={value} onChange={(e) => onChange(e.target.value)} required={required}><option value="">—</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></Field>;
}

function CountrySelect({ value, onChange, t, required = false }) {
  return <select className="field" value={value} onChange={(e) => onChange(e.target.value)} required={required}><option value="">{t.selectCountry}</option>{WORLD_COUNTRIES.map((country) => <option key={country} value={country}>{country}</option>)}</select>;
}

function JurisdictionSelect({ country, value, onChange, t, required = false }) {
  const options = getJurisdictionOptions(country);
  const known = [NATIONAL_JURISDICTION, ...options];
  const isCustom = value === CUSTOM_JURISDICTION || Boolean(value && !known.includes(value));
  const selectValue = isCustom ? CUSTOM_JURISDICTION : value;

  return <div className="space-y-2">
    <select className="field" value={selectValue} onChange={(e) => onChange(e.target.value)} required={required} disabled={!country}>
      <option value="">{t.selectRegion}</option>
      <option value={NATIONAL_JURISDICTION}>{t.national}</option>
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
      <option value={CUSTOM_JURISDICTION}>{t.otherRegion}</option>
    </select>
    {isCustom && <input className="field" value={value === CUSTOM_JURISDICTION ? "" : value} onChange={(e) => onChange(e.target.value || CUSTOM_JURISDICTION)} placeholder={t.customRegion} required={required} />}
  </div>;
}

function LocationFields({ value, update, t, required = false }) {
  return <div className="grid md:grid-cols-2 gap-4">
    <Field label={t.address}><input className="field" value={value.address || ""} onChange={(e) => update("address", e.target.value)} /></Field>
    <Field label={t.city} required={required}><input className="field" value={value.city || ""} onChange={(e) => update("city", e.target.value)} required={required} /></Field>
    <Field label={t.country} required={required}><CountrySelect value={value.country || ""} onChange={(country) => { update("country", country); update("region", ""); }} t={t} required={required} /></Field>
    <Field label={t.region} required={required}><JurisdictionSelect country={value.country || ""} value={value.region || ""} onChange={(region) => update("region", region)} t={t} required={required} /></Field>
    <Field label={t.postal}><input className="field" value={value.postalCode || ""} onChange={(e) => update("postalCode", e.target.value)} /></Field>
  </div>;
}

function LanguageDropdown({ languages, setLanguages, t }) {
  const summary = languages.length ? `${languages.join(", ")} (${languages.length} ${t.selectedLanguages})` : t.selectLanguages;
  return <details className="relative rounded-xl border border-gray-300 bg-white">
    <summary className="list-none cursor-pointer px-4 py-3 font-medium text-gray-800">{summary}</summary>
    <div className="absolute z-30 mt-1 w-full rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
      {PLATFORM_PROFESSIONAL_LANGUAGES.map((language) => (
        <label key={language} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-teal-50 cursor-pointer">
          <input type="checkbox" checked={languages.includes(language)} onChange={() => setLanguages((current) => current.includes(language) ? current.filter((item) => item !== language) : [...current, language])} className="h-4 w-4" />
          <span className="text-sm font-medium text-gray-800">{language}</span>
        </label>
      ))}
    </div>
  </details>;
}

function ChoiceGrid({ options, values, onToggle }) {
  return <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{options.map((option) => <label key={option} className={`rounded-xl border p-3 flex items-start gap-2 cursor-pointer ${values.includes(option) ? "border-teal-400 bg-teal-50" : "border-gray-200 bg-white"}`}><input type="checkbox" checked={values.includes(option)} onChange={() => onToggle(option)} className="mt-1 h-4 w-4" /><span className="text-sm font-medium text-gray-800">{option}</span></label>)}</div>;
}

function CheckRow({ checked, setChecked, label }) {
  return <label className="flex items-start gap-3 mt-3 rounded-xl border border-gray-200 p-4"><input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="h-5 w-5 mt-0.5" /><span className="text-gray-700">{label}</span></label>;
}
