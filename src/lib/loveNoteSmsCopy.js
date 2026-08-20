export const LOVE_NOTE_SMS_UI_COPY = {
  en: {
    recipientLanguage: 'Recipient SMS language',
    phoneHelp: 'Use the full international number, including country code (example: +15551234567).',
    consentTitle: 'Recipient opt-in required',
    consentBody: 'One2OneLove can send a Love Note by text only after the recipient independently agrees to receive One2OneLove SMS. The sender cannot give consent for someone else.',
    consentMissing: 'This number has not opted in to One2OneLove SMS yet. Choose email or use the approved recipient opt-in process first.',
    optedOut: 'This number has opted out of One2OneLove SMS. No text will be sent unless the recipient opts in again.',
    rates: 'Message and data rates may apply. Reply STOP to opt out; HELP for help.',
  },
  es: {
    recipientLanguage: 'Idioma del SMS del destinatario',
    phoneHelp: 'Usa el número internacional completo, incluido el código de país (ejemplo: +15551234567).',
    consentTitle: 'Se requiere la aceptación del destinatario',
    consentBody: 'One2OneLove solo puede enviar una Nota de Amor por SMS después de que el destinatario acepte de forma independiente recibir SMS de One2OneLove. El remitente no puede dar consentimiento por otra persona.',
    consentMissing: 'Este número aún no ha aceptado recibir SMS de One2OneLove. Elige correo electrónico o utiliza primero el proceso aprobado de aceptación del destinatario.',
    optedOut: 'Este número canceló los SMS de One2OneLove. No se enviará ningún mensaje hasta que el destinatario vuelva a aceptar.',
    rates: 'Pueden aplicarse tarifas de mensajes y datos. Responde STOP para cancelar; HELP para ayuda.',
  },
  fr: {
    recipientLanguage: 'Langue du SMS du destinataire',
    phoneHelp: 'Utilisez le numéro international complet avec l’indicatif du pays (exemple : +15551234567).',
    consentTitle: 'Consentement du destinataire requis',
    consentBody: 'One2OneLove ne peut envoyer un Mot d’Amour par SMS qu’après que le destinataire a lui-même accepté de recevoir des SMS One2OneLove. L’expéditeur ne peut pas consentir à sa place.',
    consentMissing: 'Ce numéro n’a pas encore accepté les SMS One2OneLove. Choisissez l’e-mail ou utilisez d’abord le processus approuvé de consentement du destinataire.',
    optedOut: 'Ce numéro s’est désabonné des SMS One2OneLove. Aucun SMS ne sera envoyé tant que le destinataire ne se sera pas réabonné.',
    rates: 'Des frais de messagerie et de données peuvent s’appliquer. Répondez STOP pour vous désabonner ; HELP pour obtenir de l’aide.',
  },
  it: {
    recipientLanguage: 'Lingua SMS del destinatario',
    phoneHelp: 'Usa il numero internazionale completo con prefisso del Paese (esempio: +15551234567).',
    consentTitle: 'È richiesto il consenso del destinatario',
    consentBody: 'One2OneLove può inviare una Nota d’Amore via SMS solo dopo che il destinatario ha accettato personalmente di ricevere SMS da One2OneLove. Il mittente non può dare il consenso per un’altra persona.',
    consentMissing: 'Questo numero non ha ancora accettato gli SMS One2OneLove. Scegli l’email oppure usa prima il processo approvato di consenso del destinatario.',
    optedOut: 'Questo numero ha revocato il consenso agli SMS One2OneLove. Nessun SMS sarà inviato finché il destinatario non accetterà di nuovo.',
    rates: 'Potrebbero applicarsi costi per messaggi e dati. Rispondi STOP per annullare; HELP per assistenza.',
  },
  de: {
    recipientLanguage: 'SMS-Sprache des Empfängers',
    phoneHelp: 'Verwende die vollständige internationale Nummer einschließlich Ländervorwahl (Beispiel: +15551234567).',
    consentTitle: 'Einwilligung des Empfängers erforderlich',
    consentBody: 'One2OneLove darf eine Liebesnotiz nur dann per SMS senden, wenn der Empfänger selbst dem Empfang von One2OneLove-SMS zugestimmt hat. Der Absender kann nicht für eine andere Person einwilligen.',
    consentMissing: 'Diese Nummer hat One2OneLove-SMS noch nicht zugestimmt. Wähle E-Mail oder nutze zuerst den genehmigten Einwilligungsprozess für den Empfänger.',
    optedOut: 'Diese Nummer hat One2OneLove-SMS abbestellt. Es wird keine SMS gesendet, bis der Empfänger erneut zustimmt.',
    rates: 'Nachrichten- und Datentarife können anfallen. Antworte STOP zum Abbestellen; HELP für Hilfe.',
  },
};

export const loveNoteSmsUiCopy = (language = 'en') =>
  LOVE_NOTE_SMS_UI_COPY[language] || LOVE_NOTE_SMS_UI_COPY.en;
