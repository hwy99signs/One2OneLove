// Voting question registry — the standard O2OL voting-question feature.
//
// One entry per question. Adding next week's question is a CONFIG-ONLY
// change: add an entry here (slug, the chat room it lives in, category keys
// with labels in all 5 languages, bills-split wording, cutoff) and mirror
// the slug/title/category-keys/closesAt in worker/voting.ts (QUESTIONS).
// No new endpoint, table, or component is needed per question.
//
// Category labels and question wording follow Eisenhower's approved
// Relationship 100 post texts verbatim, per language.

export const VOTING_QUESTIONS = [
  {
    slug: 'relationship-100',
    roomSlug: 'relationship-100',
    // Wednesday, October 7 at midnight CT (end of day, America/Chicago).
    closesAt: '2026-10-08T05:00:00.000Z',
    title: {
      en: 'Relationship 100 — What Matters Most in Your Relationship?',
      es: 'Relación 100 — ¿Qué es lo Más Importante en tu Relación?',
      fr: 'Relation 100 — Qu’est-ce qui Compte le Plus dans Votre Relation ?',
      it: 'Relazione 100 — Cosa Conta di Più nella Tua Relazione?',
      de: 'Beziehung 100 — Was Zählt in Deiner Beziehung am Meisten?',
    },
    stem: {
      en: 'If you had 100% to divide among the things that matter most in your relationship, how would you divide it?',
      es: 'Si tuvieras un 100% para repartir entre las cosas que más importan en tu relación, ¿cómo lo repartirías?',
      fr: 'Si vous aviez 100 % à répartir entre les choses qui comptent le plus dans votre relation, comment les répartiriez-vous ?',
      it: 'Se avessi il 100% da dividere tra le cose che contano di più nella tua relazione, come lo divideresti?',
      de: 'Wenn du 100 % auf die Dinge verteilen müsstest, die in deiner Beziehung am wichtigsten sind, wie würdest du sie aufteilen?',
    },
    categories: [
      { key: 'money', labels: { en: 'Money', es: 'Dinero', fr: 'Argent', it: 'Denaro', de: 'Geld' } },
      { key: 'religion', labels: { en: 'Religion/Faith', es: 'Religión/Fe', fr: 'Religion/Foi', it: 'Religione/Fede', de: 'Religion/Glaube' } },
      { key: 'sex_intimacy', labels: { en: 'Sex/Intimacy', es: 'Sexo/Intimidad', fr: 'Sexe/Intimité', it: 'Sesso/Intimità', de: 'Sex/Intimität' } },
      { key: 'politics', labels: { en: 'Politics', es: 'Política', fr: 'Politique', it: 'Politica', de: 'Politik' } },
      { key: 'family', labels: { en: 'Family', es: 'Familia', fr: 'Famille', it: 'Famiglia', de: 'Familie' } },
      { key: 'communication', labels: { en: 'Communication', es: 'Comunicación', fr: 'Communication', it: 'Comunicazione', de: 'Kommunikation' } },
      { key: 'looks_physical_appearance', labels: { en: 'Looks/Physical Appearance', es: 'Apariencia física', fr: 'Apparence physique', it: 'Aspetto fisico', de: 'Aussehen/Äußere Erscheinung' } },
      { key: 'therapy_when_needed', labels: { en: 'Therapy/Counseling When Needed', es: 'Terapia/Consejería cuando sea necesaria', fr: 'Thérapie/Accompagnement quand c’est nécessaire', it: 'Terapia/Consulenza quando serve', de: 'Therapie/Beratung bei Bedarf' } },
      { key: 'help_around_home', labels: { en: 'Help Around the Home', es: 'Ayuda en el hogar', fr: 'Aide à la maison', it: 'Aiuto in casa', de: 'Hilfe im Haushalt' } },
    ],
    bills: {
      stem: {
        en: 'In your ideal relationship, how should household bills and shared expenses be divided?',
        es: 'En tu relación ideal, ¿cómo deberían dividirse las facturas del hogar y los gastos compartidos?',
        fr: 'Dans votre relation idéale, comment les factures du foyer et les dépenses partagées devraient-elles être réparties ?',
        it: 'Nella tua relazione ideale, come dovrebbero essere divise le bollette di casa e le spese condivise?',
        de: 'Wie sollten in deiner idealen Beziehung die Rechnungen und gemeinsamen Ausgaben aufgeteilt werden?',
      },
      youLabels: { en: 'You', es: 'Tú', fr: 'Vous', it: 'Tu', de: 'Du' },
      partnerLabels: { en: 'Your Partner', es: 'Tu pareja', fr: 'Votre partenaire', it: 'Il tuo partner/La tua partner', de: 'Dein Partner/Deine Partnerin' },
    },
    // Optional identity questions (anonymous group comparison). `value` is
    // the canonical label the worker stores; it matches the canonical set
    // the admin analytics canonicalizes (worker/admin.ts canonicalIdentity).
    identity: {
      respondent: [
        { value: 'Man', labels: { en: 'Man', es: 'Hombre', fr: 'Homme', it: 'Uomo', de: 'Mann' } },
        { value: 'Woman', labels: { en: 'Woman', es: 'Mujer', fr: 'Femme', it: 'Donna', de: 'Frau' } },
        { value: 'Nonbinary', labels: { en: 'Nonbinary', es: 'No binario', fr: 'Non-binaire', it: 'Non binario', de: 'Nicht-binär' } },
        { value: 'Prefer not to say', labels: { en: 'Prefer not to say', es: 'Prefiero no decirlo', fr: 'Je préfère ne pas le dire', it: 'Preferisco non dirlo', de: 'Möchte ich nicht sagen' } },
        { value: 'Not currently partnered', labels: { en: 'Not currently partnered', es: 'Actualmente sin pareja', fr: 'Pas en couple actuellement', it: 'Attualmente senza partner', de: 'Aktuell nicht in einer Beziehung' } },
      ],
      partner: [
        { value: 'Man', labels: { en: 'Man', es: 'Hombre', fr: 'Homme', it: 'Uomo', de: 'Mann' } },
        { value: 'Woman', labels: { en: 'Woman', es: 'Mujer', fr: 'Femme', it: 'Donna', de: 'Frau' } },
        { value: 'Nonbinary', labels: { en: 'Nonbinary', es: 'No binario', fr: 'Non-binaire', it: 'Non binario', de: 'Nicht-binär' } },
        { value: 'Prefer not to say', labels: { en: 'Prefer not to say', es: 'Prefiero no decirlo', fr: 'Je préfère ne pas le dire', it: 'Preferisco non dirlo', de: 'Möchte ich nicht sagen' } },
      ],
    },
  },
];

export function questionBySlug(slug) {
  return VOTING_QUESTIONS.find((question) => question.slug === slug) || null;
}

export function questionForRoom(roomSlug) {
  return VOTING_QUESTIONS.find((question) => question.roomSlug === roomSlug) || null;
}
