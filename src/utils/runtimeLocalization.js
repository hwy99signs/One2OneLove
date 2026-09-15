const SUPPORTED_LANGUAGES = new Set(['en', 'es', 'fr', 'it', 'de']);

const EXACT_TRANSLATIONS = {
  'Love Notes Created': { es: 'Notas de Amor Creadas', fr: 'Notes d’Amour Créées', it: 'Note d’Amore Create', de: 'Erstellte Liebesbotschaften' },
  'Happy Couples': { es: 'Parejas Felices', fr: 'Couples Heureux', it: 'Coppie Felici', de: 'Glückliche Paare' },
  'Most Notes (Week)': { es: 'Más Notas (Semana)', fr: 'Plus de Notes (Semaine)', it: 'Più Note (Settimana)', de: 'Meiste Notizen (Woche)' },
  'Most Notes (Month)': { es: 'Más Notas (Mes)', fr: 'Plus de Notes (Mois)', it: 'Più Note (Mese)', de: 'Meiste Notizen (Monat)' },
  'Most Notes (Year)': { es: 'Más Notas (Año)', fr: 'Plus de Notes (Année)', it: 'Più Note (Anno)', de: 'Meiste Notizen (Jahr)' },
  'Personalizado para': { es: 'Personalizado para', fr: 'Personnalisé pour', it: 'Personalizzato per', de: 'Personalisiert für' },

  'Are you sure you want to delete this milestone?': { es: '¿Seguro que quieres eliminar este hito?', fr: 'Voulez-vous vraiment supprimer cette étape importante ?', it: 'Vuoi davvero eliminare questo traguardo?', de: 'Möchten Sie diesen Meilenstein wirklich löschen?' },
  'Please enter an event title': { es: 'Ingresa un título para el evento', fr: 'Veuillez saisir un titre pour l’événement', it: 'Inserisci un titolo per l’evento', de: 'Bitte geben Sie einen Veranstaltungstitel ein' },
  'Please select a date': { es: 'Selecciona una fecha', fr: 'Veuillez sélectionner une date', it: 'Seleziona una data', de: 'Bitte wählen Sie ein Datum aus' },
  'You must be logged in to create events': { es: 'Debes iniciar sesión para crear eventos', fr: 'Vous devez être connecté pour créer des événements', it: 'Devi accedere per creare eventi', de: 'Sie müssen angemeldet sein, um Veranstaltungen zu erstellen' },
  'Are you sure you want to delete this event?': { es: '¿Seguro que quieres eliminar este evento?', fr: 'Voulez-vous vraiment supprimer cet événement ?', it: 'Vuoi davvero eliminare questo evento?', de: 'Möchten Sie diese Veranstaltung wirklich löschen?' },
  'Buddy accepted!': { es: '¡Amigo aceptado!', fr: 'Ami accepté !', it: 'Amico accettato!', de: 'Freund akzeptiert!' },
  'Buddy declined': { es: 'Solicitud de amistad rechazada', fr: 'Demande d’ami refusée', it: 'Richiesta di amicizia rifiutata', de: 'Freundschaftsanfrage abgelehnt' },
  'Please sign in to see users': { es: 'Inicia sesión para ver usuarios', fr: 'Connectez-vous pour voir les utilisateurs', it: 'Accedi per vedere gli utenti', de: 'Bitte melden Sie sich an, um Benutzer zu sehen' },
  'Please sign in to send buddy requests': { es: 'Inicia sesión para enviar solicitudes de amistad', fr: 'Connectez-vous pour envoyer des demandes d’ami', it: 'Accedi per inviare richieste di amicizia', de: 'Bitte melden Sie sich an, um Freundschaftsanfragen zu senden' },
  'Please sign in again before purchasing extra sends.': { es: 'Vuelve a iniciar sesión antes de comprar envíos adicionales.', fr: 'Reconnectez-vous avant d’acheter des envois supplémentaires.', it: 'Accedi di nuovo prima di acquistare invii aggiuntivi.', de: 'Bitte melden Sie sich erneut an, bevor Sie zusätzliche Sendungen kaufen.' },
  'Please sign in to join the contests.': { es: 'Inicia sesión para participar en los concursos.', fr: 'Connectez-vous pour participer aux concours.', it: 'Accedi per partecipare ai concorsi.', de: 'Bitte melden Sie sich an, um an den Wettbewerben teilzunehmen.' },
  'Profile updated successfully!': { es: '¡Perfil actualizado correctamente!', fr: 'Profil mis à jour avec succès !', it: 'Profilo aggiornato con successo!', de: 'Profil erfolgreich aktualisiert!' },
  'Please sign in to upload a profile picture': { es: 'Inicia sesión para subir una foto de perfil', fr: 'Connectez-vous pour importer une photo de profil', it: 'Accedi per caricare una foto del profilo', de: 'Bitte melden Sie sich an, um ein Profilbild hochzuladen' },
  'Profile photos are currently available for regular users only': { es: 'Las fotos de perfil están disponibles actualmente solo para usuarios regulares', fr: 'Les photos de profil sont actuellement réservées aux utilisateurs réguliers', it: 'Le foto del profilo sono attualmente disponibili solo per gli utenti regolari', de: 'Profilfotos sind derzeit nur für reguläre Benutzer verfügbar' },
  'Please select an image file': { es: 'Selecciona un archivo de imagen', fr: 'Veuillez sélectionner un fichier image', it: 'Seleziona un file immagine', de: 'Bitte wählen Sie eine Bilddatei aus' },
  'Image size should be less than 5MB': { es: 'La imagen debe pesar menos de 5 MB', fr: 'L’image doit faire moins de 5 Mo', it: 'L’immagine deve essere inferiore a 5 MB', de: 'Das Bild muss kleiner als 5 MB sein' },
  'Profile image updated successfully!': { es: '¡Foto de perfil actualizada correctamente!', fr: 'Photo de profil mise à jour avec succès !', it: 'Immagine del profilo aggiornata con successo!', de: 'Profilbild erfolgreich aktualisiert!' },
  'Are you sure you want to delete this conversation?': { es: '¿Seguro que quieres eliminar esta conversación?', fr: 'Voulez-vous vraiment supprimer cette conversation ?', it: 'Vuoi davvero eliminare questa conversazione?', de: 'Möchten Sie diese Unterhaltung wirklich löschen?' },
  'Unable to copy the link.': { es: 'No se pudo copiar el enlace.', fr: 'Impossible de copier le lien.', it: 'Impossibile copiare il link.', de: 'Der Link konnte nicht kopiert werden.' },
  'Unable to copy the invite text.': { es: 'No se pudo copiar el texto de la invitación.', fr: 'Impossible de copier le texte de l’invitation.', it: 'Impossibile copiare il testo dell’invito.', de: 'Der Einladungstext konnte nicht kopiert werden.' },
  'A new administrator verification code was sent.': { es: 'Se envió un nuevo código de verificación de administrador.', fr: 'Un nouveau code de vérification administrateur a été envoyé.', it: 'È stato inviato un nuovo codice di verifica amministratore.', de: 'Ein neuer Administrator-Bestätigungscode wurde gesendet.' },
  'Administrator access is required.': { es: 'Se requiere acceso de administrador.', fr: 'Un accès administrateur est requis.', it: 'È richiesto l’accesso amministratore.', de: 'Administratorzugriff ist erforderlich.' },
  'Enter the 6-digit code from your email.': { es: 'Ingresa el código de 6 dígitos de tu correo.', fr: 'Entrez le code à 6 chiffres reçu par e-mail.', it: 'Inserisci il codice a 6 cifre ricevuto via e-mail.', de: 'Geben Sie den 6-stelligen Code aus Ihrer E-Mail ein.' },
  'Administrator verification complete.': { es: 'Verificación de administrador completada.', fr: 'Vérification administrateur terminée.', it: 'Verifica amministratore completata.', de: 'Administratorbestätigung abgeschlossen.' },
  'Please log in to save your results': { es: 'Inicia sesión para guardar tus resultados', fr: 'Connectez-vous pour enregistrer vos résultats', it: 'Accedi per salvare i risultati', de: 'Bitte melden Sie sich an, um Ihre Ergebnisse zu speichern' },
  'Love language saved to your profile!': { es: '¡Lenguaje del amor guardado en tu perfil!', fr: 'Langage de l’amour enregistré dans votre profil !', it: 'Linguaggio dell’amore salvato nel tuo profilo!', de: 'Liebessprache in Ihrem Profil gespeichert!' },
  'Failed to save love language. Please try again.': { es: 'No se pudo guardar el lenguaje del amor. Inténtalo de nuevo.', fr: 'Impossible d’enregistrer le langage de l’amour. Réessayez.', it: 'Impossibile salvare il linguaggio dell’amore. Riprova.', de: 'Die Liebessprache konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.' },
  'Are you sure you want to delete this goal?': { es: '¿Seguro que quieres eliminar esta meta?', fr: 'Voulez-vous vraiment supprimer cet objectif ?', it: 'Vuoi davvero eliminare questo obiettivo?', de: 'Möchten Sie dieses Ziel wirklich löschen?' },
  'Please select content type and tone': { es: 'Selecciona el tipo de contenido y el tono', fr: 'Sélectionnez le type de contenu et le ton', it: 'Seleziona il tipo di contenuto e il tono', de: 'Bitte wählen Sie Inhaltstyp und Ton aus' },
  'Downloaded!': { es: '¡Descargado!', fr: 'Téléchargé !', it: 'Scaricato!', de: 'Heruntergeladen!' },
  'Please fill in all fields': { es: 'Completa todos los campos', fr: 'Veuillez remplir tous les champs', it: 'Compila tutti i campi', de: 'Bitte füllen Sie alle Felder aus' },
  'Code copied': { es: 'Código copiado', fr: 'Code copié', it: 'Codice copiato', de: 'Code kopiert' },
  'Form submission error. Please refresh the page.': { es: 'Error al enviar el formulario. Actualiza la página.', fr: 'Erreur lors de l’envoi du formulaire. Actualisez la page.', it: 'Errore nell’invio del modulo. Aggiorna la pagina.', de: 'Fehler beim Absenden des Formulars. Bitte laden Sie die Seite neu.' },
  'Please select at least one personality trait': { es: 'Selecciona al menos un rasgo de personalidad', fr: 'Sélectionnez au moins un trait de personnalité', it: 'Seleziona almeno un tratto della personalità', de: 'Bitte wählen Sie mindestens eine Persönlichkeitseigenschaft aus' },
  'Personalized note generated! 💕': { es: '¡Nota personalizada generada! 💕', fr: 'Note personnalisée générée ! 💕', it: 'Nota personalizzata generata! 💕', de: 'Personalisierte Nachricht erstellt! 💕' },
  'Message copied for sharing': { es: 'Mensaje copiado para compartir', fr: 'Message copié pour le partage', it: 'Messaggio copiato per la condivisione', de: 'Nachricht zum Teilen kopiert' },
  'Message copied to clipboard': { es: 'Mensaje copiado al portapapeles', fr: 'Message copié dans le presse-papiers', it: 'Messaggio copiato negli appunti', de: 'Nachricht in die Zwischenablage kopiert' },
  'Nothing to copy': { es: 'No hay nada que copiar', fr: 'Rien à copier', it: 'Niente da copiare', de: 'Nichts zum Kopieren' },
  'Image saved': { es: 'Imagen guardada', fr: 'Image enregistrée', it: 'Immagine salvata', de: 'Bild gespeichert' },
  'File saved': { es: 'Archivo guardado', fr: 'Fichier enregistré', it: 'File salvato', de: 'Datei gespeichert' },
  'Failed to share': { es: 'No se pudo compartir', fr: 'Échec du partage', it: 'Condivisione non riuscita', de: 'Teilen fehlgeschlagen' },
  'Message edited': { es: 'Mensaje editado', fr: 'Message modifié', it: 'Messaggio modificato', de: 'Nachricht bearbeitet' },
  'Camera not ready. Please wait...': { es: 'La cámara no está lista. Espera...', fr: 'La caméra n’est pas prête. Veuillez patienter...', it: 'La fotocamera non è pronta. Attendi...', de: 'Die Kamera ist noch nicht bereit. Bitte warten...' },
  'Photo captured!': { es: '¡Foto tomada!', fr: 'Photo prise !', it: 'Foto acquisita!', de: 'Foto aufgenommen!' },
  'Failed to capture photo': { es: 'No se pudo tomar la foto', fr: 'Impossible de prendre la photo', it: 'Impossibile acquisire la foto', de: 'Foto konnte nicht aufgenommen werden' },
  'Camera not ready. Please try again.': { es: 'La cámara no está lista. Inténtalo de nuevo.', fr: 'La caméra n’est pas prête. Réessayez.', it: 'La fotocamera non è pronta. Riprova.', de: 'Die Kamera ist nicht bereit. Bitte versuchen Sie es erneut.' },
  'Video recorded!': { es: '¡Video grabado!', fr: 'Vidéo enregistrée !', it: 'Video registrato!', de: 'Video aufgenommen!' },
  'Failed to record video': { es: 'No se pudo grabar el video', fr: 'Impossible d’enregistrer la vidéo', it: 'Impossibile registrare il video', de: 'Video konnte nicht aufgenommen werden' },
  'Error recording video': { es: 'Error al grabar el video', fr: 'Erreur lors de l’enregistrement de la vidéo', it: 'Errore durante la registrazione del video', de: 'Fehler bei der Videoaufnahme' },
  'Recording...': { es: 'Grabando...', fr: 'Enregistrement...', it: 'Registrazione...', de: 'Aufnahme läuft...' },
  'Could not start video recording': { es: 'No se pudo iniciar la grabación de video', fr: 'Impossible de démarrer l’enregistrement vidéo', it: 'Impossibile avviare la registrazione video', de: 'Videoaufnahme konnte nicht gestartet werden' },
  'Please agree to the partnership terms': { es: 'Acepta los términos de colaboración', fr: 'Acceptez les conditions de partenariat', it: 'Accetta i termini della partnership', de: 'Bitte stimmen Sie den Partnerschaftsbedingungen zu' },
  'Bio must be at least 100 characters': { es: 'La biografía debe tener al menos 100 caracteres', fr: 'La biographie doit contenir au moins 100 caractères', it: 'La biografia deve contenere almeno 100 caratteri', de: 'Die Biografie muss mindestens 100 Zeichen lang sein' },
  'Application submitted! Our partnerships team will review and contact you soon.': { es: '¡Solicitud enviada! Nuestro equipo de colaboraciones la revisará y se pondrá en contacto contigo pronto.', fr: 'Candidature envoyée ! Notre équipe partenariats l’examinera et vous contactera bientôt.', it: 'Candidatura inviata! Il nostro team partnership la esaminerà e ti contatterà presto.', de: 'Bewerbung gesendet! Unser Partnerschaftsteam prüft sie und meldet sich bald bei Ihnen.' },
  'Something went wrong. Please try again.': { es: 'Algo salió mal. Inténtalo de nuevo.', fr: 'Un problème est survenu. Réessayez.', it: 'Qualcosa è andato storto. Riprova.', de: 'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.' },
  'Please agree to the terms and guidelines': { es: 'Acepta los términos y las directrices', fr: 'Acceptez les conditions et les directives', it: 'Accetta i termini e le linee guida', de: 'Bitte stimmen Sie den Bedingungen und Richtlinien zu' },
  'Please agree to the terms and conditions': { es: 'Acepta los términos y condiciones', fr: 'Acceptez les conditions générales', it: 'Accetta i termini e le condizioni', de: 'Bitte stimmen Sie den Geschäftsbedingungen zu' },
  'Account created successfully! Please check your email.': { es: '¡Cuenta creada correctamente! Revisa tu correo.', fr: 'Compte créé avec succès ! Consultez votre e-mail.', it: 'Account creato con successo! Controlla la tua e-mail.', de: 'Konto erfolgreich erstellt! Bitte prüfen Sie Ihre E-Mail.' },
  'Please agree to the professional terms': { es: 'Acepta los términos profesionales', fr: 'Acceptez les conditions professionnelles', it: 'Accetta i termini professionali', de: 'Bitte stimmen Sie den beruflichen Bedingungen zu' },
  'Professional bio must be at least 100 characters': { es: 'La biografía profesional debe tener al menos 100 caracteres', fr: 'La biographie professionnelle doit contenir au moins 100 caractères', it: 'La biografia professionale deve contenere almeno 100 caratteri', de: 'Die berufliche Biografie muss mindestens 100 Zeichen lang sein' },

  'Email verification required.': { es: 'Se requiere verificar el correo.', fr: 'La vérification de l’e-mail est requise.', it: 'È richiesta la verifica dell’e-mail.', de: 'Eine E-Mail-Bestätigung ist erforderlich.' },
  'Invalid email or password. Please try again.': { es: 'Correo o contraseña no válidos. Inténtalo de nuevo.', fr: 'E-mail ou mot de passe incorrect. Réessayez.', it: 'E-mail o password non validi. Riprova.', de: 'Ungültige E-Mail-Adresse oder ungültiges Passwort. Bitte versuchen Sie es erneut.' },
  'Login timeout after 15 seconds': { es: 'El inicio de sesión agotó el tiempo de espera después de 15 segundos', fr: 'Le délai de connexion a expiré après 15 secondes', it: 'Timeout di accesso dopo 15 secondi', de: 'Zeitüberschreitung bei der Anmeldung nach 15 Sekunden' },
  'An error occurred. Please try again.': { es: 'Ocurrió un error. Inténtalo de nuevo.', fr: 'Une erreur est survenue. Réessayez.', it: 'Si è verificato un errore. Riprova.', de: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' },
  'Could not resend the verification code.': { es: 'No se pudo reenviar el código de verificación.', fr: 'Impossible de renvoyer le code de vérification.', it: 'Impossibile reinviare il codice di verifica.', de: 'Der Bestätigungscode konnte nicht erneut gesendet werden.' },
};

const PREFIX_TRANSLATIONS = [
  ['Failed to create goal: ', { es: 'No se pudo crear la meta: ', fr: 'Impossible de créer l’objectif : ', it: 'Impossibile creare l’obiettivo: ', de: 'Ziel konnte nicht erstellt werden: ' }],
  ['Failed to update goal: ', { es: 'No se pudo actualizar la meta: ', fr: 'Impossible de mettre à jour l’objectif : ', it: 'Impossibile aggiornare l’obiettivo: ', de: 'Ziel konnte nicht aktualisiert werden: ' }],
  ['Failed to delete goal: ', { es: 'No se pudo eliminar la meta: ', fr: 'Impossible de supprimer l’objectif : ', it: 'Impossibile eliminare l’obiettivo: ', de: 'Ziel konnte nicht gelöscht werden: ' }],
  ['Failed to mark messages as read: ', { es: 'No se pudieron marcar los mensajes como leídos: ', fr: 'Impossible de marquer les messages comme lus : ', it: 'Impossibile contrassegnare i messaggi come letti: ', de: 'Nachrichten konnten nicht als gelesen markiert werden: ' }],
];

function currentLanguage() {
  try {
    const stored = String(window.localStorage.getItem('preferredLanguage') || 'en').toLowerCase();
    return SUPPORTED_LANGUAGES.has(stored) ? stored : 'en';
  } catch {
    return 'en';
  }
}

export function translateRuntimeText(value, language = currentLanguage()) {
  if (typeof value !== 'string' || language === 'en') return value;
  const leading = value.match(/^\s*/)?.[0] || '';
  const trailing = value.match(/\s*$/)?.[0] || '';
  const core = value.trim();
  if (!core) return value;

  const exact = EXACT_TRANSLATIONS[core]?.[language];
  if (exact) return `${leading}${exact}${trailing}`;

  for (const [prefix, translations] of PREFIX_TRANSLATIONS) {
    if (core.startsWith(prefix) && translations[language]) {
      return `${leading}${translations[language]}${core.slice(prefix.length)}${trailing}`;
    }
  }

  return value;
}

function localizeElementAttributes(element, language) {
  if (!(element instanceof Element)) return;
  for (const attribute of ['placeholder', 'title', 'aria-label']) {
    if (!element.hasAttribute(attribute)) continue;
    const original = element.getAttribute(attribute);
    const localized = translateRuntimeText(original, language);
    if (localized !== original) element.setAttribute(attribute, localized);
  }
}

function localizeSubtree(root) {
  const language = currentLanguage();
  if (language === 'en' || !root) return;

  if (root.nodeType === Node.TEXT_NODE) {
    const localized = translateRuntimeText(root.nodeValue, language);
    if (localized !== root.nodeValue) root.nodeValue = localized;
    return;
  }

  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;

  if (root.nodeType === Node.ELEMENT_NODE) localizeElementAttributes(root, language);

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeType === Node.TEXT_NODE) {
      const localized = translateRuntimeText(node.nodeValue, language);
      if (localized !== node.nodeValue) node.nodeValue = localized;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      localizeElementAttributes(node, language);
    }
  }
}

export function installRuntimeLocalization() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__o2olRuntimeLocalizationInstalled) return;
  window.__o2olRuntimeLocalizationInstalled = true;

  const originalAlert = window.alert.bind(window);
  const originalConfirm = window.confirm.bind(window);
  window.alert = (message) => originalAlert(translateRuntimeText(String(message ?? '')));
  window.confirm = (message) => originalConfirm(translateRuntimeText(String(message ?? '')));

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'characterData') {
        localizeSubtree(mutation.target);
        continue;
      }
      for (const node of mutation.addedNodes) localizeSubtree(node);
    }
  });

  const start = () => {
    localizeSubtree(document.body);
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();

  window.addEventListener('storage', (event) => {
    if (event.key === 'preferredLanguage') localizeSubtree(document.body);
  });
}
