export const MMIQ_DIMENSIONS = [
  { id:'values', label:{en:'Values & priorities',es:'Valores y prioridades',fr:'Valeurs et priorités',it:'Valori e priorità',de:'Werte & Prioritäten'} },
  { id:'communication', label:{en:'Communication',es:'Comunicación',fr:'Communication',it:'Comunicazione',de:'Kommunikation'} },
  { id:'conflict', label:{en:'Conflict & repair',es:'Conflicto y reparación',fr:'Conflit et réparation',it:'Conflitto e riparazione',de:'Konflikt & Wiedergutmachung'} },
  { id:'emotional_needs', label:{en:'Emotional needs',es:'Necesidades emocionales',fr:'Besoins émotionnels',it:'Bisogni emotivi',de:'Emotionale Bedürfnisse'} },
  { id:'expectations', label:{en:'Relationship expectations',es:'Expectativas de relación',fr:'Attentes relationnelles',it:'Aspettative relazionali',de:'Beziehungserwartungen'} },
  { id:'commitment', label:{en:'Commitment',es:'Compromiso',fr:'Engagement',it:'Impegno',de:'Verbindlichkeit'} },
  { id:'lifestyle', label:{en:'Lifestyle',es:'Estilo de vida',fr:'Mode de vie',it:'Stile di vita',de:'Lebensstil'} },
  { id:'finances', label:{en:'Finances',es:'Finanzas',fr:'Finances',it:'Finanze',de:'Finanzen'} },
  { id:'intimacy', label:{en:'Intimacy & affection',es:'Intimidad y afecto',fr:'Intimité et affection',it:'Intimità e affetto',de:'Intimität & Zuneigung'} },
  { id:'family', label:{en:'Family',es:'Familia',fr:'Famille',it:'Famiglia',de:'Familie'} },
  { id:'boundaries', label:{en:'Boundaries & consent',es:'Límites y consentimiento',fr:'Limites et consentement',it:'Confini e consenso',de:'Grenzen & Einwilligung'} },
  { id:'stress', label:{en:'Stress & coping',es:'Estrés y afrontamiento',fr:'Stress et adaptation',it:'Stress e gestione',de:'Stress & Bewältigung'} },
  { id:'time', label:{en:'Time & availability',es:'Tiempo y disponibilidad',fr:'Temps et disponibilité',it:'Tempo e disponibilità',de:'Zeit & Verfügbarkeit'} },
  { id:'life_planning', label:{en:'Life planning',es:'Planificación de vida',fr:'Planification de vie',it:'Pianificazione della vita',de:'Lebensplanung'} },
  { id:'safety', label:{en:'Safety & red flags',es:'Seguridad y señales de alerta',fr:'Sécurité et signaux d’alerte',it:'Sicurezza e segnali d’allarme',de:'Sicherheit & Warnsignale'} },
];

const FACETS = [
  {id:'clarity',label:{en:'clarity',es:'claridad',fr:'clarté',it:'chiarezza',de:'Klarheit'}},
  {id:'consistency',label:{en:'consistency',es:'coherencia',fr:'constance',it:'coerenza',de:'Beständigkeit'}},
  {id:'comfort',label:{en:'comfort speaking honestly',es:'comodidad al hablar con honestidad',fr:'aisance à parler honnêtement',it:'facilità nel parlare con sincerità',de:'Wohlbefinden bei ehrlichen Gesprächen'}},
  {id:'expectations',label:{en:'expectations',es:'expectativas',fr:'attentes',it:'aspettative',de:'Erwartungen'}},
  {id:'flexibility',label:{en:'flexibility',es:'flexibilidad',fr:'souplesse',it:'flessibilità',de:'Flexibilität'}},
  {id:'reciprocity',label:{en:'give-and-take',es:'reciprocidad',fr:'réciprocité',it:'reciprocità',de:'Gegenseitigkeit'}},
  {id:'limits',label:{en:'personal limits',es:'límites personales',fr:'limites personnelles',it:'limiti personali',de:'persönliche Grenzen'}},
  {id:'follow_through',label:{en:'follow-through',es:'cumplimiento',fr:'suivi des engagements',it:'mantenere gli impegni',de:'Verlässlichkeit'}},
  {id:'stress',label:{en:'what happens under stress',es:'lo que ocurre bajo estrés',fr:'ce qui se passe sous stress',it:'ciò che accade sotto stress',de:'Verhalten unter Stress'}},
  {id:'repair',label:{en:'repair after tension',es:'reparación después de tensión',fr:'réparation après une tension',it:'riparazione dopo una tensione',de:'Wiedergutmachung nach Spannung'}},
  {id:'decisions',label:{en:'shared decision-making',es:'toma de decisiones compartida',fr:'prise de décision partagée',it:'decisioni condivise',de:'gemeinsame Entscheidungen'}},
  {id:'future',label:{en:'long-term alignment',es:'alineación a largo plazo',fr:'alignement à long terme',it:'allineamento a lungo termine',de:'langfristige Übereinstimmung'}},
  {id:'vulnerability',label:{en:'vulnerability',es:'vulnerabilidad',fr:'vulnérabilité',it:'vulnerabilità',de:'Verletzlichkeit'}},
  {id:'accountability',label:{en:'accountability',es:'responsabilidad',fr:'responsabilité',it:'responsabilità',de:'Verantwortungsübernahme'}},
  {id:'respect',label:{en:'safety and mutual respect',es:'seguridad y respeto mutuo',fr:'sécurité et respect mutuel',it:'sicurezza e rispetto reciproco',de:'Sicherheit und gegenseitiger Respekt'}},
];

