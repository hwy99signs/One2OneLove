const LOVE_LANGUAGE_IDS = ['words', 'quality', 'gifts', 'service', 'touch'];

const localeData = {
  en: {
    contexts: [
      'after a stressful workweek',
      'on an ordinary weekday',
      'when celebrating good news',
      'when you are feeling discouraged',
      'after a disagreement',
      'during a very busy season',
      'on your birthday',
      'on an anniversary',
      'when you are sick or tired',
      'before an important event',
      'after spending time apart',
      'during a quiet weekend at home',
      'while traveling together',
      'when you are overwhelmed with responsibilities',
      'when reconnecting after a long day',
      'when planning time together',
      'when you need reassurance'
    ],
    templates: [
      'Thinking about {context}, which response would make you feel most loved?',
      'During {context}, what would matter most to you from your partner?',
      'If you were {context}, which gesture would feel most meaningful?',
      'Around {context}, what would help you feel closest to your partner?',
      'When it comes to {context}, which expression of care would speak most strongly to you?'
    ],
    responses: [
      [
        'Hearing specific words about what they appreciate in me',
        'Having their full attention with no distractions',
        'Receiving a small, thoughtful item chosen with me in mind',
        'Having them take care of something that would lighten my load',
        'Sharing a warm hug or affectionate touch'
      ],
      [
        'A sincere message reminding me why I matter to them',
        'Spending unrushed one-on-one time together',
        'A meaningful surprise that shows they remembered something about me',
        'Seeing them step in and help before I have to ask',
        'Holding hands, cuddling, or sitting close together'
      ],
      [
        'Being encouraged and spoken to with warmth',
        'Doing something together while they are fully present',
        'Receiving a personal token connected to a memory we share',
        'Having a practical task handled for me',
        'A kiss, embrace, or gentle touch'
      ],
      [
        'Hearing them clearly say that they love and value me',
        'Making space in the schedule just for us',
        'Being surprised with something thoughtful, even if it is small',
        'Having them make my day easier through a helpful action',
        'Feeling close through comfortable physical affection'
      ],
      [
        'Getting a heartfelt note, compliment, or expression of gratitude',
        'Sharing focused conversation or an activity without interruptions',
        'Receiving something that reflects my interests or preferences',
        'Having them follow through on something helpful they promised',
        'Being greeted or comforted with affectionate physical closeness'
      ]
    ]
  },
  es: {
    contexts: [
      'después de una semana de trabajo estresante',
      'en un día normal entre semana',
      'al celebrar una buena noticia',
      'cuando te sientes desanimado/a',
      'después de un desacuerdo',
      'durante una temporada muy ocupada',
      'en tu cumpleaños',
      'en un aniversario',
      'cuando estás enfermo/a o cansado/a',
      'antes de un evento importante',
      'después de pasar tiempo separados',
      'durante un fin de semana tranquilo en casa',
      'mientras viajan juntos',
      'cuando estás abrumado/a con responsabilidades',
      'al reconectarse después de un día largo',
      'al planear tiempo juntos',
      'cuando necesitas tranquilidad y seguridad'
    ],
    templates: [
      'Pensando en {context}, ¿qué respuesta te haría sentir más amado/a?',
      'Durante {context}, ¿qué sería lo más importante para ti de parte de tu pareja?',
      'Si estuvieras {context}, ¿qué gesto te parecería más significativo?',
      'En {context}, ¿qué te ayudaría a sentirte más cerca de tu pareja?',
      'Cuando se trata de {context}, ¿qué muestra de cariño te llegaría más?'
    ],
    responses: [
      [
        'Escuchar palabras específicas sobre lo que aprecia de mí',
        'Tener toda su atención sin distracciones',
        'Recibir un pequeño detalle elegido pensando en mí',
        'Que se encargue de algo que alivie mi carga',
        'Compartir un abrazo cálido o un toque cariñoso'
      ],
      [
        'Un mensaje sincero recordándome por qué soy importante para esa persona',
        'Pasar tiempo a solas juntos sin prisas',
        'Una sorpresa significativa que demuestre que recordó algo sobre mí',
        'Que intervenga para ayudar antes de que tenga que pedirlo',
        'Tomarnos de la mano, acurrucarnos o sentarnos cerca'
      ],
      [
        'Recibir ánimo y palabras cálidas',
        'Hacer algo juntos con atención total',
        'Recibir un detalle personal relacionado con un recuerdo compartido',
        'Que se encargue de una tarea práctica por mí',
        'Un beso, un abrazo o un toque suave'
      ],
      [
        'Escuchar claramente que me ama y me valora',
        'Reservar espacio en la agenda solo para nosotros',
        'Recibir una sorpresa considerada, aunque sea pequeña',
        'Que haga mi día más fácil con una acción útil',
        'Sentir cercanía mediante afecto físico cómodo y natural'
      ],
      [
        'Recibir una nota sincera, un cumplido o una expresión de gratitud',
        'Compartir una conversación o actividad enfocada sin interrupciones',
        'Recibir algo que refleje mis intereses o preferencias',
        'Que cumpla con algo útil que prometió hacer',
        'Ser recibido/a o consolado/a con cercanía física afectuosa'
      ]
    ]
  },
  fr: {
    contexts: [
      'après une semaine de travail stressante',
      'pendant une journée ordinaire',
      'lorsque vous célébrez une bonne nouvelle',
      'lorsque vous vous sentez découragé(e)',
      'après un désaccord',
      'pendant une période très chargée',
      'le jour de votre anniversaire',
      'lors d’un anniversaire de couple',
      'lorsque vous êtes malade ou fatigué(e)',
      'avant un événement important',
      'après avoir passé du temps séparés',
      'pendant un week-end tranquille à la maison',
      'lorsque vous voyagez ensemble',
      'lorsque vous êtes submergé(e) par les responsabilités',
      'lorsque vous vous retrouvez après une longue journée',
      'lorsque vous planifiez du temps ensemble',
      'lorsque vous avez besoin d’être rassuré(e)'
    ],
    templates: [
      'En pensant à {context}, quelle réponse vous ferait vous sentir le plus aimé(e) ?',
      'Pendant {context}, qu’est-ce qui compterait le plus pour vous de la part de votre partenaire ?',
      'Si vous étiez {context}, quel geste vous semblerait le plus significatif ?',
      'Autour de {context}, qu’est-ce qui vous aiderait à vous sentir le plus proche de votre partenaire ?',
      'Quand il s’agit de {context}, quelle marque d’attention vous toucherait le plus ?'
    ],
    responses: [
      [
        'Entendre des mots précis sur ce que mon partenaire apprécie chez moi',
        'Avoir toute son attention sans distraction',
        'Recevoir un petit objet attentionné choisi en pensant à moi',
        'Le voir s’occuper de quelque chose qui allégerait ma charge',
        'Partager une étreinte chaleureuse ou un geste tendre'
      ],
      [
        'Un message sincère me rappelant pourquoi je compte pour mon partenaire',
        'Passer du temps à deux sans être pressés',
        'Une surprise significative montrant qu’il ou elle s’est souvenu(e) de quelque chose à mon sujet',
        'Le voir intervenir pour aider avant même que je le demande',
        'Se tenir la main, se blottir ou s’asseoir proches l’un de l’autre'
      ],
      [
        'Être encouragé(e) et entendre des paroles chaleureuses',
        'Faire quelque chose ensemble avec une présence totale',
        'Recevoir un souvenir personnel lié à un moment que nous partageons',
        'Voir une tâche pratique prise en charge pour moi',
        'Un baiser, une étreinte ou un toucher doux'
      ],
      [
        'L’entendre dire clairement qu’il ou elle m’aime et me valorise',
        'Réserver du temps dans l’emploi du temps uniquement pour nous',
        'Être surpris(e) par quelque chose d’attentionné, même petit',
        'Le voir rendre ma journée plus facile par une action utile',
        'Ressentir notre proximité grâce à une affection physique naturelle'
      ],
      [
        'Recevoir un mot sincère, un compliment ou une expression de gratitude',
        'Partager une conversation ou une activité concentrée sans interruption',
        'Recevoir quelque chose qui reflète mes goûts ou mes intérêts',
        'Le voir tenir une promesse qui m’aide concrètement',
        'Être accueilli(e) ou réconforté(e) par une proximité physique affectueuse'
      ]
    ]
  },
  it: {
    contexts: [
      'dopo una settimana di lavoro stressante',
      'in un normale giorno feriale',
      'quando festeggiate una buona notizia',
      'quando ti senti scoraggiato/a',
      'dopo un disaccordo',
      'durante un periodo molto impegnativo',
      'nel giorno del tuo compleanno',
      'in occasione di un anniversario',
      'quando sei malato/a o stanco/a',
      'prima di un evento importante',
      'dopo aver trascorso del tempo separati',
      'durante un tranquillo fine settimana a casa',
      'mentre viaggiate insieme',
      'quando sei sopraffatto/a dalle responsabilità',
      'quando vi ritrovate dopo una lunga giornata',
      'quando pianificate del tempo insieme',
      'quando hai bisogno di rassicurazione'
    ],
    templates: [
      'Pensando a {context}, quale risposta ti farebbe sentire più amato/a?',
      'Durante {context}, cosa conterebbe di più per te da parte del tuo partner?',
      'Se fossi {context}, quale gesto ti sembrerebbe più significativo?',
      'In {context}, cosa ti aiuterebbe a sentirti più vicino/a al tuo partner?',
      'Quando si tratta di {context}, quale espressione di cura ti toccherebbe di più?'
    ],
    responses: [
      [
        'Sentire parole specifiche su ciò che il mio partner apprezza di me',
        'Avere tutta la sua attenzione senza distrazioni',
        'Ricevere un piccolo pensiero scelto pensando a me',
        'Vederlo occuparsi di qualcosa che alleggerirebbe il mio carico',
        'Condividere un abbraccio caldo o un gesto affettuoso'
      ],
      [
        'Un messaggio sincero che mi ricorda perché sono importante',
        'Trascorrere del tempo tranquillo insieme, senza fretta',
        'Una sorpresa significativa che dimostra che si è ricordato/a di qualcosa su di me',
        'Vederlo intervenire per aiutare prima che io debba chiederlo',
        'Tenersi per mano, coccolarsi o sedersi vicini'
      ],
      [
        'Essere incoraggiato/a e sentire parole calorose',
        'Fare qualcosa insieme con piena presenza',
        'Ricevere un piccolo ricordo personale legato a un momento condiviso',
        'Avere un compito pratico svolto per me',
        'Un bacio, un abbraccio o un tocco delicato'
      ],
      [
        'Sentirgli dire chiaramente che mi ama e mi apprezza',
        'Creare spazio nel programma solo per noi',
        'Essere sorpreso/a con qualcosa di premuroso, anche piccolo',
        'Vederlo rendere la mia giornata più facile con un’azione utile',
        'Sentire vicinanza attraverso un affetto fisico naturale'
      ],
      [
        'Ricevere una nota sincera, un complimento o un’espressione di gratitudine',
        'Condividere una conversazione o un’attività senza interruzioni',
        'Ricevere qualcosa che rifletta i miei interessi o preferenze',
        'Vederlo mantenere una promessa che mi aiuta concretamente',
        'Essere accolto/a o confortato/a con vicinanza fisica affettuosa'
      ]
    ]
  },
  de: {
    contexts: [
      'nach einer stressigen Arbeitswoche',
      'an einem ganz normalen Wochentag',
      'beim Feiern guter Nachrichten',
      'wenn Sie sich entmutigt fühlen',
      'nach einer Meinungsverschiedenheit',
      'während einer sehr arbeitsreichen Zeit',
      'an Ihrem Geburtstag',
      'an einem Jahrestag',
      'wenn Sie krank oder müde sind',
      'vor einem wichtigen Ereignis',
      'nachdem Sie Zeit getrennt verbracht haben',
      'an einem ruhigen Wochenende zu Hause',
      'während Sie gemeinsam reisen',
      'wenn Sie von Verpflichtungen überwältigt sind',
      'wenn Sie sich nach einem langen Tag wiedersehen',
      'wenn Sie gemeinsame Zeit planen',
      'wenn Sie Bestätigung und Sicherheit brauchen'
    ],
    templates: [
      'Wenn Sie an {context} denken, welche Reaktion würde Ihnen am meisten das Gefühl geben, geliebt zu werden?',
      'Was würde Ihnen während {context} von Ihrem Partner am meisten bedeuten?',
      'Welches Zeichen der Zuneigung wäre für Sie bei {context} am bedeutungsvollsten?',
      'Was würde Ihnen bei {context} helfen, sich Ihrem Partner am nächsten zu fühlen?',
      'Welche Form der Fürsorge würde Sie bei {context} am stärksten ansprechen?'
    ],
    responses: [
      [
        'Konkrete Worte darüber hören, was mein Partner an mir schätzt',
        'Seine ungeteilte Aufmerksamkeit ohne Ablenkungen haben',
        'Eine kleine, durchdachte Aufmerksamkeit erhalten, die für mich ausgesucht wurde',
        'Dass mein Partner etwas übernimmt, das meine Belastung verringert',
        'Eine warme Umarmung oder liebevolle Berührung teilen'
      ],
      [
        'Eine aufrichtige Nachricht bekommen, die mich daran erinnert, warum ich wichtig bin',
        'Entspannte Zeit nur zu zweit verbringen',
        'Eine bedeutungsvolle Überraschung, die zeigt, dass mein Partner sich an etwas über mich erinnert hat',
        'Dass mein Partner hilft, bevor ich darum bitten muss',
        'Händchen halten, kuscheln oder nah beieinandersitzen'
      ],
      [
        'Ermutigt werden und warme Worte hören',
        'Etwas gemeinsam tun und dabei volle Aufmerksamkeit füreinander haben',
        'Ein persönliches Andenken erhalten, das mit einer gemeinsamen Erinnerung verbunden ist',
        'Dass eine praktische Aufgabe für mich erledigt wird',
        'Ein Kuss, eine Umarmung oder eine sanfte Berührung'
      ],
      [
        'Klar hören, dass mein Partner mich liebt und wertschätzt',
        'Im Kalender bewusst Zeit nur für uns reservieren',
        'Mit etwas Durchdachtem überrascht werden, auch wenn es klein ist',
        'Dass mein Partner meinen Tag durch eine hilfreiche Handlung leichter macht',
        'Nähe durch angenehme körperliche Zuneigung spüren'
      ],
      [
        'Eine herzliche Notiz, ein Kompliment oder Dankbarkeit erhalten',
        'Ein konzentriertes Gespräch oder eine Aktivität ohne Unterbrechungen teilen',
        'Etwas bekommen, das meine Interessen oder Vorlieben widerspiegelt',
        'Dass mein Partner etwas Hilfreiches einhält, das er versprochen hat',
        'Mit liebevoller körperlicher Nähe begrüßt oder getröstet werden'
      ]
    ]
  },
  nl: {
    contexts: [
      'na een stressvolle werkweek',
      'op een gewone doordeweekse dag',
      'bij het vieren van goed nieuws',
      'wanneer je je ontmoedigd voelt',
      'na een meningsverschil',
      'tijdens een erg drukke periode',
      'op je verjaardag',
      'op een jubileum',
      'wanneer je ziek of moe bent',
      'voor een belangrijke gebeurtenis',
      'nadat jullie tijd apart hebben doorgebracht',
      'tijdens een rustig weekend thuis',
      'terwijl jullie samen reizen',
      'wanneer je overweldigd bent door verantwoordelijkheden',
      'wanneer jullie na een lange dag weer samen zijn',
      'wanneer jullie tijd samen plannen',
      'wanneer je geruststelling nodig hebt'
    ],
    templates: [
      'Als je denkt aan {context}, welke reactie zou je je het meest geliefd laten voelen?',
      'Wat zou tijdens {context} het meest voor je betekenen van je partner?',
      'Welk gebaar zou bij {context} voor jou het meest betekenisvol zijn?',
      'Wat zou je bij {context} helpen om je het dichtst bij je partner te voelen?',
      'Welke vorm van zorg zou je bij {context} het sterkst raken?'
    ],
    responses: [
      [
        'Specifieke woorden horen over wat mijn partner in mij waardeert',
        'Hun volledige aandacht hebben zonder afleiding',
        'Een klein, attent cadeautje krijgen dat met mij in gedachten is gekozen',
        'Dat mijn partner iets overneemt wat mijn last lichter maakt',
        'Een warme knuffel of liefdevolle aanraking delen'
      ],
      [
        'Een oprecht bericht krijgen dat me eraan herinnert waarom ik belangrijk ben',
        'Rustige één-op-één-tijd samen doorbrengen',
        'Een betekenisvolle verrassing die laat zien dat mijn partner iets over mij heeft onthouden',
        'Dat mijn partner helpt voordat ik erom hoef te vragen',
        'Handen vasthouden, knuffelen of dicht bij elkaar zitten'
      ],
      [
        'Aangemoedigd worden en warme woorden horen',
        'Samen iets doen met volledige aandacht voor elkaar',
        'Een persoonlijk aandenken krijgen dat verbonden is met een gedeelde herinnering',
        'Dat een praktische taak voor mij wordt afgehandeld',
        'Een kus, omhelzing of zachte aanraking'
      ],
      [
        'Duidelijk horen dat mijn partner van me houdt en me waardeert',
        'Bewust ruimte in de agenda maken alleen voor ons',
        'Verrast worden met iets attents, ook al is het klein',
        'Dat mijn partner mijn dag makkelijker maakt met een behulpzame actie',
        'Nabijheid voelen door prettige lichamelijke genegenheid'
      ],
      [
        'Een oprecht briefje, compliment of blijk van dankbaarheid krijgen',
        'Een gericht gesprek of activiteit delen zonder onderbrekingen',
        'Iets krijgen dat mijn interesses of voorkeuren weerspiegelt',
        'Dat mijn partner iets behulpzaams nakomt wat is beloofd',
        'Begroet of getroost worden met liefdevolle lichamelijke nabijheid'
      ]
    ]
  },
  pt: {
    contexts: [
      'depois de uma semana de trabalho estressante',
      'em um dia comum da semana',
      'ao comemorar uma boa notícia',
      'quando você está desanimado(a)',
      'depois de um desentendimento',
      'durante uma fase muito corrida',
      'no seu aniversário',
      'em um aniversário do relacionamento',
      'quando você está doente ou cansado(a)',
      'antes de um evento importante',
      'depois de passarem um tempo separados',
      'durante um fim de semana tranquilo em casa',
      'enquanto viajam juntos',
      'quando você está sobrecarregado(a) de responsabilidades',
      'ao se reencontrarem depois de um longo dia',
      'ao planejarem tempo juntos',
      'quando você precisa de segurança e reafirmação'
    ],
    templates: [
      'Pensando em {context}, qual resposta faria você se sentir mais amado(a)?',
      'Durante {context}, o que mais importaria para você vindo do seu parceiro?',
      'Em {context}, qual gesto pareceria mais significativo para você?',
      'Em {context}, o que ajudaria você a se sentir mais próximo(a) do seu parceiro?',
      'Quando se trata de {context}, qual demonstração de cuidado falaria mais forte com você?'
    ],
    responses: [
      [
        'Ouvir palavras específicas sobre o que meu parceiro aprecia em mim',
        'Ter toda a atenção dele sem distrações',
        'Receber um pequeno presente atencioso escolhido pensando em mim',
        'Que ele cuide de algo que alivie minha carga',
        'Compartilhar um abraço caloroso ou um toque carinhoso'
      ],
      [
        'Uma mensagem sincera me lembrando por que sou importante',
        'Passar um tempo tranquilo a sós juntos',
        'Uma surpresa significativa que mostre que meu parceiro se lembrou de algo sobre mim',
        'Que ele se ofereça para ajudar antes de eu precisar pedir',
        'Dar as mãos, ficar abraçados ou sentar perto um do outro'
      ],
      [
        'Ser encorajado(a) e ouvir palavras calorosas',
        'Fazer algo juntos com atenção total um ao outro',
        'Receber uma lembrança pessoal ligada a uma memória que compartilhamos',
        'Ter uma tarefa prática resolvida por mim',
        'Um beijo, abraço ou toque suave'
      ],
      [
        'Ouvir claramente que meu parceiro me ama e me valoriza',
        'Reservar espaço na agenda apenas para nós',
        'Ser surpreendido(a) com algo atencioso, mesmo que pequeno',
        'Que meu parceiro torne meu dia mais fácil com uma ação útil',
        'Sentir proximidade por meio de afeto físico confortável'
      ],
      [
        'Receber um bilhete sincero, elogio ou expressão de gratidão',
        'Compartilhar uma conversa ou atividade focada sem interrupções',
        'Receber algo que reflita meus interesses ou preferências',
        'Que meu parceiro cumpra algo útil que prometeu fazer',
        'Ser recebido(a) ou confortado(a) com proximidade física carinhosa'
      ]
    ]
  }
};

