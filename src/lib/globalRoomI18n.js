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
  },
};

export function getGlobalRoomCommonTranslation(language) {
  return globalRoomCommonTranslations[language] || globalRoomCommonTranslations.en;
}