const COPY = {
  en:{ prompt:(dimension,facet)=>`Thinking about ${dimension}, how true is this for you around ${facet}?`, choices:['Very true for me','Mostly true for me','Sometimes true for me','Rarely true for me'] },
  es:{ prompt:(dimension,facet)=>`Pensando en ${dimension}, ¿qué tan cierto es esto para ti respecto a ${facet}?`, choices:['Muy cierto para mí','Mayormente cierto para mí','A veces cierto para mí','Rara vez cierto para mí'] },
  fr:{ prompt:(dimension,facet)=>`En pensant à ${dimension}, dans quelle mesure cela vous correspond-il concernant ${facet} ?`, choices:['Tout à fait vrai pour moi','Plutôt vrai pour moi','Parfois vrai pour moi','Rarement vrai pour moi'] },
  it:{ prompt:(dimension,facet)=>`Pensando a ${dimension}, quanto ti rappresenta questo rispetto a ${facet}?`, choices:['Molto vero per me','Per lo più vero per me','A volte vero per me','Raramente vero per me'] },
  de:{ prompt:(dimension,facet)=>`Wenn Sie an ${dimension} denken: Wie sehr trifft dies bei ${facet} auf Sie zu?`, choices:['Trifft sehr auf mich zu','Trifft meistens auf mich zu','Trifft manchmal auf mich zu','Trifft selten auf mich zu'] },
};

export const MMIQ_ACCESS = {
  Free: { questionCount:15, dimensionCount:1 },
  Premier: { questionCount:45, dimensionCount:3 },
  Elite: { questionCount:225, dimensionCount:15 },
};

export function buildMyMatchIQQuestionBank(language='en'){
  const lang=COPY[language]?language:'en';
  const copy=COPY[lang];
  const questions=[];
  MMIQ_DIMENSIONS.forEach((dimension,dimensionIndex)=>{
    FACETS.forEach((facet,facetIndex)=>{
      questions.push({
        id:`${dimension.id}_${String(facetIndex+1).padStart(2,'0')}`,
        dimension:dimension.id,
        dimensionIndex,
        facet:facet.id,
        prompt:copy.prompt(dimension.label[lang]||dimension.label.en,facet.label[lang]||facet.label.en),
        choices:copy.choices,
        scores:[4,3,2,1],
        sequence:dimensionIndex*15+facetIndex+1,
      });
    });
  });
  return questions;
}

export function getAssessmentQuestions({language='en',tier='Elite'}={}){
  const bank=buildMyMatchIQQuestionBank(language);
  const access=MMIQ_ACCESS[tier]||MMIQ_ACCESS.Elite;
  return bank.slice(0,access.questionCount);
}

export function scoreAssessment(answers=[]){
  const totals={};
  for(const answer of answers){
    if(!answer?.dimension) continue;
    const current=totals[answer.dimension]||{sum:0,count:0};
    current.sum+=Number(answer.score||0);
    current.count+=1;
    totals[answer.dimension]=current;
  }
  const scores={};
  for(const [dimension,value] of Object.entries(totals)){
    scores[dimension]=value.count?Math.round((value.sum/(value.count*4))*100):0;
  }
  return scores;
}
