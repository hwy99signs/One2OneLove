export const LIKE_MINDED_PREVIEW_LIMIT = 5;
export const LIKE_MINDED_DAILY_LIMITS = Object.freeze({ Free: 10, Premiere: 63, Exclusive: null });
export const LIKE_MINDED_MAX_ROOM_QUESTIONS = 42;

const DEPTH_ORDER = {
  Easy: ['Easy','Real','Deep'],
  Real: ['Real','Deep','Easy'],
  Deep: ['Deep','Real','Easy'],
};

export function depthKey(depth) {
  return depth === 'Easy' ? 'easy' : depth === 'Deep' ? 'deep' : 'real';
}

export function buildLikeMindedSlot(categories, startCategory, startDepth, setNo = 1, questionNo = 1) {
  const list = Array.isArray(categories) && categories.length ? categories : [];
  if (!list.length) return { category: startCategory, depth: startDepth || 'Real', questionId: '' };
  const start = Math.max(0, list.indexOf(startCategory));
  const absolute = Math.max(0, (Number(setNo || 1) - 1) * 21 + (Number(questionNo || 1) - 1));
  const round = Math.floor(absolute / list.length) % 3;
  const within = absolute % list.length;
  const depthOrder = DEPTH_ORDER[startDepth] || DEPTH_ORDER.Real;
  const depth = depthOrder[round];
  const category = list[(start + within + round * 5) % list.length];
  return { category, depth, questionId: category + ':' + depthKey(depth), absoluteIndex: absolute };
}