const shuffleArray = (items) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const normalizeBaseQuestions = (baseQuestions = []) => baseQuestions.map((question, questionIndex) => ({
  id: `base-${questionIndex}`,
  question: question.question,
  options: question.options.map((text, optionIndex) => ({
    text,
    value: LOVE_LANGUAGE_IDS[optionIndex]
  }))
}));

export const buildLoveLanguageQuestionBank = (baseQuestions = [], language = 'en') => {
  const localized = localeData[language] || localeData.en;
  const base = normalizeBaseQuestions(baseQuestions);
  const supplemental = [];

  localized.contexts.forEach((context, contextIndex) => {
    localized.templates.forEach((template, templateIndex) => {
      const responseSet = localized.responses[templateIndex % localized.responses.length];
      supplemental.push({
        id: `supplemental-${contextIndex}-${templateIndex}`,
        question: template.replace('{context}', context),
        options: responseSet.map((text, optionIndex) => ({
          text,
          value: LOVE_LANGUAGE_IDS[optionIndex]
        }))
      });
    });
  });

  const needed = Math.max(0, 100 - base.length);
  return [...base.slice(0, 100), ...supplemental.slice(0, needed)].slice(0, 100);
};

export const buildLoveLanguageQuizSession = (baseQuestions = [], language = 'en', sessionSize = 15) => {
  const bank = buildLoveLanguageQuestionBank(baseQuestions, language);
  const selected = shuffleArray(bank).slice(0, Math.min(sessionSize, bank.length));

  return selected.map(question => ({
    ...question,
    options: shuffleArray(question.options)
  }));
};
