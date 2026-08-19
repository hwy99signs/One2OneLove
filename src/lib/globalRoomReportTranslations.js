export const GLOBAL_ROOM_REPORT_REASONS = [
  'misleading',
  'harassment',
  'hate',
  'sexual_content',
  'self_harm',
  'violence',
  'spam',
  'other',
];

const translations = {
  en: {
    misleading: 'Misleading or harmful advice',
    harassment: 'Harassment or bullying',
    hate: 'Hate or hateful conduct',
    sexual_content: 'Inappropriate sexual content',
    self_harm: 'Self-harm concern',
    violence: 'Violence or threats',
    spam: 'Spam or deceptive promotion',
    other: 'Other',
  },
  es: {
    misleading: 'Consejo engañoso o dañino',
    harassment: 'Acoso o intimidación',
    hate: 'Odio o conducta de odio',
    sexual_content: 'Contenido sexual inapropiado',
    self_harm: 'Preocupación por autolesión',
    violence: 'Violencia o amenazas',
    spam: 'Spam o promoción engañosa',
    other: 'Otro',
  },
  fr: {
    misleading: 'Conseil trompeur ou nuisible',
    harassment: 'Harcèlement ou intimidation',
    hate: 'Haine ou conduite haineuse',
    sexual_content: 'Contenu sexuel inapproprié',
    self_harm: 'Risque d’automutilation',
    violence: 'Violence ou menaces',
    spam: 'Spam ou promotion trompeuse',
    other: 'Autre',
  },
  it: {
    misleading: 'Consiglio fuorviante o dannoso',
    harassment: 'Molestie o bullismo',
    hate: 'Odio o condotta d’odio',
    sexual_content: 'Contenuto sessuale inappropriato',
    self_harm: 'Preoccupazione per autolesionismo',
    violence: 'Violenza o minacce',
    spam: 'Spam o promozione ingannevole',
    other: 'Altro',
  },
  de: {
    misleading: 'Irreführender oder schädlicher Rat',
    harassment: 'Belästigung oder Mobbing',
    hate: 'Hass oder hasserfülltes Verhalten',
    sexual_content: 'Unangemessene sexuelle Inhalte',
    self_harm: 'Sorge wegen Selbstverletzung',
    violence: 'Gewalt oder Drohungen',
    spam: 'Spam oder täuschende Werbung',
    other: 'Andere',
  },
};

export function getGlobalRoomReportReasonTranslations(language) {
  return translations[language] || translations.en;
}