const TEXT = {
  en: {
    weekend:['Active and adventurous','Relaxed and cozy','Social and outgoing','A mix of all three'],
    importance:['Essential','Very important','Somewhat important','Not very important'],
    tradeoff:['Protect the relationship','Protect the long-term plan','Find a workable compromise','It depends on the situation'],
    timing:['Talk about it right away','Take a short pause first','Wait until both are ready','I need plenty of time'],
    disagreement:['Understand each other first','Solve the problem first','Keep the conversation respectful','It depends on the issue'],
    repair:['Listen again before responding','Explain it a different way','Pause and come back calmer','It depends on what happened'],
    similarity:['Very important to match','Helpful, but not required','Differences can work well','It depends on the subject'],
    involvement:['Very involved together','Some involvement with clear limits','Mostly independent as a couple','It depends on the situation'],
    structure:['I like a clear plan','I prefer flexibility','A balance of both','It depends on the day'],
    money:['Save and plan first','Enjoy life now','Balance saving and spending','It depends on the goal'],
    boundary:['Keep the boundary firm','Allow some flexibility','Decide case by case','Talk it through together'],
    future:['Plan well ahead','Adapt as life changes','Plan the big things only','Keep it mostly spontaneous'],
    fun:['Adventurous','Playful and silly','Relaxed and easy','A mix depending on the mood'],
    humor:['Joke about almost anything','Playful, but know the line','Keep serious topics serious','It depends on the moment'],
    activities:['Active and outdoors','Creative or hands-on','Relaxing together','A mix of different things'],
    travel:['Explore and adventure','Food, comfort and culture','Plan the details','Stay spontaneous'],
    entertainment:['Go out and be social','Movies, music or shows','Games and interactive fun','A mix of everything'],
    daily:['Structured routine','Flexible routine','Slow and easy pace','Fast and productive pace'],
    openness:['Very open','Open, but with care','Private about some things','It depends on the topic'],
    change:['Both should adapt','Meet somewhere in the middle','Respect the difference','It depends on how serious it is'],
  },
  es: {
    weekend:['Activo y aventurero','Relajado y acogedor','Social y animado','Una mezcla de los tres'],
    importance:['Esencial','Muy importante','Algo importante','Poco importante'],
    tradeoff:['Proteger la relación','Proteger el plan a largo plazo','Buscar un compromiso viable','Depende de la situación'],
    timing:['Hablarlo de inmediato','Tomar una pausa corta primero','Esperar a que ambos estén listos','Necesito bastante tiempo'],
    disagreement:['Entenderse primero','Resolver el problema primero','Mantener el respeto','Depende del tema'],
    repair:['Escuchar de nuevo antes de responder','Explicarlo de otra manera','Pausar y volver más tranquilos','Depende de lo ocurrido'],
    similarity:['Muy importante coincidir','Ayuda, pero no es obligatorio','Las diferencias pueden funcionar','Depende del tema'],
    involvement:['Muy involucrados juntos','Algo de participación con límites claros','Mayormente independientes como pareja','Depende de la situación'],
    structure:['Me gusta un plan claro','Prefiero flexibilidad','Un equilibrio de ambos','Depende del día'],
    money:['Ahorrar y planificar primero','Disfrutar la vida ahora','Equilibrar ahorro y gasto','Depende de la meta'],
    boundary:['Mantener el límite firme','Permitir algo de flexibilidad','Decidir caso por caso','Hablarlo juntos'],
    future:['Planificar con mucha anticipación','Adaptarse a los cambios','Planificar solo lo importante','Mantenerlo bastante espontáneo'],
    fun:['Aventurero','Juguetón y divertido','Relajado y tranquilo','Una mezcla según el ánimo'],
    humor:['Bromear sobre casi todo','Ser juguetón, pero conocer el límite','Tomar en serio los temas serios','Depende del momento'],
    activities:['Activo y al aire libre','Creativo o manual','Relajarse juntos','Una mezcla de actividades'],
    travel:['Explorar y aventurarse','Comida, comodidad y cultura','Planificar los detalles','Ser espontáneo'],
    entertainment:['Salir y socializar','Películas, música o espectáculos','Juegos y diversión interactiva','Una mezcla de todo'],
    daily:['Rutina estructurada','Rutina flexible','Ritmo lento y tranquilo','Ritmo rápido y productivo'],
    openness:['Muy abierto','Abierto, pero con cuidado','Privado en algunas cosas','Depende del tema'],
    change:['Ambos deben adaptarse','Encontrarse a mitad de camino','Respetar la diferencia','Depende de qué tan serio sea'],
  },
  fr: {
    weekend:['Actif et aventureux','Détendu et confortable','Social et dynamique','Un mélange des trois'],
    importance:['Essentiel','Très important','Assez important','Peu important'],
    tradeoff:['Protéger la relation','Protéger le projet à long terme','Trouver un compromis viable','Cela dépend de la situation'],
    timing:['En parler tout de suite','Faire une courte pause','Attendre que les deux soient prêts','J’ai besoin de beaucoup de temps'],
    disagreement:['Se comprendre d’abord','Résoudre le problème d’abord','Rester respectueux','Cela dépend du sujet'],
    repair:['Écouter à nouveau avant de répondre','Expliquer autrement','Faire une pause et revenir plus calme','Cela dépend de ce qui s’est passé'],
    similarity:['Très important d’être alignés','Utile, mais pas obligatoire','Les différences peuvent fonctionner','Cela dépend du sujet'],
    involvement:['Très impliqués ensemble','Une certaine implication avec des limites claires','Plutôt indépendants comme couple','Cela dépend de la situation'],
    structure:['J’aime un plan clair','Je préfère la flexibilité','Un équilibre des deux','Cela dépend du jour'],
    money:['Épargner et planifier d’abord','Profiter de la vie maintenant','Équilibrer épargne et dépenses','Cela dépend de l’objectif'],
    boundary:['Garder la limite ferme','Permettre un peu de flexibilité','Décider au cas par cas','En parler ensemble'],
    future:['Planifier longtemps à l’avance','S’adapter aux changements','Planifier seulement les grandes choses','Rester plutôt spontané'],
    fun:['Aventureux','Joueur et drôle','Détendu et simple','Un mélange selon l’humeur'],
    humor:['Plaisanter sur presque tout','Être joueur tout en connaissant la limite','Garder les sujets sérieux sérieux','Cela dépend du moment'],
    activities:['Actif et en plein air','Créatif ou manuel','Se détendre ensemble','Un mélange d’activités'],
    travel:['Explorer et partir à l’aventure','Cuisine, confort et culture','Planifier les détails','Rester spontané'],
    entertainment:['Sortir et être sociable','Films, musique ou spectacles','Jeux et activités interactives','Un mélange de tout'],
    daily:['Routine structurée','Routine flexible','Rythme lent et tranquille','Rythme rapide et productif'],
    openness:['Très ouvert','Ouvert, mais avec prudence','Privé sur certaines choses','Cela dépend du sujet'],
    change:['Les deux devraient s’adapter','Se retrouver à mi-chemin','Respecter la différence','Cela dépend de son importance'],
  },
  it: {
    weekend:['Attivo e avventuroso','Rilassato e accogliente','Sociale e dinamico','Un mix di tutti e tre'],
    importance:['Essenziale','Molto importante','Abbastanza importante','Poco importante'],
    tradeoff:['Proteggere la relazione','Proteggere il piano a lungo termine','Trovare un compromesso pratico','Dipende dalla situazione'],
    timing:['Parlarne subito','Fare prima una breve pausa','Aspettare che entrambi siano pronti','Ho bisogno di molto tempo'],
    disagreement:['Capirsi prima','Risolvere prima il problema','Mantenere rispetto nella conversazione','Dipende dal problema'],
    repair:['Ascoltare di nuovo prima di rispondere','Spiegarlo in un altro modo','Fare una pausa e tornare più calmi','Dipende da cosa è successo'],
    similarity:['Molto importante essere allineati','Utile, ma non necessario','Le differenze possono funzionare','Dipende dall’argomento'],
    involvement:['Molto coinvolti insieme','Un po’ coinvolti con limiti chiari','Per lo più indipendenti come coppia','Dipende dalla situazione'],
    structure:['Mi piace un piano chiaro','Preferisco flessibilità','Un equilibrio tra i due','Dipende dalla giornata'],
    money:['Risparmiare e pianificare prima','Godersi la vita adesso','Bilanciare risparmio e spesa','Dipende dall’obiettivo'],
    boundary:['Mantenere il limite fermo','Consentire un po’ di flessibilità','Decidere caso per caso','Parlarne insieme'],
    future:['Pianificare con largo anticipo','Adattarsi mentre la vita cambia','Pianificare solo le cose importanti','Restare piuttosto spontanei'],
    fun:['Avventuroso','Giocoso e divertente','Rilassato e semplice','Un mix secondo l’umore'],
    humor:['Scherzare su quasi tutto','Essere giocosi ma conoscere il limite','Tenere seri gli argomenti seri','Dipende dal momento'],
    activities:['Attivo e all’aperto','Creativo o manuale','Rilassarsi insieme','Un mix di cose diverse'],
    travel:['Esplorare e avventurarsi','Cibo, comfort e cultura','Pianificare i dettagli','Restare spontanei'],
    entertainment:['Uscire e socializzare','Film, musica o spettacoli','Giochi e divertimento interattivo','Un mix di tutto'],
    daily:['Routine strutturata','Routine flessibile','Ritmo lento e tranquillo','Ritmo veloce e produttivo'],
    openness:['Molto aperto','Aperto, ma con attenzione','Privato su alcune cose','Dipende dall’argomento'],
    change:['Entrambi dovrebbero adattarsi','Incontrarsi a metà strada','Rispettare la differenza','Dipende da quanto è serio'],
  },
  de: {
    weekend:['Aktiv und abenteuerlich','Entspannt und gemütlich','Gesellig und unternehmungslustig','Eine Mischung aus allem'],
    importance:['Unverzichtbar','Sehr wichtig','Etwas wichtig','Nicht besonders wichtig'],
    tradeoff:['Die Beziehung schützen','Den langfristigen Plan schützen','Einen tragfähigen Kompromiss finden','Es kommt auf die Situation an'],
    timing:['Sofort darüber sprechen','Erst kurz Pause machen','Warten, bis beide bereit sind','Ich brauche viel Zeit'],
    disagreement:['Erst einander verstehen','Erst das Problem lösen','Respektvoll bleiben','Es kommt auf das Thema an'],
    repair:['Noch einmal zuhören, bevor man antwortet','Es anders erklären','Pause machen und ruhiger zurückkommen','Es kommt darauf an, was passiert ist'],
    similarity:['Sehr wichtig, ähnlich zu sein','Hilfreich, aber nicht nötig','Unterschiede können gut funktionieren','Es kommt auf das Thema an'],
    involvement:['Sehr stark gemeinsam eingebunden','Etwas Beteiligung mit klaren Grenzen','Als Paar eher unabhängig','Es kommt auf die Situation an'],
    structure:['Ich mag einen klaren Plan','Ich bevorzuge Flexibilität','Eine Mischung aus beidem','Es kommt auf den Tag an'],
    money:['Zuerst sparen und planen','Das Leben jetzt genießen','Sparen und Ausgeben ausgleichen','Es kommt auf das Ziel an'],
    boundary:['Die Grenze klar halten','Etwas Flexibilität zulassen','Von Fall zu Fall entscheiden','Gemeinsam darüber sprechen'],
    future:['Weit im Voraus planen','Sich an Veränderungen anpassen','Nur die großen Dinge planen','Meist spontan bleiben'],
    fun:['Abenteuerlich','Verspielt und albern','Entspannt und unkompliziert','Je nach Stimmung eine Mischung'],
    humor:['Über fast alles scherzen','Verspielt sein, aber die Grenze kennen','Ernste Themen ernst lassen','Es kommt auf den Moment an'],
    activities:['Aktiv und draußen','Kreativ oder praktisch','Gemeinsam entspannen','Eine Mischung verschiedener Dinge'],
    travel:['Entdecken und Abenteuer erleben','Essen, Komfort und Kultur','Die Details planen','Spontan bleiben'],
    entertainment:['Ausgehen und gesellig sein','Filme, Musik oder Shows','Spiele und interaktive Aktivitäten','Eine Mischung aus allem'],
    daily:['Strukturierte Routine','Flexible Routine','Langsames und ruhiges Tempo','Schnelles und produktives Tempo'],
    openness:['Sehr offen','Offen, aber mit Bedacht','Bei manchen Dingen privat','Es kommt auf das Thema an'],
    change:['Beide sollten sich anpassen','Sich in der Mitte treffen','Den Unterschied respektieren','Es hängt davon ab, wie ernst es ist'],
  },
};

