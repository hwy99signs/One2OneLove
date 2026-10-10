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

// ---------------------------------------------------------------------------
// CLICK-TO-VOTE registry (owner design, 2026-10-10).
//
// One-tap choice questions. Each question is bound to a chat room: a cast
// vote posts into that room under the voter's name/visitor number, results
// collect in the burgundy tab at the foot of the chat cards, and Amora (the
// chat rooms' host) is programmed to answer votes she has a stance on —
// her choice and her one-line reason are pre-written here per question.
// The homepage card rolls through these in order; a member resumes at
// their first unvoted question. Mirror slug/roomSlug/choice keys and
// Amora's choice in worker/voting.ts (CHOICE_QUESTIONS).
// ---------------------------------------------------------------------------

export const CLICK_VOTE_QUESTIONS = [
  {
    slug: 'ctv-first-date-bill',
    roomSlug: 'dating-new-relationships',
    question: {
      en: 'First date. Her order is $75 — yours is $25. The check lands in front of you. What do you do?',
      es: 'Primera cita. Lo que ella pidió cuesta $75 — lo tuyo, $25. La cuenta llega frente a ti. ¿Qué haces?',
      fr: 'Premier rendez-vous. Sa commande : 75 $. La vôtre : 25 $. L’addition arrive devant vous. Que faites-vous ?',
      it: 'Primo appuntamento. Il suo ordine costa $75 — il tuo, $25. Il conto arriva davanti a te. Cosa fai?',
      de: 'Erstes Date. Ihre Bestellung kostet 75 $ — deine 25 $. Die Rechnung landet vor dir. Was tust du?',
    },
    choices: [
      { key: 'a', labels: { en: 'Pay for both', es: 'Pagar por los dos', fr: 'Payer pour les deux', it: 'Pagare per entrambi', de: 'Für beide zahlen' } },
      { key: 'b', labels: { en: 'Split it', es: 'Dividir la cuenta', fr: 'Partager l’addition', it: 'Dividere il conto', de: 'Die Rechnung teilen' } },
      { key: 'c', labels: { en: 'Pay only mine', es: 'Pagar solo lo mío', fr: 'Payer seulement ma part', it: 'Pagare solo la mia parte', de: 'Nur meinen Teil zahlen' } },
      { key: 'd', labels: { en: 'Depends on the date', es: 'Depende de la cita', fr: 'Ça dépend du rendez-vous', it: 'Dipende dall’appuntamento', de: 'Kommt auf das Date an' } },
    ],
    amora: {
      choice: 'a',
      reason: {
        en: 'a first date is an invitation, not an invoice — generosity sets the tone.',
        es: 'una primera cita es una invitación, no una factura — la generosidad marca el tono.',
        fr: 'un premier rendez-vous est une invitation, pas une facture — la générosité donne le ton.',
        it: 'un primo appuntamento è un invito, non una fattura — la generosità dà il tono.',
        de: 'ein erstes Date ist eine Einladung, keine Rechnung — Großzügigkeit setzt den Ton.',
      },
    },
  },
  {
    slug: 'ctv-dutch-switch',
    roomSlug: 'general-connection',
    question: {
      en: 'He said he would pay for the date. The tab comes — and he goes Dutch instead. What do you do?',
      es: 'Él dijo que pagaría la cita. Llega la cuenta — y propone dividirla. ¿Qué haces?',
      fr: 'Il avait dit qu’il paierait le rendez-vous. L’addition arrive — et il propose de partager. Que faites-vous ?',
      it: 'Aveva detto che avrebbe pagato lui l’appuntamento. Arriva il conto — e propone di dividere. Cosa fai?',
      de: 'Er sagte, er würde für das Date zahlen. Die Rechnung kommt — und er will plötzlich teilen. Was tust du?',
    },
    choices: [
      { key: 'a', labels: { en: 'Pay my half, no drama', es: 'Pagar mi mitad, sin drama', fr: 'Payer ma moitié, sans drame', it: 'Pagare la mia metà, senza drammi', de: 'Meine Hälfte zahlen, kein Drama' } },
      { key: 'b', labels: { en: 'Pay — but no second date', es: 'Pagar — pero sin segunda cita', fr: 'Payer — mais pas de deuxième rendez-vous', it: 'Pagare — ma niente secondo appuntamento', de: 'Zahlen — aber kein zweites Date' } },
      { key: 'c', labels: { en: 'Say something right there', es: 'Decir algo en el momento', fr: 'Dire quelque chose sur le moment', it: 'Dire qualcosa subito', de: 'Es sofort ansprechen' } },
      { key: 'd', labels: { en: 'It wouldn’t bother me', es: 'No me molestaría', fr: 'Ça ne me dérangerait pas', it: 'Non mi darebbe fastidio', de: 'Es würde mich nicht stören' } },
    ],
    amora: {
      choice: 'b',
      reason: {
        en: 'the money is small; changing your word is not.',
        es: 'el dinero es poco; faltar a tu palabra, no.',
        fr: 'l’argent, c’est peu de chose ; revenir sur sa parole, non.',
        it: 'i soldi sono pochi; rimangiarsi la parola, no.',
        de: 'das Geld ist wenig; sein Wort zu brechen ist es nicht.',
      },
    },
  },
  {
    slug: 'ctv-naked-pics',
    roomSlug: 'communication-conflict',
    question: {
      en: 'One week of talking, hours on the phone — then they ask for naked pictures. What do you do?',
      es: 'Una semana hablando, horas por teléfono — y te piden fotos desnudo/a. ¿Qué haces?',
      fr: 'Une semaine à discuter, des heures au téléphone — puis on vous demande des photos dénudées. Que faites-vous ?',
      it: 'Una settimana a parlare, ore al telefono — poi ti chiedono foto di nudo. Cosa fai?',
      de: 'Eine Woche geredet, stundenlang telefoniert — dann fragt die Person nach Nacktfotos. Was tust du?',
    },
    choices: [
      { key: 'a', labels: { en: 'Send them — we’re adults', es: 'Enviarlas — somos adultos', fr: 'Les envoyer — nous sommes adultes', it: 'Inviarle — siamo adulti', de: 'Schicken — wir sind erwachsen' } },
      { key: 'b', labels: { en: 'Say no, keep talking', es: 'Decir no y seguir hablando', fr: 'Dire non et continuer à discuter', it: 'Dire di no e continuare a parlare', de: 'Nein sagen, weiterreden' } },
      { key: 'c', labels: { en: 'Say no, and end it', es: 'Decir no y terminar todo', fr: 'Dire non et tout arrêter', it: 'Dire di no e chiudere tutto', de: 'Nein sagen und es beenden' } },
      { key: 'd', labels: { en: 'Not yet — too soon', es: 'Todavía no — es muy pronto', fr: 'Pas encore — trop tôt', it: 'Non ancora — troppo presto', de: 'Noch nicht — zu früh' } },
    ],
    amora: {
      choice: 'b',
      reason: {
        en: 'a real connection survives a boundary — and their reaction to “no” tells you everything.',
        es: 'una conexión real sobrevive a un límite — y su reacción ante un «no» lo dice todo.',
        fr: 'une vraie connexion survit à une limite — et leur réaction à un « non » dit tout.',
        it: 'una connessione vera sopravvive a un limite — e la loro reazione a un «no» dice tutto.',
        de: 'eine echte Verbindung übersteht eine Grenze — und die Reaktion auf ein „Nein“ sagt alles.',
      },
    },
  },
  {
    slug: 'ctv-sex-exclusive',
    roomSlug: 'love-intimacy-connection',
    question: {
      en: 'They say sex is a MUST before they’ll decide on being exclusive. What do you do?',
      es: 'Dicen que el sexo es OBLIGATORIO antes de decidir ser exclusivos. ¿Qué haces?',
      fr: 'Ils disent que le sexe est OBLIGATOIRE avant de décider d’être exclusifs. Que faites-vous ?',
      it: 'Dicono che il sesso è OBBLIGATORIO prima di decidere per l’esclusività. Cosa fai?',
      de: 'Die Person sagt, Sex sei ein MUSS, bevor sie sich für Exklusivität entscheidet. Was tust du?',
    },
    choices: [
      { key: 'a', labels: { en: 'Agree — chemistry matters', es: 'Aceptar — la química importa', fr: 'Accepter — l’alchimie compte', it: 'Accettare — la chimica conta', de: 'Zustimmen — Chemie zählt' } },
      { key: 'b', labels: { en: 'Exclusive first, then sex', es: 'Primero exclusividad, luego sexo', fr: 'D’abord l’exclusivité, ensuite le sexe', it: 'Prima l’esclusività, poi il sesso', de: 'Erst Exklusivität, dann Sex' } },
      { key: 'c', labels: { en: 'Talk it through together', es: 'Hablarlo juntos', fr: 'En parler ensemble', it: 'Parlarne insieme', de: 'Gemeinsam darüber reden' } },
      { key: 'd', labels: { en: 'Walk away', es: 'Alejarse', fr: 'Partir', it: 'Andarsene', de: 'Gehen' } },
    ],
    amora: {
      choice: 'c',
      reason: {
        en: 'exclusivity is a decision two people make out loud — not a test one person sets.',
        es: 'la exclusividad es una decisión que dos personas toman en voz alta — no una prueba que pone una sola.',
        fr: 'l’exclusivité est une décision que deux personnes prennent à voix haute — pas un test imposé par l’une d’elles.',
        it: 'l’esclusività è una decisione che due persone prendono ad alta voce — non un test imposto da una sola.',
        de: 'Exklusivität ist eine Entscheidung, die zwei Menschen laut treffen — kein Test, den einer stellt.',
      },
    },
  },
  {
    slug: 'ctv-never-offers',
    roomSlug: 'marriage-partnership',
    question: {
      en: 'Two months of dates. You’ve paid every time — and your partner has never once offered. What do you do?',
      es: 'Dos meses de citas. Has pagado siempre — y tu pareja nunca se ha ofrecido ni una vez. ¿Qué haces?',
      fr: 'Deux mois de rendez-vous. Vous avez payé à chaque fois — et votre partenaire n’a jamais proposé une seule fois. Que faites-vous ?',
      it: 'Due mesi di appuntamenti. Hai pagato sempre tu — e il tuo partner non si è mai offerto, neanche una volta. Cosa fai?',
      de: 'Zwei Monate Dates. Du hast jedes Mal gezahlt — und dein Partner hat es kein einziges Mal angeboten. Was tust du?',
    },
    choices: [
      { key: 'a', labels: { en: 'Say something kindly', es: 'Decirlo con amabilidad', fr: 'Le dire avec bienveillance', it: 'Dirlo con gentilezza', de: 'Es freundlich ansprechen' } },
      { key: 'b', labels: { en: 'Keep paying quietly', es: 'Seguir pagando en silencio', fr: 'Continuer à payer en silence', it: 'Continuare a pagare in silenzio', de: 'Weiter still zahlen' } },
      { key: 'c', labels: { en: 'Start splitting things', es: 'Empezar a dividir gastos', fr: 'Commencer à partager les frais', it: 'Iniziare a dividere le spese', de: 'Anfangen zu teilen' } },
      { key: 'd', labels: { en: 'Reconsider the relationship', es: 'Replantearse la relación', fr: 'Repenser la relation', it: 'Ripensare la relazione', de: 'Die Beziehung überdenken' } },
    ],
    amora: {
      choice: 'a',
      reason: {
        en: 'silence about money turns into resentment — a kind word early saves a hard one later.',
        es: 'el silencio sobre el dinero se vuelve resentimiento — una palabra amable a tiempo ahorra una dura después.',
        fr: 'le silence sur l’argent devient du ressentiment — un mot gentil tôt évite un mot dur plus tard.',
        it: 'il silenzio sui soldi diventa risentimento — una parola gentile presto ne risparmia una dura dopo.',
        de: 'Schweigen über Geld wird zu Groll — ein freundliches Wort früh erspart ein hartes später.',
      },
    },
  },
  {
    slug: 'ctv-profile-active',
    roomSlug: 'trust-boundaries-growth',
    question: {
      en: 'You agreed to be exclusive — but their dating profile is still active. What do you do?',
      es: 'Acordaron ser exclusivos — pero su perfil de citas sigue activo. ¿Qué haces?',
      fr: 'Vous avez convenu d’être exclusifs — mais leur profil de rencontre est toujours actif. Que faites-vous ?',
      it: 'Avete deciso di essere esclusivi — ma il loro profilo di incontri è ancora attivo. Cosa fai?',
      de: 'Ihr habt Exklusivität vereinbart — aber das Dating-Profil der Person ist noch aktiv. Was tust du?',
    },
    choices: [
      { key: 'a', labels: { en: 'Ask them calmly', es: 'Preguntar con calma', fr: 'Leur demander calmement', it: 'Chiedere con calma', de: 'Ruhig nachfragen' } },
      { key: 'b', labels: { en: 'Watch and wait', es: 'Observar y esperar', fr: 'Observer et attendre', it: 'Osservare e aspettare', de: 'Beobachten und abwarten' } },
      { key: 'c', labels: { en: 'Confront them', es: 'Confrontarlos', fr: 'Les confronter', it: 'Affrontarli', de: 'Zur Rede stellen' } },
      { key: 'd', labels: { en: 'End it', es: 'Terminar la relación', fr: 'Y mettre fin', it: 'Chiudere la relazione', de: 'Es beenden' } },
    ],
    amora: {
      choice: 'a',
      reason: {
        en: 'ask before you accuse — but believe the answer you get.',
        es: 'pregunta antes de acusar — pero cree la respuesta que recibas.',
        fr: 'demandez avant d’accuser — mais croyez la réponse que vous obtenez.',
        it: 'chiedi prima di accusare — ma credi alla risposta che ricevi.',
        de: 'frag, bevor du beschuldigst — aber glaube der Antwort, die du bekommst.',
      },
    },
  },
];

export function clickQuestionBySlug(slug) {
  return CLICK_VOTE_QUESTIONS.find((question) => question.slug === slug) || null;
}
