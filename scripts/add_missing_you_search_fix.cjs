const fs = require('fs');
const vm = require('vm');

const langs = ['en','es','fr','it','de'];

const notes = {
  en: {
    romantic: [
      ['I Miss Your Presence','I miss the way everything feels a little better when you are beside me. I cannot wait to be close to you again.'],
      ['Counting Down to You','I keep counting the days until I can see you again. Missing you only reminds me how much you mean to me.'],
      ['Wish You Were Here','I wish you were here so I could trade this distance for your smile, your touch, and a quiet moment together.'],
      ['Distance Feels Longer','The distance feels longer today because my heart keeps reaching for you. I miss you more than these words can say.'],
      ['Until We Are Together Again','Until we are together again, carry this with you: you are loved, wanted, and deeply missed.']
    ],
    family: [
      ['Missing Home With You','Home does not feel quite the same when you are not here. I miss your presence and the comfort you bring to our family.'],
      ['Family Feels Far Away','No matter how many miles are between us, you are still close in my heart. I miss you and cannot wait until we are together again.'],
      ['Thinking of You, Family','I have been thinking about you today and missing the little things that make being family so special.'],
      ['Save Me a Seat','Save me a seat, a story, and a hug. I miss being together and making ordinary family moments feel special.'],
      ['Cannot Wait for Our Next Hug','I miss you more than I expected. I am already looking forward to the next family hug and the time we get to share.']
    ],
    friends: [
      ['Miss Our Laughs','I miss the kind of laughter that only happens when we are together. We are overdue for some friend time.'],
      ['We Need a Catch-Up','I miss you, my friend. We have stories to tell, laughs to recover, and a proper catch-up waiting for us.'],
      ['Friendship Across the Miles','Distance can change the scenery, but it does not change the friendship. I miss you and think of you often.'],
      ['It Is Not the Same Without You','Things are simply not the same without you around. I miss your energy, your humor, and having my friend nearby.'],
      ['Come Back Soon','Come back soon—or at least call me. I miss my friend, and there is far too much life to catch up on.']
    ]
  },
  es: {
    romantic: [
      ['Extraño Tu Presencia','Extraño cómo todo se siente un poco mejor cuando estás a mi lado. No veo la hora de volver a estar cerca de ti.'],
      ['Contando los Días para Verte','Sigo contando los días hasta volver a verte. Extrañarte solo me recuerda cuánto significas para mí.'],
      ['Ojalá Estuvieras Aquí','Ojalá estuvieras aquí para cambiar esta distancia por tu sonrisa, tu cariño y un momento tranquilo juntos.'],
      ['La Distancia Se Siente Más Larga','Hoy la distancia se siente más larga porque mi corazón sigue buscándote. Te extraño más de lo que estas palabras pueden decir.'],
      ['Hasta Que Estemos Juntos Otra Vez','Hasta que volvamos a estar juntos, recuerda esto: eres amado, deseado y profundamente extrañado.']
    ],
    family: [
      ['Te Extraño en Casa','La casa no se siente igual cuando no estás. Extraño tu presencia y el cariño que aportas a nuestra familia.'],
      ['La Familia Se Siente Lejos','No importa cuántos kilómetros haya entre nosotros, sigues cerca de mi corazón. Te extraño y deseo que volvamos a estar juntos.'],
      ['Pensando en Ti, Familia','Hoy he estado pensando en ti y extrañando esas pequeñas cosas que hacen tan especial ser familia.'],
      ['Guárdame un Lugar','Guárdame un lugar, una historia y un abrazo. Extraño estar juntos y compartir nuestros momentos familiares.'],
      ['Espero Nuestro Próximo Abrazo','Te extraño más de lo que esperaba. Ya estoy deseando el próximo abrazo familiar y el tiempo que compartiremos.']
    ],
    friends: [
      ['Extraño Nuestras Risas','Extraño esa clase de risa que solo aparece cuando estamos juntos. Ya nos hace falta tiempo de amigos.'],
      ['Necesitamos Ponernos al Día','Te extraño, amigo. Tenemos historias que contar, risas pendientes y una buena conversación esperándonos.'],
      ['Amistad a la Distancia','La distancia puede cambiar el paisaje, pero no cambia nuestra amistad. Te extraño y pienso en ti a menudo.'],
      ['No Es Igual Sin Ti','Las cosas simplemente no son iguales cuando no estás. Extraño tu energía, tu humor y tener a mi amigo cerca.'],
      ['Vuelve Pronto','Vuelve pronto, o al menos llámame. Extraño a mi amigo y tenemos demasiadas cosas que contarnos.']
    ]
  },
  fr: {
    romantic: [
      ['Ta Présence Me Manque','Tout semble un peu mieux quand tu es près de moi. Ta présence me manque et j’ai hâte de te retrouver.'],
      ['Je Compte les Jours','Je compte les jours jusqu’à ce que je puisse te revoir. Ton absence me rappelle simplement combien tu comptes pour moi.'],
      ['J’aimerais Que Tu Sois Ici','J’aimerais que tu sois ici pour remplacer cette distance par ton sourire, ta tendresse et un moment tranquille ensemble.'],
      ['La Distance Paraît Plus Longue','Aujourd’hui, la distance paraît plus longue parce que mon cœur te cherche sans cesse. Tu me manques énormément.'],
      ['Jusqu’à Nos Retrouvailles','Jusqu’à ce que nous soyons réunis, garde ceci en toi : tu es aimé, désiré et profondément regretté.']
    ],
    family: [
      ['Tu Manques à la Maison','La maison n’est pas tout à fait la même sans toi. Ta présence et la chaleur que tu apportes à notre famille me manquent.'],
      ['La Famille Semble Loin','Peu importe les kilomètres entre nous, tu restes proche de mon cœur. Tu me manques et j’ai hâte que nous soyons réunis.'],
      ['Je Pense à Toi, Ma Famille','Je pense à toi aujourd’hui et les petits moments qui rendent la famille si précieuse me manquent.'],
      ['Garde-Moi une Place','Garde-moi une place, une histoire et un câlin. Les moments simples en famille me manquent.'],
      ['Hâte de Notre Prochain Câlin','Tu me manques plus que je ne l’aurais imaginé. J’attends déjà notre prochain câlin en famille avec impatience.']
    ],
    friends: [
      ['Nos Fous Rires Me Manquent','Les rires que nous partageons me manquent. Il est grand temps que nous retrouvions un peu de temps entre amis.'],
      ['Il Faut Qu’on Se Raconte Tout','Tu me manques, mon ami. Nous avons des histoires, des rires et une vraie conversation à rattraper.'],
      ['Amitié Malgré la Distance','La distance change le décor, pas l’amitié. Tu me manques et je pense souvent à toi.'],
      ['Ce N’est Pas Pareil Sans Toi','Ce n’est tout simplement pas pareil sans toi. Ton énergie, ton humour et ta présence me manquent.'],
      ['Reviens Vite','Reviens vite, ou appelle-moi au moins. Mon ami me manque et nous avons beaucoup trop de choses à nous raconter.']
    ]
  },
  it: {
    romantic: [
      ['Mi Manca la Tua Presenza','Mi manca il modo in cui tutto sembra un po’ più bello quando sei accanto a me. Non vedo l’ora di riaverti vicino.'],
      ['Conto i Giorni per Rivederti','Continuo a contare i giorni fino a quando potrò rivederti. La tua mancanza mi ricorda quanto sei importante per me.'],
      ['Vorrei Che Fossi Qui','Vorrei che fossi qui per sostituire questa distanza con il tuo sorriso, il tuo affetto e un momento tranquillo insieme.'],
      ['La Distanza Sembra Più Lunga','Oggi la distanza sembra più lunga perché il mio cuore continua a cercarti. Mi manchi più di quanto riesca a dire.'],
      ['Finché Saremo di Nuovo Insieme','Finché non saremo di nuovo insieme, ricorda questo: sei amato, desiderato e mi manchi profondamente.']
    ],
    family: [
      ['Mi Manchi a Casa','La casa non sembra la stessa quando non ci sei. Mi manca la tua presenza e il calore che porti alla nostra famiglia.'],
      ['La Famiglia Sembra Lontana','Non importa quanti chilometri ci separano, sei sempre vicino al mio cuore. Mi manchi e non vedo l’ora di stare di nuovo insieme.'],
      ['Ti Penso, Famiglia','Oggi ti penso e mi mancano le piccole cose che rendono così speciale essere una famiglia.'],
      ['Tienimi un Posto','Tienimi un posto, una storia e un abbraccio. Mi manca stare insieme e condividere i nostri semplici momenti di famiglia.'],
      ['Aspetto il Nostro Prossimo Abbraccio','Mi manchi più di quanto pensassi. Non vedo già l’ora del prossimo abbraccio in famiglia e del tempo insieme.']
    ],
    friends: [
      ['Mi Mancano le Nostre Risate','Mi manca quel tipo di risata che nasce solo quando siamo insieme. È ora di ritrovarci tra amici.'],
      ['Dobbiamo Aggiornarci','Mi manchi, amico mio. Abbiamo storie da raccontare, risate da recuperare e una bella chiacchierata che ci aspetta.'],
      ['Amicizia a Distanza','La distanza può cambiare il panorama, ma non cambia l’amicizia. Mi manchi e ti penso spesso.'],
      ['Non È lo Stesso Senza di Te','Le cose semplicemente non sono le stesse senza di te. Mi mancano la tua energia, il tuo umorismo e averti vicino.'],
      ['Torna Presto','Torna presto, o almeno chiamami. Mi manca il mio amico e abbiamo troppe cose da raccontarci.']
    ]
  },
  de: {
    romantic: [
      ['Deine Nähe Fehlt Mir','Alles fühlt sich ein wenig besser an, wenn du bei mir bist. Deine Nähe fehlt mir und ich kann es kaum erwarten, dich wieder bei mir zu haben.'],
      ['Ich Zähle die Tage','Ich zähle die Tage, bis ich dich wiedersehen kann. Dich zu vermissen erinnert mich nur daran, wie viel du mir bedeutest.'],
      ['Ich Wünschte, Du Wärst Hier','Ich wünschte, du wärst hier, damit diese Entfernung deinem Lächeln, deiner Nähe und einem ruhigen Moment zu zweit Platz macht.'],
      ['Die Entfernung Fühlt Sich Größer An','Heute fühlt sich die Entfernung größer an, weil mein Herz immer wieder nach dir sucht. Du fehlst mir mehr, als Worte sagen können.'],
      ['Bis Wir Wieder Zusammen Sind','Bis wir wieder zusammen sind, vergiss das nicht: Du wirst geliebt, gebraucht und sehr vermisst.']
    ],
    family: [
      ['Du Fehlst Zu Hause','Zu Hause fühlt es sich nicht ganz gleich an, wenn du nicht da bist. Deine Nähe und die Wärme, die du unserer Familie gibst, fehlen mir.'],
      ['Die Familie Fühlt Sich Weit Weg An','Egal wie viele Kilometer zwischen uns liegen, in meinem Herzen bist du nah. Du fehlst mir und ich freue mich auf unser Wiedersehen.'],
      ['Ich Denke an Dich, Familie','Heute denke ich an dich und vermisse die kleinen Dinge, die Familie so besonders machen.'],
      ['Halt Mir Einen Platz Frei','Halt mir einen Platz, eine Geschichte und eine Umarmung frei. Mir fehlt unsere gemeinsame Familienzeit.'],
      ['Ich Freue Mich auf Unsere Nächste Umarmung','Du fehlst mir mehr, als ich erwartet habe. Ich freue mich schon auf unsere nächste Familienumarmung und gemeinsame Zeit.']
    ],
    friends: [
      ['Unser Lachen Fehlt Mir','Mir fehlt dieses Lachen, das nur entsteht, wenn wir zusammen sind. Es wird Zeit für echte Freundeszeit.'],
      ['Wir Müssen Uns Austauschen','Du fehlst mir, mein Freund. Wir haben Geschichten, Lachen und ein richtiges Gespräch nachzuholen.'],
      ['Freundschaft Über die Entfernung','Entfernung verändert die Aussicht, aber nicht unsere Freundschaft. Du fehlst mir und ich denke oft an dich.'],
      ['Ohne Dich Ist Es Nicht Dasselbe','Ohne dich ist es einfach nicht dasselbe. Deine Energie, dein Humor und deine Nähe fehlen mir.'],
      ['Komm Bald Wieder','Komm bald wieder oder ruf mich wenigstens an. Mein Freund fehlt mir und wir haben viel zu viel nachzuholen.']
    ]
  }
};

