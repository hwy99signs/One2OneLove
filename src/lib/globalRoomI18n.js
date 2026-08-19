export const globalRoomCommonTranslations = {
  en: {
    loading: 'Loading…',
    genericError: 'Something went wrong. Please try again.',
    creatorApplicationError: 'Unable to submit creator application. Please try again.',
    bookingError: 'Unable to submit programming slot. Please try again.',
    cancelError: 'Unable to cancel programming slot. Please try again.',
    pastTime: 'Programming must be scheduled in the future.',
    unavailable: 'That programming time is no longer available.',
    dailyLimit: 'Free creator accounts are limited to 2 programming slots per day.',
    creatorRequired: 'An approved creator profile is required.',
    creatorApprovalRequired: 'Your creator profile must be approved before booking.',
    titleRequired: 'Program title is required.',
    invalidTime: 'Choose a valid start and end time.',
    endAfterStart: 'End time must be after start time.',
  },
  es: {
    loading: 'Cargando…',
    genericError: 'Algo salió mal. Inténtalo de nuevo.',
    creatorApplicationError: 'No se pudo enviar la solicitud de creador. Inténtalo de nuevo.',
    bookingError: 'No se pudo enviar el horario de programación. Inténtalo de nuevo.',
    cancelError: 'No se pudo cancelar el horario. Inténtalo de nuevo.',
    pastTime: 'La programación debe programarse para una hora futura.',
    unavailable: 'Ese horario ya no está disponible.',
    dailyLimit: 'Las cuentas gratuitas de creadores están limitadas a 2 espacios de programación por día.',
    creatorRequired: 'Se requiere un perfil de creador aprobado.',
    creatorApprovalRequired: 'Tu perfil de creador debe ser aprobado antes de reservar.',
    titleRequired: 'Se requiere un título para el programa.',
    invalidTime: 'Elige una hora de inicio y finalización válidas.',
    endAfterStart: 'La hora de finalización debe ser posterior a la hora de inicio.',
  },
  fr: {
    loading: 'Chargement…',
    genericError: 'Une erreur est survenue. Veuillez réessayer.',
    creatorApplicationError: 'Impossible d’envoyer la candidature créateur. Veuillez réessayer.',
    bookingError: 'Impossible d’envoyer le créneau de programmation. Veuillez réessayer.',
    cancelError: 'Impossible d’annuler le créneau. Veuillez réessayer.',
    pastTime: 'Le programme doit être planifié à une heure future.',
    unavailable: 'Ce créneau n’est plus disponible.',
    dailyLimit: 'Les comptes créateurs gratuits sont limités à 2 créneaux de programmation par jour.',
    creatorRequired: 'Un profil créateur approuvé est requis.',
    creatorApprovalRequired: 'Votre profil créateur doit être approuvé avant toute réservation.',
    titleRequired: 'Le titre du programme est requis.',
    invalidTime: 'Choisissez une heure de début et de fin valides.',
    endAfterStart: 'L’heure de fin doit être postérieure à l’heure de début.',
  },
  it: {
    loading: 'Caricamento…',
    genericError: 'Si è verificato un problema. Riprova.',
    creatorApplicationError: 'Impossibile inviare la richiesta creator. Riprova.',
    bookingError: 'Impossibile inviare lo slot di programmazione. Riprova.',
    cancelError: 'Impossibile annullare lo slot. Riprova.',
    pastTime: 'La programmazione deve essere pianificata per un orario futuro.',
    unavailable: 'Quell’orario non è più disponibile.',
    dailyLimit: 'Gli account creator gratuiti sono limitati a 2 slot di programmazione al giorno.',
    creatorRequired: 'È richiesto un profilo creator approvato.',
    creatorApprovalRequired: 'Il profilo creator deve essere approvato prima della prenotazione.',
    titleRequired: 'Il titolo del programma è obbligatorio.',
    invalidTime: 'Scegli un orario di inizio e fine valido.',
    endAfterStart: 'L’orario di fine deve essere successivo a quello di inizio.',
  },
  de: {
    loading: 'Wird geladen…',
    genericError: 'Etwas ist schiefgelaufen. Bitte versuche es erneut.',
    creatorApplicationError: 'Die Creator-Bewerbung konnte nicht gesendet werden. Bitte versuche es erneut.',
    bookingError: 'Der Programmslot konnte nicht gesendet werden. Bitte versuche es erneut.',
    cancelError: 'Der Programmslot konnte nicht storniert werden. Bitte versuche es erneut.',
    pastTime: 'Programme müssen für einen zukünftigen Zeitpunkt geplant werden.',
    unavailable: 'Diese Programmzeit ist nicht mehr verfügbar.',
    dailyLimit: 'Kostenlose Creator-Konten sind auf 2 Programmslots pro Tag begrenzt.',
    creatorRequired: 'Ein freigegebenes Creator-Profil ist erforderlich.',
    creatorApprovalRequired: 'Dein Creator-Profil muss vor der Buchung freigegeben sein.',
    titleRequired: 'Ein Programmtitel ist erforderlich.',
    invalidTime: 'Wähle eine gültige Start- und Endzeit.',
    endAfterStart: 'Die Endzeit muss nach der Startzeit liegen.',
  },
};

export function getGlobalRoomCommonTranslation(language) {
  return globalRoomCommonTranslations[language] || globalRoomCommonTranslations.en;
}

export function translateGlobalRoomServiceError(error, language, fallbackKey = 'genericError') {
  const t = getGlobalRoomCommonTranslation(language);
  const message = String(error || '').toLowerCase();

  if (message.includes('future')) return t.pastTime;
  if (message.includes('no longer available') || message.includes('already booked')) return t.unavailable;
  if (message.includes('programming slots per') || message.includes('limited to')) return t.dailyLimit;
  if (message.includes('approved creator profile required')) return t.creatorRequired;
  if (message.includes('must be approved before booking')) return t.creatorApprovalRequired;
  if (message.includes('program title is required')) return t.titleRequired;
  if (message.includes('valid start and end')) return t.invalidTime;
  if (message.includes('end time must be after')) return t.endAfterStart;

  return t[fallbackKey] || t.genericError;
}
