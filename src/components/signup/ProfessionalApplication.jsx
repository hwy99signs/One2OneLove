import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Globe2,
  Loader2,
  MapPin,
  Mic2,
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

const COPY = {
  en: {
    back: "Back to Professional Options",
    common: {
      basic: "Account & Identity",
      firstName: "First Name",
      lastName: "Last Name",
      displayName: "Professional / Display Name",
      email: "Email Address",
      password: "Password",
      confirmPassword: "Confirm Password",
      phone: "Phone Number",
      photo: "Profile Photo",
      photoOptional: "Optional. Used on your professional profile after approval.",
      location: "Primary Location",
      address: "Street / Practice Address",
      country: "Country",
      region: "State / Province / Region",
      city: "City",
      postal: "ZIP / Postal Code",
      timezone: "Time Zone",
      languages: "Languages — ALL THAT APPLY",
      languagesHint: "Enter every language in which you can provide your services, separated by commas.",
      additionalLocations: "Additional Practice Locations",
      addLocation: "Add Another Location",
      remove: "Remove",
      website: "Website",
      platformLinks: "Professional / Social Links",
      platformLinksHint: "One per line. You may enter Platform: URL or just the URL.",
      bio: "Professional Bio",
      bioHint: "Minimum 100 characters.",
      years: "Years of Experience",
      consultationFee: "Consultation / Session Fee",
      specialties: "Specialties — REQUIRED, ALL THAT APPLY",
      otherSpecialty: "Other Specialty",
      services: "Services & Session Formats — ALL THAT APPLY",
      availability: "Availability / Typical Hours",
      accepting: "Currently Accepting New Clients",
      certifications: "Certifications / Specialized Training",
      education: "Education & Credentials",
      rates: "Rates, Insurance & Payment Information",
      cancellation: "Cancellation Policy",
      attestation: "Verification & Agreement",
      accurate: "I certify that the information I provided is accurate and current.",
      terms: "I agree to the One2One Love Terms of Service and Privacy Policy.",
      pending: "All professional applications remain Pending Verification until reviewed and approved.",
      secureDocs: "Credential documents are required before approval. Secure document upload will occur after account/email verification; sensitive license documents will not be placed in a public profile-photo bucket.",
      submit: "Submit Application",
      submitting: "Submitting Application...",
      mismatch: "Passwords do not match.",
      incomplete: "Please complete all required fields and acknowledgments.",
      successTitle: "Application Received",
      successBody: "Your application is now pending review. Nothing is published as verified until the review is completed.",
      emailVerify: "Please also complete any email verification message sent to you.",
      home: "Return Home",
    },
    licensed: {
      title: "Licensed Therapist or Counselor",
      subtitle: "Credential-verification application for licensed mental-health professionals.",
      typeLabel: "Licensed Professional Type",
      typeOptions: ["Licensed Therapist", "Licensed Professional Counselor", "Marriage & Family Therapist", "Licensed Clinical Social Worker", "Psychologist", "Psychiatrist", "Other Licensed Mental Health Professional"],
      licenseSection: "Professional License",
      licenseType: "License Type / Credential",
      licenseNumber: "License Number",
      licenseCountry: "Issuing Country",
      licenseRegion: "Issuing State / Province / Jurisdiction",
      issueDate: "Original Issue Date",
      expiryDate: "Expiration / Renewal Date",
      licenseStatus: "Current License Status",
      statusOptions: ["Active / Good Standing", "Active — Renewal Pending", "Other"],
      approach: "Therapeutic Approach / Philosophy",
      howHelp: "How I Help Couples / Clients",
      verification: "I authorize One2One Love to verify my professional credentials and understand that approval does not occur until verification is completed.",
    },
    coach: {
      title: "Relationship Coach or Educator",
      subtitle: "Application for non-clinical relationship coaches, educators and mentors.",
      typeLabel: "Professional Type",
      typeOptions: ["Relationship Coach", "Dating Coach", "Marriage Educator", "Communication Coach", "Life Coach — Relationship Focus", "Intimacy / Relationship Educator", "Faith-Based Relationship Mentor", "Divorce / Separation Coach", "Other Relationship Educator"],
      businessName: "Practice / Business Name",
      approach: "Coaching / Educational Approach",
      nonClinical: "I understand that this category is non-clinical and does not identify me as a licensed therapist, counselor, psychologist, psychiatrist, or other licensed mental-health provider.",
    },
    contributor: {
      title: "Creator, Podcaster, Writer or Influencer",
      subtitle: "Contributor and media application for relationship-focused creators and voices.",
      roles: "Contributor Type — ALL THAT APPLY",
      roleOptions: ["Creator", "Podcaster", "Writer / Blogger", "Influencer", "Author", "Speaker", "YouTuber / Video Creator", "Relationship Commentator", "Other Media Contributor"],
      categories: "Content Topics — ALL THAT APPLY",
      categoryOptions: ["Marriage", "Dating", "Communication", "Family", "Intimacy", "LGBTQ+ Relationships", "Faith & Relationships", "Divorce / Separation", "Personal Growth", "Relationship Culture", "Humor / Commentary", "Other"],
      collaborations: "Collaboration Interests — ALL THAT APPLY",
      collaborationOptions: ["Podcast / Interview Guest", "Articles / Written Contributions", "Video Contributions", "Live Discussions", "Events / Panels", "Campaign Collaborations", "Educational Content", "Other"],
      followers: "Approximate Combined Audience / Followers",
      mediaKit: "Media Kit URL",
      samples: "Sample Work Links",
      samplesHint: "One link per line.",
      platformRequired: "At least one platform or work link is required.",
      contributorAck: "I understand that contributor approval does not present me as a licensed mental-health professional unless I separately complete and pass the licensed-professional verification process.",
    },
    organization: {
      title: "Organization or Professional Partner",
      subtitle: "Application for organizations, businesses, nonprofits and professional partners.",
      organizationName: "Legal / Organization Name",
      organizationType: "Organization Type",
      organizationOptions: ["Nonprofit", "Relationship / Family Organization", "Educational Organization", "Professional Practice / Group", "Media / Publishing Company", "Community Organization", "Faith-Based Organization", "Business / Service Provider", "Other"],
      mission: "Organization Mission / Purpose",
      serviceDescription: "Services / Programs Offered",
      operatingAreas: "Countries / Regions Served",
      partnership: "Partnership Interests — ALL THAT APPLY",
      partnershipOptions: ["Directory Listing", "Educational Content", "Events / Panels", "Community Resources", "Media Collaboration", "Referral / Resource Partnership", "Other"],
      authorized: "I certify that I am authorized to submit this application on behalf of the organization and understand that submission does not create a partnership, endorsement, agency, or employment relationship with One2One Love or ERANT Property Services LLC.",
    },
  },
  es: {
    back: "Volver a Opciones Profesionales",
    common: {
      basic: "Cuenta e Identidad", firstName: "Nombre", lastName: "Apellido", displayName: "Nombre Profesional / Público", email: "Correo Electrónico", password: "Contraseña", confirmPassword: "Confirmar Contraseña", phone: "Teléfono", photo: "Foto de Perfil", photoOptional: "Opcional. Se usará en su perfil profesional después de la aprobación.", location: "Ubicación Principal", address: "Dirección / Consultorio", country: "País", region: "Estado / Provincia / Región", city: "Ciudad", postal: "Código Postal", timezone: "Zona Horaria", languages: "Idiomas — TODOS LOS QUE APLIQUEN", languagesHint: "Ingrese todos los idiomas en los que puede prestar servicios, separados por comas.", additionalLocations: "Ubicaciones Adicionales", addLocation: "Agregar Otra Ubicación", remove: "Eliminar", website: "Sitio Web", platformLinks: "Enlaces Profesionales / Sociales", platformLinksHint: "Uno por línea. Puede usar Plataforma: URL o solo la URL.", bio: "Biografía Profesional", bioHint: "Mínimo 100 caracteres.", years: "Años de Experiencia", consultationFee: "Tarifa de Consulta / Sesión", specialties: "Especialidades — OBLIGATORIAS, TODAS LAS QUE APLIQUEN", otherSpecialty: "Otra Especialidad", services: "Servicios y Formatos — TODOS LOS QUE APLIQUEN", availability: "Disponibilidad / Horarios", accepting: "Acepta Nuevos Clientes", certifications: "Certificaciones / Formación Especializada", education: "Educación y Credenciales", rates: "Tarifas, Seguro y Pagos", cancellation: "Política de Cancelación", attestation: "Verificación y Acuerdo", accurate: "Certifico que la información proporcionada es correcta y actual.", terms: "Acepto los Términos de Servicio y la Política de Privacidad de One2One Love.", pending: "Todas las solicitudes profesionales permanecen Pendientes de Verificación hasta ser revisadas y aprobadas.", secureDocs: "Los documentos de credenciales son obligatorios antes de la aprobación. La carga segura ocurrirá después de verificar la cuenta/correo; los documentos sensibles no se almacenarán en un depósito público de fotos.", submit: "Enviar Solicitud", submitting: "Enviando Solicitud...", mismatch: "Las contraseñas no coinciden.", incomplete: "Complete todos los campos y confirmaciones obligatorios.", successTitle: "Solicitud Recibida", successBody: "Su solicitud está pendiente de revisión. Nada se publica como verificado hasta completar la revisión.", emailVerify: "Complete también cualquier verificación enviada a su correo.", home: "Volver al Inicio",
    },
    licensed: { title: "Terapeuta o Consejero con Licencia", subtitle: "Solicitud de verificación de credenciales para profesionales de salud mental con licencia.", typeLabel: "Tipo de Profesional con Licencia", typeOptions: ["Terapeuta con Licencia", "Consejero Profesional con Licencia", "Terapeuta Matrimonial y Familiar", "Trabajador Social Clínico con Licencia", "Psicólogo", "Psiquiatra", "Otro Profesional de Salud Mental con Licencia"], licenseSection: "Licencia Profesional", licenseType: "Tipo de Licencia / Credencial", licenseNumber: "Número de Licencia", licenseCountry: "País Emisor", licenseRegion: "Estado / Provincia / Jurisdicción Emisora", issueDate: "Fecha de Emisión Original", expiryDate: "Fecha de Vencimiento / Renovación", licenseStatus: "Estado Actual de la Licencia", statusOptions: ["Activa / En Buen Estado", "Activa — Renovación Pendiente", "Otro"], approach: "Enfoque / Filosofía Terapéutica", howHelp: "Cómo Ayudo a Parejas / Clientes", verification: "Autorizo a One2One Love a verificar mis credenciales profesionales y entiendo que la aprobación no ocurre hasta completar la verificación." },
    coach: { title: "Coach o Educador de Relaciones", subtitle: "Solicitud para coaches, educadores y mentores de relaciones no clínicos.", typeLabel: "Tipo de Profesional", typeOptions: ["Coach de Relaciones", "Coach de Citas", "Educador Matrimonial", "Coach de Comunicación", "Coach de Vida — Enfoque en Relaciones", "Educador de Intimidad / Relaciones", "Mentor de Relaciones Basado en la Fe", "Coach de Divorcio / Separación", "Otro Educador de Relaciones"], businessName: "Nombre de Práctica / Negocio", approach: "Enfoque de Coaching / Educación", nonClinical: "Entiendo que esta categoría es no clínica y no me identifica como terapeuta, consejero, psicólogo, psiquiatra u otro proveedor de salud mental con licencia." },
    contributor: { title: "Creador, Podcaster, Escritor o Influencer", subtitle: "Solicitud de colaborador y medios para creadores enfocados en relaciones.", roles: "Tipo de Colaborador — TODOS LOS QUE APLIQUEN", roleOptions: ["Creador", "Podcaster", "Escritor / Blogger", "Influencer", "Autor", "Conferencista", "YouTuber / Creador de Video", "Comentarista de Relaciones", "Otro Colaborador de Medios"], categories: "Temas de Contenido — TODOS LOS QUE APLIQUEN", categoryOptions: ["Matrimonio", "Citas", "Comunicación", "Familia", "Intimidad", "Relaciones LGBTQ+", "Fe y Relaciones", "Divorcio / Separación", "Crecimiento Personal", "Cultura de Relaciones", "Humor / Comentario", "Otro"], collaborations: "Intereses de Colaboración — TODOS LOS QUE APLIQUEN", collaborationOptions: ["Invitado de Podcast / Entrevista", "Artículos / Contribuciones Escritas", "Contribuciones de Video", "Conversaciones en Vivo", "Eventos / Paneles", "Colaboraciones de Campaña", "Contenido Educativo", "Otro"], followers: "Audiencia / Seguidores Combinados Aproximados", mediaKit: "URL del Media Kit", samples: "Enlaces de Trabajo", samplesHint: "Un enlace por línea.", platformRequired: "Se requiere al menos un enlace de plataforma o trabajo.", contributorAck: "Entiendo que la aprobación como colaborador no me presenta como profesional de salud mental con licencia a menos que complete por separado el proceso de verificación profesional." },
    organization: { title: "Organización o Socio Profesional", subtitle: "Solicitud para organizaciones, empresas, entidades sin fines de lucro y socios profesionales.", organizationName: "Nombre Legal / de la Organización", organizationType: "Tipo de Organización", organizationOptions: ["Sin Fines de Lucro", "Organización de Relaciones / Familia", "Organización Educativa", "Práctica / Grupo Profesional", "Empresa de Medios / Editorial", "Organización Comunitaria", "Organización Basada en la Fe", "Empresa / Proveedor de Servicios", "Otro"], mission: "Misión / Propósito", serviceDescription: "Servicios / Programas Ofrecidos", operatingAreas: "Países / Regiones Servidos", partnership: "Intereses de Asociación — TODOS LOS QUE APLIQUEN", partnershipOptions: ["Listado en Directorio", "Contenido Educativo", "Eventos / Paneles", "Recursos Comunitarios", "Colaboración de Medios", "Asociación de Recursos / Referencias", "Otro"], authorized: "Certifico que estoy autorizado para presentar esta solicitud y entiendo que el envío no crea una sociedad, respaldo, agencia o relación laboral con One2One Love o ERANT Property Services LLC." },
  },
  fr: {
    back: "Retour aux Options Professionnelles",
    common: { basic: "Compte et Identité", firstName: "Prénom", lastName: "Nom", displayName: "Nom Professionnel / Public", email: "Adresse E-mail", password: "Mot de Passe", confirmPassword: "Confirmer le Mot de Passe", phone: "Téléphone", photo: "Photo de Profil", photoOptional: "Facultatif. Utilisée sur votre profil après approbation.", location: "Emplacement Principal", address: "Adresse / Cabinet", country: "Pays", region: "État / Province / Région", city: "Ville", postal: "Code Postal", timezone: "Fuseau Horaire", languages: "Langues — TOUTES CELLES QUI S’APPLIQUENT", languagesHint: "Indiquez toutes les langues dans lesquelles vous pouvez fournir vos services, séparées par des virgules.", additionalLocations: "Emplacements Supplémentaires", addLocation: "Ajouter un Emplacement", remove: "Supprimer", website: "Site Web", platformLinks: "Liens Professionnels / Sociaux", platformLinksHint: "Un par ligne. Plateforme : URL ou URL seule.", bio: "Biographie Professionnelle", bioHint: "Minimum 100 caractères.", years: "Années d’Expérience", consultationFee: "Tarif Consultation / Séance", specialties: "SPÉCIALITÉS — OBLIGATOIRES, TOUTES CELLES QUI S’APPLIQUENT", otherSpecialty: "Autre Spécialité", services: "Services et Formats — TOUS CEUX QUI S’APPLIQUENT", availability: "Disponibilités / Horaires", accepting: "Accepte de Nouveaux Clients", certifications: "Certifications / Formations Spécialisées", education: "Formation et Diplômes", rates: "Tarifs, Assurance et Paiement", cancellation: "Politique d’Annulation", attestation: "Vérification et Accord", accurate: "Je certifie que les informations fournies sont exactes et à jour.", terms: "J’accepte les Conditions d’utilisation et la Politique de confidentialité de One2One Love.", pending: "Toutes les candidatures professionnelles restent En Attente de Vérification jusqu’à leur approbation.", secureDocs: "Les justificatifs sont requis avant approbation. Le dépôt sécurisé aura lieu après vérification du compte/e-mail; les documents sensibles ne seront pas stockés dans un espace public de photos.", submit: "Envoyer la Candidature", submitting: "Envoi en Cours...", mismatch: "Les mots de passe ne correspondent pas.", incomplete: "Veuillez remplir tous les champs et confirmations obligatoires.", successTitle: "Candidature Reçue", successBody: "Votre candidature est en attente d’examen. Rien n’est publié comme vérifié avant la fin de l’examen.", emailVerify: "Veuillez également effectuer toute vérification reçue par e-mail.", home: "Retour à l’Accueil" },
    licensed: { title: "Thérapeute ou Conseiller Agréé", subtitle: "Candidature avec vérification des qualifications pour les professionnels de santé mentale agréés.", typeLabel: "Type de Professionnel Agréé", typeOptions: ["Thérapeute Agréé", "Conseiller Professionnel Agréé", "Thérapeute Conjugal et Familial", "Travailleur Social Clinique Agréé", "Psychologue", "Psychiatre", "Autre Professionnel de Santé Mentale Agréé"], licenseSection: "Licence Professionnelle", licenseType: "Type de Licence / Qualification", licenseNumber: "Numéro de Licence", licenseCountry: "Pays Émetteur", licenseRegion: "État / Province / Juridiction", issueDate: "Date d’Émission Initiale", expiryDate: "Date d’Expiration / Renouvellement", licenseStatus: "Statut Actuel de la Licence", statusOptions: ["Active / En Règle", "Active — Renouvellement en Cours", "Autre"], approach: "Approche / Philosophie Thérapeutique", howHelp: "Comment J’Aide les Couples / Clients", verification: "J’autorise One2One Love à vérifier mes qualifications professionnelles et comprends que l’approbation n’intervient qu’après vérification." },
    coach: { title: "Coach ou Éducateur Relationnel", subtitle: "Candidature pour coaches, éducateurs et mentors relationnels non cliniques.", typeLabel: "Type de Professionnel", typeOptions: ["Coach Relationnel", "Coach de Rencontres", "Éducateur Conjugal", "Coach en Communication", "Coach de Vie — Relations", "Éducateur Intimité / Relations", "Mentor Relationnel Confessionnel", "Coach Divorce / Séparation", "Autre Éducateur Relationnel"], businessName: "Nom du Cabinet / Entreprise", approach: "Approche de Coaching / Éducation", nonClinical: "Je comprends que cette catégorie est non clinique et ne m’identifie pas comme thérapeute, conseiller, psychologue, psychiatre ou autre professionnel de santé mentale agréé." },
    contributor: { title: "Créateur, Podcasteur, Auteur ou Influenceur", subtitle: "Candidature média et contributeur pour les créateurs axés sur les relations.", roles: "Type de Contributeur — TOUS CEUX QUI S’APPLIQUENT", roleOptions: ["Créateur", "Podcasteur", "Auteur / Blogueur", "Influenceur", "Auteur de Livre", "Conférencier", "YouTubeur / Créateur Vidéo", "Commentateur Relationnel", "Autre Contributeur Média"], categories: "Thèmes — TOUS CEUX QUI S’APPLIQUENT", categoryOptions: ["Mariage", "Rencontres", "Communication", "Famille", "Intimité", "Relations LGBTQ+", "Foi et Relations", "Divorce / Séparation", "Développement Personnel", "Culture Relationnelle", "Humour / Commentaire", "Autre"], collaborations: "Intérêts de Collaboration — TOUS CEUX QUI S’APPLIQUENT", collaborationOptions: ["Invité Podcast / Interview", "Articles / Contributions Écrites", "Contributions Vidéo", "Discussions en Direct", "Événements / Panels", "Campagnes", "Contenu Éducatif", "Autre"], followers: "Audience / Abonnés Combinés Approximatifs", mediaKit: "URL du Kit Média", samples: "Liens d’Exemples", samplesHint: "Un lien par ligne.", platformRequired: "Au moins un lien de plateforme ou de travail est requis.", contributorAck: "Je comprends que l’approbation comme contributeur ne me présente pas comme professionnel de santé mentale agréé sauf vérification séparée." },
    organization: { title: "Organisation ou Partenaire Professionnel", subtitle: "Candidature pour organisations, entreprises, associations et partenaires professionnels.", organizationName: "Nom Légal / Organisation", organizationType: "Type d’Organisation", organizationOptions: ["Association / Sans But Lucratif", "Organisation Relation / Famille", "Organisation Éducative", "Cabinet / Groupe Professionnel", "Média / Édition", "Organisation Communautaire", "Organisation Confessionnelle", "Entreprise / Prestataire", "Autre"], mission: "Mission / Objectif", serviceDescription: "Services / Programmes", operatingAreas: "Pays / Régions Desservis", partnership: "Intérêts de Partenariat — TOUS CEUX QUI S’APPLIQUENT", partnershipOptions: ["Répertoire", "Contenu Éducatif", "Événements / Panels", "Ressources Communautaires", "Collaboration Média", "Partenariat Ressources / Orientation", "Autre"], authorized: "Je certifie être autorisé à soumettre cette candidature et comprends que cela ne crée aucun partenariat, soutien, mandat ou emploi avec One2One Love ou ERANT Property Services LLC." },
  },
  it: {
    back: "Torna alle Opzioni Professionali",
    common: { basic: "Account e Identità", firstName: "Nome", lastName: "Cognome", displayName: "Nome Professionale / Pubblico", email: "Email", password: "Password", confirmPassword: "Conferma Password", phone: "Telefono", photo: "Foto Profilo", photoOptional: "Opzionale. Utilizzata sul profilo dopo l’approvazione.", location: "Sede Principale", address: "Indirizzo / Studio", country: "Paese", region: "Stato / Provincia / Regione", city: "Città", postal: "CAP / Codice Postale", timezone: "Fuso Orario", languages: "Lingue — TUTTE QUELLE APPLICABILI", languagesHint: "Inserisci tutte le lingue in cui puoi offrire servizi, separate da virgole.", additionalLocations: "Sedi Aggiuntive", addLocation: "Aggiungi Altra Sede", remove: "Rimuovi", website: "Sito Web", platformLinks: "Link Professionali / Social", platformLinksHint: "Uno per riga. Piattaforma: URL oppure solo URL.", bio: "Biografia Professionale", bioHint: "Minimo 100 caratteri.", years: "Anni di Esperienza", consultationFee: "Tariffa Consultazione / Sessione", specialties: "SPECIALITÀ — OBBLIGATORIE, TUTTE QUELLE APPLICABILI", otherSpecialty: "Altra Specialità", services: "Servizi e Formati — TUTTI QUELLI APPLICABILI", availability: "Disponibilità / Orari", accepting: "Accetta Nuovi Clienti", certifications: "Certificazioni / Formazione Specialistica", education: "Istruzione e Credenziali", rates: "Tariffe, Assicurazione e Pagamenti", cancellation: "Politica di Cancellazione", attestation: "Verifica e Accordo", accurate: "Certifico che le informazioni fornite sono accurate e aggiornate.", terms: "Accetto i Termini di Servizio e la Privacy Policy di One2One Love.", pending: "Tutte le candidature professionali restano In Attesa di Verifica fino all’approvazione.", secureDocs: "I documenti delle credenziali sono obbligatori prima dell’approvazione. Il caricamento sicuro avverrà dopo la verifica dell’account/email; i documenti sensibili non saranno inseriti in archivi pubblici di foto.", submit: "Invia Candidatura", submitting: "Invio in Corso...", mismatch: "Le password non corrispondono.", incomplete: "Completa tutti i campi e le conferme obbligatorie.", successTitle: "Candidatura Ricevuta", successBody: "La candidatura è in attesa di revisione. Nulla viene pubblicato come verificato prima del completamento della revisione.", emailVerify: "Completa anche l’eventuale verifica ricevuta via email.", home: "Torna alla Home" },
    licensed: { title: "Terapeuta o Consulente Abilitato", subtitle: "Candidatura con verifica delle credenziali per professionisti della salute mentale abilitati.", typeLabel: "Tipo di Professionista Abilitato", typeOptions: ["Terapeuta Abilitato", "Consulente Professionale Abilitato", "Terapeuta Matrimoniale e Familiare", "Assistente Sociale Clinico Abilitato", "Psicologo", "Psichiatra", "Altro Professionista della Salute Mentale Abilitato"], licenseSection: "Licenza Professionale", licenseType: "Tipo di Licenza / Credenziale", licenseNumber: "Numero di Licenza", licenseCountry: "Paese Emittente", licenseRegion: "Stato / Provincia / Giurisdizione", issueDate: "Data di Prima Emissione", expiryDate: "Data di Scadenza / Rinnovo", licenseStatus: "Stato Attuale della Licenza", statusOptions: ["Attiva / In Regola", "Attiva — Rinnovo in Corso", "Altro"], approach: "Approccio / Filosofia Terapeutica", howHelp: "Come Aiuto Coppie / Clienti", verification: "Autorizzo One2One Love a verificare le mie credenziali professionali e comprendo che l’approvazione avviene solo dopo la verifica." },
    coach: { title: "Coach o Educatore Relazionale", subtitle: "Candidatura per coach, educatori e mentori relazionali non clinici.", typeLabel: "Tipo di Professionista", typeOptions: ["Coach Relazionale", "Dating Coach", "Educatore Matrimoniale", "Coach di Comunicazione", "Life Coach — Relazioni", "Educatore Intimità / Relazioni", "Mentore Relazionale Basato sulla Fede", "Coach Divorzio / Separazione", "Altro Educatore Relazionale"], businessName: "Nome Studio / Attività", approach: "Approccio di Coaching / Educazione", nonClinical: "Comprendo che questa categoria è non clinica e non mi identifica come terapeuta, consulente, psicologo, psichiatra o altro professionista della salute mentale abilitato." },
    contributor: { title: "Creator, Podcaster, Scrittore o Influencer", subtitle: "Candidatura media/contributor per creatori focalizzati sulle relazioni.", roles: "Tipo di Contributor — TUTTI QUELLI APPLICABILI", roleOptions: ["Creator", "Podcaster", "Scrittore / Blogger", "Influencer", "Autore", "Speaker", "YouTuber / Video Creator", "Commentatore Relazionale", "Altro Contributor Media"], categories: "Temi — TUTTI QUELLI APPLICABILI", categoryOptions: ["Matrimonio", "Dating", "Comunicazione", "Famiglia", "Intimità", "Relazioni LGBTQ+", "Fede e Relazioni", "Divorzio / Separazione", "Crescita Personale", "Cultura Relazionale", "Umorismo / Commento", "Altro"], collaborations: "Interessi di Collaborazione — TUTTI QUELLI APPLICABILI", collaborationOptions: ["Ospite Podcast / Intervista", "Articoli / Contributi Scritti", "Contributi Video", "Discussioni Live", "Eventi / Panel", "Collaborazioni Campagna", "Contenuto Educativo", "Altro"], followers: "Pubblico / Follower Combinati Approssimativi", mediaKit: "URL Media Kit", samples: "Link a Lavori", samplesHint: "Un link per riga.", platformRequired: "È richiesto almeno un link a piattaforma o lavoro.", contributorAck: "Comprendo che l’approvazione come contributor non mi presenta come professionista della salute mentale abilitato senza verifica separata." },
    organization: { title: "Organizzazione o Partner Professionale", subtitle: "Candidatura per organizzazioni, aziende, nonprofit e partner professionali.", organizationName: "Nome Legale / Organizzazione", organizationType: "Tipo di Organizzazione", organizationOptions: ["Nonprofit", "Organizzazione Relazioni / Famiglia", "Organizzazione Educativa", "Studio / Gruppo Professionale", "Media / Editoria", "Organizzazione Comunitaria", "Organizzazione Religiosa", "Azienda / Fornitore di Servizi", "Altro"], mission: "Missione / Scopo", serviceDescription: "Servizi / Programmi Offerti", operatingAreas: "Paesi / Regioni Serviti", partnership: "Interessi di Partnership — TUTTI QUELLI APPLICABILI", partnershipOptions: ["Elenco Directory", "Contenuto Educativo", "Eventi / Panel", "Risorse Comunitarie", "Collaborazione Media", "Partnership Risorse / Referral", "Altro"], authorized: "Certifico di essere autorizzato a presentare la candidatura e comprendo che l’invio non crea partnership, approvazione, agenzia o rapporto di lavoro con One2One Love o ERANT Property Services LLC." },
  },
  de: {
    back: "Zurück zu Professionellen Optionen",
    common: { basic: "Konto & Identität", firstName: "Vorname", lastName: "Nachname", displayName: "Professioneller / Öffentlicher Name", email: "E-Mail-Adresse", password: "Passwort", confirmPassword: "Passwort Bestätigen", phone: "Telefonnummer", photo: "Profilfoto", photoOptional: "Optional. Wird nach Genehmigung im Profil verwendet.", location: "Hauptstandort", address: "Adresse / Praxis", country: "Land", region: "Bundesland / Provinz / Region", city: "Stadt", postal: "PLZ", timezone: "Zeitzone", languages: "Sprachen — ALLE ZUTREFFENDEN", languagesHint: "Geben Sie alle Sprachen an, in denen Sie Dienstleistungen anbieten können, durch Kommas getrennt.", additionalLocations: "Weitere Praxisstandorte", addLocation: "Weiteren Standort Hinzufügen", remove: "Entfernen", website: "Website", platformLinks: "Professionelle / Social Links", platformLinksHint: "Einer pro Zeile. Plattform: URL oder nur URL.", bio: "Professionelle Biografie", bioHint: "Mindestens 100 Zeichen.", years: "Jahre Erfahrung", consultationFee: "Beratungs- / Sitzungsgebühr", specialties: "SCHWERPUNKTE — ERFORDERLICH, ALLE ZUTREFFENDEN", otherSpecialty: "Anderer Schwerpunkt", services: "Dienstleistungen & Formate — ALLE ZUTREFFENDEN", availability: "Verfügbarkeit / Übliche Zeiten", accepting: "Nimmt Neue Klienten An", certifications: "Zertifikate / Spezialausbildung", education: "Ausbildung & Qualifikationen", rates: "Gebühren, Versicherung & Zahlung", cancellation: "Stornierungsbedingungen", attestation: "Verifizierung & Vereinbarung", accurate: "Ich bestätige, dass meine Angaben korrekt und aktuell sind.", terms: "Ich akzeptiere die Nutzungsbedingungen und Datenschutzrichtlinie von One2One Love.", pending: "Alle professionellen Bewerbungen bleiben bis zur Prüfung und Genehmigung Zur Verifizierung Ausstehend.", secureDocs: "Nachweise sind vor Genehmigung erforderlich. Der sichere Upload erfolgt nach Konto-/E-Mail-Verifizierung; sensible Lizenzdokumente werden nicht in öffentlichen Foto-Speichern abgelegt.", submit: "Bewerbung Absenden", submitting: "Bewerbung Wird Gesendet...", mismatch: "Die Passwörter stimmen nicht überein.", incomplete: "Bitte füllen Sie alle Pflichtfelder und Bestätigungen aus.", successTitle: "Bewerbung Eingegangen", successBody: "Ihre Bewerbung wird geprüft. Nichts wird als verifiziert veröffentlicht, bevor die Prüfung abgeschlossen ist.", emailVerify: "Bitte führen Sie auch jede per E-Mail zugesandte Verifizierung durch.", home: "Zur Startseite" },
    licensed: { title: "Lizenzierter Therapeut oder Berater", subtitle: "Bewerbung mit Qualifikationsprüfung für lizenzierte Fachkräfte der psychischen Gesundheit.", typeLabel: "Art der Lizenzierten Fachkraft", typeOptions: ["Lizenzierter Therapeut", "Lizenzierter Professioneller Berater", "Ehe- und Familientherapeut", "Lizenzierter Klinischer Sozialarbeiter", "Psychologe", "Psychiater", "Andere Lizenzierte Fachkraft für Psychische Gesundheit"], licenseSection: "Berufslizenz", licenseType: "Lizenztyp / Qualifikation", licenseNumber: "Lizenznummer", licenseCountry: "Ausstellungsland", licenseRegion: "Ausstellendes Bundesland / Provinz / Gebiet", issueDate: "Erstausstellungsdatum", expiryDate: "Ablauf- / Verlängerungsdatum", licenseStatus: "Aktueller Lizenzstatus", statusOptions: ["Aktiv / Ordnungsgemäß", "Aktiv — Verlängerung Läuft", "Andere"], approach: "Therapeutischer Ansatz / Philosophie", howHelp: "Wie Ich Paaren / Klienten Helfe", verification: "Ich ermächtige One2One Love zur Prüfung meiner beruflichen Qualifikationen und verstehe, dass die Genehmigung erst nach Abschluss der Prüfung erfolgt." },
    coach: { title: "Beziehungscoach oder -pädagoge", subtitle: "Bewerbung für nicht-klinische Beziehungscoaches, Pädagogen und Mentoren.", typeLabel: "Art der Fachkraft", typeOptions: ["Beziehungscoach", "Dating-Coach", "Ehepädagoge", "Kommunikationscoach", "Life Coach — Beziehungen", "Intimitäts- / Beziehungspädagoge", "Glaubensbasierter Beziehungsmentor", "Scheidungs- / Trennungscoach", "Anderer Beziehungspädagoge"], businessName: "Praxis- / Geschäftsname", approach: "Coaching- / Bildungsansatz", nonClinical: "Ich verstehe, dass diese Kategorie nicht klinisch ist und mich nicht als lizenzierten Therapeuten, Berater, Psychologen, Psychiater oder anderen lizenzierten Anbieter psychischer Gesundheitsleistungen ausweist." },
    contributor: { title: "Creator, Podcaster, Autor oder Influencer", subtitle: "Contributor-/Medienbewerbung für beziehungsorientierte Creator und Stimmen.", roles: "Contributor-Typ — ALLE ZUTREFFENDEN", roleOptions: ["Creator", "Podcaster", "Autor / Blogger", "Influencer", "Buchautor", "Redner", "YouTuber / Video-Creator", "Beziehungskommentator", "Anderer Medien-Contributor"], categories: "Inhaltsthemen — ALLE ZUTREFFENDEN", categoryOptions: ["Ehe", "Dating", "Kommunikation", "Familie", "Intimität", "LGBTQ+ Beziehungen", "Glaube & Beziehungen", "Scheidung / Trennung", "Persönliches Wachstum", "Beziehungskultur", "Humor / Kommentar", "Andere"], collaborations: "Kooperationsinteressen — ALLE ZUTREFFENDEN", collaborationOptions: ["Podcast- / Interviewgast", "Artikel / Schriftliche Beiträge", "Videobeiträge", "Live-Diskussionen", "Events / Panels", "Kampagnenkooperationen", "Bildungsinhalte", "Andere"], followers: "Ungefähre Kombinierte Zielgruppe / Follower", mediaKit: "Media-Kit-URL", samples: "Arbeitsproben-Links", samplesHint: "Ein Link pro Zeile.", platformRequired: "Mindestens ein Plattform- oder Arbeitslink ist erforderlich.", contributorAck: "Ich verstehe, dass die Contributor-Genehmigung mich nicht als lizenzierte Fachkraft der psychischen Gesundheit darstellt, sofern ich nicht separat verifiziert wurde." },
    organization: { title: "Organisation oder Professioneller Partner", subtitle: "Bewerbung für Organisationen, Unternehmen, gemeinnützige Einrichtungen und professionelle Partner.", organizationName: "Rechtlicher / Organisationsname", organizationType: "Organisationstyp", organizationOptions: ["Gemeinnützig", "Beziehungs- / Familienorganisation", "Bildungsorganisation", "Professionelle Praxis / Gruppe", "Medien- / Verlagsunternehmen", "Gemeinschaftsorganisation", "Glaubensbasierte Organisation", "Unternehmen / Dienstleister", "Andere"], mission: "Mission / Zweck", serviceDescription: "Angebotene Dienste / Programme", operatingAreas: "Bediente Länder / Regionen", partnership: "Partnerschaftsinteressen — ALLE ZUTREFFENDEN", partnershipOptions: ["Verzeichniseintrag", "Bildungsinhalte", "Events / Panels", "Community-Ressourcen", "Medienkooperation", "Ressourcen- / Empfehlungskooperation", "Andere"], authorized: "Ich bestätige, dass ich zur Einreichung dieser Bewerbung berechtigt bin und verstehe, dass dadurch keine Partnerschaft, Empfehlung, Vertretung oder Beschäftigung mit One2One Love oder ERANT Property Services LLC entsteht." },
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

export default function ProfessionalApplication({ mode }) {
  const { currentLanguage } = useLanguage();
  const language = COPY[currentLanguage] ? currentLanguage : "en";
  const t = COPY[language];
  const c = t.common;
  const m = t[mode];
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "", lastName: "", professionalDisplayName: "", email: "", password: "", confirmPassword: "", phone: "",
    address: "", country: "", region: "", city: "", postalCode: "", timeZone: "", languagesText: "",
    websiteUrl: "", platformLinksText: "", bio: "", yearsExperience: "", consultationFee: "", availability: "", acceptingNewClients: true,
    certificationsText: "", education: "", ratesInsurance: "", cancellationPolicy: "", otherSpecialty: "",
    professionalTitle: "", businessName: "", approach: "", howHelp: "",
    licenseType: "", licenseNumber: "", licenseCountry: "", licenseRegion: "", licenseIssueDate: "", licenseExpiryDate: "", licenseStatus: "",
    followerCount: "", mediaKitUrl: "", sampleLinksText: "",
    organizationName: "", organizationType: "", mission: "", serviceDescription: "", operatingAreas: "",
  });
  const [specialties, setSpecialties] = useState([]);
  const [serviceFormats, setServiceFormats] = useState([]);
  const [roles, setRoles] = useState([]);
  const [contentCategories, setContentCategories] = useState([]);
  const [collaborationTypes, setCollaborationTypes] = useState([]);
  const [partnershipInterests, setPartnershipInterests] = useState([]);
  const [additionalLocations, setAdditionalLocations] = useState([]);
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [accurate, setAccurate] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [categoryAcknowledged, setCategoryAcknowledged] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [requiresEmailVerification, setRequiresEmailVerification] = useState(false);

  const specialtyOptions = SPECIALTIES[language] || SPECIALTIES.en;
  const serviceOptions = SERVICE_FORMATS[language] || SERVICE_FORMATS.en;

  const modeIcon = useMemo(() => {
    if (mode === "licensed") return BadgeCheck;
    if (mode === "coach") return BriefcaseBusiness;
    if (mode === "contributor") return Mic2;
    return Building2;
  }, [mode]);
  const Icon = modeIcon;

  const update = (field, value) => setForm((previous) => ({ ...previous, [field]: value }));
  const toggle = (value, values, setter) => setter(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);

  const addLocation = () => setAdditionalLocations((items) => [...items, emptyLocation()]);
  const updateLocation = (index, field, value) => setAdditionalLocations((items) => items.map((item, i) => i === index ? { ...item, [field]: value } : item));
  const removeLocation = (index) => setAdditionalLocations((items) => items.filter((_, i) => i !== index));

  const requiredCategoryFieldsComplete = () => {
    if (mode === "licensed") {
      return Boolean(form.professionalTitle && form.licenseType && form.licenseNumber && form.licenseCountry && form.licenseRegion && form.licenseStatus && specialties.length && serviceFormats.length && categoryAcknowledged);
    }
    if (mode === "coach") {
      return Boolean(form.professionalTitle && specialties.length && serviceFormats.length && categoryAcknowledged);
    }
    if (mode === "contributor") {
      const hasLink = Boolean(form.platformLinksText.trim() || form.sampleLinksText.trim() || form.websiteUrl.trim());
      return Boolean(roles.length && contentCategories.length && collaborationTypes.length && hasLink && categoryAcknowledged);
    }
    return Boolean(form.organizationName && form.organizationType && form.serviceDescription && partnershipInterests.length && categoryAcknowledged);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (form.password !== form.confirmPassword) {
      setErrorMessage(c.mismatch);
      return;
    }

    const baseComplete = form.firstName && form.lastName && form.email && form.password.length >= 8 && form.phone && form.country && form.city && form.bio.trim().length >= 100;
    if (!baseComplete || !requiredCategoryFieldsComplete() || !accurate || !termsAccepted) {
      setErrorMessage(c.incomplete);
      return;
    }

    setIsLoading(true);
    try {
      let profilePhotoUrl = null;
      if (profilePhotoFile) {
        try {
          profilePhotoUrl = await uploadProfessionalProfilePhoto(profilePhotoFile, mode);
        } catch (uploadError) {
          console.warn("Professional photo upload failed; continuing without photo:", uploadError);
        }
      }

      const certifications = form.certificationsText.split(",").map((item) => item.trim()).filter(Boolean);
      const languages = form.languagesText.split(",").map((item) => item.trim()).filter(Boolean);
      const allSpecialties = [...specialties, ...(form.otherSpecialty.trim() ? [form.otherSpecialty.trim()] : [])];

      const application = {
        professionalKind: mode,
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
        yearsExperience: form.yearsExperience,
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
        businessName: form.businessName,
        approach: form.approach,
        howHelp: form.howHelp,
        licenseType: form.licenseType,
        licenseNumber: form.licenseNumber,
        licenseCountry: form.licenseCountry,
        licenseRegion: form.licenseRegion,
        licenseIssueDate: form.licenseIssueDate,
        licenseExpiryDate: form.licenseExpiryDate,
        licenseStatus: form.licenseStatus,
        credentialDocumentRequired: mode === "licensed",
        contributorRoles: roles,
        contentCategories,
        collaborationTypes,
        followerCount: form.followerCount,
        mediaKitUrl: form.mediaKitUrl,
        sampleLinksText: form.sampleLinksText,
        organizationName: form.organizationName,
        organizationType: form.organizationType,
        mission: form.mission,
        serviceDescription: form.serviceDescription,
        operatingAreas: form.operatingAreas,
        partnershipInterests,
        applicationStatus: "pending",
        attestedAccurate: true,
        categoryAcknowledged: true,
      };

      const result = await submitProfessionalApplication(mode, {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
      }, application);

      if (!result.success) {
        setErrorMessage(result.error || c.incomplete);
        return;
      }

      setRequiresEmailVerification(Boolean(result.requiresEmailVerification));
      setSuccess(true);
    } catch (error) {
      setErrorMessage(error?.message || c.incomplete);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 px-4 py-14 flex items-center justify-center">
        <Card className="max-w-2xl w-full shadow-2xl border-2 border-emerald-100">
          <CardContent className="p-10 text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto mb-5" />
            <h1 className="text-4xl font-black text-gray-900 mb-3">{c.successTitle}</h1>
            <p className="text-lg text-gray-600 mb-4">{c.successBody}</p>
            {requiresEmailVerification && <p className="text-sm text-purple-700 bg-purple-50 rounded-xl p-4 mb-6">{c.emailVerify}</p>}
            <Button onClick={() => navigate(createPageUrl("Home"))} className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">{c.home}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <Link to={createPageUrl("ProfessionalSignup")} className="inline-flex items-center text-gray-600 hover:text-purple-700 mb-7">
          <ArrowLeft className="w-5 h-5 mr-2" />{t.back}
        </Link>

        <div className="text-center mb-9">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg"><Icon className="w-8 h-8" /></div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-3">{m.title}</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">{m.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Section title={c.basic} icon={UserRound}>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label={c.firstName} required><input className="field" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} required /></Field>
              <Field label={c.lastName} required><input className="field" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} required /></Field>
              {mode !== "organization" && <Field label={c.displayName}><input className="field" value={form.professionalDisplayName} onChange={(e) => update("professionalDisplayName", e.target.value)} /></Field>}
              <Field label={c.phone} required><input className="field" type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} required /></Field>
              <Field label={c.email} required><input className="field" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required /></Field>
              <Field label={c.password} required><input className="field" type="password" minLength={8} value={form.password} onChange={(e) => update("password", e.target.value)} required /></Field>
              <Field label={c.confirmPassword} required><input className="field" type="password" minLength={8} value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} required /></Field>
              <Field label={c.photo}><input type="file" accept="image/*" onChange={(e) => setProfilePhotoFile(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-600" /><p className="hint">{c.photoOptional}</p></Field>
            </div>
          </Section>

          <Section title={c.location} icon={MapPin}>
            <LocationFields value={form} update={update} c={c} required />
            <div className="mt-5 flex items-center justify-between gap-3">
              <h3 className="font-bold text-gray-900">{c.additionalLocations}</h3>
              <Button type="button" variant="outline" onClick={addLocation}><Plus className="w-4 h-4 mr-2" />{c.addLocation}</Button>
            </div>
            <div className="space-y-4 mt-4">
              {additionalLocations.map((location, index) => (
                <div key={index} className="rounded-2xl border border-purple-100 bg-purple-50/50 p-4">
                  <div className="flex justify-end mb-3"><button type="button" onClick={() => removeLocation(index)} className="text-sm text-red-600 inline-flex items-center"><Trash2 className="w-4 h-4 mr-1" />{c.remove}</button></div>
                  <LocationFields value={location} update={(field, value) => updateLocation(index, field, value)} c={c} />
                </div>
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-4 mt-5">
              <Field label={c.timezone}><input className="field" value={form.timeZone} onChange={(e) => update("timeZone", e.target.value)} placeholder="e.g., America/Chicago" /></Field>
              <Field label={c.languages}><input className="field" value={form.languagesText} onChange={(e) => update("languagesText", e.target.value)} /><p className="hint">{c.languagesHint}</p></Field>
            </div>
          </Section>

          {mode === "licensed" && (
            <Section title={m.licenseSection} icon={ShieldCheck}>
              <div className="grid md:grid-cols-2 gap-4">
                <SelectField label={m.typeLabel} value={form.professionalTitle} onChange={(value) => update("professionalTitle", value)} options={m.typeOptions} required />
                <Field label={m.licenseType} required><input className="field" value={form.licenseType} onChange={(e) => update("licenseType", e.target.value)} required /></Field>
                <Field label={m.licenseNumber} required><input className="field" value={form.licenseNumber} onChange={(e) => update("licenseNumber", e.target.value)} required /></Field>
                <Field label={m.licenseCountry} required><input className="field" value={form.licenseCountry} onChange={(e) => update("licenseCountry", e.target.value)} required /></Field>
                <Field label={m.licenseRegion} required><input className="field" value={form.licenseRegion} onChange={(e) => update("licenseRegion", e.target.value)} required /></Field>
                <SelectField label={m.licenseStatus} value={form.licenseStatus} onChange={(value) => update("licenseStatus", value)} options={m.statusOptions} required />
                <Field label={m.issueDate}><input className="field" type="date" value={form.licenseIssueDate} onChange={(e) => update("licenseIssueDate", e.target.value)} /></Field>
                <Field label={m.expiryDate}><input className="field" type="date" value={form.licenseExpiryDate} onChange={(e) => update("licenseExpiryDate", e.target.value)} /></Field>
              </div>
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 flex gap-3"><Upload className="w-5 h-5 flex-none mt-0.5" /><span>{c.secureDocs}</span></div>
            </Section>
          )}

          {mode === "coach" && (
            <Section title={m.title} icon={BriefcaseBusiness}>
              <div className="grid md:grid-cols-2 gap-4">
                <SelectField label={m.typeLabel} value={form.professionalTitle} onChange={(value) => update("professionalTitle", value)} options={m.typeOptions} required />
                <Field label={m.businessName}><input className="field" value={form.businessName} onChange={(e) => update("businessName", e.target.value)} /></Field>
              </div>
            </Section>
          )}

          {(mode === "licensed" || mode === "coach") && (
            <Section title={c.specialties} icon={BriefcaseBusiness}>
              <ChoiceGrid options={specialtyOptions} values={specialties} onToggle={(value) => toggle(value, specialties, setSpecialties)} />
              <div className="mt-4"><Field label={c.otherSpecialty}><input className="field" value={form.otherSpecialty} onChange={(e) => update("otherSpecialty", e.target.value)} /></Field></div>
              <div className="mt-6"><h3 className="font-bold text-gray-900 mb-3">{c.services}</h3><ChoiceGrid options={serviceOptions} values={serviceFormats} onToggle={(value) => toggle(value, serviceFormats, setServiceFormats)} /></div>
            </Section>
          )}

          {mode === "contributor" && (
            <Section title={m.title} icon={Mic2}>
              <ChoiceBlock title={m.roles} options={m.roleOptions} values={roles} setter={setRoles} />
              <ChoiceBlock title={m.categories} options={m.categoryOptions} values={contentCategories} setter={setContentCategories} />
              <ChoiceBlock title={m.collaborations} options={m.collaborationOptions} values={collaborationTypes} setter={setCollaborationTypes} />
              <div className="grid md:grid-cols-2 gap-4 mt-5">
                <Field label={m.followers}><input className="field" type="number" min="0" value={form.followerCount} onChange={(e) => update("followerCount", e.target.value)} /></Field>
                <Field label={m.mediaKit}><input className="field" type="url" value={form.mediaKitUrl} onChange={(e) => update("mediaKitUrl", e.target.value)} /></Field>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <Field label={c.platformLinks}><textarea className="field min-h-[120px]" value={form.platformLinksText} onChange={(e) => update("platformLinksText", e.target.value)} /><p className="hint">{c.platformLinksHint}</p></Field>
                <Field label={m.samples}><textarea className="field min-h-[120px]" value={form.sampleLinksText} onChange={(e) => update("sampleLinksText", e.target.value)} /><p className="hint">{m.samplesHint}</p></Field>
              </div>
              <p className="hint mt-2">{m.platformRequired}</p>
            </Section>
          )}

          {mode === "organization" && (
            <Section title={m.title} icon={Building2}>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label={m.organizationName} required><input className="field" value={form.organizationName} onChange={(e) => update("organizationName", e.target.value)} required /></Field>
                <SelectField label={m.organizationType} value={form.organizationType} onChange={(value) => update("organizationType", value)} options={m.organizationOptions} required />
                <Field label={c.website}><input className="field" type="url" value={form.websiteUrl} onChange={(e) => update("websiteUrl", e.target.value)} /></Field>
                <Field label={m.operatingAreas}><input className="field" value={form.operatingAreas} onChange={(e) => update("operatingAreas", e.target.value)} /></Field>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <Field label={m.mission}><textarea className="field min-h-[120px]" value={form.mission} onChange={(e) => update("mission", e.target.value)} /></Field>
                <Field label={m.serviceDescription} required><textarea className="field min-h-[120px]" value={form.serviceDescription} onChange={(e) => update("serviceDescription", e.target.value)} required /></Field>
              </div>
              <div className="mt-6"><ChoiceBlock title={m.partnership} options={m.partnershipOptions} values={partnershipInterests} setter={setPartnershipInterests} /></div>
            </Section>
          )}

          <Section title={mode === "organization" ? c.bio : c.bio} icon={Globe2}>
            {mode !== "organization" && (
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <Field label={c.website}><input className="field" type="url" value={form.websiteUrl} onChange={(e) => update("websiteUrl", e.target.value)} /></Field>
                {mode !== "contributor" && <Field label={c.platformLinks}><textarea className="field min-h-[88px]" value={form.platformLinksText} onChange={(e) => update("platformLinksText", e.target.value)} /><p className="hint">{c.platformLinksHint}</p></Field>}
              </div>
            )}
            <Field label={c.bio} required><textarea className="field min-h-[150px]" value={form.bio} onChange={(e) => update("bio", e.target.value)} required /><p className="hint">{c.bioHint} ({form.bio.length})</p></Field>
            {(mode === "licensed" || mode === "coach") && (
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <Field label={c.years}><input className="field" type="number" min="0" value={form.yearsExperience} onChange={(e) => update("yearsExperience", e.target.value)} /></Field>
                <Field label={c.consultationFee}><input className="field" value={form.consultationFee} onChange={(e) => update("consultationFee", e.target.value)} /></Field>
                <Field label={c.certifications}><textarea className="field min-h-[90px]" value={form.certificationsText} onChange={(e) => update("certificationsText", e.target.value)} /></Field>
                <Field label={c.education}><textarea className="field min-h-[90px]" value={form.education} onChange={(e) => update("education", e.target.value)} /></Field>
                <Field label={mode === "licensed" ? m.approach : m.approach}><textarea className="field min-h-[110px]" value={form.approach} onChange={(e) => update("approach", e.target.value)} /></Field>
                {mode === "licensed" && <Field label={m.howHelp}><textarea className="field min-h-[110px]" value={form.howHelp} onChange={(e) => update("howHelp", e.target.value)} /></Field>}
                <Field label={c.availability}><textarea className="field min-h-[90px]" value={form.availability} onChange={(e) => update("availability", e.target.value)} /></Field>
                <Field label={c.rates}><textarea className="field min-h-[90px]" value={form.ratesInsurance} onChange={(e) => update("ratesInsurance", e.target.value)} /></Field>
                <Field label={c.cancellation}><textarea className="field min-h-[90px]" value={form.cancellationPolicy} onChange={(e) => update("cancellationPolicy", e.target.value)} /></Field>
                <label className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 mt-6 md:mt-0"><input type="checkbox" checked={form.acceptingNewClients} onChange={(e) => update("acceptingNewClients", e.target.checked)} className="h-5 w-5" /><span className="font-medium text-gray-800">{c.accepting}</span></label>
              </div>
            )}
          </Section>

          <Section title={c.attestation} icon={ShieldCheck}>
            <p className="text-sm text-gray-600 mb-4">{c.pending}</p>
            <CheckRow checked={accurate} setChecked={setAccurate} label={c.accurate} />
            {mode === "licensed" && <CheckRow checked={categoryAcknowledged} setChecked={setCategoryAcknowledged} label={m.verification} />}
            {mode === "coach" && <CheckRow checked={categoryAcknowledged} setChecked={setCategoryAcknowledged} label={m.nonClinical} />}
            {mode === "contributor" && <CheckRow checked={categoryAcknowledged} setChecked={setCategoryAcknowledged} label={m.contributorAck} />}
            {mode === "organization" && <CheckRow checked={categoryAcknowledged} setChecked={setCategoryAcknowledged} label={m.authorized} />}
            <label className="flex items-start gap-3 mt-3 rounded-xl border border-gray-200 p-4"><input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="h-5 w-5 mt-0.5" /><span className="text-gray-700">{c.terms} <Link to={createPageUrl("TermsOfService")} className="text-purple-700 underline">Terms</Link> · <Link to={createPageUrl("PrivacyPolicy")} className="text-purple-700 underline">Privacy</Link></span></label>
          </Section>

          {errorMessage && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 font-medium">{errorMessage}</div>}

          <Button type="submit" disabled={isLoading} className="w-full py-6 text-lg font-bold bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white">
            {isLoading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />{c.submitting}</> : c.submit}
          </Button>
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

function SelectField({ label, value, onChange, options, required }) {
  return <Field label={label} required={required}><select className="field" value={value} onChange={(e) => onChange(e.target.value)} required={required}><option value="">—</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></Field>;
}

function LocationFields({ value, update, c, required = false }) {
  return <div className="grid md:grid-cols-2 gap-4">
    <Field label={c.address}><input className="field" value={value.address || ""} onChange={(e) => update("address", e.target.value)} /></Field>
    <Field label={c.city} required={required}><input className="field" value={value.city || ""} onChange={(e) => update("city", e.target.value)} required={required} /></Field>
    <Field label={c.region}><input className="field" value={value.region || ""} onChange={(e) => update("region", e.target.value)} /></Field>
    <Field label={c.postal}><input className="field" value={value.postalCode || ""} onChange={(e) => update("postalCode", e.target.value)} /></Field>
    <Field label={c.country} required={required}><input className="field" value={value.country || ""} onChange={(e) => update("country", e.target.value)} required={required} /></Field>
  </div>;
}

function ChoiceGrid({ options, values, onToggle }) {
  return <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{options.map((option) => <label key={option} className={`rounded-xl border p-3 flex items-start gap-2 cursor-pointer ${values.includes(option) ? "border-purple-400 bg-purple-50" : "border-gray-200 bg-white"}`}><input type="checkbox" checked={values.includes(option)} onChange={() => onToggle(option)} className="mt-1 h-4 w-4" /><span className="text-sm font-medium text-gray-800">{option}</span></label>)}</div>;
}

function ChoiceBlock({ title, options, values, setter }) {
  const toggleLocal = (value) => setter(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  return <div className="mb-6"><h3 className="font-bold text-gray-900 mb-3">{title}</h3><ChoiceGrid options={options} values={values} onToggle={toggleLocal} /></div>;
}

function CheckRow({ checked, setChecked, label }) {
  return <label className="flex items-start gap-3 mt-3 rounded-xl border border-gray-200 p-4"><input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="h-5 w-5 mt-0.5" /><span className="text-gray-700">{label}</span></label>;
}