function loadAdditional(path) {
  let src = fs.readFileSync(path, 'utf8');
  src = src.replace('export default', 'globalThis.additional =');
  const ctx = { globalThis: {} };
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  return ctx.globalThis.additional;
}

for (const lang of langs) {
  const path = `src/components/lovenotes/additional/LoveNotesAdditional.${lang}.js`;
  const data = loadAdditional(path);
  const missingYou = [];
  for (const relation of ['romantic','family','friends']) {
    for (const [title, content] of notes[lang][relation]) {
      missingYou.push({ title, content, tags: ['missing', 'you', relation] });
    }
  }
  if (missingYou.length !== 15) throw new Error(`${lang}: Missing You must have 15 notes`);
  data.missingYou = missingYou;
  fs.writeFileSync(path, `// Additional Love Notes categories for this language.\nexport default ${JSON.stringify(data, null, 2)};\n`);
}

const pagePath = 'src/pages/LoveNotes.jsx';
let page = fs.readFileSync(pagePath, 'utf8');

const labelInsertions = [
  ['      holiday: "Holiday",', '      holiday: "Holiday",\n      missingYou: "Missing You",'],
  ['      holiday: "Festividades",', '      holiday: "Festividades",\n      missingYou: "Te Echo de Menos",'],
  ['      holiday: "Fêtes",', '      holiday: "Fêtes",\n      missingYou: "Tu Me Manques",'],
  ['      holiday: "Festività",', '      holiday: "Festività",\n      missingYou: "Mi Manchi",'],
  ['      holiday: "Feiertage",', '      holiday: "Feiertage",\n      missingYou: "Du Fehlst Mir",']
];
for (const [needle, replacement] of labelInsertions) {
  if (!page.includes(needle)) throw new Error(`Missing translation anchor: ${needle}`);
  page = page.replace(needle, replacement);
}