const STYLE = {
  'Relationship Goals': {easy:'weekend',real:'importance',deep:'tradeoff'},
  Communication: {easy:'timing',real:'disagreement',deep:'repair'},
  Values: {easy:'similarity',real:'importance',deep:'tradeoff'},
  Family: {easy:'involvement',real:'boundary',deep:'tradeoff'},
  Lifestyle: {easy:'structure',real:'similarity',deep:'change'},
  'Money & Ambition': {easy:'money',real:'importance',deep:'tradeoff'},
  Boundaries: {easy:'boundary',real:'boundary',deep:'change'},
  'Future Priorities': {easy:'future',real:'importance',deep:'tradeoff'},
  'Fun Scenarios': {easy:'fun',real:'structure',deep:'tradeoff'},
  Humor: {easy:'humor',real:'importance',deep:'boundary'},
  Activities: {easy:'activities',real:'similarity',deep:'change'},
  'Food & Travel': {easy:'travel',real:'structure',deep:'tradeoff'},
  Entertainment: {easy:'entertainment',real:'similarity',deep:'change'},
  'Daily Preferences': {easy:'daily',real:'importance',deep:'change'},
  'Wild Card': {easy:'fun',real:'tradeoff',deep:'openness'},
};

export function getLikeMindedAnswerChoices(category, depth, language = 'en') {
  const lang = TEXT[language] ? language : 'en';
  const key = STYLE[category]?.[depthKey(depth)] || 'openness';
  return TEXT[lang][key] || TEXT.en[key] || TEXT.en.openness;
}

export function normalizeLikeMindedTier(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'exclusive' || raw === 'elite') return 'Exclusive';
  if (raw === 'premiere' || raw === 'premier') return 'Premiere';
  return 'Free';
}