const categoryAnchor = "  { id: 'holiday', name: t.categories.holiday, icon: '🎊' },";
if (!page.includes(categoryAnchor)) throw new Error('Missing Holiday category anchor');
page = page.replace(categoryAnchor, `${categoryAnchor}\n  { id: 'missingYou', name: t.categories.missingYou, icon: '💌' },`);

const orderAnchor = "    'holiday', 'religious', 'service', 'workplace'";
if (!page.includes(orderAnchor)) throw new Error('Missing category order anchor');
page = page.replace(orderAnchor, "    'holiday', 'missingYou', 'religious', 'service', 'workplace'");

const helperAnchor = '\nexport default function LoveNotes() {';
if (!page.includes(helperAnchor)) throw new Error('Missing LoveNotes component anchor');
const searchHelpers = `\nconst getSearchWords = (value) =>\n  String(value || '')\n    .toLocaleLowerCase()\n    .normalize('NFD')\n    .replace(/[\\u0300-\\u036f]/g, '')\n    .match(/[a-z0-9]+/g) || [];\n\nconst matchesLoveNoteSearch = (note, query) => {\n  const queryWords = getSearchWords(query);\n  if (queryWords.length === 0) return true;\n\n  const searchableWords = getSearchWords([\n    note.title,\n    note.content,\n    ...(Array.isArray(note.tags) ? note.tags : []),\n  ].join(' '));\n\n  return queryWords.every(queryWord =>\n    searchableWords.some(word => word.startsWith(queryWord))\n  );\n};\n`;
page = page.replace(helperAnchor, `${searchHelpers}${helperAnchor}`);

const oldSearch = `    if (searchQuery.trim()) {\n      const searchLower = searchQuery.toLowerCase();\n      filtered = personalizedNotes.filter(note =>\n        note.title.toLowerCase().includes(searchLower) ||\n        note.content.toLowerCase().includes(searchLower) ||\n        note.tags.some(tag => tag.toLowerCase().includes(searchLower))\n      );\n    } else {\n        filtered = personalizedNotes;\n    }`;
const newSearch = `    if (searchQuery.trim()) {\n      filtered = personalizedNotes.filter(note => matchesLoveNoteSearch(note, searchQuery));\n    } else {\n        filtered = personalizedNotes;\n    }`;
if (!page.includes(oldSearch)) throw new Error('Existing Love Notes search block not found');
page = page.replace(oldSearch, newSearch);

fs.writeFileSync(pagePath, page);

// Search behavior regression checks.
const testWords = (value) => String(value || '').toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').match(/[a-z0-9]+/g) || [];
const testMatch = (text, query) => {
  const queryWords = testWords(query);
  const words = testWords(text);
  return queryWords.every(q => words.some(w => w.startsWith(q)));
};
if (testMatch('Give yourself permission to heal.', 'miss')) throw new Error('Search regression: miss must not match permission');
if (!testMatch("You're missed, and we cannot wait to see you.", 'miss')) throw new Error('Search regression: miss should match missed');
if (!testMatch('I am missing you today.', 'miss')) throw new Error('Search regression: miss should match missing');
if (testMatch('The mission begins tomorrow.', 'miss')) throw new Error('Search regression: miss must not match mission');

console.log('Missing You category added in five languages and word-aware search installed.');
